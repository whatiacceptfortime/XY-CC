# 数据库集合设计

> 在微信云开发控制台 → 数据库中手动创建以下集合，并设置权限为「仅创建者可读写」或「所有用户可读，仅创建者可写」。

## 1. questions（题目库）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | String | 自动生成 |
| categoryId | String | 科目 ID，如 c01 |
| categoryName | String | 科目名，如"育婴员" |
| type | String | 题型：`single` 单选 / `judge` 判断 |
| title | String | 题干 |
| options | Array | 选项数组 |
| answer | Number | 正确答案索引（0 起） |
| analysis | String | 解析说明 |
| createTime | Date | 创建时间 |

**示例数据：**
```json
{
  "categoryId": "c01",
  "categoryName": "育婴员",
  "type": "single",
  "title": "育婴员给婴幼儿洗澡的水温应控制在？",
  "options": ["30-35℃", "37-40℃", "42-45℃", "50℃以上"],
  "answer": 1,
  "analysis": "37-40℃接近体温，最为适宜。",
  "createTime": "2025-01-01T00:00:00.000Z"
}
```

**权限建议：** 所有用户可读，仅创建者可写

---

## 2. records（答题记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | String | 自动生成 |
| _openid | String | 学员 openid（云函数自动写入） |
| categoryId | String | 科目 ID |
| total | Number | 本次题量 |
| correctCount | Number | 答对数 |
| answers | Array | 作答记录（索引数组） |
| createTime | Date | 答题时间 |

**权限建议：** 仅创建者可读写

---

## 3. wrong_questions（错题本）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | String | 自动生成 |
| _openid | String | 学员 openid |
| questionId | String | 原题 ID |
| title | String | 题干（冗余存储，便于展示） |
| categoryId | String | 科目 ID |
| userAnswer | Number | 学员错误选项 |
| correctAnswer | Number | 正确选项 |
| analysis | String | 解析 |
| createTime | Date | 收录时间 |

**权限建议：** 仅创建者可读写

---

## 科目 ID 规划

| ID | 科目名 |
|----|--------|
| c01 | 育婴员 |
| c02 | 保育师 |
| c03 | 中式烹调师 |
| c04 | 电工 |
| c05 | 养老护理员 |

> 可根据学校实际开设课程调整。

---

## 4. admins（管理员白名单）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | String | 自动生成 |
| _openid | String | 管理员 openid（首次登录后自动绑定） |
| phone | String | 手机号（白名单核心字段） |
| name | String | 管理员姓名 |
| role | String | `super`(超管) / `admin`(普通管理员) |
| createTime | Date | 创建时间 |
| lastLogin | Date | 最后登录时间 |

**权限建议：** 仅创建者可读写

**使用方式：** 在云开发控制台手动录入手机号白名单，例如：
```json
{ "phone": "13800138000", "name": "张老师", "role": "super" }
```

> `answer` 字段说明：单选/判断题为 Number（如 `1`），多选题为 Array（如 `[0,2,3]`）。

### 科目 ID 规划（当前实际使用）

| ID | 科目名 |
|----|--------|
| c01 | 叉车司机 |
