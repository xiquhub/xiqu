import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Work, Production, ActorRef, TroupeRef } from "./types";

const WORKS_DIR = path.join(process.cwd(), "..", "..", "docs", "works");

// basePath 同步：与 next.config.ts 的 basePath 保持一致，
// 给以 / 开头的静态资源 URL（如 /covers/foo.jpg）加前缀。
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

function withBasePath(url: string | undefined): string | undefined {
  if (!url) return url;
  if (!BASE_PATH) return url;
  if (!url.startsWith("/") || url.startsWith("//")) return url; // 绝对/相对 URL 不动
  return BASE_PATH + url;
}

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
            file_en: pt?.file_en ? String(pt.file_en) : undefined,
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
      cover: withBasePath(data.cover ? String(data.cover) : undefined),
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

/**
 * 规范标签集 + 同义词。每个原始 plot_type 通过子串匹配挑出归类。
 * 例如 "宫廷历史剧" → ["宫廷", "历史"]；"爱情喜剧" → ["爱情", "喜剧"]。
 */
const CANONICAL_TAGS: Array<{ tag: string; matchers: string[] }> = [
  { tag: "公案", matchers: ["公案", "冤案", "侦案", "侦探"] },
  { tag: "家庭", matchers: ["家庭", "伦理", "家国", "继母", "家务"] },
  { tag: "历史", matchers: ["历史", "古装"] },
  { tag: "爱情", matchers: ["爱情", "婚恋", "才子佳人", "情仇", "传情"] },
  { tag: "才子佳人", matchers: ["才子佳人"] },
  { tag: "喜剧", matchers: ["喜剧", "滑稽", "诙谐"] },
  { tag: "讽刺", matchers: ["讽刺"] },
  { tag: "神怪", matchers: ["神怪", "神话", "鬼神", "怪诞"] },
  { tag: "武打", matchers: ["武打", "武戏", "武侠", "打斗"] },
  { tag: "侠义", matchers: ["侠义", "义侠"] },
  { tag: "宫廷", matchers: ["宫廷", "皇帝", "微服", "宫闱"] },
  { tag: "苦情", matchers: ["苦情", "悲剧", "悲情", "离合", "冤"] },
  { tag: "孝义", matchers: ["孝义", "孝子", "二十四孝", "孝顺"] },
  { tag: "民间故事", matchers: ["民间", "传说"] },
  { tag: "传奇", matchers: ["传奇"] },
  { tag: "道德教化", matchers: ["道德", "教化", "劝善", "报恩", "救良"] },
  { tag: "寻亲", matchers: ["寻亲", "认亲", "失散", "团圆"] },
  { tag: "折子", matchers: ["折子"] },
  { tag: "清官", matchers: ["清官", "官场"] },
  { tag: "忠义", matchers: ["忠义", "英雄"] },
];

const CANONICAL_TAG_NAMES = new Set(CANONICAL_TAGS.map((c) => c.tag));

/** 把 plot_type 原始值（可能复合）归一到 0-N 个规范标签。 */
export function splitTags(raw: string | undefined): string[] {
  if (!raw) return [];
  // 先按 / ／ 、 ， , 切；保留每段做子串匹配
  const pieces = raw
    .split(/[\/／、,，]+/u)
    .map((s) => s.trim())
    .filter(Boolean);

  const out = new Set<string>();
  for (const piece of pieces) {
    let matched = false;
    for (const { tag, matchers } of CANONICAL_TAGS) {
      if (matchers.some((m) => piece.includes(m))) {
        out.add(tag);
        matched = true;
      }
    }
    // 已是规范标签本身（不在 matchers 中但等于 tag）
    if (!matched && CANONICAL_TAG_NAMES.has(piece)) {
      out.add(piece);
    }
    // 其余（如"未知"、"婚恋"等）不进入标签，否则会满屏长尾
  }
  return [...out];
}

export function getWorkTags(w: Work): string[] {
  return splitTags(w.plot_type);
}

export type TagCount = { tag: string; count: number };

export function getAllTagCounts(): TagCount[] {
  const counts = new Map<string, number>();
  for (const w of getAllWorks()) {
    for (const t of getWorkTags(w)) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "zh-Hans"));
}

/**
 * 用户选中一组 tag 时的筛选：OR 语义——剧目只要有任一选中标签就保留。
 */
export function filterWorksByTags(works: Work[], selected: Set<string>): Work[] {
  if (selected.size === 0) return works;
  return works.filter((w) => getWorkTags(w).some((t) => selected.has(t)));
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
