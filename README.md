# Metaphorical — 集中式日志监控看板

> **域名**：[metaphorical.yanmengsss.xyz](https://metaphorical.yanmengsss.xyz)  
> **技术栈**：Next.js 16 · React 19 · Mongoose · shadcn/ui · TailwindCSS  
> **部署方式**：Jenkins + Docker

## 项目简介

Metaphorical 是 LifePilot 生态的**集中式日志监控看板**，接收来自各项目通过 `yanmengs-logs` SDK 上报的运行日志，持久化到 MongoDB，并提供可视化查询界面。开发者与运维人员可按项目、时间、日志级别等维度筛选查看运行状态。

该链路完全独立于主业务逻辑，即使 Metaphorical 服务不可用，SDK 内部的错误也不会传播到主应用。

---

## 核心功能

- 📥 **日志接收**：接受各项目 HTTP POST 上报的结构化日志
- 💾 **日志存储**：按 `projectKey` 隔离，持久化到 MongoDB Collection
- 📊 **可视化看板**：分页查看、多维筛选、日志详情展开
- 🗂️ **表管理**：按 `projectKey` 创建独立日志表，支持自定义配置

---

## API 接口

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/logs` | POST | 接收日志上报（`projectKey`, `tableName`, `level`, `message`, `data`） |
| `/api/logs` | GET | 查询日志列表（支持分页、过滤） |
| `/api/tables` | GET | 获取所有已注册的日志表 |
| `/api/tables` | POST | 创建新日志表（项目注册） |
| `/api/tables/[id]` | PUT | 编辑日志表配置 |

---

## 页面路由

| 路由 | 功能 |
|------|------|
| `/` | 首页 / 项目概览 |
| `/tables` | 日志表管理（创建/查看/编辑） |
| `/tables/[id]/logs` | 具体表的日志列表（分页、筛选） |
| `/dashboard` | 汇总数据看板（日志量统计等） |

---

## 日志数据结构

```typescript
interface LogEntry {
  _id: string;
  projectKey: string;   // 项目标识
  tableName: string;    // 日志表名（对应 MongoDB Collection）
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;      // 日志内容
  data?: Record<string, unknown>;  // 附加数据
  timestamp: Date;      // 上报时间（自动注入）
  ip?: string;          // 客户端 IP（可选）
}
```

---

## 配套 SDK 接入

通过 `yanmengs-logs`（npm 正式包）向本服务上报日志：

```bash
npm install yanmengs-logs
```

```typescript
import { createLogger } from 'yanmengs-logs';

const logger = createLogger({
  projectKey: 'my-project',
  tableName: 'prod_logs',
  endpoint: 'https://metaphorical.yanmengsss.xyz/api/logs'
});

logger.info('user_login', { userId: '123' });
logger.error('api_error', { error: 'timeout', url: '/api/chat' });
```

---

## 技术栈

| 分层 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js | 16.1.6 |
| UI | shadcn/ui, Radix UI, TailwindCSS | latest |
| 数据库 | MongoDB（Mongoose） | ^9.2.3 |
| 表单 | react-hook-form, zod | latest |
| 时间 | date-fns | ^4.1.0 |

---

## 快速开始

```bash
pnpm install
pnpm dev
```

**关键环境变量：**
- `MONGODB_URI` — MongoDB 连接串

---

## 部署

```bash
# 生产构建与启动
next build && next start -p 6500

# Jenkins + Docker 自动化部署
# 域名：metaphorical.yanmengsss.xyz
```
