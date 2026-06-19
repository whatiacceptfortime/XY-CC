// pages/admin/question-edit/question-edit.js - 题目编辑（新增/修改）
const api = require('../../../utils/api')

Page({
  data: {
    isEdit: false,
    questionId: '',
    form: {
      _id: '',
      categoryId: 'c01',
      categoryName: '叉车司机',
      type: 'single',
      title: '',
      options: ['', '', '', ''],
      answer: 0,
      analysis: ''
    },
    typeOptions: [
      { id: 'single', name: '单选题', optionCount: 4 },
      { id: 'judge', name: '判断题', optionCount: 2 },
      { id: 'multi', name: '多选题', optionCount: 5 }
    ],
    typeIndex: 0,
    saving: false
  },

  onLoad(opts) {
    if (opts.id) {
      this.setData({ isEdit: true, questionId: opts.id })
      this.loadQuestion(opts.id)
    }
  },

  async loadQuestion(id) {
    wx.showLoading({ title: '加载中...' })
    try {
      // 通过列表接口获取单题（或直接用 where 查询）
      const res = await api.adminGetQuestions({ page: 1, pageSize: 1000, keyword: '' })
      if (res.code === 0) {
        const q = res.list.find(x => x._id === id)
        if (q) {
          const typeIdx = this.data.typeOptions.findIndex(t => t.id === q.type)
          this.setData({
            form: {
              _id: q._id,
              categoryId: q.categoryId || 'c01',
              categoryName: q.categoryName || '叉车司机',
              type: q.type,
              title: q.title,
              options: q.options,
              answer: q.answer,
              analysis: q.analysis || ''
            },
            typeIndex: typeIdx >= 0 ? typeIdx : 0
          })
        }
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
    wx.hideLoading()
  },

  onTypeChange(e) {
    const idx = e.detail.value
    const type = this.data.typeOptions[idx]
    let options = [...this.data.form.options]
    // 调整选项数量
    if (options.length < type.optionCount) {
      while (options.length < type.optionCount) options.push('')
    } else {
      options = options.slice(0, type.optionCount)
    }
    this.setData({
      'form.type': type.id,
      'form.options': options,
      'form.answer': type.id === 'multi' ? [] : 0,
      typeIndex: idx
    })
  },

  onTitleInput(e) {
    this.setData({ 'form.title': e.detail.value })
  },

  onOptionInput(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ [`form.options[${idx}]`]: e.detail.value })
  },

  onAnalysisInput(e) {
    this.setData({ 'form.analysis': e.detail.value })
  },

  /** 单选/判断：选择正确答案 */
  onAnswerSelect(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ 'form.answer': idx })
  },

  /** 多选：切换正确答案 */
  onMultiAnswerToggle(e) {
    const idx = e.currentTarget.dataset.index
    let answer = [...this.data.form.answer]
    const pos = answer.indexOf(idx)
    if (pos > -1) {
      answer.splice(pos, 1)
    } else {
      answer.push(idx)
    }
    this.setData({ 'form.answer': answer })
  },

  async onSave() {
    const { form } = this.data

    // 校验
    if (!form.title.trim()) {
      wx.showToast({ title: '请输入题干', icon: 'none' }); return
    }
    if (form.options.some(o => !o.trim())) {
      wx.showToast({ title: '请填写所有选项', icon: 'none' }); return
    }
    if (form.type === 'multi' && form.answer.length === 0) {
      wx.showToast({ title: '请选择正确答案', icon: 'none' }); return
    }

    this.setData({ saving: true })
    wx.showLoading({ title: '保存中...' })

    try {
      const res = await api.adminSaveQuestion(form)
      wx.hideLoading()
      if (res.code === 0) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 800)
      } else {
        wx.showToast({ title: res.msg, icon: 'none' })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
    this.setData({ saving: false })
  }
})
