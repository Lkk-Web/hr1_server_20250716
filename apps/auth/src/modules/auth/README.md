# 多端 Token 验证系统

## 概述

本系统实现了支持多端登录的 Token 验证机制，支持以下 5 个端：

- `management` - 管理端
- `planning` - 计划端  
- `workstation` - 工位端
- `mobile` - 移动端
- `dashboard` - 看板端

## 主要特性

- ✅ 多端独立认证
- ✅ Token 与设备绑定
- ✅ 支持刷新 Token
- ✅ 微服务间 Token 验证
- ✅ Token 生命周期管理
- ✅ 设备和 IP 地址记录

## API 接口

### 1. 用户注册
```http
POST /base/register
```

**请求参数：**
```json
{
  "name": "用户姓名",
  "phone": "手机号",
  "password": "密码"
}
```

**响应：**
```json
{
  "user": {
    "id": 1,
    "name": "用户姓名",
    "phone": "13800138000"
  },
  "message": "注册成功，请登录"
}
```

### 2. 用户登录
```http
POST /base/login
```

**请求参数：**
```json
{
  "username": "用户名",
  "password": "密码",
  "platform": "management", // 必填：指定登录端
  "deviceId": "设备标识"      // 可选：设备唯一标识
}
```

**响应：**
```json
{
  "accessToken": "访问令牌",
  "refreshToken": "刷新令牌", 
  "expiresIn": 7200,
  "user": {
    "id": 1,
    "username": "admin",
    "name": "管理员",
    "platform": "management"
  }
}
```

### 3. 刷新 Token
```http
POST /base/refresh
```

**请求参数：**
```json
{
  "refreshToken": "刷新令牌"
}
```

### 4. 微服务 Token 验证
```http
POST /base/verify
```

**请求参数：**
```json
{
  "token": "访问令牌"
}
```

**响应：**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "admin",
    "name": "管理员",
    "platform": "management"
  }
}
```

### 5. 用户登出
```http
POST /base/logout
```

**请求参数：**
```json
{
  "platform": "management", // 可选：指定登出的端
  "deviceId": "设备标识"      // 可选：指定登出的设备
}
```

### 6. 获取用户所有 Token
```http
GET /base/tokens?platform=management
```

### 7. 撤销指定 Token
```http
POST /base/revoke
```

**请求参数：**
```json
{
  "tokenId": 123
}
```

## 数据库模型

### Token 表结构

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| userId | INTEGER | 用户ID |
| token | TEXT | 访问令牌 |
| platform | ENUM | 平台类型 |
| deviceId | STRING | 设备标识 |
| ipAddress | STRING | IP地址 |
| userAgent | TEXT | 用户代理 |
| expiresAt | DATE | 过期时间 |
| refreshToken | STRING | 刷新令牌 |
| refreshExpiresAt | DATE | 刷新令牌过期时间 |
| lastUsedAt | DATE | 最后使用时间 |
| isActive | BOOLEAN | 是否激活 |

## 使用示例

### 前端注册示例

```javascript
// 用户注册
const registerResponse = await fetch('/api/base/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: '张三',
    phone: '13800138000',
    password: 'password123'
  })
})

const { user, message } = await registerResponse.json()
console.log(message) // 注册成功，请登录
console.log('用户信息:', user)

// 注册成功后，引导用户登录
// 登录时指定平台获取对应的 Token
```

### 前端登录示例

```javascript
// 管理端登录
const loginResponse = await fetch('/api/base/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'password123',
    platform: 'management',
    deviceId: 'web-browser-001'
  })
})

const { accessToken, refreshToken } = await loginResponse.json()

// 存储 Token
localStorage.setItem('accessToken', accessToken)
localStorage.setItem('refreshToken', refreshToken)
```

### 微服务验证示例

```javascript
// 在其他微服务中验证 Token
const verifyResponse = await fetch('/api/base/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: accessToken
  })
})

const { valid, user } = await verifyResponse.json()

if (valid) {
  console.log('Token 有效，用户信息：', user)
} else {
  console.log('Token 无效，需要重新登录')
}
```

## 安全特性

1. **Token 过期机制**：访问 Token 2小时过期，刷新 Token 7天过期
2. **设备绑定**：每个设备的 Token 独立管理
3. **平台隔离**：不同端的 Token 相互独立
4. **IP 记录**：记录 Token 使用的 IP 地址
5. **主动撤销**：支持主动撤销指定 Token

## 注意事项

1. **注册与登录分离**：注册时只创建用户基础信息，不绑定特定平台
2. **多平台登录**：同一用户可以使用同一账号在不同平台登录
3. 登录时必须指定 `platform` 参数
4. 同一用户可以在多个端同时登录
5. **Token 管理**：每个平台的 Token 独立管理，互不影响
3. 同一端同一设备的重复登录会更新现有 Token
4. Token 过期后需要使用刷新 Token 获取新的访问 Token
5. 微服务验证会更新 Token 的最后使用时间