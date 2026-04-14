// Flomi 历史记录页
const { EMOTIONS } = require('../../utils/emotions')
const { getRecordsByDate, fetchRecordsByDate } = require('../../utils/storage')

// 获取本周7天（周一到今天，或最近7天）
function getWeekDays() {
  const days = []
  const today = new Date()
  const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const dateStr = `${d.getFullYear()}-${mm}-${dd}`
    days.push({
      date: dateStr,
      dayNum: d.getDate(),
      dayLabel: DAY_LABELS[d.getDay()],
      isToday: i === 0,
    })
  }
  return days
}

// 根据记录生成心情分析文案
function buildAnalysis(records) {
  if (!records || records.length === 0) return null

  const countMap = {}
  records.forEach(r => {
    if (r.emotionKey) countMap[r.emotionKey] = (countMap[r.emotionKey] || 0) + 1
  })

  const sorted = Object.keys(countMap).sort((a, b) => countMap[b] - countMap[a])
  const topKey = sorted[0]
  const topEmotion = EMOTIONS[topKey]
  if (!topEmotion) return null

  const total = records.length
  const positiveCount = records.filter(r => {
    const e = EMOTIONS[r.emotionKey]
    return e && e.direction === 'positive'
  }).length
  const negativeCount = total - positiveCount

  // 心情复杂度：情绪种类数
  const kindCount = sorted.length
  const moodDesc = positiveCount > negativeCount ? '偏向愉悦' :
                   negativeCount > positiveCount ? '有些沉重' : '复杂交织'

  // 起伏程度：energy 标准差
  const energies = records.map(r => { const e = EMOTIONS[r.emotionKey]; return e ? (e.energy || 50) : 50 })
  const mean = energies.reduce((s, v) => s + v, 0) / energies.length
  const std = Math.sqrt(energies.reduce((s, v) => s + (v - mean) ** 2, 0) / energies.length)
  const fluctDesc = std >= 20 ? '起伏较大' : std >= 10 ? '起伏适中' : '起伏平缓'

  // 具体行动建议
  const positiveActions = [
    '出去走走，感受一下今天的空气',
    '喝杯喜欢的饮料，犒劳一下自己',
    '把这份好心情分享给一个朋友',
    '听几首喜欢的歌，延续这份愉悦',
    '做一件一直想做但没做的小事',
  ]
  const negativeActions = [
    '起来走走，动一动会好一些',
    '喝口水，给自己几分钟安静',
    '听一首舒缓的音乐，放松一下',
    '找个舒服的地方坐着，深呼吸几次',
    '给自己泡杯热茶，慢慢喝',
  ]
  const mixedActions = [
    '出去走走，换个环境清醒一下',
    '喝口水，整理一下思绪',
    '听首音乐，给情绪一点出口',
    '写下此刻最想说的一句话',
    '做几个深呼吸，感受当下',
  ]

  const actionPool = positiveCount > negativeCount ? positiveActions
                   : negativeCount > positiveCount ? negativeActions
                   : mixedActions
  const action = actionPool[Math.floor(Math.random() * actionPool.length)]

  const summary = `今天心情${moodDesc}，${fluctDesc}，可以试试${action}。`

  return {
    summary,
    topLabel: topEmotion.label,
    topColor: topEmotion.textColor,
    topBg: topEmotion.bubbleColor,
    total,
  }
}

