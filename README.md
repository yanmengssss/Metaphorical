# Metaphorical 审计平台接入

Metaphorical 接收按项目、表和消息类型组织的结构化审计记录，并在看板查询。公网看板是 `https://metaphorical.yanmengsss.xyz`；K3s `app` 命名空间内的后端使用 `http://metaphorical.app.svc.cluster.local:6500`。当前 Gateway 没有 Metaphorical 路由。

## 注册项目与审计表

在看板登录后创建项目和表，记录项目 `key`、表 `key`，并在表中配置允许的 `messageType`。项目创建接口 `POST /api/projects` 接收 `{ "name": "..." }`，返回生成的项目 Key；表接口为 `POST /api/projects/{projectId}/tables`。这些管理接口使用用户 JWT，不使用上报请求体中的 Key 代替登录。

## 后端上报

后端向 `POST /api/logs/report` 发送 JSON。四个字段 `projectKey`、`tableKey`、`messageType`、`data` 都必填；项目与表须已存在，消息类型须在该表中配置。成功返回通用 JSON 响应 `{ "code": 0, "data": ..., "msg": "..." }`。

```bash
curl -X POST 'http://metaphorical.app.svc.cluster.local:6500/api/logs/report' \
  -H 'Content-Type: application/json' \
  -d '{"projectKey":"<project-key>","tableKey":"<table-key>","messageType":"user_login","data":{"userId":"123"}}'
```

`/api/logs/report` 当前按项目 Key、表 Key 和消息类型校验，没有独立上报令牌校验；应只从可信后端调用，并通过网络策略控制可达范围。不要在审计数据中写入密码或 Token。`GET /api/logs` 是使用用户 JWT 的看板查询接口，不是写入接口。

部署时按实际依赖设置 `MONGODB_URI` 或 `MONGODB_DATABASE_URL`、`REDIS_URL` 或 `REDIS_DATABASE_URL`、`GATEWAY_URL` 和构建时的 `NEXT_PUBLIC_USER_SERVICE_WEB_URL`；连接凭据由 K3s Secret 注入。实施约定见 `skills/metaphorical-integration/SKILL.md`；平台内地址见 `F:/ye-base/docs/platform-integration-urls.md`。

## 用户服务统一退出

登录页面直接访问 `NEXT_PUBLIC_USER_SERVICE_WEB_URL`，CAS 兑换和用户资料校验继续经 `GATEWAY_URL/user`；页面 token 保留在内存，业务请求沿用 Bearer 和现有 401 跳转。

导航栏“退出登录”调用本地 `POST /api/auth/logout`，再经网关转发至 `/user/api/v1/users/logout`，撤销 Redis 中该用户唯一登录 token。成功或 401 后清理页面凭据，并自动跳转统一登录页，保留 service 以便登录后返回。网络、5xx 或异常响应保留凭据并提示重试；不会用 `logout=1` 重复撤销。其他网站／设备在后续鉴权时收到 401。
