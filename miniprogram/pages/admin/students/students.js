// pages/admin/students/students.js - 学员答题详情
const api = require('../../../utils/api')

Page({
  data: {
    list: [],
    totalQuestions: 0,
    loading: true,
    showExport: false,
    csvText: ''
  },

  onLoad() {
    this.loadDetail()
  },

  onShow() {
    if (this._needRefresh) {
      this.loadDetail()
      this._needRefresh = false
    }
  },

  async loadDetail() {
    this.setData({ loading: true })
    try {
      const res = await api.adminGetStudentDetail()
      if (res.code === 0) {
        this.setData({
          list: res.list,
          totalQuestions: res.totalQuestions,
          loading: false
        })
      } else {
        wx.showToast({ title: res.msg || '加载失败', icon: 'none' })
        this.setData({ loading: false })
      }
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: '网络异常', icon: 'none' })
    }
  },

  /** 导出 CSV */
  onExport() {
    const { list, totalQuestions } = this.data
    if (list.length === 0) {
      wx.showToast({ title: '暂无数据', icon: 'none' })
      return
    }

    // 生成 CSV
    let csv = '姓名,手机号,已答题数(去重),题库总量,覆盖率(%),正确率(%),答题次数,最近答题,状态\n'
    list.forEach(s => {
      csv += `${s.name},${s.phone},${s.uniqueAnswered},${totalQuestions},${s.coverage},${s.correctRate},${s.totalAnswered},${s.lastTimeStr},${s.status === 'expired' ? '已过期' : '有效'}\n`
    })

    this.setData({ showExport: true, csvText: csv })
  },

  /** 复制到剪贴板 */
  onCopyCSV() {
    wx.setClipboardData({
      data: this.data.csvText,
      success: () => {
        wx.showToast({ title: '已复制，粘贴到Excel', icon: 'success', duration: 2000 })
      }
    })
  },

  onCloseExport() {
    this.setData({ showExport: false })
  },

  onPullDownRefresh() {
    this.loadDetail()
    wx.stopPullDownRefresh()
  },

  onAdd() {
    this._needRefresh = true
    wx.navigateTo({ url: '/pages/admin/student-add/student-add' })
  },

  onImport() {
    this._needRefresh = true
    wx.navigateTo({ url: '/pages/admin/student-import/student-import' })
  }
})