Page({
  data: {
    groups: [],
    filteredGroups: [],
    stats: [],
    totalDays: 0,
    activeFilter: '',
    // 周视图
    weekDays: [],
    selectedDate: '',
    selectedDateLabel: '',
    selectedGroups: [],
    selectedAnalysis: null,
    // canvas 就绪标志，绘制完成前隐藏 canvas 避免闪烁
    chartReady: false,
    // 切换日期时内容区淡出标志
    switching: false,
  },

  onShow() {
    this.loadRecords()
  },

  loadRecords() {
    // 先用本地缓存快速渲染，再异步拉云端数据刷新
    const localGroups = getRecordsByDate()
    this._applyGroups(localGroups, false)

    fetchRecordsByDate(cloudGroups => {
      this._applyGroups(cloudGroups, true)
    })
  },

  // 将 rgba(r,g,b,a) 加深（供图例圆点使用）
  _darkenRgba(rgba, ratio) {
    const m = rgba.match(/rgba?\((\d+\.?\d*),\s*(\d+\.?\d*),\s*(\d+\.?\d*)/)
    if (!m) return rgba
    const r = Math.round(Number(m[1]) * ratio)
    const g = Math.round(Number(m[2]) * ratio)
    const b = Math.round(Number(m[3]) * ratio)
    return `rgba(${r},${g},${b},0.9)`
  },

  _applyGroups(rawGroups, redraw) {
    const groups = rawGroups.map(group => {
      const records = group.records.map(r => {
        const emotion = r.emotionKey ? EMOTIONS[r.emotionKey] : null
        const emotionBg = emotion ? emotion.bubbleColor : 'rgba(227,227,220,0.5)'
        const emotionDotColor = emotion ? (emotion.dotColor || this._darkenRgba(emotionBg, 0.72)) : 'rgba(160,158,150,1)'
        return {
          ...r,
          emotionBg,
          emotionDeepBg: emotionDotColor,
          emotionBorder: emotion ? emotion.borderColor : 'rgba(178,178,173,0.3)',
          emotionColor: emotion ? emotion.textColor : '#5e605b',
          emotionLabel: r.emotionLabel || (emotion ? emotion.label : ''),
          energy: emotion ? (emotion.energy || 50) : 50,
        }
      })
      const showChart = records.length >= 1
      const chartPoints = showChart ? this._buildChartPoints(records) : []
      return { ...group, records, showChart, chartPoints }
    })

    // 统计
    const countMap = {}
    rawGroups.forEach(g => {
      g.records.forEach(r => {
        if (r.emotionKey) countMap[r.emotionKey] = (countMap[r.emotionKey] || 0) + (r.count || 1)
      })
    })
    const stats = Object.keys(countMap)
      .sort((a, b) => countMap[b] - countMap[a])
      .slice(0, 8)
      .map(key => {
        const emotion = EMOTIONS[key]
        return {
          key,
          label: emotion ? emotion.label : key,
          count: countMap[key],
          bg: emotion ? emotion.bubbleColor : 'rgba(227,227,220,0.5)',
          border: emotion ? emotion.borderColor : 'rgba(178,178,173,0.3)',
          color: emotion ? emotion.textColor : '#5e605b',
        }
      })

    // 周视图
    const weekDays = getWeekDays()
    const dateSet = new Set(rawGroups.map(g => g.date))
    weekDays.forEach(d => { d.hasRecord = dateSet.has(d.date) })

    // 保持当前选中日期（云端刷新时不重置），首次默认今天
    const currentSelected = this.data.selectedDate
    const todayDate = weekDays[weekDays.length - 1].date
    const targetDate = (redraw && currentSelected) ? currentSelected : todayDate
    const targetGroup = groups.find(g => g.date === targetDate)
    const selectedGroups = targetGroup ? [targetGroup] : []
    const selectedAnalysis = targetGroup ? buildAnalysis(targetGroup.records) : null
    const selectedDateLabel = targetDate === todayDate ? '今天' : this.data.selectedDateLabel || '今天'

    this.setData({
      groups,
      filteredGroups: groups,
      stats,
      totalDays: rawGroups.length,
      activeFilter: '',
      weekDays,
      selectedDate: targetDate,
      selectedDateLabel,
      selectedGroups,
      selectedAnalysis,
      chartReady: false,
    })

    if (targetGroup && targetGroup.showChart) {
      setTimeout(() => {
        this._drawChart(targetGroup.date, targetGroup.chartPoints, () => {
          this.setData({ chartReady: true })
        })
      }, redraw ? 80 : 320)
    } else {
      this.setData({ chartReady: true })
    }
  },

  selectDay(e) {
    const date = e.currentTarget.dataset.date
    if (date === this.data.selectedDate) return // 点同一天不重复切换

    const dayLabel = e.currentTarget.dataset.label
    const group = this.data.groups.find(g => g.date === date)
    const selectedGroups = group ? [group] : []
    const selectedAnalysis = group ? buildAnalysis(group.records) : null

    // 先淡出
    this.setData({ switching: true })

    setTimeout(() => {
      // 更新内容，同时关闭淡出（触发淡入 transition）
      this.setData({
        selectedDate: date,
        selectedDateLabel: dayLabel,
        selectedGroups,
        selectedAnalysis,
        chartReady: false,
        switching: false,
      })

      if (group && group.showChart) {
        setTimeout(() => {
          this._drawChart(group.date, group.chartPoints, () => {
            this.setData({ chartReady: true })
          })
        }, 80)
      } else {
        this.setData({ chartReady: true })
      }
    }, 150)
  },

  _buildChartPoints(records) {
    // 同一时间点只保留最后一条记录
    const timeMap = new Map()
    records.forEach((r, i) => {
      timeMap.set(r.time || '', { r, i })
    })
    return Array.from(timeMap.values())
      .sort((a, b) => (a.r.time || '').localeCompare(b.r.time || ''))
      .map(({ r, i }) => ({
        index: i,
        energy: r.energy,
        label: r.emotionLabel,
        color: r.emotionColor,
        dotBg: r.emotionBg,
        dotColor: r.emotionDeepBg,
        time: r.time || '',
      }))
  },

  _drawChart(date, points, onDone) {
    if (!points || points.length < 1) {
      onDone && onDone()
      return
    }
    const canvasId = `chart-${date}`
    const query = wx.createSelectorQuery()
    query.select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec(res => {
        if (!res || !res[0] || !res[0].node) {
          onDone && onDone()
          return
        }
        const canvas = res[0].node
        const w = res[0].width
        const h = res[0].height
        const dpr = wx.getWindowInfo().pixelRatio || 2
        canvas.width = w * dpr
        canvas.height = h * dpr
        const ctx = canvas.getContext('2d')
        ctx.scale(dpr, dpr)

        const padL = 20, padR = 20, padT = 20, padB = 36
        const chartW = w - padL - padR
        const chartH = h - padT - padB
        const n = points.length
        const minE = 15, maxE = 95

        // 将记录时间（HH:MM）映射到 00:00-24:00 的 x 轴比例
        function timeToRatio(timeStr) {
          if (!timeStr) return 0.5
          const parts = timeStr.split(':')
          const h = parseInt(parts[0], 10) || 0
          const m = parseInt(parts[1], 10) || 0
          return (h * 60 + m) / (24 * 60)
        }

        const coords = points.map((p) => ({
          x: padL + (n === 1 ? chartW / 2 : timeToRatio(p.time) * chartW),
          y: padT + chartH - ((p.energy - minE) / (maxE - minE)) * chartH,
          ...p,
        }))

        ctx.clearRect(0, 0, w, h)

        if (n === 1) {
          // 单点：画水平虚线参考轨道 + 居中圆点
          const p = coords[0]
          ctx.setLineDash([6, 6])
          ctx.beginPath()
          ctx.moveTo(padL, p.y)
          ctx.lineTo(padL + chartW, p.y)
          ctx.strokeStyle = 'rgba(140, 148, 200, 0.35)'
          ctx.lineWidth = 2
          ctx.stroke()
          ctx.setLineDash([])
        } else {
          // 多点：渐变填充区域
          const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH)
          grad.addColorStop(0, 'rgba(140, 148, 200, 0.15)')
          grad.addColorStop(1, 'rgba(140, 148, 200, 0.02)')
          ctx.beginPath()
          ctx.moveTo(coords[0].x, coords[0].y)
          for (let i = 1; i < coords.length; i++) {
            const prev = coords[i - 1], curr = coords[i]
            const cpx = (prev.x + curr.x) / 2
            ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y)
          }
          ctx.lineTo(coords[n - 1].x, padT + chartH)
          ctx.lineTo(coords[0].x, padT + chartH)
          ctx.closePath()
          ctx.fillStyle = grad
          ctx.fill()

          // 折线
          ctx.beginPath()
          ctx.moveTo(coords[0].x, coords[0].y)
          for (let i = 1; i < coords.length; i++) {
            const prev = coords[i - 1], curr = coords[i]
            const cpx = (prev.x + curr.x) / 2
            ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y)
          }
          ctx.strokeStyle = 'rgba(140, 148, 200, 0.7)'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }

        // dotColor → 提取 rgb 分量，生成 20% 透明填充色
        function dotFillColor(dotColor) {
          const m = dotColor.match(/rgba?\((\d+\.?\d*),\s*(\d+\.?\d*),\s*(\d+\.?\d*)/)
          if (!m) return 'rgba(140,148,200,0.2)'
          return `rgba(${m[1]},${m[2]},${m[3]},0.2)`
        }

        coords.forEach(p => {
          const fill = dotFillColor(p.dotColor)

          // 层1：白色不透明底，遮住下方折线
          ctx.beginPath()
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255,255,255,1)'
          ctx.fill()

          // 层2：情绪色 20% 透明叠色
          ctx.beginPath()
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
          ctx.fillStyle = fill
          ctx.fill()

          // 层3：情绪色描边
          ctx.beginPath()
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
          ctx.strokeStyle = p.dotColor
          ctx.lineWidth = 1.5
          ctx.stroke()
        })

        // x 轴固定时间刻度：00:00 / 06:00 / 12:00 / 18:00 / 24:00
        ctx.font = `${10}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = 'rgba(120,120,120,0.7)'
        const timeY = padT + chartH + 8
        const timeTicks = ['00:00', '06:00', '12:00', '18:00', '24:00']
        timeTicks.forEach((label, i) => {
          const tx = padL + (i / (timeTicks.length - 1)) * chartW
          ctx.fillText(label, tx, timeY)
        })

        onDone && onDone()
      })
  },

  toggleFilter(e) {
    const key = e.currentTarget.dataset.key
    const current = this.data.activeFilter
    const newFilter = current === key ? '' : key
    const filteredGroups = newFilter
      ? this.data.groups
          .map(g => ({ ...g, records: g.records.filter(r => r.emotionKey === newFilter) }))
          .filter(g => g.records.length > 0)
          .map(g => ({
            ...g,
            showChart: g.records.length >= 2,
            chartPoints: g.records.length >= 2 ? this._buildChartPoints(g.records) : [],
          }))
      : this.data.groups
    this.setData({ activeFilter: newFilter, filteredGroups })
    if (newFilter) setTimeout(() => this._drawAllCharts(filteredGroups), 100)
  },

  _drawAllCharts(groups) {
    groups.forEach(g => { if (g.showChart) this._drawChart(g.date, g.chartPoints) })
  },
})
