// pages/admin/questions/questions.js - 题库管理列表
const api = require('../../../utils/api')

Page({
  data: {
    list: [],
    loading: true,
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: true,
    // 筛选
    filterCategory: 'all',
    filterType: 'all',
    keyword: '',
    // 分类选项
    categories: [
      { id: 'all', name: '全部科目' },
      { id: 'c01', name: '叉车司机' }
    ],
    types: [
      { id: 'all', name: '全部题型' },
      { id: 'single', name: '单选题' },
      { id: 'judge', name: '判断题' },
      { id: 'multi', name: '多选题' }
    ],
    typeMap: { single: '单选', judge: '判断', multi: '多选' }
  },

  onLoad() {
    this.loadList(true)
  },

  async loadList(reset = false) {
    if (reset) {
      this.setData({ page: 1, list: [], hasMore: true })
    }
    if (!this.data.hasMore && !reset) return

    this.setData({ loading: true })
    try {
      const res = await api.adminGetQuestions({
        page: this.data.page,
        pageSize: this.data.pageSize,
        categoryId: this.data.filterCategory,
        type: this.data.filterType,
        keyword: this.data.keyword
      })

      if (res.code === 0) {
        this.setData({
          list: reset ? res.list : [...this.data.list, ...res.list],
          total: res.total,
          hasMore: res.hasMore,
          loading: false
        })
      } else if (res.code === 403) {
        wx.showToast({ title: '请先登录', icon: 'none' })
        setTimeout(() => wx.redirectTo({ url: '/pages/admin/login/login' }), 1000)
      } else {
        this.setData({ loading: false })
      }
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 })
      this.loadList()
    }
  },

  onCategoryChange(e) {
    this.setData({ filterCategory: this.data.categories[e.detail.value].id })
    this.loadList(true)
  },

  onTypeChange(e) {
    this.setData({ filterType: this.data.types[e.detail.value].id })
    this.loadList(true)
  },

  onSearch(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearchConfirm() {
    this.loadList(true)
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/admin/question-edit/question-edit' })
  },

  onEdit(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/admin/question-edit/question-edit?id=${id}` })
  },

  onDelete(e) {
    const { id, index } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定删除此题？',
      danger: true,
      success: async r => {
        if (r.confirm) {
          wx.showLoading({ title: '删除中...' })
          try {
            const res = await api.adminDeleteQuestion(id)
            wx.hideLoading()
            if (res.code === 0) {
              const list = [...this.data.list]
              list.splice(index, 1)
              this.setData({ list, total: this.data.total - 1 })
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
