// pages/index/index.js - 首页：科目列表
const app = getApp()
const questionData = require('../../data/questions.js')
const api = require('../../utils/api')

Page({
  data: {
    appName: '',
    categories: [],
    stats: {
      totalQuestions: 0,
      todayCount: 0
    }
  },

  onLoad() {
    this.setData({ appName: app.globalData.appName })
    // 检查登录态（离线模式跳过）
    if (!app.checkLogin()) return
    this.loadCategories()
  },

  onShow() {
    // 每次显示页面都检查登录态（管理员和已登录学员放行）
    if (app.globalData.cloudReady && !app.globalData.isLoggedIn && !app.globalData.isAdmin) {
      wx.redirectTo({ url: '/pages/login/login' })
    }
  },

  /** 加载科目列表：云端优先，降级本地 */
  async loadCategories() {
    // 先用本地数据显示，保证秒开
    this.loadLocalCategories()

    // 再尝试云端获取最新数据
    if (!app.globalData.cloudReady) return
    try {
      const res = await api.getQuestions({ mode: 'categories' })
      if (res && res.categories && res.categories.length > 0) {
        const categories = res.categories.map(c => ({
          id: c.id,
          name: c.name,
          count: c.count,
          icon: c.name.includes('叉车') ? '🚜' : '📘',
          desc: `共 ${c.count} 题`
        }))
        const total = categories.reduce((s, c) => s + c.count, 0)
        this.setData({ categories, stats: { totalQuestions: total, todayCount: 0 } })
      }
    } catch (e) {
      // 云端失败，保持本地数据
      console.log('使用本地题库数据')
    }
  },

  /** 从本地题库统计科目 */
  loadLocalCategories() {
    const catMap = {}
    questionData.forEach(q => {
      if (!catMap[q.categoryId]) {
        catMap[q.categoryId] = { id: q.categoryId, name: q.categoryName, count: 0 }
      }
      catMap[q.categoryId].count++
    })
    const categories = Object.values(catMap).map(c => ({
      ...c,
      icon: c.name.includes('叉车') ? '🚜' : '📘',
      desc: `共 ${c.count} 题`
    }))
    this.setData({
      categories,
      stats: { totalQuestions: questionData.length, todayCount: 0 }
    })
  },

  /** 点击科目进入答题练习 */
  onTapCategory(e) {
    const { id, name } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/practice/practice?categoryId=${id}&name=${encodeURIComponent(name)}`
    })
  }
})
