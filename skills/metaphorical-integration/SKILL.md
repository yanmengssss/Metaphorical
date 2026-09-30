---
name: metaphorical-integration
description: 让应用向 Metaphorical 上报按项目、表和消息类型组织的结构化审计记录。适用于审计事件接入，不用于 Logboard 纯文本日志。
---

# 接入 Metaphorical

先读本仓库 `README.md` 与 `src/app/api/logs/report/route.ts`。旧版 `Architecture Plan.md` 的 `/api/logs` 写入示例不是当前接口。

1. 在 `https://metaphorical.yanmengsss.xyz` 登录并创建项目、表和允许的消息类型，记录 `projectKey`、`tableKey` 与 `messageType`。管理接口使用用户 JWT。
2. 从可信应用后端向 `http://metaphorical.app.svc.cluster.local:6500/api/logs/report` 发送 `POST` JSON：`{ "projectKey": "...", "tableKey": "...", "messageType": "...", "data": {} }`。四个字段必填，Key 和消息类型必须与已创建配置一致。
3. 检查 HTTP 状态与 JSON `code`。项目不存在、项目被禁用、表不存在或消息类型未登记时，上报失败；不要把失败响应当成成功审计。

当前上报接口没有独立令牌校验，应限制为可信后端和受控网络调用。不要上报密码、Token 或其他凭据。当前 Gateway 未注册 Metaphorical 路由；浏览器只使用 HTTPS 看板地址。
