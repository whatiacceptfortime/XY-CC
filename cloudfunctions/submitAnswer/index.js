// cloudfunctions/submitAnswer/index.js - 提交答卷云函数
// 记录答题成绩 + 自动收录错题到错题本
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { questions, answers, correctCount, total, categoryId } = event

  try {
    // 1. 记录本次答题成绩
    await db.collection('records').add({
      data: {
        openid: wxContext.OPENID,
        categoryId,
        total,
        correctCount,
        answers,
        createTime: db.serverDate()
      }
    })

    // 2. 自动收录错题
    const wrongQuestions = []
    questions.forEach((q, i) => {
      if (answers[i] !== -1 && answers[i] !== q.answer) {
        wrongQuestions.push({
          openid: wxContext.OPENID,
          questionId: q.id,
          title: q.title,
          categoryId,
          userAnswer: answers[i],
          correctAnswer: q.answer,
          analysis: q.analysis || '',
          createTime: db.serverDate()
        })
      }
    })

    // 批量写入错题（逐条 add，云数据库单次批量上限 20）
    for (const wq of wrongQuestions) {
      await db.collection('wrong_questions').add({ data: wq })
    }

    return { success: true, wrongCount: wrongQuestions.length }
  } catch (e) {
    console.error('submitAnswer error:', e)
    return { success: false, error: e.message }
  }
}
