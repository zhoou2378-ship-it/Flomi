// 云函数：获取当前用户的所有情绪记录
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const col = db.collection('flomi_records')

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()

  try {
    // 最多取 200 条，按日期倒序
    const res = await col
      .where({ _openid: OPENID })
      .orderBy('date', 'desc')
      .limit(200)
      .get()

    return { success: true, data: res.data }
  } catch (e) {
    console.error('[getRecords]', e)
    return { success: false, error: e.message, data: [] }
  }
}
