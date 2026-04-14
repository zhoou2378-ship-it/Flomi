App({
  globalData: {
    currentTab: 1,
    cloudReady: false,
    statusBarHeight: 0,
    menuBtnTop: 0,
    menuBtnHeight: 32,
  },
  onLaunch() {
    console.log('Flomi launched')

    // 读取导航栏占位高度：取胶囊按钮底部位置，确保内容不与右上角胶囊重叠
    try {
      const menuBtn = wx.getMenuButtonBoundingClientRect()
      // 胶囊底部 + 8px 间距 作为占位高度
      this.globalData.statusBarHeight = (menuBtn.bottom || 0) + 8
      this.globalData.menuBtnTop = menuBtn.top || 0
      this.globalData.menuBtnHeight = menuBtn.height || 32
    } catch (e) {
      try {
        const info = wx.getWindowInfo()
        this.globalData.statusBarHeight = (info.statusBarHeight || 44) + 44
        this.globalData.menuBtnTop = (info.statusBarHeight || 44) + 6
        this.globalData.menuBtnHeight = 32
      } catch (e2) {
        this.globalData.statusBarHeight = 88
        this.globalData.menuBtnTop = 50
        this.globalData.menuBtnHeight = 32
      }
    }

    // 初始化云开发（需在微信云开发控制台创建环境后替换 env ID）
    try {
      if (wx.cloud) {
        wx.cloud.init({
          env: 'prod-flomi', // ← 替换为你的云环境 ID
          traceUser: true,
        })
        this.globalData.cloudReady = true
        console.log('[cloud] init success')
      }
    } catch (e) {
      console.warn('[cloud] init failed, fallback to local storage', e)
      this.globalData.cloudReady = false
    }

    // 开发调试：如果本地没有记录，注入一批测试数据
    this._injectMockDataIfEmpty()
  },

  _injectMockDataIfEmpty() {
    try {
      const KEY = 'flomi_records'
      const raw = wx.getStorageSync(KEY)
      if (raw) return // 已有数据，不注入

      const today = _dateStr(0)
      const yesterday = _dateStr(-1)
      const d2 = _dateStr(-2)
      const d3 = _dateStr(-3)

      const mock = [
        { date: today,     time: '09:15', emotionKey: 'happy',    emotionLabel: '开心',  direction: 'positive', count: 1 },
        { date: today,     time: '11:30', emotionKey: 'calm',     emotionLabel: '平静',  direction: 'positive', count: 1 },
        { date: today,     time: '14:00', emotionKey: 'anxious',  emotionLabel: '焦虑',  direction: 'negative', count: 1 },
        { date: today,     time: '16:20', emotionKey: 'excited',  emotionLabel: '兴奋',  direction: 'positive', count: 1 },
        { date: today,     time: '18:45', emotionKey: 'tired',    emotionLabel: '疲惫',  direction: 'negative', count: 1 },
        { date: yesterday, time: '10:00', emotionKey: 'grateful', emotionLabel: '感恩',  direction: 'positive', count: 1 },
        { date: yesterday, time: '13:30', emotionKey: 'sad',      emotionLabel: '难过',  direction: 'negative', count: 1 },
        { date: yesterday, time: '20:00', emotionKey: 'calm',     emotionLabel: '平静',  direction: 'positive', count: 1 },
        { date: d2,        time: '09:00', emotionKey: 'angry',    emotionLabel: '愤怒',  direction: 'negative', count: 1 },
        { date: d2,        time: '15:00', emotionKey: 'happy',    emotionLabel: '开心',  direction: 'positive', count: 1 },
        { date: d3,        time: '11:00', emotionKey: 'tired',    emotionLabel: '疲惫',  direction: 'negative', count: 1 },
        { date: d3,        time: '17:30', emotionKey: 'excited',  emotionLabel: '兴奋',  direction: 'positive', count: 1 },
      ]

      wx.setStorageSync(KEY, JSON.stringify(mock))
      console.log('[mock] 测试数据已注入')
    } catch (e) {
      console.warn('[mock] 注入失败', e)
    }
  }
})

function _dateStr(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
