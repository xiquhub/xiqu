import Link from "next/link";
import { notFound } from "next/navigation";
import { getActor, getAllActors, getWork } from "@/lib/works";
import { CoverImage } from "@/components/CoverImage";
import type { Metadata } from "next";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllActors().map((a) => ({ slug: a.name }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const name = decodeURIComponent(slug);
  return { title: `${name} · 演员 · 闽剧档案` };
}

export default async function ActorPage({ params }: Params) {
  const { slug } = await params;
  const name = decodeURIComponent(slug);
  const actor = getActor(name);
  if (!actor) notFound();

  // 按 work 聚合
  const byWork = new Map<string, { work: ReturnType<typeof getWork>; productions: string[] }>();
  for (const ref of actor.works) {
    const w = getWork(ref.slug);
    if (!w) continue;
    const entry = byWork.get(w.slug) ?? { work: w, productions: [] };
    entry.productions.push(ref.production);
    byWork.set(w.slug, entry);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <nav className="text-sm text-[var(--color-fg-muted)] mb-6">
        <Link href="/actors" className="hover:text-[var(--color-accent)]">← 演员索引</Link>
      </nav>

      <header className="mb-10 border-b border-[var(--color-border)] pb-6">
        <h1 className="font-serif text-4xl sm:text-5xl text-[var(--color-fg)]">{actor.name}</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-2">
          参演 <strong className="text-[var(--color-fg)]">{byWork.size}</strong> 部作品，
          共 <strong className="text-[var(--color-fg)]">{actor.works.length}</strong> 个版本
        </p>
        <p className="text-xs italic text-[var(--color-fg-muted)] mt-2">
          演员资料从视频文件名提取，暂无传记。如您熟悉本人，欢迎补充。
        </p>
      </header>

      <section>
        <h2 className="font-serif text-2xl text-[var(--color-fg)] mb-5">参演作品</h2>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
          {[...byWork.values()].map(({ work, productions }) => work && (
            <li key={work.slug}>
              <Link href={`/plays/${work.slug}`} className="flex gap-3 group">
                <div className="w-20 shrink-0">
                  <CoverImage src={work.cover} title={work.title} className="rounded ring-1 ring-[var(--color-border)]" />
                </div>
                <div>
                  <h3 className="font-serif text-base text-[var(--color-fg)] group-hover:text-[var(--color-accent)]">
                    {work.title}
                  </h3>
                  {work.plot_type && (
                    <div className="text-xs text-[var(--color-fg-muted)] mt-0.5">{work.plot_type}</div>
                  )}
                  <div className="text-xs text-[var(--color-fg-muted)] mt-1">
                    {productions.length} 个版本
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
