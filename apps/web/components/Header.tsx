import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/plays", label: "剧目" },
  { href: "/actors", label: "演员" },
  { href: "/troupes", label: "剧团" },
  { href: "/about", label: "关于" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-[var(--color-bg)]/85 backdrop-blur border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 font-serif text-xl text-[var(--color-fg)] hover:text-[var(--color-accent)]">
          <span className="inline-block w-7 h-7 bg-[var(--color-accent)] text-[#f5efe2] rounded-sm grid place-items-center text-xs font-bold tracking-tighter">
            闽
          </span>
          <span className="hidden sm:inline">闽剧档案 · xiquhub</span>
          <span className="sm:hidden">闽剧档案</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-[15px]">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-[var(--color-fg-muted)] hover:text-[var(--color-accent)]"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-[var(--color-border)] text-sm text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)]"
            aria-label="搜索"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span className="hidden sm:inline">搜索</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden flex items-center gap-5 px-6 pb-3 text-sm overflow-x-auto">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] whitespace-nowrap">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
