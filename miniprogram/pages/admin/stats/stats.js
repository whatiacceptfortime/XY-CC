// pages/admin/stats/stats.js - 数据统计
const api = require('../../../utils/api')

Page({
  data: {
    stats: null,
    loading: true,
    typeLabels: { single: '单选题', judge: '判断题', multi: '多选题' },
    typeColors: { single: '#1989fa', judge: '#ff9800', multi: '#722ed1' }
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

  onPullDownRefresh() {
    this.loadStats()
    wx.stopPullDownRefresh()
  }
})
