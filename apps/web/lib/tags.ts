/**
 * 标签归一化逻辑（client/server 共用，纯函数无 node 依赖）。
 */

const CANONICAL_TAGS: Array<{ tag: string; matchers: string[] }> = [
  { tag: "公案", matchers: ["公案", "冤案", "侦案", "侦探"] },
  { tag: "家庭", matchers: ["家庭", "伦理", "家国", "继母", "家务"] },
  { tag: "历史", matchers: ["历史", "古装"] },
  { tag: "爱情", matchers: ["爱情", "婚恋", "才子佳人", "情仇", "传情"] },
  { tag: "才子佳人", matchers: ["才子佳人"] },
  { tag: "喜剧", matchers: ["喜剧", "滑稽", "诙谐"] },
  { tag: "讽刺", matchers: ["讽刺"] },
  { tag: "神怪", matchers: ["神怪", "神话", "鬼神", "怪诞"] },
  { tag: "武打", matchers: ["武打", "武戏", "武侠", "打斗"] },
  { tag: "侠义", matchers: ["侠义", "义侠"] },
  { tag: "宫廷", matchers: ["宫廷", "皇帝", "微服", "宫闱"] },
  { tag: "苦情", matchers: ["苦情", "悲剧", "悲情", "离合", "冤"] },
  { tag: "孝义", matchers: ["孝义", "孝子", "二十四孝", "孝顺"] },
  { tag: "民间故事", matchers: ["民间", "传说"] },
  { tag: "传奇", matchers: ["传奇"] },
  { tag: "道德教化", matchers: ["道德", "教化", "劝善", "报恩", "救良"] },
  { tag: "寻亲", matchers: ["寻亲", "认亲", "失散", "团圆"] },
  { tag: "折子", matchers: ["折子"] },
  { tag: "清官", matchers: ["清官", "官场"] },
  { tag: "忠义", matchers: ["忠义", "英雄"] },
];

const CANONICAL_TAG_NAMES = new Set(CANONICAL_TAGS.map((c) => c.tag));

export function splitTags(raw: string | undefined): string[] {
  if (!raw) return [];
  const pieces = raw.split(/[\/／、,，]+/u).map((s) => s.trim()).filter(Boolean);
  const out = new Set<string>();
  for (const piece of pieces) {
    let matched = false;
    for (const { tag, matchers } of CANONICAL_TAGS) {
      if (matchers.some((m) => piece.includes(m))) {
        out.add(tag);
        matched = true;
      }
    }
    if (!matched && CANONICAL_TAG_NAMES.has(piece)) {
      out.add(piece);
    }
  }
  return [...out];
}
