// Flomi 首页 — 情绪气泡系统
const { EMOTIONS, EMOTION_KEYS, getEmotion, getRelatedWords, isPositive } = require('../../utils/emotions')
const { saveRecord, getTodayStr, getTimeStr } = require('../../utils/storage')

// 屏幕气泡场尺寸（rpx，750rpx宽基准）
const FIELD_W = 750
const FIELD_H = 900  // 气泡场高度（不含顶部问候区）

// 情绪气泡尺寸范围
const EMOTION_SIZE_MIN = 140
const EMOTION_SIZE_MAX = 220

// 关联词气泡尺寸范围
const WORD_SIZE_MIN = 110
const WORD_SIZE_MAX = 200

/**
 * 随机整数 [min, max]
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 随机浮点 [min, max]
 */
function randFloat(min, max) {
  return Math.random() * (max - min) + min
}

/**
 * 生成不重叠的气泡布局
 * @param {number} count - 气泡数量
 * @param {number} sizeMin
 * @param {number} sizeMax
 * @param {number} fieldW
 * @param {number} fieldH
 */
function generateLayout(count, sizeMin, sizeMax, fieldW, fieldH) {
  const bubbles = []
  const maxAttempts = 80

  for (let i = 0; i < count; i++) {
    let placed = false
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const size = randInt(sizeMin, sizeMax)
      const x = randInt(16, fieldW - size - 16)
      const y = randInt(60, fieldH - size - 60)

      // 检查与已有气泡的重叠（允许轻微重叠，增加自然感）
      const minGap = -size * 0.15
      let overlap = false
      for (const b of bubbles) {
        const dx = (x + size / 2) - (b.x + b.size / 2)
        const dy = (y + size / 2) - (b.y + b.size / 2)
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < (size / 2 + b.size / 2 + minGap)) {
          overlap = true
          break
        }
      }
      if (!overlap) {
        bubbles.push({ x, y, size })
        placed = true
        break
      }
    }
    // 如果实在放不下，强制放置（避免死循环）
    if (!placed) {
      const size = randInt(sizeMin, sizeMax)
      bubbles.push({
        x: randInt(16, fieldW - size - 16),
        y: randInt(60, fieldH - size - 60),
        size,
      })
    }
  }
  return bubbles
}

