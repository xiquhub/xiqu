"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MiniSearch from "minisearch";
import type { SearchDoc } from "@/lib/search-index";

export function SearchClient({ docs }: { docs: SearchDoc[] }) {
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [filter, setFilter] = useState<"all" | "work" | "actor" | "troupe">("all");

  const ms = useMemo(() => {
    const m = new MiniSearch<SearchDoc>({
      fields: ["title", "subtitle", "body"],
      storeFields: ["id", "kind", "title", "slug", "subtitle", "url", "heritage"],
      tokenize: (s) => {
        // 中文按字符切，西文按空格
        const tokens: string[] = [];
        const buf: string[] = [];
        for (const c of s) {
          if (/[一-鿿]/.test(c)) {
            if (buf.length) { tokens.push(buf.join("")); buf.length = 0; }
            tokens.push(c);
          } else if (/[\s.,!?;:()【】、，。！？；：《》〈〉]/.test(c)) {
            if (buf.length) { tokens.push(buf.join("")); buf.length = 0; }
          } else {
            buf.push(c);
          }
        }
        if (buf.length) tokens.push(buf.join(""));
        return tokens;
      },
      searchOptions: { prefix: true, fuzzy: 0.1, boost: { title: 3, subtitle: 1.5 } },
    });
    m.addAll(docs);
    return m;
  }, [docs]);

  const results = useMemo(() => {
    const trimmed = q.trim();
    if (!trimmed) return [];
    const raw = ms.search(trimmed) as unknown as (SearchDoc & { score: number })[];
    if (filter === "all") return raw;
    return raw.filter((r) => r.kind === filter);
  }, [ms, q, filter]);

  // sync URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const u = new URL(window.location.href);
    if (q) u.searchParams.set("q", q);
    else u.searchParams.delete("q");
    window.history.replaceState(null, "", u.toString());
  }, [q]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof results> = { work: [], actor: [], troupe: [] };
    for (const r of results) g[r.kind].push(r);
    return g;
  }, [results]);

  return (
    <div>
      <div className="mb-6 flex w-full max-w-2xl items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            placeholder="输入剧名、演员名、剧团名…"
            className="w-full h-12 pl-12 pr-4 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] placeholder-[var(--color-fg-muted)]/70 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </div>

      {q.trim() && (
        <div className="mb-6 flex flex-wrap gap-2 text-sm">
          {([
            ["all", "全部"],
            ["work", "剧目"],
            ["actor", "演员"],
            ["troupe", "剧团"],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={
                "px-3 h-8 rounded-md border " +
                (filter === k
                  ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)]")
              }
            >
              {l}
              {filter === k
                ? <span className="ml-1.5 opacity-70">({results.length})</span>
                : null}
            </button>
          ))}
        </div>
      )}

      {!q.trim() ? (
        <div className="text-[var(--color-fg-muted)]">输入关键词开始搜索。</div>
      ) : results.length === 0 ? (
        <div className="text-[var(--color-fg-muted)]">未找到与「{q}」相关的结果。</div>
      ) : (
        <div className="space-y-10">
          {(["work", "actor", "troupe"] as const).map((kind) => {
            if (filter !== "all" && filter !== kind) return null;
            const list = grouped[kind];
            if (!list.length) return null;
            const heading = kind === "work" ? "剧目" : kind === "actor" ? "演员" : "剧团";
            return (
              <section key={kind}>
                <h2 className="font-serif text-xl text-[var(--color-fg)] border-b border-[var(--color-border)] pb-2 mb-3">
                  {heading} <span className="text-sm text-[var(--color-fg-muted)] ml-2">{list.length}</span>
                </h2>
                <ul className="divide-y divide-[var(--color-border)]">
                  {list.slice(0, 30).map((r) => (
                    <li key={r.id}>
                      <Link href={r.url} className="block py-3 hover:bg-[var(--color-surface)] -mx-3 px-3 rounded">
                        <div className="flex items-baseline gap-2">
                          <span className="font-serif text-base text-[var(--color-fg)]">{r.title}</span>
                          {r.heritage && <span className="heritage-stamp">非遗</span>}
                        </div>
                        {r.subtitle && <div className="text-sm text-[var(--color-fg-muted)] mt-0.5">{r.subtitle}</div>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
