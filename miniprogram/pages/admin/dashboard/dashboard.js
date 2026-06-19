// pages/admin/dashboard/dashboard.js - 管理首页
const api = require('../../../utils/api')

Page({
  data: {
    stats: {
      questionsCount: 0,
      recordsCount: 0,
      studentCount: 0,
      avgAccuracy: 0
    },
    loading: true,
    menus: [
      { id: 'questions', icon: '📝', name: '题库管理', desc: '增删改查题目' },
      { id: 'students', icon: '👥', name: '学员管理', desc: '开通/编辑学员及有效期' },
      { id: 'stats', icon: '📊', name: '数据统计', desc: '题量分布与正确率' },
      { id: 'logout', icon: '🚪', name: '退出登录', desc: '退出管理后台' }
    ]
  },

  onLoad() {
    this.loadStats()
  },

  async loadStats() {
    try {
      const res = await api.adminGetStats()
      if (res.code === 0) {
        this.setData({ stats: res.stats, loading: false })
      } else {
        this.setData({ loading: false })
      }
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  onMenuTap(e) {
    const { id } = e.currentTarget.dataset
    switch (id) {
      case 'questions':
        wx.navigateTo({ url: '/pages/admin/questions/questions' })
        break
      case 'students':
        wx.navigateTo({ url: '/pages/admin/students/students' })
        break
      case 'stats':
        wx.navigateTo({ url: '/pages/admin/stats/stats' })
        break
      case 'logout':
        wx.showModal({
          title: '提示',
          content: '确定退出管理后台吗？',
          success: r => {
            if (r.confirm) {
              const app = getApp()
              app.globalData.isAdmin = false
              app.globalData.adminInfo = null
              wx.navigateBack()
            }
          }
        })
        break
    }
  },

  onPullDownRefresh() {
    this.loadStats()
    wx.stopPullDownRefresh()
  }
})
