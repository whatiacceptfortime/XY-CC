// pages/wrongbook/wrongbook.js - 错题本
const app = getApp()
const api = require('../../utils/api')
const { formatTime } = require('../../utils/util')

const LETTERS = ['A', 'B', 'C', 'D', 'E']

Page({
  data: {
    wrongList: [],
    isEmpty: true,
    loading: false,
    expandedIndex: -1
  },

  onShow() {
    this.loadWrongQuestions()
  },

  /** 从云端加载错题 */
  async loadWrongQuestions() {
    if (!app.globalData.cloudReady) {
      this.setData({ isEmpty: true, loading: false })
      return
    }

    this.setData({ loading: true })
    try {
      const res = await api.getWrongQuestions({ page: 1, pageSize: 100 })
      if (res.code === 0) {
        const list = res.list.map(item => {
          // 处理 userAnswer 和 correctAnswer 格式
          let userAnswer = item.userAnswer
          let correctAnswer = item.correctAnswer
          // 如果是数字（单选/判断），转成数组格式统一处理
          if (typeof userAnswer === 'number') userAnswer = [userAnswer]
          if (typeof correctAnswer === 'number') correctAnswer = [correctAnswer]

          return {
            ...item,
            userAnswer,
            correctAnswer,
            timeStr: item.createTime ? formatTime(item.createTime) : ''
          }
        })
        this.setData({
          wrongList: list,
          isEmpty: list.length === 0,
          loading: false
        })
      } else {
        this.setData({ loading: false, isEmpty: true })
      }
    } catch (e) {
      console.error('加载错题失败', e)
      this.setData({ loading: false, isEmpty: true })
    }
  },

  /** 展开/收起错题详情 */
  onToggleDetail(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({
      expandedIndex: this.data.expandedIndex === idx ? -1 : idx
    })
  },

  /** 格式化多选答案为字母 */
  formatMulti(arr) {
    if (!Array.isArray(arr)) return ''
    return arr.map(i => LETTERS[i] || '?').join('')
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
            this.setData({ wrongList: [], isEmpty: true, expandedIndex: -1 })
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
