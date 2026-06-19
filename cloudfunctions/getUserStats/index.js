// cloudfunctions/getUserStats/index.js - 获取当前用户答题统计
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const $ = db.command.aggregate

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    // 1. 答题记录聚合
    const recordRes = await db.collection('records').aggregate()
      .match({ _openid: wxContext.OPENID })
      .group({
        _id: null,
        totalAnswered: $.sum(1),
        totalCorrect: $.sum('$correctCount'),
        totalQuestions: $.sum('$total')
      })
      .end()

    let stats = {
      totalAnswered: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      accuracy: 0,
      wrongCount: 0
    }

    if (recordRes.list.length > 0) {
      const r = recordRes.list[0]
      stats.totalAnswered = r.totalAnswered
      stats.totalCorrect = r.totalCorrect
      stats.totalQuestions = r.totalQuestions
      stats.accuracy = r.totalQuestions > 0
        ? Math.round((r.totalCorrect / r.totalQuestions) * 1000) / 10
        : 0
    }

    // 2. 错题数
    const wrongRes = await db.collection('wrong_questions')
      .where({ _openid: wxContext.OPENID })
      .count()
    stats.wrongCount = wrongRes.total

    return { code: 0, stats }
  } catch (e) {
    console.error('getUserStats error:', e)
    return { code: 500, msg: e.message, stats: null }
  }
}
