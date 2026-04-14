/**
 * Flomi 数据存储工具
 * 优先使用微信云数据库（跨设备同步），本地 Storage 作为缓存兜底
 */

const KEY_RECORDS = 'flomi_records'

// ─── 本地缓存读写 ───────────────────────────────────────────

function _getLocalRecords() {
  try {
    const raw = wx.getStorageSync(KEY_RECORDS)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

function _setLocalRecords(records) {
  try {
    wx.setStorageSync(KEY_RECORDS, JSON.stringify(records.slice(0, 200)))
  } catch (e) {
    console.warn('[storage] setLocal failed', e)
  }
}

// ─── 判断云开发是否可用 ──────────────────────────────────────

function _cloudAvailable() {
  try {
    const app = getApp()
    return !!(wx.cloud && app && app.globalData && app.globalData.cloudReady)
  } catch (e) {
    return false
  }
}

// ─── 保存记录（本地 + 云同步） ───────────────────────────────

/**
 * 保存一条情绪记录
 * @param {Object} record - { date, emotionKey, emotionLabel, direction, energy, words, note, gameType }
 */
function saveRecord(record) {
  // 1. 先写本地缓存（保证即时可用）
  const all = _getLocalRecords()
  const existing = all.findIndex(r => r.date === record.date && r.emotionKey === record.emotionKey)
  if (existing >= 0) {
    all[existing] = Object.assign({}, all[existing], record, {
      count: (all[existing].count || 1) + 1
    })
  } else {
    all.unshift({ ...record, count: 1 })
  }
  _setLocalRecords(all)

  // 2. 异步同步到云数据库
  if (_cloudAvailable()) {
    wx.cloud.callFunction({
      name: 'saveRecord',
      data: { record },
      success: res => {
        if (!res.result || !res.result.success) {
          console.warn('[cloud] saveRecord failed', res.result)
        }
      },
      fail: err => {
        console.warn('[cloud] saveRecord error', err)
      }
    })
  }

  return true
}

// ─── 获取所有记录（优先云，降级本地） ───────────────────────

/**
 * 异步获取所有记录，优先从云数据库拉取并更新本地缓存
 * @param {Function} callback - (records: Array) => void
 */
function fetchAllRecords(callback) {
  if (_cloudAvailable()) {
    wx.cloud.callFunction({
      name: 'getRecords',
      success: res => {
        if (res.result && res.result.success && res.result.data) {
          const cloudRecords = res.result.data
          // 更新本地缓存
          _setLocalRecords(cloudRecords)
          callback(cloudRecords)
        } else {
          // 云端失败，降级本地
          callback(_getLocalRecords())
        }
      },
      fail: () => {
        callback(_getLocalRecords())
      }
    })
  } else {
    // 无云开发，直接用本地
    callback(_getLocalRecords())
  }
}

/**
 * 同步获取所有记录（从本地缓存，用于不需要等待的场景）
 */
function getAllRecords() {
  return _getLocalRecords()
}

// ─── 按日期分组（用于历史页） ────────────────────────────────

/**
 * 按日期分组获取记录（同步，从本地缓存）
 * 返回 [{ date, dateLabel, records: [...] }, ...]
 */
function getRecordsByDate() {
  return _groupByDate(_getLocalRecords())
}

/**
 * 异步按日期分组（优先云端）
 * @param {Function} callback - (groups: Array) => void
 */
function fetchRecordsByDate(callback) {
  fetchAllRecords(records => {
    callback(_groupByDate(records))
  })
}

function _groupByDate(all) {
  const map = {}
  all.forEach(r => {
    if (!map[r.date]) map[r.date] = []
    map[r.date].push(r)
  })
  return Object.keys(map)
    .sort((a, b) => b.localeCompare(a))
    .map(date => ({
      date,
      dateLabel: formatDateLabel(date),
      records: map[date],
    }))
}

// ─── 工具函数 ────────────────────────────────────────────────

function formatDateLabel(dateStr) {
  const today = getTodayStr()
  const yesterday = getYesterdayStr()
  if (dateStr === today) return '今天'
  if (dateStr === yesterday) return '昨天'
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parseInt(parts[1])}月${parseInt(parts[2])}日`
  }
  return dateStr
}

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getYesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function getTimeStr() {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

module.exports = {
  saveRecord,
  getAllRecords,
  fetchAllRecords,
  getRecordsByDate,
  fetchRecordsByDate,
  getTodayStr,
  getTimeStr,
}
