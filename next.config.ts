import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用 standalone 模式，生成 .next/standalone，用于 Docker 最小化部署
  output: 'standalone',
};

export default nextConfig;
