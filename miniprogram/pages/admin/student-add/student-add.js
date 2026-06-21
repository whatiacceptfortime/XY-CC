// pages/admin/student-add/student-add.js - 录入学员
const api = require('../../../utils/api')

Page({
  data: {
    isEdit: false,
    form: {
      _id: '',
      name: '',
      account: '',
      expireDate: ''
    },
    durationOptions: [
      { label: '3个月', value: 3 },
      { label: '6个月', value: 6 },
      { label: '1年', value: 12 },
      { label: '2年', value: 24 }
    ],
    durationIndex: 2,
    expireDateStr: '',
    saving: false
  },

  onLoad(opts) {
    if (opts.id) {
      this.setData({ isEdit: true })
      const data = JSON.parse(decodeURIComponent(opts.data || '{}'))
      if (data._id) {
        this.setData({
          form: {
            _id: data._id,
            name: data.name,
            account: data.account || data.phone || '',
            expireDate: data.expireDate
          },
          expireDateStr: data.expireDateStr || ''
        })
      }
    } else {
      this.calcExpireDate(12)
    }
  },

  onDurationChange(e) {
    const idx = e.detail.value
    this.setData({ durationIndex: idx })
    this.calcExpireDate(this.data.durationOptions[idx].value)
  },

  calcExpireDate(months) {
    const d = new Date()
    d.setMonth(d.getMonth() + months)
    const str = d.toISOString().slice(0, 10)
    this.setData({ 'form.expireDate': d, expireDateStr: str })
  },

  onNameInput(e) {
    this.setData({ 'form.name': e.detail.value })
  },

  onAccountInput(e) {
    this.setData({ 'form.account': e.detail.value })
  },

  async onSave() {
    const { name, account, expireDate } = this.data.form

    if (!name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' }); return
    }
    if (!account.trim()) {
      wx.showToast({ title: '请输入学员账号', icon: 'none' }); return
    }

    this.setData({ saving: true })
    wx.showLoading({ title: '保存中...' })

    try {
      const res = await api.adminSaveStudent({
        _id: this.data.isEdit ? this.data.form._id : '',
        name: name.trim(),
        account: account.trim(),
        expireDate: expireDate.toISOString()
      })
      wx.hideLoading()
      if (res.code === 0) {
        wx.showToast({ title: res.msg, icon: 'success' })
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
