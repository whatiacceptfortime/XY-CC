// utils/util.js - 通用工具函数

/** 格式化时间 yyyy-mm-dd hh:mm */
function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date)
  const pad = n => (n < 10 ? '0' + n : n)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 打乱数组顺序（用于随机抽题） */
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 计算正确率 */
function accuracy(correct, total) {
  if (!total) return '0%'
  return Math.round((correct / total) * 100) + '%'
}

module.exports = { formatTime, shuffle, accuracy }
