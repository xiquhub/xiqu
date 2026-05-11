import type { Production } from "@/lib/types";

export function VideoPlaceholder({ production }: { production: Production }) {
  return (
    <div className="border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] rounded-md p-8 text-center">
      <div className="mx-auto w-14 h-14 mb-4 grid place-items-center rounded-full bg-[var(--color-bg)] border border-[var(--color-border)]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-fg-muted)]">
          <rect x="2" y="6" width="14" height="12" rx="2" />
          <path d="m22 8-6 4 6 4V8z" />
        </svg>
      </div>
      <div className="font-serif text-lg text-[var(--color-fg)] mb-1">视频暂未上线</div>
      <p className="text-sm text-[var(--color-fg-muted)] max-w-md mx-auto">
        本版本视频文件尚未编码上传。如您有原始录像或修复版本，欢迎提交。
      </p>

      {production.parts.length > 0 && (
        <div className="mt-6 pt-6 border-t border-[var(--color-border)] text-left max-w-md mx-auto">
          <div className="text-xs uppercase tracking-wider text-[var(--color-fg-muted)] mb-2">已知分卷文件名</div>
          <ul className="space-y-1 text-sm">
            {production.parts.map((p) => (
              <li key={p.file} className="flex items-center gap-2 text-[var(--color-fg)]">
                <span className="inline-block w-1 h-1 rounded-full bg-[var(--color-fg-muted)]" aria-hidden />
                <span className="font-mono text-xs break-all">{p.file}</span>
                {p.label && <span className="text-[var(--color-fg-muted)] text-xs">· {p.label}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
