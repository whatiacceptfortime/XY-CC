// pages/practice/practice.js - 答题练习页（支持单选/判断/多选）
const app = getApp()
const questionData = require('../../data/questions.js')
const { shuffle } = require('../../utils/util')
const api = require('../../utils/api')

const LETTERS = ['A', 'B', 'C', 'D', 'E']

Page({
  data: {
    categoryName: '',
    currentIndex: 0,
    total: 0,
    question: null,
    selected: [],          // 已选选项索引数组
    answered: false,       // 是否已确认作答
    answers: [],           // 每题作答记录
    correctCount: 0,
    showAnalysis: false,
    isMulti: false,
    optionStates: [],      // 每个选项的状态：'' / 'chosen' / 'correct' / 'wrong'
    answerText: ''         // 正确答案文本（如 "B" 或 "ACD"）
  },

  onLoad(opts) {
    const name = decodeURIComponent(opts.name || '练习')
    const categoryId = opts.categoryId || 'c01'
    this.setData({ categoryName: name })
    this._categoryId = categoryId

    // 优先云端加载，降级本地
    this.loadQuestions(categoryId)
  },

  /** 加载题目：云端优先，降级本地 */
  async loadQuestions(categoryId) {
    if (app.globalData.cloudReady) {
      try {
        const res = await api.getQuestions({ categoryId, limit: 50 })
        if (res && res.questions && res.questions.length > 0) {
          this.initQuestions(shuffle(res.questions))
          return
        }
      } catch (e) {
        console.log('云端题库不可用，使用本地数据')
      }
    }
    // 降级：本地题库
    let questions = questionData.filter(q => q.categoryId === categoryId)
    if (questions.length === 0) questions = questionData
    this.initQuestions(shuffle(questions))
  },

  initQuestions(questions) {
    this._questions = questions
    this.setData({
      total: questions.length,
      answers: new Array(questions.length).fill(null)
    })
    this.renderQuestion(0)
  },

  /** 渲染指定题目 */
  renderQuestion(i) {
    const q = this._questions[i]
    const isMulti = q.type === 'multi'
    const prevAnswer = this.data.answers[i]

    const selected = prevAnswer ? prevAnswer.selected : []
    const answered = prevAnswer ? prevAnswer.answered : false

    this.setData({
      currentIndex: i,
      question: q,
      isMulti,
      selected,
      answered,
      showAnalysis: answered,
      optionStates: this.calcOptionStates(q, selected, answered),
      answerText: this.formatAnswer(q.answer)
    })
  },

  /** 计算每个选项的状态 */
  calcOptionStates(q, selected, answered) {
    return q.options.map((_, i) => {
      const correctArr = Array.isArray(q.answer) ? q.answer : [q.answer]
      const selectedArr = selected || []

      if (answered) {
        if (correctArr.includes(i)) return 'correct'
        if (selectedArr.includes(i) && !correctArr.includes(i)) return 'wrong'
        return ''
      }
      // 未作答
      if (selectedArr.includes(i)) return 'chosen'
      return ''
    })
  },

  /** 格式化正确答案文本 */
  formatAnswer(ans) {
    if (Array.isArray(ans)) {
      return ans.map(i => LETTERS[i]).join('')
    }
    return LETTERS[ans] || ''
  },

  /** 点击选项 */
  onTapOption(e) {
    if (this.data.answered) return

    const idx = e.currentTarget.dataset.index
    let selected

    if (this.data.isMulti) {
      selected = [...this.data.selected]
      const pos = selected.indexOf(idx)
      if (pos > -1) {
        selected.splice(pos, 1)
      } else {
        selected.push(idx)
      }
    } else {
      selected = [idx]
    }

    this.setData({
      selected,
      optionStates: this.calcOptionStates(this.data.question, selected, false)
    })

    // 单选/判断：直接确认
    if (!this.data.isMulti) {
      this.confirmAnswer()
    }
  },

  /** 多选题确认作答 */
  onConfirmMulti() {
    if (this.data.selected.length === 0) {
      wx.showToast({ title: '请至少选择一项', icon: 'none' })
      return
    }
    this.confirmAnswer()
  },

  /** 判定答案并记录 */
  confirmAnswer() {
    const { question, selected } = this.data
    let isCorrect

    if (this.data.isMulti) {
      const userAns = [...selected].sort((a, b) => a - b)
      const correctAns = [...question.answer].sort((a, b) => a - b)
      isCorrect = JSON.stringify(userAns) === JSON.stringify(correctAns)
    } else {
      isCorrect = selected[0] === question.answer
    }

    const newCorrect = this.data.correctCount + (isCorrect ? 1 : 0)
    this.data.answers[this.data.currentIndex] = {
      selected: [...selected],
      answered: true,
      correct: isCorrect
    }

    this.setData({
      answered: true,
      showAnalysis: true,
      correctCount: newCorrect,
      optionStates: this.calcOptionStates(question, selected, true)
    })
  },

  onPrev() {
    if (this.data.currentIndex === 0) return
    this.renderQuestion(this.data.currentIndex - 1)
  },

  onNext() {
    if (this.data.currentIndex === this.data.total - 1) {
      this.onSubmit()
      return
    }
    this.renderQuestion(this.data.currentIndex + 1)
  },

  /** 提交答卷：写入云端记录 + 跳转结果页 */
  onSubmit() {
    const { correctCount, total, categoryName } = this.data

    // 静默提交答题记录到云端（失败不阻断）
    if (app.globalData.cloudReady) {
      // answers 格式：每题为选中选项索引（单选为数字，多选为数组，未答为-1）
      const answers = this.data.answers.map(a => {
        if (!a || !a.answered) return -1
        if (this.data.isMulti || Array.isArray(a.selected)) {
          return a.selected.length === 1 ? a.selected[0] : a.selected
        }
        return a.selected[0] !== undefined ? a.selected[0] : -1
      })

      // 重新计算每题是否多选
      const formattedAnswers = this._questions.map((q, i) => {
        const a = this.data.answers[i]
        if (!a || !a.answered) return -1
        // 多选题传数组，单选/判断传数字
        if (q.type === 'multi') {
          return a.selected
        }
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

    wx.navigateTo({
      url: `/pages/result/result?correct=${correctCount}&total=${total}&name=${encodeURIComponent(categoryName)}`
    })
  }
})
