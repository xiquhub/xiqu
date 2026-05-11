import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTroupes, getTroupe, getWork } from "@/lib/works";
import { CoverImage } from "@/components/CoverImage";
import type { Metadata } from "next";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllTroupes().map((t) => ({ slug: t.name }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${decodeURIComponent(slug)} · 剧团 · 闽剧档案` };
}

export default async function TroupePage({ params }: Params) {
  const { slug } = await params;
  const name = decodeURIComponent(slug);
  const troupe = getTroupe(name);
  if (!troupe) notFound();

  const uniqWorks = Array.from(new Set(troupe.works.map((w) => w.slug)))
    .map((s) => getWork(s))
    .filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <nav className="text-sm text-[var(--color-fg-muted)] mb-6">
        <Link href="/troupes" className="hover:text-[var(--color-accent)]">← 全部剧团</Link>
      </nav>

      <header className="mb-10 border-b border-[var(--color-border)] pb-6">
        <h1 className="font-serif text-4xl sm:text-5xl text-[var(--color-fg)]">{troupe.name}</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-2">
          已收录 <strong className="text-[var(--color-fg)]">{uniqWorks.length}</strong> 部代表剧目
        </p>
      </header>

      <section>
        <h2 className="font-serif text-2xl text-[var(--color-fg)] mb-5">代表剧目</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-5 gap-y-8">
          {uniqWorks.map((w) => w && (
            <Link key={w.slug} href={`/plays/${w.slug}`} className="group block">
              <CoverImage src={w.cover} title={w.title} className="rounded ring-1 ring-[var(--color-border)]" />
              <h3 className="mt-2 font-serif text-base text-[var(--color-fg)] group-hover:text-[var(--color-accent)] line-clamp-1">
                {w.title}
              </h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
