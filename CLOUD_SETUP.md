# 云开发开通指南

> 按照本指南操作，约 15 分钟完成云开发接入。

---

## 第一步：开通云开发环境

1. 打开**微信开发者工具**，导入项目 `xinyue-quiz-miniprogram`
2. 点击工具栏的 **「云开发」** 按钮（一个云朵图标）
3. 弹出提示，点击 **「开通」**，同意协议
4. 输入环境名称（如 `xinyue-quiz`），选择**免费套餐**
5. 创建完成后，进入云开发控制台

### 获取云环境 ID（重要！）

1. 在云开发控制台点击 **「设置」**
2. 找到 **环境 ID**，复制它（形如 `xinyue-quiz-3gxxxxxx`）
3. 打开 `miniprogram/app.js`
4. 把 `your-cloud-env-id` 替换为你复制的环境 ID：

```js
wx.cloud.init({
  env: 'xinyue-quiz-3gxxxxxx',  // ← 替换这里
  traceUser: true
})
```

---

## 第二步：创建数据库集合

在云开发控制台 → **数据库** → **+** 新建集合，依次创建以下 4 个集合：

| 集合名 | 用途 | 权限设置 |
|--------|------|----------|
| `questions` | 题目库 | 所有用户可读，仅创建者可写 |
| `records` | 答题记录 | 仅创建者可读写 |
| `wrong_questions` | 错题本 | 仅创建者可读写 |
| `admins` | 管理员白名单 | 仅创建者可读写 |

### 设置权限的方法
1. 点击集合名 → **数据权限**
2. 选择对应权限 → 保存

---

## 第三步：导入题库到云数据库

1. 在云开发控制台 → 数据库 → 点击 `questions` 集合
2. 点击 **「导入记录」**
3. 选择项目目录下的 `miniprogram/data/questions.json`
4. 冲突模式选「插入」
5. 点击导入，等待完成（1000 条约 10 秒）

> 导入后可在控制台看到 1000 条题目数据。

---

## 第四步：部署云函数

项目共有 **11 个云函数**，需要逐一部署：

| 序号 | 云函数名 | 用途 |
|------|----------|------|
| 1 | `login` | 学员登录 |
| 2 | `getQuestions` | 获取题目 |
| 3 | `submitAnswer` | 提交答卷 |
| 4 | `getWrongQuestions` | 错题本 |
| 5 | `getUserStats` | 个人统计 |
| 6 | `adminLogin` | 管理员登录 |
| 7 | `adminGetQuestions` | 题库管理-查 |
| 8 | `adminSaveQuestion` | 题库管理-增改 |
| 9 | `adminDeleteQuestion` | 题库管理-删 |
| 10 | `adminGetStudents` | 学员管理 |
| 11 | `adminGetStats` | 数据统计 |

### 部署方法（每个云函数都要操作一遍）

1. 在微信开发者工具左侧文件树，找到 `cloudfunctions/` 目录
2. **右键**点击云函数文件夹（如 `login`）
3. 选择 **「上传并部署：云端安装依赖」**
4. 等待提示"上传成功"
5. 对所有 11 个云函数重复以上操作

> ⚠️ 必须选"**云端安装依赖**"，否则云函数无法运行。

---

## 第五步：录入管理员白名单

1. 在云开发控制台 → 数据库 → `admins` 集合
2. 点击 **「添加记录」**
3. 输入以下内容（JSON 格式）：

```json
{
  "phone": "你的手机号",
  "name": "你的名字",
  "role": "super"
}
```

4. 保存

> 之后管理员在小程序「我的」页面长按昵称 5 次 → 用该手机号登录即可进入管理后台。

---

## 第六步：验证

完成以上步骤后，测试以下功能：

| 测试项 | 操作 | 预期结果 |
|--------|------|----------|
| 云开发连接 | 打开小程序首页 | 显示科目列表和题量（来自云端） |
| 答题 | 点击科目进入练习 | 正常加载题目（云端数据） |
| 答题记录 | 完成一组练习 | 云开发控制台 `records` 集合出现记录 |
| 错题本 | 答错几题后查看错题本 | 显示错题列表 |
| 个人统计 | 查看「我的」页面 | 显示已答题数和正确率 |
| 管理后台 | 长按昵称5次 → 手机号登录 | 进入管理后台 |

---

## 常见问题

### Q: 部署云函数时报错？
A: 确保选了"云端安装依赖"，检查 `package.json` 中 `wx-server-sdk` 版本为 `~2.6.3`。

### Q: 题目导入失败？
A: 确保 `questions.json` 是 UTF-8 编码，文件格式为 JSON 数组。

### Q: 管理员登录提示"无权限"？
A: 检查 `admins` 集合中是否录入手机号，手机号需与微信绑定的号码一致。

### Q: 云函数调用返回 403？
A: 管理类云函数需要先通过 `adminLogin` 绑定 openid，确保 `admins` 集合中该记录的 `_openid` 已绑定。

### Q: 答题记录没有写入？
A: 检查 `records` 集合权限是否为"仅创建者可读写"，云函数 `submitAnswer` 是否已部署。

---

## 云函数依赖关系图

```
学员端：
  login → 获取 openid
  getQuestions → 读取题目（mode: categories / practice）
  submitAnswer → 写入 records + wrong_questions
  getWrongQuestions → 读取/清空错题
  getUserStats → 聚合个人统计

管理端（需 adminLogin 鉴权）：
  adminLogin → 校验手机号白名单 + 绑定 openid
  adminGetQuestions → 分页查询题目
  adminSaveQuestion → 新增/编辑题目
  adminDeleteQuestion → 删除题目
  adminGetStudents → 学员列表聚合
  adminGetStats → 全局统计
```
