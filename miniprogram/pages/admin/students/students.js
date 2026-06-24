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
    let csv = '姓名,账号,已答题数(去重),题库总量,覆盖率(%),正确率(%),答题次数,最近答题,状态\n'
    list.forEach(s => {
      csv += `${s.name},${s.account || s.phone || ''},${s.uniqueAnswered},${totalQuestions},${s.coverage},${s.correctRate},${s.totalAnswered},${s.lastTimeStr},${s.status === 'expired' ? '已过期' : '有效'}\n`
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
  },

  /** 删除学员 */
  onDelete(e) {
    const { id, index } = e.currentTarget.dataset
    const student = this.data.list[index]
    wx.showModal({
      title: '确认删除',
      content: `确定删除学员「${student.name}」(${student.account || ''})吗？\n其答题记录和错题将一并清除，不可恢复！`,
      success: async (r) => {
        if (r.confirm) {
          wx.showLoading({ title: '删除中...' })
          try {
            const res = await api.adminDeleteStudent(id)
            wx.hideLoading()
            if (res.code === 0) {
              const list = [...this.data.list]
              list.splice(index, 1)
              this.setData({ list })
              wx.showToast({ title: '已删除', icon: 'success' })
            } else {
              wx.showToast({ title: res.msg, icon: 'none' })
            }
          } catch (e) {
            wx.hideLoading()
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  }
})
