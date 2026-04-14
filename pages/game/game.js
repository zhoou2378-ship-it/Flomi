// Flomi 解压小游戏页
// 包含：4-7-8呼吸法 / 捏气泡 / 涂鸦

const GAME_BUBBLE_COLORS = [
  'rgba(184, 192, 255, 0.65)',
  'rgba(255, 218, 217, 0.65)',
  'rgba(218, 232, 190, 0.65)',
  'rgba(250, 200, 200, 0.65)',
  'rgba(170, 178, 240, 0.60)',
  'rgba(255, 218, 150, 0.60)',
]

const DOODLE_COLORS = ['#576342', '#535b93', '#7b5556', '#A3B18A', '#aab2f0', '#fac8c8', '#31332f']

// 呼吸阶段配置（4-7-8法，Andrew Weil 博士提出）
// 吸气4秒、屏气7秒、呼气8秒，呼气时间是吸气的2倍，激活副交感神经降低心率
const BREATH_PHASES = [
  { phase: 'inhale',  label: '吸气',  duration: 4, color: 'rgba(140,148,200,0.75)' },
  { phase: 'hold',    label: '屏气',  duration: 7, color: 'rgba(170,178,240,0.65)' },
  { phase: 'exhale',  label: '呼气',  duration: 8, color: 'rgba(184,192,255,0.45)' },
]
const BREATH_TOTAL_ROUNDS = 4

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

