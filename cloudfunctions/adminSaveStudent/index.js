// cloudfunctions/adminSaveStudent/index.js - 管理员录入/编辑学员
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

  const { _id, phone, name, expireDate } = event

  if (!phone || !/^1\d{10}$/.test(phone)) {
    return { code: 400, msg: '请输入正确的手机号' }
  }
  if (!name) {
    return { code: 400, msg: '请输入学员姓名' }
  }
  if (!expireDate) {
    return { code: 400, msg: '请选择有效期' }
  }

  try {
    // 检查手机号是否已存在（新增时）
    if (!_id) {
      const exist = await db.collection('students').where({ phone }).get()
      if (exist.data.length > 0) {
        return { code: 400, msg: '该手机号已录入' }
      }
    }

    const studentData = {
      phone,
      name,
      expireDate: new Date(expireDate),
      updateTime: db.serverDate()
    }

    if (_id) {
      await db.collection('students').doc(_id).update({ data: studentData })
      return { code: 0, msg: '修改成功', _id }
    } else {
      studentData.createTime = db.serverDate()
      const res = await db.collection('students').add({ data: studentData })
      return { code: 0, msg: '录入成功', _id: res._id }
    }
  } catch (e) {
    console.error('adminSaveStudent error:', e)
    return { code: 500, msg: '保存失败: ' + e.message }
  }
}
