// pages/admin/login/login.js - 管理员登录
const app = getApp()
const api = require('../../../utils/api')

Page({
  data: {
    loading: false,
    account: ''
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
        wx.showModal({ title: '无权限', content: res.msg || '该账号未授权', showCancel: false })
      }
    } catch (e) {
      wx.showToast({ title: '请使用手动输入', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onAccountInput(e) {
    this.setData({ account: e.detail.value })
  },

  /** 手动输入账号登录 */
  async onManualLogin() {
    const account = this.data.account.trim()
    if (!account) {
      wx.showToast({ title: '请输入账号', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    try {
      const res = await api.adminLogin({ account, phone: account })
      if (res.code === 0 && res.isAdmin) {
        this.loginSuccess(res)
      } else {
        wx.showModal({ title: '无权限', content: res.msg || '该账号未授权', showCancel: false })
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
