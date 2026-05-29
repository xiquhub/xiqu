import Link from "next/link";
import { notFound } from "next/navigation";
import { CoverImage } from "@/components/CoverImage";
import { PlayDetailPlayer } from "@/components/PlayDetailPlayer";
import { getAllWorks, getWork } from "@/lib/works";
import type { Metadata } from "next";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllWorks().map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const w = getWork(slug);
  if (!w) return { title: "未找到 · 闽剧档案" };
  return {
    title: `${w.title} · 闽剧档案`,
    description: w.plot_summary.slice(0, 120) || `闽剧《${w.title}》资料`,
    openGraph: w.cover ? { images: [w.cover] } : undefined,
  };
}

export default async function PlayDetailPage({ params }: Params) {
  const { slug } = await params;
  const work = getWork(slug);
  if (!work) notFound();

  return (
    <article className="max-w-5xl mx-auto px-6 py-10">
      <nav className="text-sm text-[var(--color-fg-muted)] mb-6">
        <Link href="/plays" className="hover:text-[var(--color-accent)]">← 全部剧目</Link>
      </nav>

      <div className="grid md:grid-cols-[260px_1fr] gap-10 mb-14">
        <CoverImage src={work.cover} title={work.title} size="lg"
          className="rounded-md shadow-md ring-1 ring-[var(--color-border)] md:sticky md:top-24" />

        <div>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {work.heritage && <span className="heritage-stamp">★ 国家级非遗</span>}
            {work.plot_type && <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-fg-muted)]">{work.plot_type}</span>}
            {work.era_setting && <span className="text-xs text-[var(--color-fg-muted)]">· {work.era_setting}</span>}
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl text-[var(--color-fg)] mb-2">{work.title}</h1>
          {work.title_alt.length > 0 && (
            <div className="text-[var(--color-fg-muted)] text-base mb-4">
              别名：{work.title_alt.join(" / ")}
            </div>
          )}

          {work.adapted_from && (
            <div className="text-sm text-[var(--color-fg-muted)] mb-4">
              <span className="font-medium text-[var(--color-fg)]">改编自：</span>
              {work.adapted_from}
            </div>
          )}

          {work.plot_summary ? (
            <div className="prose-cn text-[var(--color-fg)] mt-6 leading-relaxed">
              {work.plot_summary.split(/\n\s*\n/).map((p, i) => (
                <p key={i}>{p.replace(/^>\s*/, "")}</p>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm italic text-[var(--color-fg-muted)]">
              暂无剧情资料。如有了解此剧的朋友，欢迎通过右下角"反馈"补充。
            </p>
          )}
        </div>
      </div>

      {/* 观看 — 多版本以 tab 切换，单版本直接渲染播放器 */}
      <section className="mb-14">
        <h2 className="font-serif text-2xl text-[var(--color-fg)] mb-5 border-b border-[var(--color-border)] pb-2">
          观看
          {work.productions.length > 1 && (
            <span className="text-sm text-[var(--color-fg-muted)] ml-2">
              {work.productions.length} 个版本
            </span>
          )}
        </h2>
        <PlayDetailPlayer workSlug={work.slug} productions={work.productions} />
      </section>

      {/* 资料来源 — 仅展示外部 URL 来源，不展示 LLM/内部追踪条目 */}
      {(() => {
        const visible = work.sources.filter(
          (s) => s.url?.startsWith("http") && s.type !== "llm_synthesis",
        );
        if (visible.length === 0) return null;
        return (
          <section className="mb-14">
            <h2 className="font-serif text-2xl text-[var(--color-fg)] mb-5 border-b border-[var(--color-border)] pb-2">
              资料来源
            </h2>
            <ul className="space-y-1.5 text-sm">
              {visible.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-link)] hover:underline break-all"
                  >
                    {s.url}
                  </a>
                  {s.scope && (
                    <span className="ml-2 text-xs text-[var(--color-fg-muted)]">· {s.scope}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })()}
    </article>
  );
}
