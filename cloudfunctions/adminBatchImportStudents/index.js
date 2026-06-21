// cloudfunctions/adminBatchImportStudents/index.js - 批量导入学员
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

  const { students, durationMonths = 12 } = event

  if (!students || !Array.isArray(students) || students.length === 0) {
    return { code: 400, msg: '无数据' }
  }

  // 计算到期日期
  const expireDate = new Date()
  expireDate.setMonth(expireDate.getMonth() + Number(durationMonths))

  let success = 0
  let failed = 0
  const errors = []

  for (let i = 0; i < students.length; i++) {
    const s = students[i]
    const account = (s.account || s.phone || '').trim()
    const name = (s.name || '').trim()

    if (!account) {
      failed++
      errors.push(`第${i + 1}行：账号为空`)
      continue
    }
    if (!name) {
      failed++
      errors.push(`第${i + 1}行：姓名为空`)
      continue
    }

    try {
      // 检查是否已存在（兼容 account 和 phone 字段）
      const _ = db.command
      const exist = await db.collection('students').where(
        _.or([{ account }, { phone: account }])
      ).get()
      if (exist.data.length > 0) {
        // 已存在则更新
        await db.collection('students').doc(exist.data[0]._id).update({
          data: { account, name, expireDate, updateTime: db.serverDate() }
        })
        success++
      } else {
        await db.collection('students').add({
          data: {
            account,
            name,
            expireDate,
            createTime: db.serverDate()
          }
        })
        success++
      }
    } catch (e) {
      failed++
      errors.push(`第${i + 1}行：${e.message}`)
    }
  }

  return {
    code: 0,
    msg: `导入完成：成功${success}条，失败${failed}条`,
    success,
    failed,
    errors: errors.slice(0, 10) // 最多返回前10条错误
  }
}
