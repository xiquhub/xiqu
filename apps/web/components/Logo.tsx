/**
 * 站点 Logo——朱砂印章底 + 抽象折扇。
 *
 * 折扇是戏曲（不论生旦）通用道具，剧种中立；
 * 印章底沿用档案站基调。
 */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      aria-label="戏曲档案 logo"
      role="img"
      style={{ flexShrink: 0 }}
    >
      {/* 印章主体 */}
      <rect x="0" y="0" width="28" height="28" rx="2.5" fill="var(--color-accent)" />
      {/* 内框（仿真印章二重边） */}
      <rect
        x="1.5"
        y="1.5"
        width="25"
        height="25"
        rx="1.5"
        fill="none"
        stroke="#f5efe2"
        strokeOpacity="0.25"
        strokeWidth="0.55"
      />

      {/* 折扇 —— 5 根扇骨 + 顶部弧形扇面 */}
      <g
        stroke="#f5efe2"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {/* 中骨 */}
        <line x1="14" y1="20" x2="14" y2="7" />
        {/* 中左 / 中右 */}
        <line x1="14" y1="20" x2="9.5" y2="8" />
        <line x1="14" y1="20" x2="18.5" y2="8" />
        {/* 外左 / 外右 */}
        <line x1="14" y1="20" x2="6" y2="11" />
        <line x1="14" y1="20" x2="22" y2="11" />
        {/* 扇面外弧（连接扇骨顶端） */}
        <path d="M 6 11 Q 14 4 22 11" />
        {/* 扇面内弧（淡，呈现层次） */}
        <path d="M 8.5 13 Q 14 7 19.5 13" strokeOpacity="0.55" />
      </g>

      {/* 扇钉 */}
      <circle cx="14" cy="20" r="1.2" fill="#f5efe2" />
    </svg>
  );
}
