// cloudfunctions/adminGetStats/index.js - 数据统计
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const $ = db.command.aggregate

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  // 鉴权
  const adminCheck = await db.collection('admins').where({ _openid: wxContext.OPENID }).get()
  if (adminCheck.data.length === 0) {
    return { code: 403, msg: '无管理权限' }
  }

  try {
    // 1. 题库总量
    const questionsCount = await db.collection('questions').count()

    // 2. 累计答题次数
    const recordsCount = await db.collection('records').count()

    // 3. 学员数（去重 openid）
    const studentRes = await db.collection('records').aggregate()
      .group({ _id: '$_openid' })
      .end()
    const studentCount = studentRes.list.length

    // 4. 平均正确率
    const avgRes = await db.collection('records').aggregate()
      .group({
        _id: null,
        totalCorrect: $.sum('$correctCount'),
        totalQuestions: $.sum('$total')
      })
      .end()
    let avgAccuracy = 0
    if (avgRes.list.length > 0 && avgRes.list[0].totalQuestions > 0) {
      avgAccuracy = Math.round((avgRes.list[0].totalCorrect / avgRes.list[0].totalQuestions) * 1000) / 10
    }

    // 5. 各科目题量分布
    const categoryRes = await db.collection('questions').aggregate()
      .group({
        _id: '$categoryId',
        name: $.first('$categoryName'),
        count: $.sum(1)
      })
      .end()
    const categories = categoryRes.list.map(c => ({
      categoryId: c._id,
      name: c.name || c._id,
      count: c.count
    }))

    // 6. 各题型分布
    const typeRes = await db.collection('questions').aggregate()
      .group({
        _id: '$type',
        count: $.sum(1)
      })
      .end()
    const typeDistribution = typeRes.list.map(t => ({
      type: t._id,
      count: t.count
    }))

    return {
      code: 0,
      stats: {
        questionsCount: questionsCount.total,
        recordsCount: recordsCount.total,
        studentCount,
        avgAccuracy,
        categories,
        typeDistribution
      }
    }
  } catch (e) {
    console.error('adminGetStats error:', e)
    return { code: 500, msg: '统计失败: ' + e.message }
  }
}
