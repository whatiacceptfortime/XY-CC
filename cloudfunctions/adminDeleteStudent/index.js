// cloudfunctions/adminDeleteStudent/index.js - 删除学员
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 鉴权
  if (openid) {
    const adminCheck = await db.collection('admins').where({ _openid: openid }).get()
    if (adminCheck.data.length === 0) {
      return { code: 403, msg: '无管理权限' }
    }
  }

  const { _id } = event
  if (!_id) {
    return { code: 400, msg: '缺少学员ID' }
  }

  try {
    // 先查学员的 openid（删除前）
    const studentRes = await db.collection('students').doc(_id).get()
    const studentOpenid = studentRes.data ? studentRes.data._openid : null

    // 删除学员
    await db.collection('students').doc(_id).remove()

    // 同时清理该学员的数据
    if (studentOpenid) {
      await db.collection('records').where({ _openid: studentOpenid }).remove()
      await db.collection('wrong_questions').where({ _openid: studentOpenid }).remove()
    }

    return { code: 0, msg: '删除成功' }
  } catch (e) {
    console.error('adminDeleteStudent error:', e)
    return { code: 500, msg: '删除失败: ' + e.message }
  }
}
