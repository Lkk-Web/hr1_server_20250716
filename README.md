# NestJS Monorepo

基于 NestJS 框架，采用微服务架构和 Monorepo。

测试服部署：

如果第一次部署需要 `pm2 save`

```
cd /home/hr1_server_20250716 && git pull && npm run build && pm2 restart 18 && pm2 restart 19 && pm2 logs 18
```

`权限接口文档`：https://s4.orbitsoft.cn/hr1-auth/doc/auth/
`管理端接口文档`：https://s4.orbitsoft.cn/hr1/doc/admin
`工控屏端接口文档`：https://s4.orbitsoft.cn/hr1/doc/station

### 技术栈

- **框架**: NestJS 8.0.0+
- **语言**: TypeScript
- **数据库**: MySQL
- **ORM**: Sequelize
- **认证**: JWT
- **进程管理**: PM2
- **架构**: 微服务 + Monorepo

## 🏗️ 项目架构

```
nestjs-monorepo-hr1/
├── apps/                    # 应用程序
│   ├── main/               # 主服务应用
│   └── auth/               # 认证微服务
├── libs/                   # 共享库
│   ├── utils/              # 工具库
│   └── script/             # 部署脚本
├── config.example.yaml     # 配置文件示例
├── pm2.json               # PM2 配置
└── nest-cli.json          # NestJS CLI 配置
```

### 主服务目录结构

```
apps/main/src/
├── common/                 # 公用模块
│   ├── config/            # 全局配置
│   ├── dto/               # 公用 DTO
│   ├── enum/              # 常量枚举
│   ├── error/             # 错误异常处理
│   ├── interface/         # TypeScript 接口
│   └── type/              # TypeScript 类型
├── core/                  # 核心模块
│   ├── decorator/         # 装饰器
│   └── guards/            # 守卫（JWT 认证等）
├── library/               # 公共库
│   ├── logger/            # 日志模块
│   ├── tasks/             # 定时任务
│   └── microserviceClient/ # 微服务客户端
├── model/                 # 数据表结构定义
├── modules/               # 业务模块
│   ├── admin/             # 管理员模块
│   ├── client/            # 客户端模块
│   └── public/            # 公开接口模块
├── services/              # 公用服务
└── main.ts               # 应用启动入口
```

## 🚀 快速开始

### 环境要求

- **操作系统**: CentOS / Windows / macOS
- **Node.js**: 14.x ~ 16.18.0
- **npm**: 8.5.5+
- **PM2**: 5.0.0+

### 安装依赖

```bash
# 安装项目依赖
npm install
# 或者
yarn install

# 全局安装 NestJS CLI（可选）
npm i -g @nestjs/cli
```

### 配置文件

1. 复制配置文件模板：

   ```bash
   cp config.example.yaml config.yaml
   ```

2. 修改 `config.yaml` 中的配置项：
   - `PORT`: 服务端口
   - `APP_NAME`: 应用名称
   - `HOME_PATH`: 项目路径
   - `DB_DATABASE`: 数据库配置

### 启动服务

#### 开发模式

```bash
# 启动主服务（开发模式）
npm run main

# 启动认证服务（开发模式）
npm run auth

# 同时启动所有服务
npm run dev
```

#### 生产模式

```bash
# 构建项目
npm run build

# 启动生产环境（单线程）
npm run prod

# 使用 PM2 启动（负载均衡）
pm2 start ./pm2.json
```

## 📝 开发指南

### 常用命令

```bash
# 生成新模块
nest g module user modules
nest g controller user modules
nest g service user modules

# 构建项目
npm run build

# 运行测试
npm run test

# 代码格式化
npm run format

# 代码检查
npm run lint
```

### PM2 管理命令

```bash
# 查看运行状态
pm2 status

# 查看日志
pm2 logs

# 重启服务
pm2 restart all

# 停止服务
pm2 stop all

# 删除服务
pm2 delete all
```

## 🔧 环境配置

### 环境类型

- **dev**: 开发环境（本地）
- **test**: 测试环境
- **prod**: 生产环境

### 日志配置

项目使用 Winston 日志库，支持多级别日志输出：

- **开发环境**: 仅控制台输出
- **其他环境**: 写入 `logs/` 目录
  - `logs/stdout.log`: 常规日志（debug 级别以上）
  - `logs/stderr.log`: 错误日志（error 级别）

## 🔐 微服务架构

### 服务列表

| 服务名 | 端口 | 描述                         |
| ------ | ---- | ---------------------------- |
| main   | 3000 | 主服务，处理业务逻辑         |
| auth   | 7999 | 认证服务，处理用户认证和授权 |

### 服务通信

- 使用 TCP 协议进行微服务间通信
- 支持服务发现和负载均衡
- 内置超时和重试机制

## 🚀 部署指南

### 自动部署

项目支持 GitLab CI/CD 自动部署：

```bash
# 部署命令示例
cd /home/project && git pull && npm run build && pm2 restart all
```

### 手动部署

1. 拉取最新代码
2. 安装依赖
3. 构建项目
4. 重启服务

```bash
git pull
npm install
npm run build
pm2 restart all
```

## 📚 API 文档

启动服务后，可通过以下地址访问 API 文档：

- Swagger 文档: `http://localhost:3000/api`
- API 接口: `http://localhost:3000/api/*`

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

---

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目 Issues: [GitHub Issues](https://github.com/Lkk-Web/nest-monorepo/issues)
