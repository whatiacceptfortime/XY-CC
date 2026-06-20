// pages/exam/exam.js - 模拟考试（限时）
const app = getApp()
const questionData = require('../../data/questions.js')
const { shuffle } = require('../../utils/util')
const api = require('../../utils/api')

const LETTERS = ['A', 'B', 'C', 'D', 'E']

Page({
  data: {
    currentIndex: 0,
    total: 0,
    question: null,
    selected: [],
    answers: [],
    isMulti: false,
    optionStates: [],
    // 倒计时
    timeLeft: 0,
    timeStr: '',
    // 考试配置
    questionCount: 50,
    timeLimit: 1800, // 30分钟=1800秒
    categoryName: '叉车司机',
    // 状态
    started: false,
    finished: false
  },

  onLoad(opts) {
    const name = decodeURIComponent(opts.name || '叉车司机')
    const categoryId = opts.categoryId || 'c01'
    this._categoryId = categoryId

    this.setData({
      categoryName: name,
      timeStr: this.formatTime(this.data.timeLimit)
    })
  },

  /** 开始考试 */
  startExam() {
    let questions = questionData.filter(q => q.categoryId === this._categoryId)
    if (questions.length === 0) questions = questionData

    const examQuestions = shuffle(questions).slice(0, this.data.questionCount)
    this._questions = examQuestions
    this._timer = null

    this.setData({
      started: true,
      total: examQuestions.length,
      answers: new Array(examQuestions.length).fill(null),
      currentIndex: 0,
      timeLeft: this.data.timeLimit
    })

    this.renderQuestion(0)
    this.startTimer()
  },

  /** 倒计时 */
  startTimer() {
    this._timer = setInterval(() => {
      const left = this.data.timeLeft - 1
      if (left <= 0) {
        clearInterval(this._timer)
        this.setData({ timeLeft: 0, timeStr: '00:00' })
        wx.showModal({
          title: '时间到',
          content: '考试时间已结束，自动提交',
          showCancel: false,
          success: () => this.submitExam()
        })
        return
      }
      this.setData({ timeLeft: left, timeStr: this.formatTime(left) })
    }, 1000)
  },

  formatTime(sec) {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`
  },

  renderQuestion(i) {
    const q = this._questions[i]
    const isMulti = q.type === 'multi'
    const prev = this.data.answers[i]
    const selected = prev ? prev.selected : []
    const answered = prev ? prev.answered : false

    this.setData({
      currentIndex: i,
      question: q,
      isMulti,
      selected,
      optionStates: this.calcStates(q, selected, answered)
    })
  },

  calcStates(q, selected, answered) {
    return q.options.map((_, i) => {
      const correctArr = Array.isArray(q.answer) ? q.answer : [q.answer]
      const selArr = selected || []
      if (answered) {
        if (correctArr.includes(i)) return 'correct'
        if (selArr.includes(i) && !correctArr.includes(i)) return 'wrong'
        return ''
      }
      if (selArr.includes(i)) return 'chosen'
      return ''
    })
  },

  onTapOption(e) {
    if (this.data.answers[this.data.currentIndex]?.answered) return
    const idx = e.currentTarget.dataset.index
    let selected
    if (this.data.isMulti) {
      selected = [...this.data.selected]
      const pos = selected.indexOf(idx)
      if (pos > -1) selected.splice(pos, 1)
      else selected.push(idx)
    } else {
      selected = [idx]
      // 单选直接记录，但不显示对错（考试模式）
      this.data.answers[this.data.currentIndex] = { selected, answered: true, correct: undefined }
    }
    this.setData({
      selected,
      optionStates: this.calcStates(this.data.question, selected, this.data.isMulti ? false : true)
    })
    if (!this.data.isMulti) {
      this.data.answers[this.data.currentIndex] = { selected, answered: true, correct: undefined }
    }
  },

  onConfirmMulti() {
    if (this.data.selected.length === 0) {
      wx.showToast({ title: '请至少选择一项', icon: 'none' })
      return
    }
    this.data.answers[this.data.currentIndex] = {
      selected: [...this.data.selected],
      answered: true,
      correct: undefined
    }
    this.setData({
      optionStates: this.calcStates(this.data.question, this.data.selected, true)
    })
  },

  onPrev() {
    if (this.data.currentIndex === 0) return
    this.renderQuestion(this.data.currentIndex - 1)
  },

  onNext() {
    if (this.data.currentIndex === this.data.total - 1) {
      this.submitExam()
      return
    }
    this.renderQuestion(this.data.currentIndex + 1)
  },

  /** 跳转到指定题号 */
  gotoQuestion(e) {
    const idx = e.currentTarget.dataset.index
    this.renderQuestion(idx)
  },

  /** 提交考试 */
  submitExam() {
    if (this._timer) clearInterval(this._timer)

    const { answers, total, categoryName } = this.data
    let correctCount = 0
    let answeredCount = 0

    this._questions.forEach((q, i) => {
      const a = answers[i]
      if (!a || !a.answered) return
      answeredCount++
      let isCorrect
      if (q.type === 'multi') {
        const user = [...a.selected].sort((x, y) => x - y)
        const correct = [...q.answer].sort((x, y) => x - y)
        isCorrect = JSON.stringify(user) === JSON.stringify(correct)
      } else {
        isCorrect = a.selected[0] === q.answer
      }
      if (isCorrect) correctCount++
    })

    // 提交记录到云端
    if (app.globalData.cloudReady) {
      const formattedAnswers = this._questions.map((q, i) => {
        const a = answers[i]
        if (!a || !a.answered) return -1
        if (q.type === 'multi') return a.selected
        return a.selected[0] !== undefined ? a.selected[0] : -1
      })

      api.submitAnswer({
        categoryId: this._categoryId,
        questions: this._questions,
        answers: formattedAnswers,
        correctCount,
        total
      }).catch(() => {})
    }

    wx.redirectTo({
      url: `/pages/exam-result/exam-result?correct=${correctCount}&total=${total}&answered=${answeredCount}&time=${this.data.timeLimit - this.data.timeLeft}&name=${encodeURIComponent(categoryName)}`
    })
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer)
  }
})