Page({
  data: {
    currentGame: 'menu',

    // 呼吸
    breathPhase: 'inhale',
    breathInstruction: '吸气',
    breathCount: 4,
    breathRound: 1,
    breathTotalRounds: BREATH_TOTAL_ROUNDS,
    breathProgress: 0,
    breathBarColor: 'rgba(140,148,200,0.75)',

    // 捏气泡
    gameBubbles: [],
    bubblesPopped: 0,

    // 涂鸦
    doodleColors: DOODLE_COLORS,
    doodleColorIndex: 0,

    // 完成页日记
    journalText: '',
    inputPlaceholder: '写下此刻的感受，不需要完美...',
  },

  _breathTimer: null,
  _breathPhaseIndex: 0,
  _breathCountdown: 0,
  _breathRound: 1,
  _doodleCtx: null,
  _doodleDrawing: false,
  _doodleLastX: 0,
  _doodleLastY: 0,

  onLoad(options) {
    // 从首页直接传入 game 参数，跳过 menu
    if (options && options.game) {
      this._launchGame(options.game)
    }
  },

  onUnload() {
    this.clearBreathTimer()
  },

  goBack() {
    wx.navigateBack()
  },

  goJournal() {
    wx.navigateTo({ url: '/pages/journal/journal' })
  },

  onJournalInput(e) {
    this.setData({ journalText: e.detail.value })
  },

  saveJournal() {
    const text = this.data.journalText.trim()
    if (!text) return
    wx.showToast({ title: '已记录 ✓', icon: 'none', duration: 1500 })
    this.setData({ journalText: '' })
    setTimeout(() => wx.navigateBack(), 1600)
  },

  // 内部启动方法（供 onLoad 和 startGame 共用）
  _launchGame(game) {
    const titleMap = {
      breath: '4-7-8 呼吸法',
      bubble: '捏气泡解压',
      doodle: '随手涂鸦',
    }
    wx.setNavigationBarTitle({ title: titleMap[game] || '放松一下' })
    this.setData({ currentGame: game })
    if (game === 'breath') {
      this.startBreath()
    } else if (game === 'bubble') {
      this.buildGameBubbles()
    } else if (game === 'doodle') {
      setTimeout(() => this.initDoodle(), 300)
    }
  },

  startGame(e) {
    const game = e.currentTarget.dataset.game
    this._launchGame(game)
  },

  stopGame() {
    this.clearBreathTimer()
    this.setData({ currentGame: 'done' })
  },

  // ===== 呼吸游戏 =====

  startBreath() {
    this._breathPhaseIndex = 0
    this._breathRound = 1
    this.runBreathPhase()
  },

  runBreathPhase() {
    const phaseConfig = BREATH_PHASES[this._breathPhaseIndex]
    const totalSeconds = phaseConfig.duration
    let elapsed = 0

    this.setData({
      breathPhase: phaseConfig.phase,
      breathInstruction: phaseConfig.label,
      breathCount: totalSeconds,
      breathRound: this._breathRound,
      breathBarColor: phaseConfig.color,
    })

    wx.vibrateShort({ type: 'light' })

    this._breathTimer = setInterval(() => {
      elapsed++
      const remaining = totalSeconds - elapsed
      const progress = (elapsed / totalSeconds) * 100

      this.setData({
        breathCount: remaining > 0 ? remaining : 0,
        breathProgress: progress,
      })

      if (elapsed >= totalSeconds) {
        clearInterval(this._breathTimer)
        this._breathTimer = null
        this.nextBreathPhase()
      }
    }, 1000)
  },

  nextBreathPhase() {
    this._breathPhaseIndex++

    if (this._breathPhaseIndex >= BREATH_PHASES.length) {
      // 完成一轮
      this._breathPhaseIndex = 0
      this._breathRound++

      if (this._breathRound > BREATH_TOTAL_ROUNDS) {
        // 全部完成
        this.setData({ currentGame: 'done' })
        return
      }
    }

    setTimeout(() => this.runBreathPhase(), 500)
  },

  clearBreathTimer() {
    if (this._breathTimer) {
      clearInterval(this._breathTimer)
      this._breathTimer = null
    }
  },

  // ===== 捏气泡游戏 =====

  buildGameBubbles() {
    const count = randInt(18, 24)
    const bubbles = []
    const fieldW = 750
    const fieldH = 1000

    for (let i = 0; i < count; i++) {
      const size = randInt(80, 180)
      bubbles.push({
        id: i,
        x: randInt(10, fieldW - size - 10),
        y: randInt(10, fieldH - size - 10),
        size,
        color: GAME_BUBBLE_COLORS[i % GAME_BUBBLE_COLORS.length],
        delay: (i * 0.15) % 2,
        popping: false,
        gone: false,
      })
    }

    this.setData({ gameBubbles: bubbles, bubblesPopped: 0 })
  },

  popGameBubble(e) {
    const id = e.currentTarget.dataset.id
    const bubbles = this.data.gameBubbles
    const idx = bubbles.findIndex(b => b.id === id)
    if (idx < 0 || bubbles[idx].gone) return

    wx.vibrateShort({ type: 'light' })

    const poppingKey = `gameBubbles[${idx}].popping`
    this.setData({ [poppingKey]: true })

    setTimeout(() => {
      const goneKey = `gameBubbles[${idx}].gone`
      this.setData({
        [goneKey]: true,
        bubblesPopped: this.data.bubblesPopped + 1,
      })

      // 全部爆完后补充新一批
      const remaining = this.data.gameBubbles.filter(b => !b.gone).length
      if (remaining === 0) {
        setTimeout(() => this.buildGameBubbles(), 600)
      }
    }, 300)
  },

  // ===== 涂鸦游戏 =====

  initDoodle() {
    const query = wx.createSelectorQuery()
    query.select('#doodleCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) return
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getWindowInfo().pixelRatio || 2
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.lineWidth = 4
        ctx.strokeStyle = DOODLE_COLORS[0]
        this._doodleCtx = ctx
        this._doodleCanvas = canvas
        this._doodleDpr = dpr
        this._doodleW = res[0].width
        this._doodleH = res[0].height
      })
  },

  setDoodleColor(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ doodleColorIndex: index })
    if (this._doodleCtx) {
      this._doodleCtx.strokeStyle = DOODLE_COLORS[index]
    }
  },

  doodleStart(e) {
    if (!this._doodleCtx) return
    const touch = e.touches[0]
    this._doodleDrawing = true
    this._doodleLastX = touch.x
    this._doodleLastY = touch.y
    this._doodleCtx.beginPath()
    this._doodleCtx.moveTo(touch.x, touch.y)
  },

  doodleMove(e) {
    if (!this._doodleDrawing || !this._doodleCtx) return
    const touch = e.touches[0]
    this._doodleCtx.lineTo(touch.x, touch.y)
    this._doodleCtx.stroke()
    this._doodleLastX = touch.x
    this._doodleLastY = touch.y
  },

  doodleEnd() {
    this._doodleDrawing = false
  },

  clearDoodle() {
    if (!this._doodleCtx) return
    this._doodleCtx.clearRect(0, 0, this._doodleW, this._doodleH)
  },
})
