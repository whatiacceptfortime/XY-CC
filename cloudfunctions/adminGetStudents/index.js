// cloudfunctions/adminGetStudents/index.js - 学员列表（从 students 集合读取）
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

  const { page = 1, pageSize = 20, keyword } = event
  const skip = (page - 1) * pageSize

  try {
    let query = {}
    if (keyword) {
      query = db.command.or([
        { phone: db.RegExp({ regexp: keyword, options: 'i' }) },
        { name: db.RegExp({ regexp: keyword, options: 'i' }) }
      ])
    }

    const countRes = await db.collection('students').where(query).count()
    const total = countRes.total

    const res = await db.collection('students')
      .where(query)
      .skip(skip)
      .limit(pageSize)
      .orderBy('createTime', 'desc')
      .get()

    // 动态计算状态
    const now = new Date()
    const list = res.data.map(s => {
      const expireDate = s.expireDate ? new Date(s.expireDate) : null
      const isExpired = expireDate && now > expireDate
      return {
        ...s,
        status: isExpired ? 'expired' : 'active',
        expireDateStr: expireDate ? expireDate.toISOString().slice(0, 10) : '未设置'
      }
    })

    return {
      code: 0,
      list,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      hasMore: skip + list.length < total
    }
  } catch (e) {
    console.error('adminGetStudents error:', e)
    return { code: 500, msg: '查询失败: ' + e.message, list: [], total: 0 }
  }
}
