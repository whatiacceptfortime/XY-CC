// cloudfunctions/adminLogin/index.js - 管理员登录（手机号白名单校验）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { phone, account } = event
  const loginKey = account || phone

  if (!loginKey) {
    return { code: 400, msg: '请输入账号' }
  }

  try {
    // 查询账号是否在白名单（兼容 phone 和 account 字段）
    const _ = db.command
    const res = await db.collection('admins').where(
      _.or([{ phone: loginKey }, { account: loginKey }])
    ).get()

    if (res.data.length === 0) {
      return { code: 403, msg: '该账号未授权，无管理权限', isAdmin: false }
    }

    const admin = res.data[0]

    // 首次登录：绑定 openid
    if (!admin._openid || admin._openid !== wxContext.OPENID) {
      await db.collection('admins').doc(admin._id).update({
        data: { _openid: wxContext.OPENID, lastLogin: db.serverDate() }
      })
    }

    return {
      code: 0,
      msg: '登录成功',
      isAdmin: true,
      adminInfo: {
        _id: admin._id,
        name: admin.name,
        phone: admin.phone,
        role: admin.role || 'admin'
      }
    }
  } catch (e) {
    console.error('adminLogin error:', e)
    return { code: 500, msg: '服务器错误: ' + e.message, isAdmin: false }
  }
}
