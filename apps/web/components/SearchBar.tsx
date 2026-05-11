"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBar({ placeholder = "搜索剧目、演员、剧团…", autoFocus = false }: { placeholder?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-2xl items-center gap-2">
      <div className="flex-1 relative">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full h-12 pl-12 pr-4 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] placeholder-[var(--color-fg-muted)]/70 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-shadow"
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)]"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <button
        type="submit"
        className="h-12 px-5 rounded-md bg-[var(--color-accent)] text-[#f5efe2] font-medium hover:opacity-90 transition-opacity"
      >
        搜索
      </button>
    </form>
  );
}
