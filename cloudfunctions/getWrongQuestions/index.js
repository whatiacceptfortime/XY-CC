// cloudfunctions/getWrongQuestions/index.js - 获取当前用户错题本
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { page = 1, pageSize = 50, action = 'list' } = event
  const skip = (page - 1) * pageSize

  try {
    if (action === 'clear') {
      // 清空当前用户错题
      const res = await db.collection('wrong_questions')
        .where({ _openid: wxContext.OPENID })
        .remove()
      return { code: 0, msg: '已清空', removed: res.stats.removed }
    }

    // 查询错题列表
    const countRes = await db.collection('wrong_questions')
      .where({ _openid: wxContext.OPENID })
      .count()

    const res = await db.collection('wrong_questions')
      .where({ _openid: wxContext.OPENID })
      .skip(skip)
      .limit(pageSize)
      .orderBy('createTime', 'desc')
      .get()

    return {
      code: 0,
      list: res.data,
      total: countRes.total,
      page: Number(page),
      pageSize: Number(pageSize),
      hasMore: skip + res.data.length < countRes.total
    }
  } catch (e) {
    console.error('getWrongQuestions error:', e)
    return { code: 500, msg: e.message, list: [], total: 0 }
  }
}
