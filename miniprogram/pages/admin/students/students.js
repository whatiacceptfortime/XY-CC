// pages/admin/students/students.js - 学员管理
const api = require('../../../utils/api')

Page({
  data: {
    list: [],
    loading: true,
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: true,
    keyword: ''
  },

  onLoad() {
    this.loadList(true)
  },

  onShow() {
    // 从录入页返回时刷新
    if (this._needRefresh) {
      this.loadList(true)
      this._needRefresh = false
    }
  },

  async loadList(reset = false) {
    if (reset) {
      this.setData({ page: 1, list: [], hasMore: true })
    }
    this.setData({ loading: true })

    try {
      const res = await api.adminGetStudents({
        page: this.data.page,
        pageSize: this.data.pageSize,
        keyword: this.data.keyword
      })
      if (res.code === 0) {
        this.setData({
          list: reset ? res.list : [...this.data.list, ...res.list],
          total: res.total,
          hasMore: res.hasMore,
          loading: false
        })
      } else {
        this.setData({ loading: false })
      }
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  onSearch(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearchConfirm() {
    this.loadList(true)
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 })
      this.loadList()
    }
  },

  onAdd() {
    this._needRefresh = true
    wx.navigateTo({ url: '/pages/admin/student-add/student-add' })
  },

  onImport() {
    this._needRefresh = true
    wx.navigateTo({ url: '/pages/admin/student-import/student-import' })
  },

  onEdit(e) {
    const data = encodeURIComponent(JSON.stringify(e.currentTarget.dataset.item))
    this._needRefresh = true
    wx.navigateTo({ url: `/pages/admin/student-add/student-add?id=1&data=${data}` })
  }
})
