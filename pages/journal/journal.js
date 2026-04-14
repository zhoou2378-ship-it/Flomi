// Flomi Journal 记录页
const { EMOTIONS } = require('../../utils/emotions')
const { saveRecord, getTodayStr } = require('../../utils/storage')

const PROMPTS = [
  '今天有什么让你感到温暖的瞬间？',
  '此刻你最想对自己说什么？',
  '今天发生了什么，让你有这样的感受？',
  '如果把今天的心情画成一幅画，会是什么样子？',
  '有什么事情，你一直想做但还没做？',
  '今天你为自己做了什么好事？',
  '什么让你感到有力量？',
  '如果明天可以重来，你希望改变什么？',
]

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const WEEKS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

Page({
  data: {
    dateLabel: '',
    currentPrompt: '',
    inputText: '',
    autoFocus: false,
    showSavedToast: false,
    statusBarHeight: 0,
    menuBtnTop: 0,
    menuBtnHeight: 32,
    // 情绪信息（从首页传入）
    emotionKey: '',
    emotionLabel: '',
    emotionBg: '',
    emotionBorder: '',
    emotionColor: '',
  },

  onLoad(options) {
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 0,
      menuBtnTop: app.globalData.menuBtnTop || 0,
      menuBtnHeight: app.globalData.menuBtnHeight || 32,
    })
    this.setDateLabel()
    this.setRandomPrompt()

    // 接收从首页传来的情绪参数
    if (options && options.emotionKey) {
      const emotion = EMOTIONS[options.emotionKey]
      if (emotion) {
        this.setData({
          emotionKey: options.emotionKey,
          emotionLabel: emotion.label,
          emotionBg: emotion.bubbleColor,
          emotionBorder: emotion.borderColor,
          emotionColor: emotion.textColor,
        })
      }
    }

    // 延迟自动聚焦
    setTimeout(() => this.setData({ autoFocus: true }), 400)
  },

  setDateLabel() {
    const d = new Date()
    const dateLabel = `${d.getFullYear()}年${MONTHS[d.getMonth()]}${d.getDate()}日 ${WEEKS[d.getDay()]}`
    this.setData({ dateLabel })
  },

  setRandomPrompt() {
    const idx = Math.floor(Math.random() * PROMPTS.length)
    this.setData({ currentPrompt: PROMPTS[idx] })
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },

  saveEntry() {
    const text = this.data.inputText.trim()
    if (!text) return

    saveRecord({
      date: getTodayStr(),
      emotionKey: this.data.emotionKey,
      emotionLabel: this.data.emotionLabel,
      direction: this.data.emotionKey ? (EMOTIONS[this.data.emotionKey]?.direction || '') : '',
      note: text,
      type: 'journal',
    })

    this.setData({ showSavedToast: true })
    setTimeout(() => {
      this.setData({ showSavedToast: false, inputText: '' })
    }, 1800)
  },

  goBack() {
    wx.navigateBack()
  },
})
