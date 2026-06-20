// pages/exam-result/exam-result.js - 考试结果页
Page({
  data: {
    correct: 0,
    total: 0,
    answered: 0,
    rate: 0,
    timeUsed: 0,
    timeStr: '',
    name: '',
    passed: false,
    comment: ''
  },

  onLoad(opts) {
    const correct = Number(opts.correct || 0)
    const total = Number(opts.total || 0)
    const answered = Number(opts.answered || 0)
    const timeUsed = Number(opts.time || 0)
    const rate = total ? Math.round((correct / total) * 100) : 0
    const passed = rate >= 60

    let comment = ''
    if (rate >= 90) comment = '优秀！成绩优异 🏆'
    else if (rate >= 75) comment = '良好！基础扎实 👍'
    else if (rate >= 60) comment = '合格！继续巩固 💪'
    else comment = '未达标，多练习一定能过 📖'

    this.setData({
      correct, total, answered, rate,
      timeUsed,
      timeStr: `${Math.floor(timeUsed / 60)}分${timeUsed % 60}秒`,
      name: decodeURIComponent(opts.name || '考试'),
      passed,
      comment
    })
  },

  onRetry() {
    wx.redirectTo({ url: '/pages/exam/exam?name=' + encodeURIComponent(this.data.name) })
  },

  onHome() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  onWrongBook() {
    wx.switchTab({ url: '/pages/wrongbook/wrongbook' })
  }
})
