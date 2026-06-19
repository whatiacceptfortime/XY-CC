// pages/admin/student-import/student-import.js - 批量导入学员
const api = require('../../../utils/api')

Page({
  data: {
    text: '',
    durationOptions: [
      { label: '3个月', value: 3 },
      { label: '6个月', value: 6 },
      { label: '1年', value: 12 },
      { label: '2年', value: 24 }
    ],
    durationIndex: 2,
    importing: false,
    result: null
  },

  onLoad() {},

  onTextInput(e) {
    this.setData({ text: e.detail.value })
  },

  onDurationChange(e) {
    this.setData({ durationIndex: e.detail.value })
  },

  /** 解析文本为学员数组 */
  parseText() {
    const lines = this.data.text.trim().split('\n')
    const students = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      // 支持逗号、空格、制表符分隔
      const parts = trimmed.split(/[,，\s\t]+/)
      if (parts.length >= 2) {
        students.push({ phone: parts[0], name: parts[1] })
      } else if (parts.length === 1 && /^1\d{10}$/.test(parts[0])) {
        students.push({ phone: parts[0], name: '学员' + parts[0].slice(-4) })
      }
    }
    return students
  },

  async onImport() {
    const students = this.parseText()

    if (students.length === 0) {
      wx.showToast({ title: '请输入有效数据', icon: 'none' })
      return
    }

    this.setData({ importing: true })

    try {
      const res = await api.adminBatchImportStudents({
        students,
        durationMonths: this.data.durationOptions[this.data.durationIndex].value
      })

      if (res.code === 0) {
        this.setData({ result: res })
        wx.showToast({ title: res.msg, icon: 'none', duration: 3000 })
      } else {
        wx.showToast({ title: res.msg, icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: '导入失败', icon: 'none' })
    } finally {
      this.setData({ importing: false })
    }
  },

  onClear() {
    this.setData({ text: '', result: null })
  },

  onBack() {
    wx.navigateBack()
  }
})
