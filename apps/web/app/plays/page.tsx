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

  const selectedTags = new Set(
    (params.tags ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const heritageOnly = params.heritage === "true";

  let works: Work[];
  if (sort === "popular") works = getPopularWorks(999);
  else if (sort === "recent") works = getRecentWorks(999);
  else works = getAllWorks();

  works = filterWorksByTags(works, selectedTags);
  if (heritageOnly) works = works.filter((w) => w.heritage);

  const allTags = getAllTagCounts();
  const heritageCount = getAllWorks().filter((w) => w.heritage).length;

  const sortOptions = [
    { key: "title", label: "按剧名" },
    { key: "popular", label: "热门" },
    { key: "recent", label: "最近更新" },
  ];

  const buildHref = (overrides: { tags?: string[]; heritage?: boolean; sort?: string }) => {
    const next = new URLSearchParams();
    const finalSort = overrides.sort ?? sort;
    if (finalSort && finalSort !== "title") next.set("sort", finalSort);
    const tags = overrides.tags ?? [...selectedTags];
    if (tags.length) next.set("tags", tags.join(","));
    const heritage = overrides.heritage ?? heritageOnly;
    if (heritage) next.set("heritage", "true");
    const qs = next.toString();
    return qs ? `/plays?${qs}` : "/plays";
  };

  const toggleTag = (tag: string) => {
    const next = new Set(selectedTags);
    next.has(tag) ? next.delete(tag) : next.add(tag);
    return buildHref({ tags: [...next] });
  };

  const hasFilter = selectedTags.size > 0 || heritageOnly;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 sm:py-12">
      {/* 标题 + 排序 */}
      <header className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--color-fg)]">全部剧目</h1>
          <p className="text-sm text-[var(--color-fg-muted)] mt-2">
            共 <strong className="text-[var(--color-fg)]">{works.length}</strong> 部
            {hasFilter && (
              <>
                {" "}
                <span className="text-[var(--color-fg-muted)]/70">
                  / 共收录 {getAllWorks().length}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {sortOptions.map((o) => (
            <Link
              key={o.key}
              href={buildHref({ sort: o.key })}
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

      {/* 横向标签筛选 */}
      <div className="mb-2 -mx-6 px-6 sm:mx-0 sm:px-0">
        <div className="flex sm:flex-wrap gap-2 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TagChip
            href={buildHref({ heritage: !heritageOnly })}
            active={heritageOnly}
            label="★ 非遗"
            count={heritageCount}
            tone="heritage"
          />
          {allTags.map((t) => (
            <TagChip
              key={t.tag}
              href={toggleTag(t.tag)}
              active={selectedTags.has(t.tag)}
              label={t.tag}
              count={t.count}
            />
          ))}
        </div>
      </div>

      {/* 已选筛选条 */}
      {hasFilter && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm border-y border-[var(--color-border)] py-3">
          <span className="text-[var(--color-fg-muted)]">已选：</span>
          {heritageOnly && (
            <Link
              href={buildHref({ heritage: false })}
              className="inline-flex items-center gap-1.5 pl-3 pr-2 h-7 rounded-full bg-[var(--color-heritage)] text-[#f5efe2] hover:opacity-90 text-xs"
            >
              ★ 非遗
              <span className="opacity-70" aria-hidden>
                ×
              </span>
            </Link>
          )}
          {[...selectedTags].map((t) => (
            <Link
              key={t}
              href={toggleTag(t)}
              className="inline-flex items-center gap-1.5 pl-3 pr-2 h-7 rounded-full bg-[var(--color-accent)] text-[#f5efe2] hover:opacity-90 text-xs"
            >
              {t}
              <span className="opacity-70" aria-hidden>
                ×
              </span>
            </Link>
          ))}
          <Link
            href="/plays"
            className="text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] underline ml-1 text-xs"
          >
            清除全部
          </Link>
        </div>
      )}

      {/* 主网格（全宽） */}
      <div className={hasFilter ? "mt-2" : "mt-6"}>
        {works.length === 0 ? (
          <div className="text-center text-[var(--color-fg-muted)] py-20">
            没有匹配的剧目。
            <Link href="/plays" className="text-[var(--color-accent)] hover:underline ml-1">
              清除筛选
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
            {works.map((w) => (
              <PlayCard key={w.slug} work={w} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TagChip({
  href,
  active,
  label,
  count,
  tone = "default",
}: {
  href: string;
  active?: boolean;
  label: string;
  count?: number;
  tone?: "default" | "heritage";
}) {
  // 配色：默认/已选 / 非遗 / 已选非遗
  let cls = "";
  if (tone === "heritage" && active) {
    cls = "bg-[var(--color-heritage)] text-[#f5efe2] border-[var(--color-heritage)]";
  } else if (tone === "heritage") {
    cls =
      "border-[var(--color-heritage)] text-[var(--color-heritage)] hover:bg-[var(--color-heritage)] hover:text-[#f5efe2]";
  } else if (active) {
    cls = "bg-[var(--color-accent)] text-[#f5efe2] border-[var(--color-accent)]";
  } else {
    cls =
      "border-[var(--color-border)] text-[var(--color-fg)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]";
  }

  return (
    <Link
      href={href}
      className={
        "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm whitespace-nowrap transition-colors " +
        cls
      }
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={
            "text-xs " +
            (active ? "text-[#f5efe2]/75" : "text-[var(--color-fg-muted)]/80")
          }
        >
          {count}
        </span>
      )}
    </Link>
  );
}
