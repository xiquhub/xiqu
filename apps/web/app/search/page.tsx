import { SearchClient } from "@/components/SearchClient";
import { buildSearchDocs } from "@/lib/search-index";

export const metadata = { title: "搜索 · 闽剧档案" };

type Params = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Params) {
  const params = await searchParams;
  const docs = buildSearchDocs();

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <header className="mb-8 border-b border-[var(--color-border)] pb-4">
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--color-fg)]">搜索</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-2">
          全文索引：剧名、剧情、主演、剧团，共 {docs.length} 条
        </p>
      </header>
      <SearchClient docs={docs} initialQuery={params.q ?? ""} />
    </div>
  );
}
