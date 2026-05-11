export type WorkSource = {
  url: string;
  type: string;
  scope?: string;
  confidence?: string;
};

export type Production = {
  slug: string;
  label: string;
  troupe?: string;
  year?: number | null;
  media_type?: string;
  leads: string[];
  parts: PartFile[];
  confidence?: string;
};

export type PartFile = {
  file: string;
  label?: string;
  sort_order: number;
};

export type Work = {
  slug: string;
  title: string;
  title_alt: string[];
  genre: string;
  heritage: boolean;
  plot_type?: string;
  era_setting?: string;
  adapted_from?: string;
  needs_research: boolean;
  sources: WorkSource[];
  cover?: string;
  productions: Production[];
  /** Markdown body without frontmatter */
  body: string;
  /** Extracted plot summary (first paragraph after `## 剧情简介`) */
  plot_summary: string;
  /** mtime in ms for sorting "最近" */
  mtime: number;
};

export type ActorRef = { name: string; works: { slug: string; title: string; production: string; is_lead: boolean }[] };
export type TroupeRef = { name: string; works: { slug: string; title: string; production: string }[] };
