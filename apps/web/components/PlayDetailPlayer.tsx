"use client";
import { useState } from "react";
import { VideoPlayer } from "./VideoPlayer";
import type { Production } from "@/lib/types";

export function PlayDetailPlayer({
  workSlug,
  productions,
}: {
  workSlug: string;
  productions: Production[];
}) {
  const [selectedSlug, setSelectedSlug] = useState<string>(productions[0]?.slug ?? "");

  if (productions.length === 0) {
    return (
      <div className="border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] rounded-md p-8 text-center text-sm text-[var(--color-fg-muted)]">
        本剧暂无可播放资料。
      </div>
    );
  }

  const current = productions.find((p) => p.slug === selectedSlug) ?? productions[0];

  return (
    <div>
      {/* 版本 tab — 只有多个版本时显示 */}
      {productions.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-3">
          {productions.map((p) => {
            const active = p.slug === current.slug;
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => setSelectedSlug(p.slug)}
                className={
                  "px-4 h-9 rounded-md text-sm transition-colors " +
                  (active
                    ? "bg-[var(--color-accent)] text-[#f5efe2]"
                    : "border border-[var(--color-border)] text-[var(--color-fg)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]")
                }
              >
                {p.label}
                <span
                  className={
                    "ml-2 text-xs " +
                    (active ? "text-[#f5efe2]/70" : "text-[var(--color-fg-muted)]/80")
                  }
                >
                  {p.parts.length} 卷
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 当前版本元数据 */}
      {(current.troupe || current.leads.length > 0 || current.year || current.media_type) && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-5">
          {current.troupe && (
            <Field label="剧团">
              <a href={`/troupes/${encodeURIComponent(current.troupe)}`} className="text-[var(--color-link)] hover:underline">
                {current.troupe}
              </a>
            </Field>
          )}
          {current.year && <Field label="年份">{current.year}</Field>}
          {current.media_type && <Field label="媒介">{current.media_type}</Field>}
          {current.leads.length > 0 && (
            <Field label="主演">
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                {current.leads.map((lead) => (
                  <a
                    key={lead}
                    href={`/actors/${encodeURIComponent(lead)}`}
                    className="text-[var(--color-link)] hover:underline"
                  >
                    {lead}
                  </a>
                ))}
              </div>
            </Field>
          )}
        </dl>
      )}

      {/* 视频播放器（switch production 时 key 强制重 mount） */}
      <VideoPlayer
        key={current.slug}
        workSlug={workSlug}
        productionSlug={current.slug}
        parts={current.parts}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="text-[var(--color-fg-muted)] w-12 shrink-0">{label}</dt>
      <dd className="text-[var(--color-fg)]">{children}</dd>
    </div>
  );
}
