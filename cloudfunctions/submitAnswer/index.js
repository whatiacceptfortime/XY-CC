// cloudfunctions/submitAnswer/index.js - 提交答卷云函数
// 记录答题成绩 + 自动收录错题到错题本
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { questions, answers, correctCount, total, categoryId } = event

  console.log('submitAnswer 收到参数:', { 
    openid: wxContext.OPENID, 
    correctCount, 
    total, 
    answersLength: answers ? answers.length : 0,
    questionsLength: questions ? questions.length : 0
  })

  try {
    // 1. 记录本次答题成绩（_openid 由系统自动写入，不需手动加）
    const recordRes = await db.collection('records').add({
      data: {
        categoryId: categoryId || '',
        total: total || 0,
        correctCount: correctCount || 0,
        createTime: db.serverDate()
      }
    })
    console.log('records 写入成功, _id:', recordRes._id)

    // 2. 自动收录错题
    let wrongCount = 0
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const userAnswer = answers[i]

      // 跳过未作答
      if (userAnswer === -1 || userAnswer === undefined || userAnswer === null) continue

      // 判断是否答对
      let isCorrect = false
      if (q.type === 'multi') {
        // 多选：排序后比较数组
        const userArr = Array.isArray(userAnswer) ? [...userAnswer].sort((a, b) => a - b) : [userAnswer]
        const correctArr = Array.isArray(q.answer) ? [...q.answer].sort((a, b) => a - b) : [q.answer]
        isCorrect = JSON.stringify(userArr) === JSON.stringify(correctArr)
      } else {
        // 单选/判断：比较数字
        const ua = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer
        isCorrect = ua === q.answer
      }

      if (!isCorrect) {
        try {
          await db.collection('wrong_questions').add({
            data: {
              questionId: q.id || q._id || '',
              title: q.title || '',
              categoryId: categoryId || '',
              type: q.type || 'single',
              options: q.options || [],
              userAnswer: userAnswer,
              correctAnswer: q.answer,
              analysis: q.analysis || '',
              createTime: db.serverDate()
            }
          })
          wrongCount++
        } catch (e) {
          console.error('写入错题失败:', i, e.message)
        }
      }
    }

    console.log('submitAnswer 完成, 错题数:', wrongCount)
    return { success: true, wrongCount, total: total || 0 }
  } catch (e) {
    console.error('submitAnswer error:', e)
    return { success: false, error: e.message }
  }
}
