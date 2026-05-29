import type { NextConfig } from "next";

// 部署到子路径（如 GitHub Pages 的 /xiqu/）时设此环境变量。
// CF Pages / 自定义根域名部署留空。
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // 静态导出（pure HTML/CSS/JS，丢 Caddy 静态服务即可）
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath,
};

export default nextConfig;
