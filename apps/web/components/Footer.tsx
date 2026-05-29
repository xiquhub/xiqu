import Link from "next/link";
import { FeedbackLink } from "./FeedbackWidget";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm text-[var(--color-fg-muted)]">
        <div>
          <div className="font-serif text-lg text-[var(--color-fg)]">闽剧档案 · xiquhub</div>
          <p className="mt-2 leading-relaxed">
            闽剧（福州地方戏曲）数字档案。
            剧目、演员、剧团、剧情资料收录。
          </p>
        </div>

        <div>
          <div className="text-[var(--color-fg)] font-semibold mb-3">浏览</div>
          <ul className="space-y-1.5">
            <li><Link href="/plays" className="hover:text-[var(--color-accent)]">全部剧目</Link></li>
            <li><Link href="/actors" className="hover:text-[var(--color-accent)]">演员索引</Link></li>
            <li><Link href="/troupes" className="hover:text-[var(--color-accent)]">剧团</Link></li>
            <li><Link href="/search" className="hover:text-[var(--color-accent)]">全文搜索</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-[var(--color-fg)] font-semibold mb-3">关于</div>
          <ul className="space-y-1.5">
            <li><Link href="/about" className="hover:text-[var(--color-accent)]">项目说明</Link></li>
            <li><FeedbackLink /></li>
          </ul>
          <p className="mt-4 text-xs text-[var(--color-fg-muted)]/80">
            内容来自民间整理，仅供学习研究。
            若涉及您的权益，请联系处理。
          </p>
        </div>
      </div>
    </footer>
  );
}
