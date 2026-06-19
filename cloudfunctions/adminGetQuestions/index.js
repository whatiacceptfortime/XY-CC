// cloudfunctions/adminGetQuestions/index.js - 管理员查询题目列表（分页+筛选）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  // 鉴权：校验是否管理员
  const adminCheck = await db.collection('admins').where({ _openid: wxContext.OPENID }).get()
  if (adminCheck.data.length === 0) {
    return { code: 403, msg: '无管理权限' }
  }

  const { page = 1, pageSize = 20, categoryId, type, keyword } = event
  const skip = (page - 1) * pageSize

  try {
    let query = {}

    if (categoryId && categoryId !== 'all') {
      query.categoryId = categoryId
    }
    if (type && type !== 'all') {
      query.type = type
    }
    if (keyword) {
      query.title = db.RegExp({ regexp: keyword, options: 'i' })
    }

    // 获取总数
    const countRes = await db.collection('questions').where(query).count()
    const total = countRes.total

    // 分页查询
    const res = await db.collection('questions')
      .where(query)
      .skip(skip)
      .limit(pageSize)
      .orderBy('createTime', 'desc')
      .get()

    return {
      code: 0,
      list: res.data,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      hasMore: skip + res.data.length < total
    }
  } catch (e) {
    console.error('adminGetQuestions error:', e)
    return { code: 500, msg: '查询失败: ' + e.message, list: [], total: 0 }
  }
}
