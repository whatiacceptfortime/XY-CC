// app.js
App({
  onLaunch() {
    if (!wx.cloud) {
      console.warn('当前基础库不支持云能力，将使用离线模式')
      this.globalData.cloudReady = false
      return
    }

    const envId = 'xy-d7g4tnpz6b0eb4255'

    if (envId === 'your-cloud-env-id') {
      console.info('未配置云环境ID，当前为离线模式')
      this.globalData.cloudReady = false
      return
    }

    wx.cloud.init({ env: envId, traceUser: true })
    this.globalData.cloudReady = true

    // 获取 openid
    this.getLoginOpenid()

    // 恢复登录态
    this.restoreLogin()
  },

  /** 获取 openid */
  getLoginOpenid() {
    if (!this.globalData.cloudReady) return
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        if (res.result && res.result.openid) {
          this.globalData.openid = res.result.openid
        }
      },
      fail: () => {}
    })
  },

  /** 从缓存恢复登录态（学员+管理员） */
  restoreLogin() {
    try {
      // 先检查管理员
      const adminInfo = wx.getStorageSync('adminInfo')
      if (adminInfo) {
        this.globalData.adminInfo = adminInfo
        this.globalData.isAdmin = true
        this.globalData.isLoggedIn = true
        return
      }

      // 再检查学员
      const studentInfo = wx.getStorageSync('studentInfo')
      if (studentInfo) {
        const now = new Date()
        const expire = studentInfo.expireDate ? new Date(studentInfo.expireDate) : null
        if (expire && now > expire) {
          wx.removeStorageSync('studentInfo')
          this.globalData.studentInfo = null
          this.globalData.isLoggedIn = false
        } else {
          this.globalData.studentInfo = studentInfo
          this.globalData.isLoggedIn = true
        }
      }
    } catch (e) {}
  },

  /** 检查登录态，未登录则跳转登录页 */
  checkLogin() {
    if (!this.globalData.cloudReady) return true // 离线模式不拦截
    
    // 管理员直接放行
    if (this.globalData.isAdmin) return true

    // 学员检查
    if (this.globalData.isLoggedIn) {
      const info = this.globalData.studentInfo
      if (info && info.expireDate) {
        const now = new Date()
        if (now > new Date(info.expireDate)) {
          wx.removeStorageSync('studentInfo')
          this.globalData.studentInfo = null
          this.globalData.isLoggedIn = false
          wx.redirectTo({ url: '/pages/login/login' })
          return false
        }
      }
      return true
    }
    
    // 未登录
    wx.redirectTo({ url: '/pages/login/login' })
    return false
  },

  globalData: {
    userInfo: null,
    openid: null,
    appName: '新越职业技能培训学校',
    isAdmin: false,
    adminInfo: null,
    cloudReady: false,
    studentInfo: null,
    isLoggedIn: false
  }
})
