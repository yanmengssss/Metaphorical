ARG NODE_IMAGE=yemengs/cli-manger:20260924

# ==========================================
# 阶段 1：安装依赖包
# ==========================================
FROM ${NODE_IMAGE} AS deps
USER root
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ==========================================
# 阶段 2：构建 Next.js 产物
# ==========================================
FROM ${NODE_IMAGE} AS builder
USER root
WORKDIR /app
ARG NEXT_PUBLIC_USER_SERVICE_WEB_URL=http://localhost:4500
ARG NEXT_PUBLIC_HARNESS_UI_ORIGIN=http://localhost:5173
ARG NEXT_PUBLIC_HARNESS_PROJECT_ID=metaphorical
ARG NEXT_PUBLIC_HARNESS_PROJECT_NAME=Metaphorical
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_USER_SERVICE_WEB_URL=${NEXT_PUBLIC_USER_SERVICE_WEB_URL} \
    NEXT_PUBLIC_HARNESS_UI_ORIGIN=${NEXT_PUBLIC_HARNESS_UI_ORIGIN} \
    NEXT_PUBLIC_HARNESS_PROJECT_ID=${NEXT_PUBLIC_HARNESS_PROJECT_ID} \
    NEXT_PUBLIC_HARNESS_PROJECT_NAME=${NEXT_PUBLIC_HARNESS_PROJECT_NAME}
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

# 先复制所有源代码
COPY . .
# 再把装好的依赖覆盖进来（防止本地空 node_modules 覆盖）
COPY --from=deps /app/node_modules ./node_modules

# 构建产物（因为开启了 standalone，会生成 .next/standalone 目录）
RUN pnpm build

# ==========================================
# 阶段 3：精简运行环境
# ==========================================
FROM ${NODE_IMAGE} AS runner
USER root
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=6500
# 允许外部访问
ENV HOSTNAME="0.0.0.0"

# 安全实践：创建一个非 root 用户来运行服务
RUN grep -q '^nodejs:' /etc/group || addgroup --system --gid 1001 nodejs; \
    id -u nextjs >/dev/null 2>&1 || adduser --system --uid 1001 nextjs

# 复制 public 静态资源
COPY --from=builder /app/public ./public

# 自动创建 .next 目录并设置权限
RUN mkdir -p .next && chown nextjs:nodejs .next

# 只复制 standalone 提取出的核心文件和静态资源
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切换为普通用户，提升容器安全性
USER nextjs

EXPOSE 6500

# Standalone 模式下直接通过 Node 运行 server.js 即可
CMD ["node", "server.js"]
