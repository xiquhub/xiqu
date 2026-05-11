import Link from "next/link";
import { getAllActors } from "@/lib/works";

export const metadata = { title: "演员索引 · 闽剧档案" };

export default function ActorsPage() {
  const actors = getAllActors();

  // 按拼音首字母分组（简单按名字首字符分组）
  const groups: Record<string, typeof actors> = {};
  for (const a of actors) {
    const k = a.name[0] || "#";
    (groups[k] ??= []).push(a);
  }
  const keys = Object.keys(groups).sort((a, b) => a.localeCompare(b, "zh-Hans"));

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <header className="mb-10 border-b border-[var(--color-border)] pb-4">
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--color-fg)]">演员索引</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-2">
          共 <strong className="text-[var(--color-fg)]">{actors.length}</strong> 位演员（来自文件名解析）
        </p>
      </header>

      {actors.length === 0 ? (
        <p className="text-[var(--color-fg-muted)] italic">尚无演员信息。</p>
      ) : (
        <div className="space-y-8">
          {keys.map((k) => (
            <section key={k}>
              <h2 className="font-serif text-xl text-[var(--color-accent)] border-b border-[var(--color-border)] pb-1.5 mb-3">{k}</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                {groups[k].map((a) => (
                  <li key={a.name}>
                    <Link
                      href={`/actors/${encodeURIComponent(a.name)}`}
                      className="flex items-baseline justify-between gap-2 py-1 hover:text-[var(--color-accent)]"
                    >
                      <span className="text-[var(--color-fg)]">{a.name}</span>
                      <span className="text-xs text-[var(--color-fg-muted)]">{a.works.length} 部</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
