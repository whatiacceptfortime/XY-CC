// pages/result/result.js - 答题结果页
Page({
  data: {
    correct: 0,
    total: 0,
    rate: 0,
    name: '',
    comment: ''
  },

  onLoad(opts) {
    const correct = Number(opts.correct || 0)
    const total = Number(opts.total || 0)
    const rate = total ? Math.round((correct / total) * 100) : 0
    let comment = ''
    if (rate >= 90) comment = '优秀！你已经掌握得很扎实了 🎉'
    else if (rate >= 70) comment = '良好！再接再厉会更棒 💪'
    else if (rate >= 50) comment = '继续努力，多练几遍就熟悉了 📖'
    else comment = '别灰心，错题多复习几遍一定能进步 🌱'

    this.setData({
      correct, total, rate,
      name: decodeURIComponent(opts.name || '练习'),
      comment
    })
  },

  onRetry() {
    wx.navigateBack()
  },

  onHome() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  onWrongBook() {
    wx.switchTab({ url: '/pages/wrongbook/wrongbook' })
  }
})
