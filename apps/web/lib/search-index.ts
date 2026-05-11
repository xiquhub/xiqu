import { getAllActors, getAllTroupes, getAllWorks } from "./works";

export type SearchDoc = {
  id: string;       // "work:slug" / "actor:name" / "troupe:name"
  kind: "work" | "actor" | "troupe";
  title: string;
  slug: string;     // 用于跳转
  subtitle?: string;
  body: string;     // 全文索引字段
  url: string;
  heritage?: boolean;
};

/** Build-time 生成可序列化的 JSON 索引（轻量）。 */
export function buildSearchDocs(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const w of getAllWorks()) {
    docs.push({
      id: `work:${w.slug}`,
      kind: "work",
      title: w.title,
      slug: w.slug,
      subtitle: [w.plot_type, w.era_setting].filter(Boolean).join(" · "),
      body: [
        w.title,
        w.title_alt.join(" "),
        w.adapted_from ?? "",
        w.plot_summary,
        w.productions.map((p) => `${p.troupe ?? ""} ${p.leads.join(" ")}`).join(" "),
      ].join(" "),
      url: `/plays/${w.slug}`,
      heritage: w.heritage,
    });
  }

  for (const a of getAllActors()) {
    docs.push({
      id: `actor:${a.name}`,
      kind: "actor",
      title: a.name,
      slug: a.name,
      subtitle: `演员 · ${a.works.length} 部作品`,
      body: `${a.name} ${a.works.map((w) => w.title).join(" ")}`,
      url: `/actors/${encodeURIComponent(a.name)}`,
    });
  }

  for (const t of getAllTroupes()) {
    docs.push({
      id: `troupe:${t.name}`,
      kind: "troupe",
      title: t.name,
      slug: t.name,
      subtitle: `剧团 · ${t.works.length} 部剧目`,
      body: `${t.name} ${t.works.map((w) => w.title).join(" ")}`,
      url: `/troupes/${encodeURIComponent(t.name)}`,
    });
  }

  return docs;
}
