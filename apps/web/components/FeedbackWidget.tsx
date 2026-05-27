"use client";
import { useEffect, useState } from "react";

// Web3Forms access key（公开 key，只能向你注册时绑定的邮箱发信）。
// 获取：https://web3forms.com → 填 xiquhub@gmail.com → 邮件里拿 access key →
// 写到 apps/web/.env.local： NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY=你的key
const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY ?? "";

/** 任意位置可用的"打开反馈"文字链接（派发全局事件）。 */
export function FeedbackLink({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("open-feedback"))}
      className={"hover:text-[var(--color-accent)] " + className}
    >
      提交资料 / 反馈
    </button>
  );
}

type Status = "idle" | "submitting" | "success" | "error";

const FEEDBACK_TYPES = ["资料补充", "勘误纠错", "功能建议", "其他"] as const;

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [type, setType] = useState<string>(FEEDBACK_TYPES[0]);

  // 监听全局事件，让 Footer 等任意位置都能打开
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-feedback", handler);
    return () => window.removeEventListener("open-feedback", handler);
  }, []);

  // ESC 关闭 + 锁滚动
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    // 蜜罐：机器人会填这个隐藏字段
    if (fd.get("botcheck")) return;

    if (!ACCESS_KEY) {
      setStatus("error");
      setErrorMsg("反馈功能尚未配置（缺少 Web3Forms key）。可直接邮件 xiquhub@gmail.com。");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: `闽剧档案反馈 · ${type}`,
          from_name: "闽剧档案站",
          类型: type,
          相关剧目: fd.get("play") || "（未填）",
          留言: fd.get("message"),
          联系方式: fd.get("contact") || "（未留）",
          botcheck: "",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
        setErrorMsg(data.message || "提交失败，请稍后重试或直接邮件 xiquhub@gmail.com。");
      }
    } catch {
      setStatus("error");
      setErrorMsg("网络错误，请稍后重试或直接邮件 xiquhub@gmail.com。");
    }
  }

  return (
    <>
      {/* 浮动按钮 */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 h-11 px-4 rounded-full bg-[var(--color-accent)] text-[#f5efe2] shadow-lg hover:opacity-90 transition-opacity text-sm"
        aria-label="提交反馈"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        反馈
      </button>

      {!open ? null : (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-6"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full sm:max-w-lg bg-[var(--color-bg)] border border-[var(--color-border)] rounded-t-2xl sm:rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-bg)]">
              <h2 className="font-serif text-xl text-[var(--color-fg)]">提交反馈 / 资料</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 grid place-items-center rounded-md text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)]"
                aria-label="关闭"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {status === "success" ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto w-14 h-14 mb-4 grid place-items-center rounded-full bg-[var(--color-surface)] text-[var(--color-accent)]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <div className="font-serif text-lg text-[var(--color-fg)] mb-1">已收到，谢谢！</div>
                <p className="text-sm text-[var(--color-fg-muted)]">
                  您的反馈已发送到 xiquhub@gmail.com，我们会尽快处理。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("idle");
                    setOpen(false);
                  }}
                  className="mt-6 px-5 h-10 rounded-md border border-[var(--color-border)] text-[var(--color-fg)] hover:bg-[var(--color-surface)]"
                >
                  完成
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
                {/* 类型 */}
                <div>
                  <label className="block text-sm text-[var(--color-fg-muted)] mb-1.5">反馈类型</label>
                  <div className="flex flex-wrap gap-2">
                    {FEEDBACK_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={
                          "px-3 h-8 rounded-full border text-sm " +
                          (type === t
                            ? "bg-[var(--color-accent)] text-[#f5efe2] border-[var(--color-accent)]"
                            : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)]")
                        }
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 相关剧目 */}
                <div>
                  <label htmlFor="fb-play" className="block text-sm text-[var(--color-fg-muted)] mb-1.5">
                    相关剧目 <span className="text-[var(--color-fg-muted)]/60">（可选）</span>
                  </label>
                  <input
                    id="fb-play"
                    name="play"
                    type="text"
                    placeholder="如《六月雪》"
                    className="w-full h-10 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                </div>

                {/* 留言 */}
                <div>
                  <label htmlFor="fb-message" className="block text-sm text-[var(--color-fg-muted)] mb-1.5">
                    留言 <span className="text-[var(--color-accent)]">*</span>
                  </label>
                  <textarea
                    id="fb-message"
                    name="message"
                    required
                    rows={5}
                    placeholder="补充剧情、演员、剧团、年代信息，或指出错误、提建议…"
                    className="w-full px-3 py-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-y"
                  />
                </div>

                {/* 联系方式 */}
                <div>
                  <label htmlFor="fb-contact" className="block text-sm text-[var(--color-fg-muted)] mb-1.5">
                    联系方式 <span className="text-[var(--color-fg-muted)]/60">（可选，方便回复）</span>
                  </label>
                  <input
                    id="fb-contact"
                    name="contact"
                    type="text"
                    placeholder="邮箱 / 微信 / 其他"
                    className="w-full h-10 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                </div>

                {/* 蜜罐（隐藏） */}
                <input
                  type="checkbox"
                  name="botcheck"
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ display: "none" }}
                  aria-hidden
                />

                {status === "error" && (
                  <p className="text-sm text-[var(--color-accent)]">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full h-11 rounded-md bg-[var(--color-accent)] text-[#f5efe2] font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {status === "submitting" ? "提交中…" : "发送"}
                </button>

                <p className="text-xs text-[var(--color-fg-muted)] text-center">
                  也可直接邮件 <a href="mailto:xiquhub@gmail.com" className="text-[var(--color-link)] hover:underline">xiquhub@gmail.com</a>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
