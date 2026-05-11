import Link from "next/link";
import { getAllTroupes } from "@/lib/works";

export const metadata = { title: "剧团 · 闽剧档案" };

export default function TroupesPage() {
  const troupes = getAllTroupes();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <header className="mb-10 border-b border-[var(--color-border)] pb-4">
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--color-fg)]">剧团</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-2">
          共 <strong className="text-[var(--color-fg)]">{troupes.length}</strong> 个剧团
        </p>
      </header>

      {troupes.length === 0 ? (
        <p className="text-[var(--color-fg-muted)] italic">尚无剧团信息。</p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)]">
          {troupes.map((t) => (
            <li key={t.name}>
              <Link
                href={`/troupes/${encodeURIComponent(t.name)}`}
                className="flex items-baseline justify-between gap-2 py-4 hover:text-[var(--color-accent)]"
              >
                <span className="font-serif text-lg text-[var(--color-fg)]">{t.name}</span>
                <span className="text-sm text-[var(--color-fg-muted)]">{t.works.length} 部剧目</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
