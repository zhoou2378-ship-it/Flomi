// Flomi 解压小游戏页
// 包含：4-7-8呼吸法 / 烦恼消消 / 涂鸦

// 8色相环（每45°一色，柔和饱和度）
const DOODLE_COLORS = [
  '#E05252', // 0°   红
  '#E09040', // 45°  橙
  '#D4C84A', // 90°  黄
  '#4AC46E', // 135° 绿
  '#4AC4B0', // 180° 青
  '#4A72E0', // 225° 蓝
  '#7A4AE0', // 270° 紫
  '#E04AB0', // 315° 玫红
]

// 呼吸阶段配置（4-7-8法）
const BREATH_PHASES = [
  { phase: 'inhale',  label: '吸气',  duration: 4, color: 'rgba(140,148,200,0.75)' },
  { phase: 'hold',    label: '屏气',  duration: 7, color: 'rgba(170,178,240,0.65)' },
  { phase: 'exhale',  label: '呼气',  duration: 8, color: 'rgba(184,192,255,0.45)' },
]
const BREATH_TOTAL_ROUNDS = 4

// 清空烦恼 emoji 主题（三类独立，每次随机选一类）
const EMOJI_THEMES = [
  ['🥹','😔','😭','😫','💔','😡','😒','😐','😣','😠','🙁','😿'],
  ['🐭','🐮','🐯','🐰','🐲','🐍','🐑','🐎','🐤','🐒','🐶','🐷'],
  ['🌧️','⚡️','🪾','🌲','🍂','🌺','💦','🌊','☁️','🍃','🥀','🌸'],
]

const MAX_EMOJI = 36

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFloat(min, max) {
  return Math.random() * (max - min) + min
}

function pickEmoji(pool) {
  return pool[randInt(0, pool.length - 1)]
}

