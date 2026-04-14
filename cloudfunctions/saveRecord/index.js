// 云函数：保存一条情绪记录到云数据库
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const col = db.collection('flomi_records')

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const record = event.record

  try {
    // 同一天同一情绪合并
    const res = await col.where({
      _openid: OPENID,
      date: record.date,
      emotionKey: record.emotionKey,
    }).get()

    if (res.data && res.data.length > 0) {
      const existing = res.data[0]
      await col.doc(existing._id).update({
        data: {
          ...record,
          count: (existing.count || 1) + 1,
          updatedAt: db.serverDate(),
        }
      })
    } else {
      await col.add({
        data: {
          ...record,
          count: 1,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate(),
        }
      })
    }
    return { success: true }
  } catch (e) {
    console.error('[saveRecord]', e)
    return { success: false, error: e.message }
  }
}
