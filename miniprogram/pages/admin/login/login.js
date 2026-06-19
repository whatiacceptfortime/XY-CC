// pages/admin/login/login.js - 管理员登录
const app = getApp()
const api = require('../../../utils/api')

Page({
  data: {
    loading: false,
    phone: ''
  },

  /** 微信手机号快速登录（真机用） */
  async onGetPhone(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      wx.showToast({ title: '请使用手动输入', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    try {
      const res = await api.adminLogin({ cloudID: e.detail.cloudID })
      if (res.code === 0 && res.isAdmin) {
        this.loginSuccess(res)
      } else {
        wx.showModal({ title: '无权限', content: res.msg || '该手机号未授权', showCancel: false })
      }
    } catch (e) {
      wx.showToast({ title: '请使用手动输入', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  /** 手动输入手机号登录 */
  async onManualLogin() {
    const phone = this.data.phone.trim()
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '请输入11位手机号', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    try {
      const res = await api.adminLogin({ phone })
      if (res.code === 0 && res.isAdmin) {
        this.loginSuccess(res)
      } else {
        wx.showModal({ title: '无权限', content: res.msg || '该手机号未授权', showCancel: false })
      }
    } catch (e) {
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  loginSuccess(res) {
    app.globalData.isAdmin = true
    app.globalData.adminInfo = res.adminInfo
    wx.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/admin/dashboard/dashboard' })
    }, 500)
  }
})
