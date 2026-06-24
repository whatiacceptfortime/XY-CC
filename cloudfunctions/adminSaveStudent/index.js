// cloudfunctions/adminSaveStudent/index.js - 管理员录入/编辑学员
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  console.log('adminSaveStudent 开始, openid:', openid, 'event:', JSON.stringify(event).slice(0, 200))

  // 鉴权：openid 为空时跳过鉴权（控制台测试用），有 openid 时校验
  if (openid) {
    try {
      const adminCheck = await db.collection('admins').where({ _openid: openid }).get()
      if (adminCheck.data.length === 0) {
        console.log('鉴权失败: openid 不在 admins 集合中')
        return { code: 403, msg: '无管理权限' }
      }
    } catch (e) {
      console.warn('鉴权查询异常，跳过:', e.message)
    }
  }

  const { _id, account, phone, name, expireDate } = event
  const accountKey = (account || phone || '').trim()

  if (!accountKey) {
    return { code: 400, msg: '请输入学员账号' }
  }
  if (!name || !name.trim()) {
    return { code: 400, msg: '请输入学员姓名' }
  }
  if (!expireDate) {
    return { code: 400, msg: '请选择有效期' }
  }

  try {
    // 检查账号是否已存在（新增时）
    if (!_id) {
      const _ = db.command
      const exist = await db.collection('students').where(
        _.or([{ account: accountKey }, { phone: accountKey }])
      ).get()
      if (exist.data.length > 0) {
        return { code: 400, msg: '该账号已录入' }
      }
    }

    const studentData = {
      account: accountKey,
      name: name.trim(),
      expireDate: new Date(expireDate),
      updateTime: db.serverDate()
    }

    if (_id) {
      await db.collection('students').doc(_id).update({ data: studentData })
      return { code: 0, msg: '修改成功', _id }
    } else {
      studentData.createTime = db.serverDate()
      const res = await db.collection('students').add({ data: studentData })
      console.log('录入成功, _id:', res._id)
      return { code: 0, msg: '录入成功', _id: res._id }
    }
  } catch (e) {
    console.error('adminSaveStudent error:', e)
    return { code: 500, msg: '保存失败: ' + e.message }
  }
}
