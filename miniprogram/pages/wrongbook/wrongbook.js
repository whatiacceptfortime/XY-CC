// pages/wrongbook/wrongbook.js - 错题本
const app = getApp()
const api = require('../../utils/api')
const { formatTime } = require('../../utils/util')

Page({
  data: {
    wrongList: [],
    isEmpty: true,
    loading: false
  },

  onShow() {
    this.loadWrongQuestions()
  },

  /** 从云端加载错题 */
  async loadWrongQuestions() {
    if (!app.globalData.cloudReady) {
      this.setData({ isEmpty: true })
      return
    }

    this.setData({ loading: true })
    try {
      const res = await api.getWrongQuestions({ page: 1, pageSize: 50 })
      if (res.code === 0) {
        const list = res.list.map(item => ({
          ...item,
          timeStr: item.createTime ? formatTime(item.createTime) : ''
        }))
        this.setData({
          wrongList: list,
          isEmpty: list.length === 0,
          loading: false
        })
      } else {
        this.setData({ loading: false, isEmpty: true })
      }
    } catch (e) {
      this.setData({ loading: false, isEmpty: true })
    }
  },

  onRetryQuestion(e) {
    const { id, categoryid } = e.currentTarget.dataset
    const catId = categoryid || 'c01'
    wx.navigateTo({
      url: `/pages/practice/practice?categoryId=${catId}&name=${encodeURIComponent('错题重练')}`
    })
  },

  async onClearAll() {
    if (this.data.isEmpty) return
    wx.showModal({
      title: '提示',
      content: '确定清空所有错题吗？',
      success: async res => {
        if (res.confirm) {
          try {
            await api.clearWrongQuestions()
            this.setData({ wrongList: [], isEmpty: true })
            wx.showToast({ title: '已清空', icon: 'success' })
          } catch (e) {
            wx.showToast({ title: '清空失败', icon: 'none' })
          }
        }
      }
    })
  },

  onPullDownRefresh() {
    this.loadWrongQuestions()
    wx.stopPullDownRefresh()
  }
})
