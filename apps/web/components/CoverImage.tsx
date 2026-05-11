"use client";
import { useState, useMemo } from "react";

/**
 * Cover with graceful 404 fallback to a generated SVG placeholder
 * (剧名书法字 + 朱砂渐变背景).
 */
export function CoverImage({
  src,
  title,
  className = "",
  size = "md",
}: {
  src?: string;
  title: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [error, setError] = useState(false);

  const placeholder = useMemo(() => {
    // 取剧名前 2 个字符作为印章字
    const stamp = (title || "闽").slice(0, 2);
    const fontSize = stamp.length === 1 ? 120 : 80;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#a32522"/>
            <stop offset="100%" stop-color="#5b1e1d"/>
          </linearGradient>
          <pattern id="p" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="0.8" fill="#f5efe2" opacity="0.08"/>
          </pattern>
        </defs>
        <rect width="300" height="400" fill="url(#g)"/>
        <rect width="300" height="400" fill="url(#p)"/>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
              font-family="'Noto Serif SC', 'Songti SC', serif"
              font-size="${fontSize}" fill="#f5efe2" letter-spacing="6">
          ${stamp.replace(/[<>&]/g, "")}
        </text>
        <text x="50%" y="90%" text-anchor="middle"
              font-family="'Noto Sans SC', sans-serif"
              font-size="14" fill="#f5efe2" opacity="0.6" letter-spacing="3">闽剧</text>
      </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
  }, [title]);

  const finalSrc = !src || error ? placeholder : src;
  return (
    <div className={`cover-frame ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={finalSrc}
        alt={`${title} 封面`}
        onError={() => setError(true)}
        loading={size === "lg" ? "eager" : "lazy"}
        decoding="async"
      />
    </div>
  );
}