Page({
  data: {
    // 时间问候
    timeGreeting: '',

    // 阶段：'pick' | 'expand'
    stage: 'pick',

    // 环境色（跟随选中情绪变化）
    ambientColor: 'rgba(184, 192, 255, 0.4)',

    // 首屏情绪气泡
    emotionBubbles: [],

    // 选中的情绪
    selectedEmotion: null,

    // 关联词气泡
    wordBubbles: [],

    // 交互状态
    poppedCount: 0,
    remainCount: 0,
    showBottomAction: false,
    actionBtnText: '写下来',
    comboAnimate: false,
    // 内联记录
    journalText: '',
    inputPlaceholder: '写下此刻的感受，不需要完美...',
    // 负向情绪安抚文案
    sootheMain: '',
    sootheSub: '',
    // 键盘弹起时面板底部偏移（px）
    keyboardOffset: 0,
    // 自定义导航栏占位高度
    statusBarHeight: 0,
    menuBtnTop: 0,
    menuBtnHeight: 32,
  },

  onLoad() {
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 0,
      menuBtnTop: app.globalData.menuBtnTop || 0,
      menuBtnHeight: app.globalData.menuBtnHeight || 32,
    })
    this.setGreeting()
    this.buildEmotionBubbles()
    this.setInputPlaceholder()
  },

  onHide() {
    // 离开首页时提前重置面板，确保返回时已是默认态，不会看到收起动画
    this.setData({ showBottomAction: false, journalText: '', keyboardOffset: 0 })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  // ===== 初始化 =====

  setInputPlaceholder(emotionKey) {
    const PLACEHOLDERS_BY_EMOTION = {
      happy: [
        '今天什么让你感到开心？',
        '有什么让你感到温暖的瞬间？',
        '把这份好心情记下来吧～',
        '今天你为自己做了什么好事？',
      ],
      calm: [
        '此刻你最想对自己说什么？',
        '平静的时候，你在想什么？',
        '今天有什么让你感到踏实的事？',
      ],
      excited: [
        '是什么让你这么兴奋？',
        '把这份能量记下来！',
        '今天发生了什么好事？',
      ],
      grateful: [
        '你在感谢谁，或者什么事？',
        '今天有什么让你觉得幸运的瞬间？',
        '把这份感恩写下来吧～',
      ],
      anxious: [
        '你在担心什么？写出来会轻一点。',
        '把让你不安的事情说出来吧。',
        '此刻最让你紧张的是什么？',
      ],
      sad: [
        '你有什么想放下的事情吗？',
        '难过的时候，写下来会好一些。',
        '今天发生了什么，让你有这样的感受？',
        '有什么话，你一直想说但没说出口？',
      ],
      angry: [
        '把让你生气的事情说出来吧。',
        '是什么让你感到不公平？',
        '写下来，让情绪有个出口。',
      ],
      tired: [
        '今天是什么让你感到疲惫？',
        '你需要什么样的休息？',
        '写下此刻的感受，不需要完美...',
      ],
    }
    const pool = PLACEHOLDERS_BY_EMOTION[emotionKey] || [
      '写下此刻的感受，不需要完美...',
      '今天发生了什么，让你有这样的感受？',
      '此刻你最想对自己说什么？',
    ]
    const idx = Math.floor(Math.random() * pool.length)
    this.setData({ inputPlaceholder: pool[idx] })
  },

  setGreeting() {
    const hour = new Date().getHours()
    let timeGreeting = '早上好，'
    if (hour >= 11 && hour < 13) timeGreeting = '中午好，'
    else if (hour >= 13 && hour < 18) timeGreeting = '下午好，'
    else if (hour >= 18) timeGreeting = '晚上好，'

    this.setData({ timeGreeting })
  },

  buildEmotionBubbles() {
    // 首屏展示全部8种情绪，随机布局
    const keys = [...EMOTION_KEYS]
    // shuffle
    for (let i = keys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [keys[i], keys[j]] = [keys[j], keys[i]]
    }

    const layouts = generateLayout(keys.length, EMOTION_SIZE_MIN, EMOTION_SIZE_MAX, FIELD_W, FIELD_H)

    const emotionBubbles = keys.map((key, i) => {
      const emotion = EMOTIONS[key]
      const layout = layouts[i]
      const labelSize = layout.size > 180 ? 32 : layout.size > 150 ? 28 : 24
      return {
        id: i,
        emotionKey: key,
        label: emotion.label,
        emoji: emotion.emoji || '',
        x: layout.x,
        y: layout.y,
        size: layout.size,
        bg: emotion.bubbleColor,
        textColor: 'rgba(80,82,76,0.75)',
        labelSize,
        emojiSize: layout.size > 180 ? 44 : layout.size > 150 ? 38 : 32,
        animName: layout.size > 190 ? 'floatBubbleSlow' : i % 3 === 0 ? 'floatBubble' : i % 3 === 1 ? 'floatBubbleAlt' : 'floatBubbleSlow',
        delay: randFloat(0, 2.0),
        dur: layout.size > 190 ? randFloat(5.5, 7.5) : randFloat(3.8, 5.8),
        popped: false,
      }
    })

    this.setData({ emotionBubbles, stage: 'pick' })
  },

  // ===== 阶段一：选择情绪 =====

  pickEmotion(e) {
    const key = e.currentTarget.dataset.key
    const emotion = EMOTIONS[key]
    if (!emotion) return

    wx.vibrateShort({ type: 'medium' })

    // 计算环境色
    const ambientColor = emotion.bubbleColor
      .replace('0.75', '0.5').replace('0.70', '0.5').replace('0.65', '0.5')
      .replace('0.60', '0.5').replace('0.55', '0.5').replace('0.50', '0.5')
      .replace('0.48', '0.5').replace('0.46', '0.5').replace('0.45', '0.5')
      .replace('0.42', '0.5').replace('0.40', '0.5')

    this.setData({
      selectedEmotion: emotion,
      sootheMain: emotion.sootheMain || '',
      sootheSub: emotion.sootheSub || '',
      ambientColor,
      actionBtnText: '写下来',
      showBottomAction: true,
    })

    // placeholder 跟随情绪随机变化
    this.setInputPlaceholder(key)

    // 保存情绪记录
    this._currentEmotionKey = key
    saveRecord({
      date: getTodayStr(),
      time: getTimeStr(),
      emotionKey: key,
      emotionLabel: emotion.label,
      direction: emotion.direction,
      words: [],
      note: '',
    })
  },

  // ===== 阶段二：点击关联词气泡 =====

  popWord(e) {
    const id = e.currentTarget.dataset.id
    const wordBubbles = this.data.wordBubbles
    // 用 findIndex 按 id 查找，避免下标错位
    const idx = wordBubbles.findIndex(b => b.id === id)
    if (idx < 0 || wordBubbles[idx].popped || wordBubbles[idx].popping) return

    wx.vibrateShort({ type: 'light' })

    // 触发弹出动画
    this.setData({ [`wordBubbles[${idx}].popping`]: true })

    setTimeout(() => {
      // 标记已消失
      this.setData({ [`wordBubbles[${idx}].popped`]: true })

      const newPoppedCount = this.data.poppedCount + 1
      this.setData({ poppedCount: newPoppedCount, comboAnimate: false })
      // 下一帧重新触发动画（class 切换需要先 false 再 true）
      setTimeout(() => this.setData({ comboAnimate: true }), 16)
      setTimeout(() => this.setData({ comboAnimate: false }), 320)

      // 有剩余词 → 立刻补一个新气泡
      if (this._remainWords && this._remainWords.length > 0) {
        this.spawnNewBubble()
      } else {
        // 词库耗尽，检查屏幕上是否还有存活气泡
        const alive = this.data.wordBubbles.filter(b => !b.popped).length
        if (alive === 0) {
          setTimeout(() => this.setData({ showBottomAction: true }), 400)
        }
      }
    }, 360)
  },

  spawnNewBubble() {
    const word = this._remainWords.shift()
    const emotion = this.data.selectedEmotion
    const size = randInt(WORD_SIZE_MIN, WORD_SIZE_MAX)
    const x = randInt(16, FIELD_W - size - 16)
    const y = randInt(60, FIELD_H - size - 60)
    const labelSize = size > 170 ? 30 : size > 140 ? 26 : 22

    // 用递增 id，避免与旧气泡冲突
    this._bubbleIdCounter = (this._bubbleIdCounter || 1000) + 1

    const newBubble = {
      id: this._bubbleIdCounter,
      word,
      x, y, size,
      bg: emotion.bubbleColor,
      textColor: 'rgba(80,82,76,0.75)',
      labelSize,
      animName: this._bubbleIdCounter % 3 === 0 ? 'floatBubble' : this._bubbleIdCounter % 3 === 1 ? 'floatBubbleAlt' : 'floatBubbleSlow',
      delay: randFloat(0, 0.5),
      dur: randFloat(4.0, 6.0),
      popped: false,
      popping: false,
      count: 1,
    }

    // 过滤掉已消失的，追加新气泡
    const wordBubbles = this.data.wordBubbles.filter(b => !b.popped)
    wordBubbles.push(newBubble)
    this.setData({ wordBubbles })
  },

  // ===== 直接启动游戏 =====

  startGameDirect(e) {
    const game = e.currentTarget.dataset.game
    wx.navigateTo({ url: `/pages/game/game?game=${game}` })
  },

  // ===== 内联记录 =====

  onJournalInput(e) {
    this.setData({ journalText: e.detail.value })
  },

  onInputFocus(e) {
    // 键盘弹起：将面板底部顶到键盘顶部
    const keyboardHeight = e.detail.height || 0
    this.setData({ keyboardOffset: keyboardHeight })
  },

  onInputBlur() {
    // 键盘收起：面板回到底部
    this.setData({ keyboardOffset: 0 })
  },

  onClosePanelTap() {
    // 关闭底部面板，回到气泡阶段
    this.setData({ showBottomAction: false, journalText: '', keyboardOffset: 0 })
  },

  onSkipTap() {
    // 跳过不记录，关闭面板回到气泡
    this.setData({ showBottomAction: false, journalText: '' })
  },

  // ===== 底部按钮 =====

  onActionTap() {
    const emotion = this.data.selectedEmotion
    if (!emotion) return

    if (emotion.direction === 'positive') {
      // 正向 → 保存日记，留在首页
      const text = this.data.journalText.trim()
      if (text) {
        saveRecord({
          date: getTodayStr(),
          time: getTimeStr(),
          emotionKey: this._currentEmotionKey || '',
          emotionLabel: emotion.label,
          direction: emotion.direction,
          note: text,
          type: 'journal',
        })
        wx.showToast({ title: '已记录 ✓', icon: 'none', duration: 1500 })
        this.setData({ journalText: '' })
      } else {
        wx.showToast({ title: '写点什么吧～', icon: 'none', duration: 1200 })
      }
    } else {
      // 负向 → 解压游戏
      wx.navigateTo({ url: '/pages/game/game' })
    }
  },

  resetAll() {
    this.setData({
      stage: 'pick',
      selectedEmotion: null,
      wordBubbles: [],
      poppedCount: 0,
      remainCount: 0,
      showBottomAction: false,
      comboAnimate: false,
      journalText: '',
      ambientColor: 'rgba(184, 192, 255, 0.4)',
    })
    this.buildEmotionBubbles()
  },
})
