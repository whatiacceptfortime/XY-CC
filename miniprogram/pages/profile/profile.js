// pages/profile/profile.js - 我的
const app = getApp()
const api = require('../../utils/api')

Page({
  data: {
    userInfo: null,
    hasLogin: false,
    tapCount: 0,            // 长按计数器（管理入口触发）
    stats: {
      totalAnswered: 0,
      accuracy: '0%',
      dayStreak: 0
    },
    menus: [
      { id: 'favorites', icon: '⭐', name: '我的收藏' },
      { id: 'records', icon: '📊', name: '答题记录' },
      { id: 'about', icon: 'ℹ️', name: '关于我们' },
      { id: 'contact', icon: '📞', name: '联系学校' },
      { id: 'logout', icon: '🚪', name: '退出登录' }
    ]
  },

  onShow() {
    // 判断登录状态：学员有 studentInfo，管理员有 adminInfo
    const isLoggedIn = app.globalData.isLoggedIn || app.globalData.isAdmin
    const userInfo = app.globalData.isAdmin
      ? { nickName: app.globalData.adminInfo?.name || '管理员' }
      : app.globalData.studentInfo
        ? { nickName: app.globalData.studentInfo.name || '学员' }
        : app.globalData.userInfo
    this.setData({
      userInfo,
      hasLogin: isLoggedIn
    })
    this.loadStats()
  },

  /** 从云端加载个人统计 */
  async loadStats() {
    if (!app.globalData.cloudReady) return
    try {
      const res = await api.getUserStats()
      if (res.code === 0 && res.stats) {
        this.setData({
          stats: {
            totalAnswered: res.stats.totalAnswered || 0,
            accuracy: (res.stats.accuracy || 0) + '%',
            dayStreak: res.stats.wrongCount || 0
          }
        })
      }
    } catch (e) {
      // 云端失败保持默认 0
    }
  },

  onLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  /** 长按标题触发管理入口（连续5次） */
  onTitleLongPress() {
    const count = this.data.tapCount + 1
    if (count >= 5) {
      this.setData({ tapCount: 0 })
      if (app.globalData.isAdmin) {
        wx.navigateTo({ url: '/pages/admin/dashboard/dashboard' })
      } else {
        wx.navigateTo({ url: '/pages/admin/login/login' })
      }
    } else {
      this.setData({ tapCount: count })
      if (count >= 3) {
        wx.showToast({ title: `再按 ${5 - count} 次进入管理`, icon: 'none', duration: 800 })
      }
      // 2秒内不继续按则重置
      clearTimeout(this._tapTimer)
      this._tapTimer = setTimeout(() => {
        this.setData({ tapCount: 0 })
      }, 2000)
    }
  },

  onMenuTap(e) {
    const { id } = e.currentTarget.dataset
    switch (id) {
      case 'about':
        wx.showModal({
          title: '关于我们',
          content: '新越职业技能培训学校答题小程序，助力学员随时练习、提升技能。',
          showCancel: false
        })
        break
      case 'contact':
        wx.showModal({
          title: '联系学校',
          content: '咨询电话：19957611799\n地址：浙江省台州市路桥区路北街道银安街689号二楼路桥区职业技能培训基地A001',
          confirmText: '复制电话',
          cancelText: '关闭',
          success: (r) => {
            if (r.confirm) {
              wx.setClipboardData({
                data: '19957611799',
                success: () => wx.showToast({ title: '电话已复制', icon: 'success' })
              })
            }
          }
        })
        break
      case 'logout':
        wx.showModal({
          title: '提示',
          content: '确定退出登录吗？',
          success: r => {
            if (r.confirm) {
              // 清除所有登录态
              wx.removeStorageSync('studentInfo')
              wx.removeStorageSync('adminInfo')
              app.globalData.studentInfo = null
              app.globalData.adminInfo = null
              app.globalData.isAdmin = false
              app.globalData.isLoggedIn = false
              wx.showToast({ title: '已退出', icon: 'success' })
              setTimeout(() => {
                wx.reLaunch({ url: '/pages/login/login' })
              }, 800)
            }
          }
        })
        break
      default:
        wx.showToast({ title: '功能开发中', icon: 'none' })
    }
  }
})
