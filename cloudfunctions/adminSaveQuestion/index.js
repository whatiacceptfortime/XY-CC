// cloudfunctions/adminSaveQuestion/index.js - 新增/编辑题目
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

  const { _id, categoryId, categoryName, type, title, options, answer, analysis } = event

  // 参数校验
  if (!title || !options || options.length < 2) {
    return { code: 400, msg: '题干和选项不能为空' }
  }
  if (answer === undefined || answer === null) {
    return { code: 400, msg: '请设置正确答案' }
  }

  const questionData = {
    categoryId: categoryId || 'c01',
    categoryName: categoryName || '叉车司机',
    type: type || 'single',
    title: title.trim(),
    options: options.map(o => o.trim()),
    answer,
    analysis: analysis || '',
    updateTime: db.serverDate()
  }

  try {
    if (_id) {
      // 编辑
      await db.collection('questions').doc(_id).update({ data: questionData })
      return { code: 0, msg: '修改成功', _id }
    } else {
      // 新增
      questionData.createTime = db.serverDate()
      const res = await db.collection('questions').add({ data: questionData })
      return { code: 0, msg: '添加成功', _id: res._id }
    }
  } catch (e) {
    console.error('adminSaveQuestion error:', e)
    return { code: 500, msg: '保存失败: ' + e.message }
  }
}
