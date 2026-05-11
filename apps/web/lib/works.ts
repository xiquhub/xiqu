import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Work, Production, ActorRef, TroupeRef } from "./types";

const WORKS_DIR = path.join(process.cwd(), "..", "..", "docs", "works");

let _cache: Work[] | null = null;

/**
 * Read all works from docs/works/*.md once per process.
 * Build-time SSG uses this directly; dev hot-reload also benefits.
 */
export function getAllWorks(): Work[] {
  if (_cache) return _cache;

  const files = fs.readdirSync(WORKS_DIR).filter((f) => f.endsWith(".md"));
  const works: Work[] = [];

  for (const file of files) {
    const fp = path.join(WORKS_DIR, file);
    const raw = fs.readFileSync(fp, "utf8");
    const stat = fs.statSync(fp);
    const { data, content } = matter(raw);

    const fmProductions = Array.isArray(data.productions) ? data.productions : [];
    const productions: Production[] = fmProductions.map((p: any) => ({
      slug: String(p?.slug ?? "main"),
      label: String(p?.label ?? "主版"),
      troupe: p?.troupe || undefined,
      year: typeof p?.year === "number" ? p.year : null,
      media_type: p?.media_type || undefined,
      leads: Array.isArray(p?.leads) ? p.leads.map(String) : [],
      parts: Array.isArray(p?.parts)
        ? p.parts.map((pt: any) => ({
            file: String(pt?.file ?? ""),
            label: pt?.label || undefined,
            sort_order: typeof pt?.sort_order === "number" ? pt.sort_order : 0,
          }))
        : [],
      confidence: p?.confidence || undefined,
    }));

    works.push({
      slug: String(data.slug ?? file.replace(/\.md$/, "")),
      title: String(data.title ?? ""),
      title_alt: Array.isArray(data.title_alt) ? data.title_alt.map(String) : [],
      genre: String(data.genre ?? "闽剧"),
      heritage: data.heritage === true || data.heritage === "true",
      plot_type: data.plot_type ? String(data.plot_type) : undefined,
      era_setting: data.era_setting ? String(data.era_setting) : undefined,
      adapted_from: data.adapted_from ? String(data.adapted_from) : undefined,
      needs_research: data.needs_research === true || data.needs_research === "true",
      sources: Array.isArray(data.sources) ? (data.sources as any) : [],
      cover: data.cover ? String(data.cover) : undefined,
      productions,
      body: content.trim(),
      plot_summary: extractPlot(content),
      mtime: stat.mtimeMs,
    });
  }

  works.sort((a, b) => a.title.localeCompare(b.title, "zh-Hans"));
  _cache = works;
  return works;
}

export function getWork(slug: string): Work | undefined {
  return getAllWorks().find((w) => w.slug === slug);
}

export function getProduction(workSlug: string, prodSlug: string): { work: Work; production: Production } | undefined {
  const work = getWork(workSlug);
  if (!work) return undefined;
  const production = work.productions.find((p) => p.slug === prodSlug);
  if (!production) return undefined;
  return { work, production };
}

/**
 * 推荐加权打分：用于首页"精选"、"热门"。
 */
export function scoreWork(w: Work): number {
  let s = 0;
  if (w.heritage) s += 30;
  s += w.productions.length * 4;
  if (w.plot_summary.length > 100) s += 10;
  if (!w.needs_research) s += 5;
  const leadCount = w.productions.reduce((acc, p) => acc + p.leads.length, 0);
  s += leadCount * 2;
  if (w.productions.some((p) => p.troupe)) s += 5;
  return s;
}

export function getFeaturedWorks(n = 12): Work[] {
  const works = getAllWorks().slice();
  // 加权 + random 微扰，固定 seed 避免每次 build 都换
  const SEED_OFFSET_HASH = (slug: string) =>
    [...slug].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) / 0xffffffff;
  works.sort((a, b) => scoreWork(b) + SEED_OFFSET_HASH(b.slug) - (scoreWork(a) + SEED_OFFSET_HASH(a.slug)));
  return works.slice(0, n);
}

export function getPopularWorks(n = 12): Work[] {
  return getAllWorks()
    .slice()
    .sort((a, b) => b.productions.reduce((s, p) => s + p.parts.length, 0) - a.productions.reduce((s, p) => s + p.parts.length, 0))
    .slice(0, n);
}

export function getRecentWorks(n = 12): Work[] {
  return getAllWorks()
    .slice()
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, n);
}

export function getHeritageWorks(): Work[] {
  return getAllWorks().filter((w) => w.heritage);
}

/** 汇总：去重的所有演员，及其参演剧目。 */
export function getAllActors(): ActorRef[] {
  const map = new Map<string, ActorRef>();
  for (const w of getAllWorks()) {
    for (const p of w.productions) {
      for (const lead of p.leads) {
        const key = lead.trim();
        if (!key) continue;
        const entry = map.get(key) ?? { name: key, works: [] };
        entry.works.push({ slug: w.slug, title: w.title, production: p.slug, is_lead: true });
        map.set(key, entry);
      }
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "zh-Hans"));
}

export function getActor(name: string): ActorRef | undefined {
  return getAllActors().find((a) => a.name === name);
}

export function getAllTroupes(): TroupeRef[] {
  const map = new Map<string, TroupeRef>();
  for (const w of getAllWorks()) {
    for (const p of w.productions) {
      const t = p.troupe?.trim();
      if (!t) continue;
      const entry = map.get(t) ?? { name: t, works: [] };
      entry.works.push({ slug: w.slug, title: w.title, production: p.slug });
      map.set(t, entry);
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "zh-Hans"));
}

export function getTroupe(name: string): TroupeRef | undefined {
  return getAllTroupes().find((t) => t.name === name);
}

/** 拼音首字母分组（slug 第一个字符）。 */
export function groupByPinyinInitial(works: Work[]): Record<string, Work[]> {
  const out: Record<string, Work[]> = {};
  for (const w of works) {
    const letter = (w.slug[0] || "#").toUpperCase();
    (out[letter] ??= []).push(w);
  }
  return out;
}

function extractPlot(content: string): string {
  // 找 "## 剧情简介" 与下一个 H2 之间的第一段
  const m = content.match(/##\s*剧情简介\s*\n+([\s\S]*?)(?:\n##\s|$)/);
  if (!m) return "";
  const block = m[1].trim();
  // 取前 1-2 段，去除 blockquote / markdown 符号
  const paras = block.split(/\n\s*\n/).filter((p) => p.trim() && !p.startsWith(">"));
  return paras.slice(0, 2).join("\n\n").trim();
}
