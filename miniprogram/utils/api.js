// utils/api.js - 云函数调用封装
// 统一封装云函数调用，便于后续维护与错误处理

/**
 * 调用云函数的通用方法
 * @param {string} name 云函数名
 * @param {object} data 入参
 */
function callCloud(name, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success: res => resolve(res.result),
      fail: err => {
        console.error(`[云函数 ${name}] 调用失败:`, err)
        wx.showToast({ title: '网络异常，请重试', icon: 'none' })
        reject(err)
      }
    })
  })
}

/**
 * 静默调用云函数（失败不弹 Toast，用于降级场景）
 */
function callCloudSilent(name, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success: res => resolve(res.result),
      fail: err => {
        console.warn(`[云函数 ${name}] 调用失败:`, err)
        reject(err)
      }
    })
  })
}

/** 微信登录，获取 openid */
const login = () => callCloud('login')

/** 获取题目列表
 * @param {object} params { categoryId, mode, limit }
 */
const getQuestions = (params) => callCloudSilent('getQuestions', params)

/** 提交答案，记录答题结果（静默，失败不阻断）
 * @param {object} params { questions, answers, categoryId, correctCount, total }
 */
const submitAnswer = (params) => callCloudSilent('submitAnswer', params)

/** 获取当前用户错题本
 * @param {object} params { page, pageSize, action }
 */
const getWrongQuestions = (params) => callCloudSilent('getWrongQuestions', params)

/** 清空当前用户错题本 */
const clearWrongQuestions = () => callCloudSilent('getWrongQuestions', { action: 'clear' })

/** 获取当前用户答题统计 */
const getUserStats = () => callCloudSilent('getUserStats')

/** 学员手机号登录 */
const studentLogin = (params) => callCloud('studentLogin', params)

module.exports = {
  login,
  getQuestions,
  submitAnswer,
  getWrongQuestions,
  clearWrongQuestions,
  getUserStats,
  studentLogin,
  // 管理后台接口
  adminLogin: (params) => callCloud('adminLogin', params),
  adminGetQuestions: (params) => callCloud('adminGetQuestions', params),
  adminSaveStudent: (params) => callCloud('adminSaveStudent', params),
  adminSaveQuestion: (params) => callCloud('adminSaveQuestion', params),
  adminDeleteQuestion: (id) => callCloud('adminDeleteQuestion', { _id: id }),
  adminGetStudents: (params) => callCloud('adminGetStudents', params),
  adminGetStats: () => callCloud('adminGetStats'),
  adminBatchImportStudents: (params) => callCloud('adminBatchImportStudents', params)
}
