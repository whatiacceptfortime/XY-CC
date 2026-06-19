// pages/login/login.js - 学员/管理员手机号登录
const app = getApp()
const api = require('../../utils/api')

Page({
  data: {
    loading: false,
    phone: '',
    cloudReady: false
  },

  onLoad() {
    this.setData({ cloudReady: app.globalData.cloudReady })
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  /** 手机号登录 */
  async onLogin() {
    if (this.data.loading) return

    if (!app.globalData.cloudReady) {
      wx.showModal({
        title: '云开发未配置',
        content: '登录功能需要开通云开发。当前为离线模式，仅可浏览题库。',
        showCancel: false,
        confirmText: '我知道了'
      })
      return
    }

    const phone = this.data.phone.trim()
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '请输入11位手机号', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      // 1. 先尝试管理员登录
      const adminRes = await api.adminLogin({ phone })
      if (adminRes.code === 0 && adminRes.isAdmin) {
        app.globalData.isAdmin = true
        app.globalData.adminInfo = adminRes.adminInfo
        app.globalData.isLoggedIn = true
        wx.setStorageSync('adminInfo', adminRes.adminInfo)

        wx.showToast({ title: '管理员登录成功', icon: 'success' })
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/admin/dashboard/dashboard' })
        }, 800)
        return
      }

      // 2. 不是管理员，尝试学员登录
      const res = await api.studentLogin({ phone })
      if (res.code === 0) {
        app.globalData.studentInfo = res.studentInfo
        app.globalData.isLoggedIn = true
        wx.setStorageSync('studentInfo', res.studentInfo)

        wx.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' })
        }, 800)
      } else {
        wx.showModal({
          title: '登录失败',
          content: res.msg,
          showCancel: false
        })
      }
    } catch (e) {
      console.error('登录失败', e)
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})
