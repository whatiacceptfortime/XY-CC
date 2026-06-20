// cloudfunctions/adminGetStudentDetail/index.js - 学员答题详情（去重统计）
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

  try {
    // 1. 题库总量
    const questionsCount = await db.collection('questions').count()
    const totalQuestions = questionsCount.total

    // 2. 查所有学员（从 students 集合）
    const PAGE_SIZE = 100
    let allStudents = []
    let skip = 0
    while (true) {
      const batch = await db.collection('students').skip(skip).limit(PAGE_SIZE).get()
      allStudents = allStudents.concat(batch.data)
      if (batch.data.length < PAGE_SIZE) break
      skip += PAGE_SIZE
    }

    // 3. 查所有答题记录（从 records 集合）
    let allRecords = []
    skip = 0
    while (true) {
      const batch = await db.collection('records').skip(skip).limit(PAGE_SIZE).get()
      allRecords = allRecords.concat(batch.data)
      if (batch.data.length < PAGE_SIZE) break
      skip += PAGE_SIZE
    }

    // 4. 按 _openid 聚合答题数据
    const recordMap = {} // _openid -> { uniqueIds: Set, totalAnswered, totalCorrect, totalQuestions, lastTime }
    allRecords.forEach(r => {
      const oid = r._openid
      if (!recordMap[oid]) {
        recordMap[oid] = {
          uniqueIds: new Set(),
          totalAnswered: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          lastTime: null
        }
      }
      recordMap[oid].totalAnswered++
      recordMap[oid].totalCorrect += (r.correctCount || 0)
      recordMap[oid].totalQuestions += (r.total || 0)
      // 收集去重题ID
      if (r.questionIds && Array.isArray(r.questionIds)) {
        r.questionIds.forEach(id => id && recordMap[oid].uniqueIds.add(id))
      }
      // 最近答题时间
      if (r.createTime) {
        const t = new Date(r.createTime)
        if (!recordMap[oid].lastTime || t > recordMap[oid].lastTime) {
          recordMap[oid].lastTime = t
        }
      }
    })

    // 5. 合并学员信息 + 答题数据
    const list = allStudents.map(s => {
      const r = recordMap[s._openid] || {
        uniqueIds: new Set(),
        totalAnswered: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        lastTime: null
      }
      const uniqueAnswered = r.uniqueIds.size
      const coverage = totalQuestions > 0
        ? Math.round((uniqueAnswered / totalQuestions) * 1000) / 10
        : 0
      const correctRate = r.totalQuestions > 0
        ? Math.round((r.totalCorrect / r.totalQuestions) * 1000) / 10
        : 0

      // 到期状态
      const now = new Date()
      const expire = s.expireDate ? new Date(s.expireDate) : null
      const isExpired = expire && now > expire

      return {
        _id: s._id,
        name: s.name || '未命名',
        phone: s.phone || '',
        uniqueAnswered,
        totalAnswered: r.totalAnswered,
        correctRate,
        coverage,
        totalQuestions,
        status: isExpired ? 'expired' : 'active',
        expireDateStr: expire ? expire.toISOString().slice(0, 10) : '未设置',
        lastTimeStr: r.lastTime ? r.lastTime.toISOString().slice(0, 10) : '未答题'
      }
    })

    return {
      code: 0,
      totalQuestions,
      list,
      total: list.length
    }
  } catch (e) {
    console.error('adminGetStudentDetail error:', e)
    return { code: 500, msg: e.message, list: [], totalQuestions: 0 }
  }
}
