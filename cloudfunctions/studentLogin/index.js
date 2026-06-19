// cloudfunctions/studentLogin/index.js - 学员手机号登录+有效期校验
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { phone } = event

  if (!phone) {
    return { code: 400, msg: '请输入手机号' }
  }

  try {
    // 查询手机号是否在学员白名单
    const res = await db.collection('students').where({ phone }).get()

    if (res.data.length === 0) {
      return { code: 403, msg: '该手机号未开通权限，请联系管理员' }
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
        phone: student.phone,
        expireDate: student.expireDate
      }
    }
  } catch (e) {
    console.error('studentLogin error:', e)
    return { code: 500, msg: '服务器错误: ' + e.message }
  }
}
