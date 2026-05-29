import Link from "next/link";
import { notFound } from "next/navigation";
import { CoverImage } from "@/components/CoverImage";
import { VideoPlayer } from "@/components/VideoPlayer";
import { getAllWorks, getProduction } from "@/lib/works";
import type { Metadata } from "next";

type Params = { params: Promise<{ slug: string; production: string }> };

export async function generateStaticParams() {
  const out: { slug: string; production: string }[] = [];
  for (const w of getAllWorks()) {
    for (const p of w.productions) {
      out.push({ slug: w.slug, production: p.slug });
    }
  }
  return out;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, production } = await params;
  const found = getProduction(slug, production);
  if (!found) return { title: "未找到 · 闽剧档案" };
  return {
    title: `${found.work.title} · ${found.production.label} · 闽剧档案`,
    description: `闽剧《${found.work.title}》${found.production.label}`,
  };
}

export default async function ProductionPage({ params }: Params) {
  const { slug, production } = await params;
  const found = getProduction(slug, production);
  if (!found) notFound();
  const { work, production: prod } = found;

  return (
    <article className="max-w-5xl mx-auto px-6 py-10">
      <nav className="text-sm text-[var(--color-fg-muted)] mb-6 flex items-center gap-2">
        <Link href="/plays" className="hover:text-[var(--color-accent)]">全部剧目</Link>
        <span aria-hidden>›</span>
        <Link href={`/plays/${work.slug}`} className="hover:text-[var(--color-accent)]">{work.title}</Link>
        <span aria-hidden>›</span>
        <span className="text-[var(--color-fg)]">{prod.label}</span>
      </nav>

      <div className="grid md:grid-cols-[200px_1fr] gap-8 mb-10">
        <CoverImage src={work.cover} title={work.title} size="md"
          className="rounded-md ring-1 ring-[var(--color-border)]" />
        <div>
          <div className="text-sm text-[var(--color-fg-muted)] mb-1">
            <Link href={`/plays/${work.slug}`} className="hover:text-[var(--color-accent)]">
              {work.title}
            </Link>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--color-fg)] mb-4">{prod.label}</h1>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {prod.troupe && (
              <Field label="剧团">
                <Link
                  href={`/troupes/${encodeURIComponent(prod.troupe)}`}
                  className="text-[var(--color-link)] hover:underline"
                >
                  {prod.troupe}
                </Link>
              </Field>
            )}
            {prod.year && <Field label="年份">{prod.year}</Field>}
            {prod.media_type && <Field label="媒介">{prod.media_type}</Field>}
            <Field label="分卷">{prod.parts.length} 卷</Field>
            {prod.leads.length > 0 && (
              <Field label="主演">
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {prod.leads.map((lead) => (
                    <Link
                      key={lead}
                      href={`/actors/${encodeURIComponent(lead)}`}
                      className="text-[var(--color-link)] hover:underline"
                    >
                      {lead}
                    </Link>
                  ))}
                </div>
              </Field>
            )}
          </dl>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="font-serif text-xl text-[var(--color-fg)] mb-4 border-b border-[var(--color-border)] pb-2">观看</h2>
        <VideoPlayer workSlug={work.slug} productionSlug={prod.slug} parts={prod.parts} />
      </section>

      {/* 其他版本 */}
      {work.productions.length > 1 && (
        <section className="mb-10">
          <h2 className="font-serif text-xl text-[var(--color-fg)] mb-4 border-b border-[var(--color-border)] pb-2">本剧其他版本</h2>
          <ul className="flex flex-wrap gap-2">
            {work.productions
              .filter((p) => p.slug !== prod.slug)
              .map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/plays/${work.slug}/${p.slug}`}
                    className="inline-block px-3 py-1.5 border border-[var(--color-border)] rounded-md text-sm hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}
    </article>
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
