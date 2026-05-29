import Link from "next/link";
import { getAllWorks } from "@/lib/works";

export const metadata = { title: "关于 · 闽剧档案" };

export default function AboutPage() {
  const works = getAllWorks();
  const totals = {
    works: works.length,
    heritage: works.filter((w) => w.heritage).length,
    needsResearch: works.filter((w) => w.needs_research).length,
    productions: works.reduce((s, w) => s + w.productions.length, 0),
    parts: works.reduce((s, w) => s + w.productions.reduce((ss, p) => ss + p.parts.length, 0), 0),
  };

  return (
    <article className="max-w-3xl mx-auto px-6 py-16 prose-cn">
      <header className="mb-12 border-b border-[var(--color-border)] pb-6">
        <h1 className="font-serif text-4xl sm:text-5xl text-[var(--color-fg)]">关于本站</h1>
      </header>

      <section className="mb-10 leading-relaxed text-[var(--color-fg)]">
        <p>
          <strong>闽剧档案</strong>专注于福州地方戏曲<strong>闽剧</strong>的剧目资料整理与保存。
        </p>
        <p>
          闽剧是福建省主要的地方戏曲剧种，国家级非物质文化遗产代表性项目。
          但在网络上，关于闽剧的完整资料站、可检索的剧目库几乎不存在。
          百度、谷歌检索结果碎片化，许多优秀传统剧目无文字介绍可查。
        </p>
        <p>
          本站把分散的剧目元信息（剧情、源流、演员、剧团、年代）
          整理成可索引、可浏览的形式，作为戏迷、研究者和后人的起点。
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-2xl mb-4">当前状态</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4 not-prose">
          <Stat label="剧目总数" value={totals.works} />
          <Stat label="国家级非遗" value={totals.heritage} />
          <Stat label="录制版本" value={totals.productions} />
          <Stat label="分卷文件" value={totals.parts} />
          <Stat label="资料待补全" value={totals.needsResearch} />
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-2xl mb-4">数据来源</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>视频文件名解析（剧团、主演、年份）</li>
          <li>百度百科、维基百科、闽剧网、B 站视频简介</li>
          <li>福州新闻网、福建省政府文化栏目、地方志</li>
          <li>戏迷、研究者通过站内反馈持续补全</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-2xl mb-4">版权立场</h2>
        <p>
          本站收录的剧目元信息（剧情、人物、源流）属公共领域的戏曲文化知识，
          均经原创整理或来源标注；封面图来自公开网络搜索，仅作 placeholder 用。
        </p>
        <p>
          视频文件本身<strong>不在本站托管</strong>。
          如您是相关录像版权方，希望调整任何条目的展示方式，请联系处理，
          24 小时内响应。
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-2xl mb-4">参与建设</h2>
        <p>
          欢迎通过 issue 或邮件提交：
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>剧情简介、唱段亮点、唱词</li>
          <li>剧目年代、剧团、演员、首演记录</li>
          <li>勘误、异名合并建议</li>
          <li>非遗、文献相关的额外资料</li>
        </ul>
      </section>

      <section className="text-sm text-[var(--color-fg-muted)] border-t border-[var(--color-border)] pt-6 not-prose">
        <p>
          <Link href="/" className="text-[var(--color-accent)] hover:underline">← 回首页</Link>
        </p>
      </section>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <li className="p-4 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)]">
      <div className="text-2xl font-serif text-[var(--color-fg)]">{value}</div>
      <div className="text-xs text-[var(--color-fg-muted)] mt-1">{label}</div>
    </li>
  );
}
