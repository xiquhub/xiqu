import { Suspense } from "react";
import { PlaysListClient } from "@/components/PlaysListClient";
import { getAllTagCounts, getAllWorks } from "@/lib/works";

export const metadata = {
  title: "全部剧目 · 闽剧档案",
  description: "闽剧档案站收录的全部剧目目录",
};

export default function PlaysPage() {
  const works = getAllWorks();
  const allTags = getAllTagCounts();
  const heritageCount = works.filter((w) => w.heritage).length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 sm:py-12">
      <Suspense fallback={<div className="text-[var(--color-fg-muted)]">加载中…</div>}>
        <PlaysListClient
          works={works}
          allTags={allTags}
          heritageCount={heritageCount}
          totalCount={works.length}
        />
      </Suspense>
    </div>
  );
}
