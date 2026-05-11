import Link from "next/link";
import { PlayCard } from "@/components/PlayCard";
import {
  getAllTagCounts,
  getAllWorks,
  getPopularWorks,
  getRecentWorks,
  filterWorksByTags,
} from "@/lib/works";
import type { Work } from "@/lib/types";

export const metadata = {
  title: "全部剧目 · 闽剧档案",
  description: "闽剧公益档案站收录的全部剧目目录",
};

type Params = {
  searchParams: Promise<{
    sort?: string;
    tags?: string;
    heritage?: string;
  }>;
};

export default async function PlaysPage({ searchParams }: Params) {
  const params = await searchParams;
  const sort = params.sort ?? "title";

  // 选中标签集合
  const selectedTags = new Set(
    (params.tags ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  // 基础排序
  let works: Work[];
  if (sort === "popular") works = getPopularWorks(999);
  else if (sort === "recent") works = getRecentWorks(999);
  else works = getAllWorks();

  // 标签筛选（OR 语义）
  works = filterWorksByTags(works, selectedTags);
  if (params.heritage === "true") works = works.filter((w) => w.heritage);

  const allTags = getAllTagCounts();
  const heritageCount = getAllWorks().filter((w) => w.heritage).length;

  const sortOptions = [
    { key: "title", label: "按剧名" },
    { key: "popular", label: "热门" },
    { key: "recent", label: "最近更新" },
  ];

  // 构造 toggle 链接：当前所有筛选保留，仅切换某个 tag
  const buildHref = (overrides: { tags?: string[]; heritage?: boolean }) => {
    const next = new URLSearchParams();
    if (sort && sort !== "title") next.set("sort", sort);
    const tags = overrides.tags ?? [...selectedTags];
    if (tags.length) next.set("tags", tags.join(","));
    const heritage = overrides.heritage ?? params.heritage === "true";
    if (heritage) next.set("heritage", "true");
    const qs = next.toString();
    return qs ? `/plays?${qs}` : "/plays";
  };

  const toggleTag = (tag: string) => {
    const next = new Set(selectedTags);
    next.has(tag) ? next.delete(tag) : next.add(tag);
    return buildHref({ tags: [...next] });
  };

  const hasFilter = selectedTags.size > 0 || params.heritage === "true";

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-8 border-b border-[var(--color-border)] pb-4 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--color-fg)]">全部剧目</h1>
          <p className="text-sm text-[var(--color-fg-muted)] mt-2">
            共 <strong className="text-[var(--color-fg)]">{works.length}</strong> 部
            {hasFilter && (
              <>
                {" "}<span className="text-[var(--color-fg-muted)]/70">/ 共收录 {getAllWorks().length}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {sortOptions.map((o) => (
            <Link
              key={o.key}
              href={`/plays${o.key === "title" ? "" : `?sort=${o.key}`}`}
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

      {/* 当前筛选条 */}
      {hasFilter && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-[var(--color-fg-muted)]">筛选：</span>
          {[...selectedTags].map((t) => (
            <Link
              key={t}
              href={toggleTag(t)}
              className="inline-flex items-center gap-1.5 pl-3 pr-2 h-8 rounded-md bg-[var(--color-accent)] text-[#f5efe2] hover:opacity-90"
            >
              {t}
              <span className="text-[#f5efe2]/70" aria-hidden>×</span>
            </Link>
          ))}
          {params.heritage === "true" && (
            <Link
              href={buildHref({ heritage: false })}
              className="inline-flex items-center gap-1.5 pl-3 pr-2 h-8 rounded-md bg-[var(--color-heritage)] text-[#f5efe2] hover:opacity-90"
            >
              非遗
              <span className="text-[#f5efe2]/70" aria-hidden>×</span>
            </Link>
          )}
          <Link href="/plays" className="text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] underline ml-1">
            清除全部
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-[220px_1fr] gap-10">
        {/* 侧栏 */}
        <aside className="space-y-7 text-sm">
          <FilterBlock title="特殊">
            <FilterChip
              href={buildHref({ heritage: !(params.heritage === "true") })}
              active={params.heritage === "true"}
              label="国家级非遗"
              count={heritageCount}
            />
          </FilterBlock>

          <FilterBlock title={`题材${selectedTags.size > 0 ? `（已选 ${selectedTags.size}）` : ""}`}>
            <p className="text-xs text-[var(--color-fg-muted)] mb-2 leading-relaxed">
              点击切换；可同时选多个（满足任一即显示）
            </p>
            {allTags.map((t) => (
              <FilterChip
                key={t.tag}
                href={toggleTag(t.tag)}
                active={selectedTags.has(t.tag)}
                label={t.tag}
                count={t.count}
              />
            ))}
          </FilterBlock>
        </aside>

        {/* 主网格 */}
        <div>
          {works.length === 0 ? (
            <div className="text-center text-[var(--color-fg-muted)] py-20">
              没有匹配的剧目。
              <Link href="/plays" className="text-[var(--color-accent)] hover:underline ml-1">
                清除筛选
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-8">
              {works.map((w) => (
                <PlayCard key={w.slug} work={w} />
              ))}
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
      <div className="text-xs uppercase tracking-wider text-[var(--color-fg-muted)] font-semibold mb-2">
        {title}
      </div>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active?: boolean;
  label: string;
  count?: number;
}) {
  return (
    <li>
      <Link
        href={href}
        className={
          "flex items-center justify-between gap-2 px-2 py-1 -mx-2 rounded transition-colors " +
          (active
            ? "text-[var(--color-accent)] bg-[var(--color-surface)] font-medium"
            : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)]")
        }
      >
        <span className="flex items-center gap-1.5">
          <span
            className={
              "inline-block w-3 h-3 rounded-sm border " +
              (active
                ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                : "border-[var(--color-border)]")
            }
            aria-hidden
          />
          {label}
        </span>
        {count !== undefined && (
          <span className="text-xs text-[var(--color-fg-muted)]/80">{count}</span>
        )}
      </Link>
    </li>
  );
}
