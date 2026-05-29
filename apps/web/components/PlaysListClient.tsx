"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { PlayCard } from "@/components/PlayCard";
import { splitTags } from "@/lib/tags";
import type { Work } from "@/lib/types";

type TagCount = { tag: string; count: number };

function getWorkTags(w: Work): string[] {
  return splitTags(w.plot_type);
}

export function PlaysListClient({
  works,
  allTags,
  heritageCount,
  totalCount,
}: {
  works: Work[];
  allTags: TagCount[];
  heritageCount: number;
  totalCount: number;
}) {
  const sp = useSearchParams();
  const sort = sp.get("sort") ?? "title";

  const selectedTags = useMemo(
    () => new Set((sp.get("tags") ?? "").split(",").map((s) => s.trim()).filter(Boolean)),
    [sp],
  );
  const heritageOnly = sp.get("heritage") === "true";
  const hasFilter = selectedTags.size > 0 || heritageOnly;

  const filtered = useMemo(() => {
    let list = works.slice();
    if (sort === "popular") {
      list.sort((a, b) =>
        b.productions.reduce((s, p) => s + p.parts.length, 0) -
        a.productions.reduce((s, p) => s + p.parts.length, 0),
      );
    } else if (sort === "recent") {
      list.sort((a, b) => b.mtime - a.mtime);
    } else {
      list.sort((a, b) => a.title.localeCompare(b.title, "zh-Hans"));
    }
    if (selectedTags.size > 0) {
      list = list.filter((w) => getWorkTags(w).some((t) => selectedTags.has(t)));
    }
    if (heritageOnly) list = list.filter((w) => w.heritage);
    return list;
  }, [works, sort, selectedTags, heritageOnly]);

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

  const sortOptions = [
    { key: "title", label: "按剧名" },
    { key: "popular", label: "热门" },
    { key: "recent", label: "最近更新" },
  ];

  return (
    <>
      {/* 标题 + 排序 */}
      <header className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--color-fg)]">全部剧目</h1>
          <p className="text-sm text-[var(--color-fg-muted)] mt-2">
            共 <strong className="text-[var(--color-fg)]">{filtered.length}</strong> 部
            {hasFilter && (
              <span className="text-[var(--color-fg-muted)]/70">
                {" "}/ 共收录 {totalCount}
              </span>
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

      {/* 标签筛选 */}
      <div className="mb-2">
        <div className="flex flex-wrap gap-2">
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

      {hasFilter && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm border-y border-[var(--color-border)] py-3">
          <span className="text-[var(--color-fg-muted)]">已选：</span>
          {heritageOnly && (
            <Link
              href={buildHref({ heritage: false })}
              className="inline-flex items-center gap-1.5 pl-3 pr-2 h-7 rounded-full bg-[var(--color-heritage)] text-[#f5efe2] hover:opacity-90 text-xs"
            >
              ★ 非遗
              <span className="opacity-70" aria-hidden>×</span>
            </Link>
          )}
          {[...selectedTags].map((t) => (
            <Link
              key={t}
              href={toggleTag(t)}
              className="inline-flex items-center gap-1.5 pl-3 pr-2 h-7 rounded-full bg-[var(--color-accent)] text-[#f5efe2] hover:opacity-90 text-xs"
            >
              {t}
              <span className="opacity-70" aria-hidden>×</span>
            </Link>
          ))}
          <Link href="/plays" className="text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] underline ml-1 text-xs">
            清除全部
          </Link>
        </div>
      )}

      {/* 主网格 */}
      <div className={hasFilter ? "mt-2" : "mt-6"}>
        {filtered.length === 0 ? (
          <div className="text-center text-[var(--color-fg-muted)] py-20">
            没有匹配的剧目。
            <Link href="/plays" className="text-[var(--color-accent)] hover:underline ml-1">清除筛选</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
            {filtered.map((w) => (
              <PlayCard key={w.slug} work={w} />
            ))}
          </div>
        )}
      </div>
    </>
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
  let cls = "";
  if (tone === "heritage" && active) {
    cls = "bg-[var(--color-heritage)] text-[#f5efe2] border-[var(--color-heritage)]";
  } else if (tone === "heritage") {
    cls = "border-[var(--color-heritage)] text-[var(--color-heritage)] hover:bg-[var(--color-heritage)] hover:text-[#f5efe2]";
  } else if (active) {
    cls = "bg-[var(--color-accent)] text-[#f5efe2] border-[var(--color-accent)]";
  } else {
    cls = "border-[var(--color-border)] text-[var(--color-fg)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]";
  }
  return (
    <Link
      href={href}
      className={"inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm whitespace-nowrap transition-colors " + cls}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={"text-xs " + (active ? "text-[#f5efe2]/75" : "text-[var(--color-fg-muted)]/80")}>
          {count}
        </span>
      )}
    </Link>
  );
}
