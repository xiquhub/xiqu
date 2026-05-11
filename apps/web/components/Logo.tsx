/**
 * 站点 Logo——朱砂印章 + 繁体"戲"字。
 *
 * 用繁体而不是简体"戏"是出于美学：戲笔画密度更接近真实的篆/隶印章；
 * 用"戲"通名而不是"闽"，是为了未来扩展（粤剧/京剧/越剧等同站可用）。
 */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      aria-label="戏曲档案 logo"
      role="img"
      style={{ flexShrink: 0 }}
    >
      {/* 印章主体 */}
      <rect x="0" y="0" width="36" height="36" rx="3" fill="var(--color-accent)" />
      {/* 内框（仿真印章二重边） */}
      <rect
        x="2"
        y="2"
        width="32"
        height="32"
        rx="2"
        fill="none"
        stroke="#f5efe2"
        strokeOpacity="0.25"
        strokeWidth="0.7"
      />
      {/* 戲 字 */}
      <text
        x="18"
        y="19"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#f5efe2"
        fontSize="22"
        fontWeight="900"
        style={{ fontFamily: "var(--font-noto-serif-sc), serif" }}
      >
        戲
      </text>
    </svg>
  );
}
