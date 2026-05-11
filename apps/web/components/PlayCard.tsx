import Link from "next/link";
import { CoverImage } from "./CoverImage";
import type { Work } from "@/lib/types";

export function PlayCard({ work, variant = "default" }: { work: Work; variant?: "default" | "featured" }) {
  return (
    <Link
      href={`/plays/${work.slug}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-md"
    >
      <CoverImage
        src={work.cover}
        title={work.title}
        size={variant === "featured" ? "lg" : "md"}
        className="rounded-md shadow-sm group-hover:shadow-md transition-shadow ring-1 ring-[var(--color-border)]"
      />
      <div className="mt-2.5 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-base text-[var(--color-fg)] group-hover:text-[var(--color-accent)] line-clamp-1">
            {work.title}
          </h3>
          {work.heritage && (
            <span className="heritage-stamp" title="国家级非物质文化遗产代表性项目">
              非遗
            </span>
          )}
        </div>
        <div className="text-xs text-[var(--color-fg-muted)] flex items-center gap-2 line-clamp-1">
          {work.plot_type && <span>{work.plot_type}</span>}
          {work.plot_type && work.era_setting && <span aria-hidden>·</span>}
          {work.era_setting && <span>{work.era_setting}</span>}
          {work.productions.length > 1 && (
            <>
              <span aria-hidden>·</span>
              <span>{work.productions.length} 版本</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
