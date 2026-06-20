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
        createTime: db.serverDate()
      }
    })

    // 2. 自动收录错题
    const wrongQuestions = []
    questions.forEach((q, i) => {
      const userAnswer = answers[i]
      // 跳过未作答
      if (userAnswer === -1 || userAnswer === undefined || userAnswer === null) return

      // 判断是否答对
      let isCorrect = false
      if (q.type === 'multi') {
        // 多选：排序后比较数组
        const userArr = [...userAnswer].sort((a, b) => a - b)
        const correctArr = [...q.answer].sort((a, b) => a - b)
        isCorrect = JSON.stringify(userArr) === JSON.stringify(correctArr)
      } else {
        // 单选/判断：比较数字
        isCorrect = userAnswer === q.answer
      }

      if (!isCorrect) {
        wrongQuestions.push({
          openid: wxContext.OPENID,
          questionId: q.id || q._id || '',
          title: q.title,
          categoryId,
          type: q.type,
          options: q.options,
          userAnswer,
          correctAnswer: q.answer,
          analysis: q.analysis || '',
          createTime: db.serverDate()
        })
      }
    })

    // 批量写入错题
    for (const wq of wrongQuestions) {
      await db.collection('wrong_questions').add({ data: wq })
    }

    return { success: true, wrongCount: wrongQuestions.length, total }
  } catch (e) {
    console.error('submitAnswer error:', e)
    return { success: false, error: e.message }
  }
}
