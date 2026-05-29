import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静态导出（pure HTML/CSS/JS，丢 Caddy 静态服务即可）
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
