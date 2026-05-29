"use client";
import { useEffect, useRef, useState } from "react";

const VIDEO_BASE = process.env.NEXT_PUBLIC_VIDEO_BASE_URL ?? "http://server.yunxy.top:4768";

type Part = {
  file: string;
  file_en?: string;
  label?: string;
  sort_order: number;
};

export function VideoPlayer({
  workSlug,
  productionSlug,
  parts,
}: {
  workSlug: string;
  productionSlug: string;
  parts: Part[];
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);

  // 选中当前 part 的 URL & 类型
  const current = parts[currentIdx];
  const fileName = current?.file_en ?? "";
  const ext = fileName.toLowerCase().split(".").pop() || "";
  const url = fileName
    ? `${VIDEO_BASE}/${encodeURIComponent(workSlug)}/${encodeURIComponent(productionSlug)}/${encodeURIComponent(fileName)}`
    : "";

  // 加载 mpegts.js（仅 FLV 时按需动态导入）
  useEffect(() => {
    let cancelled = false;
    const video = videoRef.current;
    if (!video || !url) return;

    // 卸掉旧实例
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch {}
      playerRef.current = null;
    }

    if (ext === "flv") {
      (async () => {
        const mpegts = (await import("mpegts.js")).default;
        if (cancelled || !video) return;
        if (!mpegts.getFeatureList().mseLivePlayback && !mpegts.isSupported()) {
          // 浏览器不支持 MSE — 提示用户直接下载
          video.src = url;
          return;
        }
        const player = mpegts.createPlayer({
          type: "flv",
          url,
          isLive: false,
          cors: true,
        });
        playerRef.current = player;
        player.attachMediaElement(video);
        player.load();
      })();
    } else {
      // mp4 / 其他原生支持的格式
      video.src = url;
    }

    return () => {
      cancelled = true;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
    };
  }, [url, ext]);

  if (parts.length === 0) {
    return (
      <div className="border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] rounded-md p-8 text-center text-sm text-[var(--color-fg-muted)]">
        本版本暂无分卷文件。
      </div>
    );
  }

  return (
    <div>
      {/* 播放器 */}
      <div className="bg-black rounded-md overflow-hidden aspect-video shadow-md">
        <video
          ref={videoRef}
          controls
          controlsList="nodownload noremoteplayback noplaybackrate"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          playsInline
          preload="metadata"
          className="w-full h-full"
        />
      </div>

      {/* 当前文件标识 */}
      <div className="mt-3 text-sm text-[var(--color-fg-muted)]">
        当前：
        <span className="text-[var(--color-fg)] font-medium">
          {current.label || `第 ${currentIdx + 1} 段`}
        </span>
      </div>

      {/* 分卷选择 */}
      {parts.length > 1 && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <div className="text-xs uppercase tracking-wider text-[var(--color-fg-muted)] mb-2">
            分卷（{parts.length}）
          </div>
          <div className="flex flex-wrap gap-2">
            {parts.map((p, i) => (
              <button
                key={p.file}
                type="button"
                onClick={() => setCurrentIdx(i)}
                className={
                  "px-3 h-9 rounded-md border text-sm transition-colors " +
                  (i === currentIdx
                    ? "bg-[var(--color-accent)] text-[#f5efe2] border-[var(--color-accent)]"
                    : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-fg)]")
                }
              >
                {p.label || `第 ${i + 1} 段`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FLV 提示 */}
      {ext === "flv" && (
        <p className="mt-3 text-xs text-[var(--color-fg-muted)]/80">
          FLV 格式由浏览器内 mpegts.js 解码播放，如卡顿请刷新页面重试。
        </p>
      )}
    </div>
  );
}
