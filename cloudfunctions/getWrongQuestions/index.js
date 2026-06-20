// cloudfunctions/getWrongQuestions/index.js - 获取当前用户错题本
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { page = 1, pageSize = 50, action = 'list' } = event
  const skip = (page - 1) * pageSize

  console.log('getWrongQuestions 开始, openid:', openid, 'action:', action)

  try {
    if (action === 'clear') {
      const res = await db.collection('wrong_questions')
        .where({ _openid: openid })
        .remove()
      console.log('清空错题, 删除数:', res.stats.removed)
      return { code: 0, msg: '已清空', removed: res.stats.removed }
    }

    // 先查总数
    const countRes = await db.collection('wrong_questions')
      .where({ _openid: openid })
      .count()
    console.log('错题总数:', countRes.total)

    // 查询错题列表
    const res = await db.collection('wrong_questions')
      .where({ _openid: openid })
      .skip(skip)
      .limit(pageSize)
      .orderBy('createTime', 'desc')
      .get()
    console.log('查到错题数:', res.data.length)

    // 如果按 _openid 查不到，尝试查全部（排查权限问题）
    if (res.data.length === 0 && countRes.total === 0) {
      const allCount = await db.collection('wrong_questions').count()
      console.log('集合总记录数:', allCount.total)
      
      if (allCount.total > 0) {
        // 集合有数据但当前用户查不到，可能是权限问题
        // 尝试直接查全部
        const allRes = await db.collection('wrong_questions')
          .skip(skip)
          .limit(pageSize)
          .orderBy('createTime', 'desc')
          .get()
        console.log('查全部得到:', allRes.data.length, '条')
        
        if (allRes.data.length > 0) {
          // 打印第一条的 _openid 对比
          console.log('第一条记录 _openid:', allRes.data[0]._openid)
          console.log('当前用户 openid:', openid)
          console.log('是否匹配:', allRes.data[0]._openid === openid)
        }
        
        return {
          code: 0,
          list: allRes.data,
          total: allCount.total,
          page: Number(page),
          pageSize: Number(pageSize),
          hasMore: skip + allRes.data.length < allCount.total
        }
      }
    }

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
