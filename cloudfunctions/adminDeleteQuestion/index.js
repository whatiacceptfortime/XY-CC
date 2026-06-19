// cloudfunctions/adminDeleteQuestion/index.js - 删除题目
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  // 鉴权
  const adminCheck = await db.collection('admins').where({ _openid: wxContext.OPENID }).get()
  if (adminCheck.data.length === 0) {
    return { code: 403, msg: '无管理权限' }
  }

  const { _id } = event
  if (!_id) {
    return { code: 400, msg: '缺少题目ID' }
  }

  try {
    await db.collection('questions').doc(_id).remove()
    return { code: 0, msg: '删除成功' }
  } catch (e) {
    console.error('adminDeleteQuestion error:', e)
    return { code: 500, msg: '删除失败: ' + e.message }
  }
}
