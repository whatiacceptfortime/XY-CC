// cloudfunctions/studentLogin/index.js - 学员账号登录+有效期校验
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { account, phone } = event
  const loginKey = account || phone // 兼容旧数据

  if (!loginKey) {
    return { code: 400, msg: '请输入账号' }
  }

  try {
    // 查询账号是否在学员白名单（兼容 account 和 phone 字段）
    const _ = db.command
    const res = await db.collection('students').where(
      _.or([{ account: loginKey }, { phone: loginKey }])
    ).get()

    if (res.data.length === 0) {
      return { code: 403, msg: '该账号未开通权限，请联系管理员' }
    }

    const student = res.data[0]

    // 校验有效期
    const now = new Date()
    const expireDate = student.expireDate ? new Date(student.expireDate) : null

    if (expireDate && now > expireDate) {
      return { code: 403, msg: '您的使用权限已过期，请联系管理员续期' }
    }

    // 首次登录：绑定 openid
    if (!student._openid || student._openid !== wxContext.OPENID) {
      await db.collection('students').doc(student._id).update({
        data: { _openid: wxContext.OPENID, lastLogin: db.serverDate() }
      })
    }

    return {
      code: 0,
      msg: '登录成功',
      studentInfo: {
        _id: student._id,
        name: student.name,
        account: student.account || student.phone || loginKey,
        expireDate: student.expireDate
      }
    }
  } catch (e) {
    console.error('studentLogin error:', e)
    return { code: 500, msg: '服务器错误: ' + e.message }
  }
}