Page({
data: {
currentGame: 'breath',
gameTitle: '呼吸放松',
statusBarHeight: 0,
menuBtnTop: 0,
menuBtnHeight: 32,
emotionLabel: '',
clearDoneText: '',


    // 呼吸
    breathPhase: 'inhale',
    breathInstruction: '吸气',
    breathCount: 4,
    breathRound: 1,
    breathTotalRounds: BREATH_TOTAL_ROUNDS,
    breathProgress: 0,
    breathBarColor: 'rgba(140,148,200,0.75)',
    // 呼吸控制状态：'idle' | 'running' | 'paused'
    breathStatus: 'idle',

    // 清空烦恼
    emojiItems: [],
    showClearToast: false,
    showClearDone: false,
    bubbleCombo: 0,

// 涂鸦
doodleColors: DOODLE_COLORS,
doodleColorIndex: 0,
doodleHasContent: false,
doodleCustomColor: '',
doodleCanvasH: 0,


    // 完成页日记
    journalText: '',
    inputPlaceholder: '写下此刻的感受，不需要完美...',
    showDonePanel: false,
  },

  _breathTimer: null,
  _breathPhaseIndex: 0,
  _breathRound: 1,
  _breathElapsed: 0,       // 当前阶段已过秒数（暂停恢复用）
  _doodleCtx: null,
  _doodleDrawing: false,
  _doodleLastX: 0,
  _doodleLastY: 0,
  _emojiPool: [],
  _emojiIdCounter: 0,

  onLoad(options) {
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 0,
      menuBtnTop: app.globalData.menuBtnTop || 0,
      menuBtnHeight: app.globalData.menuBtnHeight || 32,
      emotionLabel: (options && options.emotionLabel) ? decodeURIComponent(options.emotionLabel) : '',
    })
    const game = (options && (options.game || options.mode)) || 'breath'
    this._launchGame(game)
  },

  onUnload() {
    this.clearBreathTimer()
  },

  goBack() {
    wx.navigateBack()
  },

  closeDonePanel() {
    this.setData({ showDonePanel: false })
    wx.navigateBack()
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

  // 内部启动方法
_launchGame(game) {
const titleMap = {
breath: '呼吸放松',
bubble: '清空烦恼',
doodle: '随手涂鸦',
}
const gameTitle = titleMap[game] || '放松一下'
this.setData({ currentGame: game, showDonePanel: false, gameTitle })
    if (game === 'breath') {
      // 进入呼吸页，等用户点「开始」
      this.setData({ breathStatus: 'idle', breathCount: BREATH_PHASES[0].duration, breathInstruction: BREATH_PHASES[0].label, breathProgress: 0 })
    } else if (game === 'bubble') {
      this._initEmojiGame()
    } else if (game === 'doodle') {
      setTimeout(() => this.initDoodle(), 300)
    }
  },

  startGame(e) {
    const game = e.currentTarget.dataset.game
    this._launchGame(game)
  },

  // ===== 呼吸游戏控制 =====

  breathStart() {
    if (this.data.breathStatus === 'idle') {
      // 首次开始
      this._breathPhaseIndex = 0
      this._breathRound = 1
      this._breathElapsed = 0
      this.setData({ breathStatus: 'running', breathRound: 1 })
      this.runBreathPhase()
    } else if (this.data.breathStatus === 'paused') {
      // 恢复
      this.setData({ breathStatus: 'running' })
      this._resumeBreathPhase()
    }
  },

  breathPause() {
    if (this.data.breathStatus !== 'running') return
    this.clearBreathTimer()
    this.setData({ breathStatus: 'paused' })
  },

  breathStop() {
    this.clearBreathTimer()
    this.setData({ breathStatus: 'idle', showDonePanel: true })
  },

  runBreathPhase() {
    const phaseConfig = BREATH_PHASES[this._breathPhaseIndex]
    const totalSeconds = phaseConfig.duration
    this._breathElapsed = 0

    this.setData({
      breathPhase: phaseConfig.phase,
      breathInstruction: phaseConfig.label,
      breathCount: totalSeconds,
      breathRound: this._breathRound,
      breathBarColor: phaseConfig.color,
      breathProgress: 0,
    })

    wx.vibrateShort({ type: 'light' })
    this._startBreathTick(totalSeconds)
  },

  _resumeBreathPhase() {
    const phaseConfig = BREATH_PHASES[this._breathPhaseIndex]
    const totalSeconds = phaseConfig.duration
    // 从已过秒数继续
    this._startBreathTick(totalSeconds)
  },

  _startBreathTick(totalSeconds) {
    this._breathTimer = setInterval(() => {
      if (this.data.breathStatus !== 'running') return
      this._breathElapsed++
      const remaining = totalSeconds - this._breathElapsed
      const progress = (this._breathElapsed / totalSeconds) * 100

      this.setData({
        breathCount: remaining > 0 ? remaining : 0,
        breathProgress: progress,
      })

      if (this._breathElapsed >= totalSeconds) {
        clearInterval(this._breathTimer)
        this._breathTimer = null
        this.nextBreathPhase()
      }
    }, 1000)
  },

  nextBreathPhase() {
    this._breathPhaseIndex++

    if (this._breathPhaseIndex >= BREATH_PHASES.length) {
      this._breathPhaseIndex = 0
      this._breathRound++

      if (this._breathRound > BREATH_TOTAL_ROUNDS) {
        // 全部完成
        this.setData({ breathStatus: 'idle', showDonePanel: true })
        return
      }
    }

    setTimeout(() => {
      if (this.data.breathStatus === 'running') {
        this.runBreathPhase()
      }
    }, 500)
  },

  clearBreathTimer() {
    if (this._breathTimer) {
      clearInterval(this._breathTimer)
      this._breathTimer = null
    }
  },

  // ===== 清空烦恼 =====

  _initEmojiGame() {
    this._emojiIdCounter = 0

    // 随机选一个主题
    const theme = EMOJI_THEMES[randInt(0, EMOJI_THEMES.length - 1)]

    // 每次随机数量：32 ~ 64，从该主题循环取用
    const count = randInt(24, MAX_EMOJI)

    this.setData({ emojiItems: [], showClearToast: false, showClearDone: false, bubbleCombo: 0 })

    const items = []
    for (let i = 0; i < count; i++) {
      const emoji = theme[i % theme.length]
      items.push(this._makeEmojiItem(emoji, i * 80))
    }
    this.setData({ emojiItems: items })
  },

  _makeEmojiItem(emoji, dropDelayMs) {
    const id = ++this._emojiIdCounter
    // 字号随机：53 ~ 106rpx（整体放大10%）
    const size = randInt(53, 106)
    const fieldW = 750
    const x = randInt(10, fieldW - size - 10)
    // 掉落时长：慢快随机，营造层次感
    const dur = randFloat(0.7, 1.4)
    // 最终停留的 Y 位置（屏幕内随机分布，留出底部安全区）
    const finalY = randInt(80, 1300)

    return {
      id,
      emoji,
      x,
      size,
      popping: false,
      gone: false,
      dur,
      delay: dropDelayMs / 1000,
      finalY,
    }
  },

  tapEmoji(e) {
    const id = e.currentTarget.dataset.id
    const items = this.data.emojiItems
    const idx = items.findIndex(b => b.id === id)
    if (idx < 0 || items[idx].gone || items[idx].popping) return

    wx.vibrateShort({ type: 'light' })
    const newCombo = this.data.bubbleCombo + 1
    this.setData({ [`emojiItems[${idx}].gone`]: true, bubbleCombo: newCombo })

    const remaining = this.data.emojiItems.filter(b => !b.gone).length
    if (remaining === 0) {
      const clearDoneText = `${this.data.emotionLabel}都帮你打包丢掉咯～`
      this.setData({ showClearDone: true, clearDoneText })
    }
  },

  restartBubbleGame() {
    this.setData({ showClearDone: false })
    setTimeout(() => this._initEmojiGame(), 300)
  },

  // ===== 涂鸦游戏 =====

  initDoodle() {
    // 先查 wrap 尺寸，再初始化 canvas
    const wrapQuery = wx.createSelectorQuery()
    wrapQuery.select('.doodle-canvas-wrap')
      .boundingClientRect((rect) => {
        if (!rect) return
        const wrapH = rect.height
        const wrapW = rect.width
        this.setData({ doodleCanvasH: wrapH }, () => {
          const query = wx.createSelectorQuery()
          query.select('#doodleCanvas')
            .fields({ node: true, size: true })
            .exec((res) => {
              if (!res || !res[0]) return
              const canvas = res[0].node
              const ctx = canvas.getContext('2d')
              const dpr = wx.getWindowInfo().pixelRatio || 2
              canvas.width = wrapW * dpr
              canvas.height = wrapH * dpr
              ctx.scale(dpr, dpr)
              ctx.lineCap = 'round'
              ctx.lineJoin = 'round'
              ctx.lineWidth = 4
              ctx.strokeStyle = DOODLE_COLORS[0]
              this._doodleCtx = ctx
              this._doodleCanvas = canvas
              this._doodleDpr = dpr
              this._doodleW = wrapW
              this._doodleH = wrapH
            })
        })
      })
      .exec()
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
    if (!this.data.doodleHasContent) {
      this.setData({ doodleHasContent: true })
    }
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
    if (!this._doodleCtx || !this._doodleCanvas) return
    this._doodleCtx.clearRect(0, 0, this._doodleCanvas.width, this._doodleCanvas.height)
    this.setData({ doodleHasContent: false })
  },

  onDoodleColorPickerChange(e) {
    const color = e.detail.value
    this.setData({ doodleCustomColor: color, doodleColorIndex: -1 })
    if (this._doodleCtx) {
      this._doodleCtx.strokeStyle = color
    }
  },

  stopGame() {
    this.clearBreathTimer()
    this.setData({ showDonePanel: true })
  },
})
