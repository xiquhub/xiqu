import Link from "next/link";
import { PlayCard } from "@/components/PlayCard";
import { getAllWorks, getPopularWorks, getRecentWorks } from "@/lib/works";
import type { Work } from "@/lib/types";

export const metadata = {
  title: "全部剧目 · 闽剧档案",
  description: "闽剧公益档案站收录的全部剧目目录",
};

type Params = {
  searchParams: Promise<{
    sort?: string;
    plot_type?: string;
    era?: string;
    heritage?: string;
    has_video?: string;
  }>;
};

export default async function PlaysPage({ searchParams }: Params) {
  const params = await searchParams;
  const sort = params.sort ?? "title";

  let works: Work[];
  if (sort === "popular") works = getPopularWorks(999);
  else if (sort === "recent") works = getRecentWorks(999);
  else works = getAllWorks();

  if (params.plot_type) works = works.filter((w) => w.plot_type === params.plot_type);
  if (params.era) works = works.filter((w) => w.era_setting?.includes(params.era!));
  if (params.heritage === "true") works = works.filter((w) => w.heritage);

  // 汇总筛选可选值
  const allPlotTypes = Array.from(new Set(getAllWorks().map((w) => w.plot_type).filter(Boolean))) as string[];

  const sortOptions = [
    { key: "title", label: "按剧名" },
    { key: "popular", label: "热门" },
    { key: "recent", label: "最近更新" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-8 border-b border-[var(--color-border)] pb-4 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--color-fg)]">全部剧目</h1>
          <p className="text-sm text-[var(--color-fg-muted)] mt-2">
            共 <strong className="text-[var(--color-fg)]">{works.length}</strong> 部
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {sortOptions.map((o) => (
            <Link
              key={o.key}
              href={`/plays?sort=${o.key}`}
              className={
                "px-3 h-9 inline-flex items-center rounded-md border " +
                (sort === o.key
                  ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)]")
              }
            >
              {o.label}
            </Link>
          ))}
        </div>
      </header>

      <div className="grid lg:grid-cols-[200px_1fr] gap-10">
        {/* 侧栏筛选 */}
        <aside className="space-y-6 text-sm">
          <FilterBlock title="题材">
            <FilterChip href={`/plays`} active={!params.plot_type} label="全部" />
            {allPlotTypes.map((t) => (
              <FilterChip
                key={t}
                href={`/plays?plot_type=${encodeURIComponent(t)}`}
                active={params.plot_type === t}
                label={t}
              />
            ))}
          </FilterBlock>

          <FilterBlock title="特殊">
            <FilterChip href="/plays?heritage=true" active={params.heritage === "true"} label="国家级非遗" />
          </FilterBlock>
        </aside>

        {/* 主网格 */}
        <div>
          {works.length === 0 ? (
            <div className="text-center text-[var(--color-fg-muted)] py-20">
              没有匹配的剧目。<Link href="/plays" className="text-[var(--color-accent)] hover:underline">清除筛选</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-8">
              {works.map((w) => <PlayCard key={w.slug} work={w} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-[var(--color-fg-muted)] font-semibold mb-2">{title}</div>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active?: boolean; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className={
          "block px-2 py-1 -mx-2 rounded " +
          (active
            ? "text-[var(--color-accent)] bg-[var(--color-surface)] font-medium"
            : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)]")
        }
      >
        {label}
      </Link>
    </li>
  );
}
