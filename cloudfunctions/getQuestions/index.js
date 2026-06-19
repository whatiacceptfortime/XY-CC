// cloudfunctions/getQuestions/index.js - 获取题目云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate

exports.main = async (event, context) => {
  const { categoryId, mode = 'practice', limit = 20 } = event

  try {
    // 模式一：返回各科目题量统计（含科目名）
    if (mode === 'categories') {
      const res = await db.collection('questions').aggregate()
        .group({
          _id: '$categoryId',
          name: $.first('$categoryName'),
          count: $.sum(1)
        })
        .end()
      const categories = res.list.map(c => ({
        id: c._id,
        name: c.name || c._id,
        count: c.count
      }))
      return { categories }
    }

    // 模式二：按科目抽取题目
    const query = categoryId && categoryId !== 'all' ? { categoryId } : {}
    const res = await db.collection('questions')
      .where(query)
      .limit(Number(limit))
      .get()

    return { questions: res.data }
  } catch (e) {
    // 数据库尚未初始化时返回空数组，前端会用 mock 数据
    console.error('getQuestions error:', e)
    return { questions: [], error: e.message }
  }
}
