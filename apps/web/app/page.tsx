import Link from "next/link";
import { PlayCard } from "@/components/PlayCard";
import { SearchBar } from "@/components/SearchBar";
import { CoverImage } from "@/components/CoverImage";
import {
  getAllWorks,
  getFeaturedWorks,
  getHeritageWorks,
  getPopularWorks,
  getRecentWorks,
} from "@/lib/works";

export default function Home() {
  const featured = getFeaturedWorks(12);
  const heritage = getHeritageWorks();
  const popular = getPopularWorks(8);
  const recent = getRecentWorks(8);
  const totals = {
    works: getAllWorks().length,
    productions: getAllWorks().reduce((s, w) => s + w.productions.length, 0),
    parts: getAllWorks().reduce((s, w) => s + w.productions.reduce((ss, p) => ss + p.parts.length, 0), 0),
  };

  return (
    <div>
      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24 grid lg:grid-cols-[1fr_auto] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-[var(--color-accent)] font-medium mb-4">
              <span className="w-8 h-px bg-[var(--color-accent)]" />
              福州地方戏曲 · 数字档案
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight text-[var(--color-fg)] mb-6">
              留下 <span className="text-[var(--color-accent)]">闽剧</span><br />
              的光影与唱腔
            </h1>
            <p className="text-lg text-[var(--color-fg-muted)] mb-8 max-w-xl leading-relaxed">
              收录 <strong className="text-[var(--color-fg)]">{totals.works}</strong> 部闽剧剧目、
              <strong className="text-[var(--color-fg)]">{totals.productions}</strong> 个录制版本、
              <strong className="text-[var(--color-fg)]">{totals.parts}</strong> 个分卷资料。
            </p>
            <SearchBar />
          </div>

          {heritage[0] && (
            <Link href={`/plays/${heritage[0].slug}`} className="hidden lg:block w-72 group">
              <div className="text-xs uppercase tracking-wider text-[var(--color-heritage)] mb-2 font-medium">★ 国家级非物质文化遗产</div>
              <CoverImage src={heritage[0].cover} title={heritage[0].title} size="lg"
                className="rounded shadow-md ring-1 ring-[var(--color-border)] group-hover:shadow-lg transition-shadow" />
              <h3 className="mt-3 font-serif text-lg group-hover:text-[var(--color-accent)]">{heritage[0].title}</h3>
              {heritage[0].plot_type && <p className="text-sm text-[var(--color-fg-muted)] mt-1">{heritage[0].plot_type}</p>}
            </Link>
          )}
        </div>
      </section>

      <Section title="精选推荐" subtitle="按加权打分挑选，含非遗剧目、多版本经典与剧情完整度"
               seeMore={{ href: "/plays", label: "全部剧目" }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-8">
          {featured.map((w) => <PlayCard key={w.slug} work={w} />)}
        </div>
      </Section>

      <Section title="热门版本" subtitle="按已收录视频版本数与分卷数量排序"
               seeMore={{ href: "/plays?sort=popular", label: "更多" }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-5 gap-y-8">
          {popular.map((w) => <PlayCard key={w.slug} work={w} />)}
        </div>
      </Section>

      <Section title="最近补全" subtitle="近期更新的剧目资料"
               seeMore={{ href: "/plays?sort=recent", label: "更多" }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-5 gap-y-8">
          {recent.map((w) => <PlayCard key={w.slug} work={w} />)}
        </div>
      </Section>

      <section className="border-t border-[var(--color-border)] mt-16">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="font-serif text-3xl mb-4">参与整理</h2>
          <p className="text-[var(--color-fg-muted)] mb-6 leading-relaxed">
            闽剧是福州珍贵的非物质文化遗产，许多剧目资料、演员信息仍待补全。
            如您熟悉某剧目、或持有老录像、节目单、剧本，欢迎参与建设。
          </p>
          <Link href="/about"
            className="inline-flex items-center gap-2 px-6 h-11 border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[#f5efe2] transition-colors rounded-md">
            了解项目
          </Link>
        </div>
      </section>
    </div>
  );
}

function Section({ title, subtitle, seeMore, children }: {
  title: string; subtitle?: string; seeMore?: { href: string; label: string }; children: React.ReactNode;
}) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-12 sm:py-14">
      <div className="flex items-end justify-between mb-8 border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[var(--color-fg)]">{title}</h2>
          {subtitle && <p className="text-sm text-[var(--color-fg-muted)] mt-1.5">{subtitle}</p>}
        </div>
        {seeMore && (
          <Link href={seeMore.href} className="text-sm text-[var(--color-accent)] hover:underline whitespace-nowrap shrink-0">
            {seeMore.label} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
