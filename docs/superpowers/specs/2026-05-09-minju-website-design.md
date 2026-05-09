# 闽剧文化档案站 · V1 设计文档

> **创建日期**：2026-05-09
> **状态**：设计完成，待用户 review
> **下一步**：转入 implementation plan（writing-plans skill）

---

## 1. 项目概述

### 1.1 目标

搭建一个公开访问的闽剧资料站，覆盖剧目、版本、演员、剧团、剧情简介等元信息，作为闽剧文化数字化保存的民间档案。

### 1.2 背景与动机

- 国内外公开网络上**没有完整可索引的闽剧资料站**，百度/谷歌检索结果碎片、缺失严重
- 现有视频材料多为 480p 老录像，质量参差
- 持有 514 个 .flv 视频文件，约 200 部独立剧目（含多版本/多分集）
- 闽剧作为福建地方戏曲，部分剧目（如《贻顺哥烛蒂》）属于国家级非物质文化遗产，存在数字化保存的真实公益需求

### 1.3 V1 范围

**包含：**

- 约 200 部闽剧的剧目页（剧情、源流、年代、行当、改编自）
- 版本/录制档案（剧团、主演、年份、媒介类型）
- 演员档案页（名下作品列表、艺术活动期）
- 剧团档案页（沿革、代表剧目）
- 全文搜索（剧目名、剧情、演员、剧团）
- SEO 优化（sitemap、JSON-LD、OG tags）
- 完整本地开发环境（Go + SQLite + Next.js）

**显式不包含：**

- 视频播放、FLV 转码、AI 修复（v2+）
- 用户系统、登录、评论、收藏
- 广告、赞助按钮、变现 UI
- Cloudflare 部署（v1 完成后单独实施）
- 实时爬虫服务（管线为一次性脚本）

### 1.4 后续路线（仅供参考，不在本 spec 范围）

- **V2**：FLV → HLS 转码、视频播放器、视频页 SEO 策略调整
- **V3**：AI 视频修复（招牌剧目优先）
- **V4+**：可能的官方合作（接洽福建省实验闽剧院、福州闽剧院寻求授权）

---

## 2. 战略定位

### 2.1 立场

- **公开访问**，无注册门槛
- **完全非营利**：无广告、无赞助按钮、无任何变现 UI
- **完全开放 SEO**：没有商业目的，搜索引擎索引等同公益传播
- **域名**：`xiquhub.com`（已注册）
- **托管**：境外服务器（V2 阶段计划 Cloudflare Pages + R2；V1 仅本地运行）
- **预期生命周期**：5-10 年

### 2.2 风险与缓解

| 风险 | 描述 | 缓解 |
|---|---|---|
| 录像版权 | 闽剧老录像多为 1980s-2010s 制作，**录像制作者权 50 年保护期内** | V1 不内嵌视频；视频问题在 V2 单独评估 |
| 操作者刑事追责 | 参考字幕组案，境外托管不能保护操作者 | **完全去商业化**消除"以营利为目的"定罪要件；低调运营降低被关注概率 |
| 平台 ToS | Cloudflare 免费 CDN 不允许主要用于视频流 | V1 无视频；V2 视频从 R2 直出（R2 不受 CDN 流媒体限制） |

### 2.3 这个站不做的事

- 不放广告
- 不开赞助/捐赠按钮
- 不做用户登录/注册/评论
- 不主动在社交平台推广（被自然搜到 OK，主动博取流量不做）
- 不与 mainland CN 商业机构合作变现

---

## 3. 技术架构

### 3.1 仓库结构（monorepo）

```
xiqu/
├─ apps/
│  ├─ web/                # Next.js 15（App Router）前端
│  └─ server/             # Go HTTP API 服务（本地）
├─ pipelines/             # Go CLI 工具（一次性内容补完）
│  ├─ ingest/             # 514 文件名 → 去重 → plays.jsonl
│  ├─ crawl/              # 多源元数据爬取
│  ├─ synthesize/         # LLM（Claude API）综合 → draft.md
│  └─ import/             # draft.md → SQLite
├─ content/
│  └─ plays/{slug}/
│      ├─ draft.md        # 仅 v1 内容补完阶段存在；import 后归档
│      ├─ cover.jpg       # 封面图（永久）
│      └─ posters/        # 剧照（永久）
├─ db/
│  ├─ schema.sql          # DDL（git 追踪）
│  ├─ migrations/         # 演进迁移（git 追踪）
│  ├─ snapshots/
│  │   └─ latest.sql      # sqlite3 .dump 输出（git 追踪）
│  └─ xiqu.db             # 真源（gitignore）
├─ shared/
│  └─ openapi.yaml        # API 契约（前端、Go 服务、未来 Workers 共用）
├─ storage/               # 视频/媒体文件目录（gitignore，v1 留空）
├─ docs/
│  └─ superpowers/specs/  # 设计文档
├─ Makefile               # backup / snapshot / restore / dev 等
├─ go.work                # Go workspaces（apps/server + pipelines）
├─ package.json           # pnpm workspace root
├─ pnpm-workspace.yaml
└─ .gitignore
```

### 3.2 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 前端框架 | **Next.js 15（App Router）** | 用户指定；SSG/ISR 友好；React 生态最大 |
| 样式 | Tailwind CSS + shadcn/ui | a11y 默认，SEO 友好的语义标签 |
| 后端（本地） | **Go 1.22+** + chi router + modernc.org/sqlite（pure-Go，无 CGO） | 用户指定；单二进制；本地开发零依赖 |
| 数据库 | SQLite（FTS5 启用） | 单文件备份；迁移 D1 零摩擦；FTS5 满足搜索 |
| API 契约 | OpenAPI 3.0 | Go 实现 + 未来 Workers 重写共用 |
| LLM | Anthropic Claude API（Sonnet 4.6 默认；复杂综合用 Opus 4.7） | 模糊去重、多源综合、内容生成 |
| 类型生成 | `oapi-codegen`（Go）+ `openapi-typescript`（前端） | 单源真理 OpenAPI → 双端类型 |
| 包管理 | Go modules + pnpm workspaces | 标准 |
| 测试 | Go 内置 testing；Vitest + Playwright（前端） | 标准 |

### 3.3 同步策略：本地 ↔ Cloudflare（V2 部署）

**核心原则**：OpenAPI 是接口边界。Go 是 V1 实现，Workers + D1 是 V2 部署目标。**V2 用 TypeScript 重写后端，前端不动**。

**重写成本估算**：

- Go 服务端代码量：约 2000-3000 行
- TS Workers 重写代码量：约 1500-2500 行
- 估计耗时：3-7 天纯重写（不含测试），契约不变 + 前端零改

**为什么不直接 TS 一份代码两端跑？** 用户偏好 Go 后端开发体验，接受 V2 重写成本。

---

## 4. 数据模型

### 4.1 三层模型：作品 → 录制 → 分卷

```
works（剧目，抽象作品）
  ├─ slug、title、剧情、行当、年代、改编自...
  ↓ 1:N
productions（录制版本）
  ├─ id、所属 work、剧团、年份、媒介类型（录音/录像/电影）...
  ↓ 1:N
parts（分卷/分集）
  └─ id、所属 production、文件名、上中下/1-N、时长

actors（演员）─┐
              ├─ M:N production_actors（含 role 角色字段）
troupes（剧团）─┘
```

**为什么三层**：闽剧本质是表演艺术，同一剧目（如《六月雪》）会有多次不同剧团/演员/年代的演出录制；每次录制可能被切成多集物理文件。三层结构忠于现实，便于"对比观看"、演员归属准确。单版本剧前端 UX 自动折叠为两层（URL 直接到 production 页）。

### 4.2 核心 Schema（SQLite DDL 摘要）

```sql
-- 作品（剧目）
CREATE TABLE works (
  slug          TEXT PRIMARY KEY,         -- e.g. "liu-yue-xue"
  title         TEXT NOT NULL,            -- 六月雪
  title_alt     TEXT,                     -- JSON array of 异名
  genre         TEXT NOT NULL DEFAULT '闽剧',
  heritage      TEXT,                     -- 非遗项目编号或 NULL
  plot_type     TEXT,                     -- 公案/家庭/才子佳人/历史/神怪
  era_setting   TEXT,                     -- 故事所处朝代
  adapted_from  TEXT,                     -- 改编自
  plot_summary  TEXT,                     -- markdown 长文
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

-- 版本/录制
CREATE TABLE productions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  work_slug     TEXT NOT NULL REFERENCES works(slug) ON DELETE CASCADE,
  slug          TEXT NOT NULL,            -- 在所属 work 下唯一，e.g. "1985-recording"
  label         TEXT NOT NULL,            -- "1985 黄愿亭录音版"
  troupe_id     INTEGER REFERENCES troupes(id),
  year          INTEGER,                  -- 1985；不详为 NULL
  media_type    TEXT,                     -- 录音/录像/电影
  notes         TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  UNIQUE(work_slug, slug)
);

-- 分卷
CREATE TABLE parts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  production_id   INTEGER NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,          -- 002-福建地方戏曲闽剧《六月雪》全剧 1985年录音 黄愿亭 林锦芳.flv
  label           TEXT,                   -- "上"、"中"、"下"、"1"、"全剧"
  sort_order      INTEGER NOT NULL DEFAULT 0,
  duration_sec    INTEGER                 -- 时长，如知道
);

-- 演员
CREATE TABLE actors (
  slug          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  hangdang      TEXT,                     -- 行当（生/旦/净/丑/...）
  bio           TEXT,                     -- markdown
  active_period TEXT,                     -- "1960s-1990s" 之类
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

-- 剧团
CREATE TABLE troupes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,     -- "fujian-experimental-minju-troupe"
  name          TEXT NOT NULL,            -- 福建省实验闽剧院
  founded_year  INTEGER,
  city          TEXT,
  bio           TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

-- 演员-录制 多对多（含角色）
CREATE TABLE production_actors (
  production_id INTEGER NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  actor_slug    TEXT    NOT NULL REFERENCES actors(slug) ON DELETE CASCADE,
  role          TEXT,                     -- 饰演的角色（如"窦娥"）
  is_lead       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (production_id, actor_slug)
);

-- 数据来源/置信度（用于内容补完阶段追溯）
CREATE TABLE field_sources (
  entity_type   TEXT NOT NULL,            -- works/productions/actors/troupes
  entity_key    TEXT NOT NULL,            -- slug or composite
  field         TEXT NOT NULL,            -- 字段名
  source        TEXT NOT NULL,            -- baidu_baike/minju_net/filename/manual/llm
  source_url    TEXT,
  confidence    TEXT NOT NULL,            -- high/medium/low
  recorded_at   INTEGER NOT NULL,
  PRIMARY KEY (entity_type, entity_key, field)
);

-- FTS5 搜索表（衍生，由触发器维护）
CREATE VIRTUAL TABLE works_fts USING fts5(
  slug UNINDEXED,
  title,
  title_alt,
  plot_summary,
  tokenize = 'unicode61 remove_diacritics 2'
);
-- + INSERT/UPDATE/DELETE 触发器维护 works_fts
```

完整 DDL 与触发器在 `db/schema.sql`（实施阶段产出）。

### 4.3 Source of Truth 与 Git 策略

- **真源**：`db/xiqu.db`（gitignore 不进 git）
- **可 diff 的快照**：`db/snapshots/latest.sql`（`sqlite3 .dump` 文本输出，git 追踪）
- **草稿区**（仅 V1 内容补完阶段存在）：`content/plays/{slug}/draft.md`，import 后归档至 `content/plays/{slug}/imported.md`（保留以便溯源）

**为什么不直接提交 .db**：二进制不可 diff，PR review 不友好；snapshot 文本可以看到行级变化。

### 4.4 备份与迁移

`Makefile` 提供：

```
make snapshot    # sqlite3 xiqu.db ".dump" > db/snapshots/latest.sql
make backup      # cp xiqu.db db/backups/xiqu-{timestamp}.db
make restore     # 从 latest.sql 重建 xiqu.db
```

**V2 迁移到 D1**：

```
wrangler d1 create xiqu
wrangler d1 execute xiqu --file=db/snapshots/latest.sql
```

零数据转换。

---

## 5. API 契约

### 5.1 OpenAPI Spec

位置：`shared/openapi.yaml`

类型生成：

- Go 服务端：`oapi-codegen` 生成 server stub + DTO
- Next.js 前端：`openapi-typescript` 生成 TS 类型

### 5.2 Endpoints（V1）

```
GET  /api/plays                                # 列表（query: page, sort, hangdang, troupe, era）
GET  /api/plays/:work-slug                     # 剧目详情 + productions[] 摘要
GET  /api/plays/:work-slug/:production-slug    # 版本详情 + parts[] + 主演[]

GET  /api/actors                               # 演员列表
GET  /api/actors/:slug                         # 演员详情 + 名下 productions[]

GET  /api/troupes                              # 剧团列表
GET  /api/troupes/:slug                        # 剧团详情 + 代表 works[]

GET  /api/search?q=                            # FTS5 搜索（works/actors/troupes 联合）

GET  /api/healthz                              # 健康检查
```

### 5.3 错误响应规约

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Play not found: liu-yue-xue",
    "details": null
  }
}
```

错误码：`NOT_FOUND`、`INVALID_PARAM`、`INTERNAL`。

### 5.4 CORS

- 本地：允许 `http://localhost:3000`
- 生产（V2 时再敲定）：允许 production domain + preview domains

### 5.5 缓存

- V1 在 Go 端不做 cache；前端 Next.js 走 SSG，自带静态缓存
- 搜索响应加 `Cache-Control: public, max-age=300`

---

## 6. 元数据管线

### 6.1 阶段总览

```
514 个 .flv 文件名
  ↓  Stage 1: Ingest（Go + LLM 模糊聚类）
plays.jsonl（约 200 条 work，含 productions[]、parts[]）
  ↓  Stage 2: Crawl（Go HTTP，多源并发，缓存）
raw/{slug}/{source}.json（百度百科、闽剧网、B 站搜索结果...）
  ↓  Stage 3: Synthesize（Claude API 综合）
content/plays/{slug}/draft.md（含 frontmatter + 长文）
  ↓  Stage 4: 人工 Review（编辑 draft.md，重点修正 needs_review 字段）
content/plays/{slug}/draft.md（已 review）
  ↓  Stage 5: Import（Go）
db/xiqu.db + content/plays/{slug}/imported.md（draft 归档）
```

### 6.2 Stage 1 — Ingest（文件名解析与去重）

**输入**：514 个文件名（已知列表）

**输出**：`plays.jsonl`，每行一条 work，含：
- 候选 slug（基于规范化的拼音）
- title（清理后）
- title_alt[]（识别到的异名）
- productions[]（每个 production 含 parts[]）
- 提取自文件名的 leads/troupe/year/notes

**实现要点**：
1. 规则提取：先用正则抽出 `《剧名》`、集数标记（`1/2/3`、`上/中/下`、`A/B/C`、`01/02/...`）、年份、剧团关键词、主演（按"剧团 主演 主演"格式）
2. 模糊聚类：对剧名做归一化（去标点、《》、空格、繁简、异体字），然后用 LLM 二次确认聚类（处理 OCR 错误如`壮元/状元`、`贻春/贻顺`、`菱花/凌花`、`兄弟俩/兄弟两`）
3. Production 检测：同一 work 内若有多个明显不同的 production（比如"1985 录音版"和"3 集现代版"），创建独立 production 条目
4. 输出每条 work + productions 的初稿，并附 `low_confidence_clusters` 供人工抽查

**LLM 用法**：批量发送 100 个候选项让 Claude 判定哪些是同一剧目的 OCR 变体 / 不同版本 / 真正不同剧目。Prompt 设计要给出明确判定标准、要求结构化输出（JSON）。

### 6.3 Stage 2 — Crawl（多源元数据抓取）

**数据源优先级**：

1. **百度百科**（主力，覆盖率最高）
2. **闽剧网 / 戏剧网 / 戏缘**（专业度高但覆盖不全）
3. **维基百科中文**（极少数有）
4. **B 站视频简介**（戏迷一手信息，杂但有用）
5. **中国非物质文化遗产网**（仅非遗剧目）

**实现要点**：
- Go HTTP client，速率限制（1-2 req/sec），UA 真实化
- 全部响应缓存到 `raw/{slug}/{source}.{json|html}`，便于失败重试和合规审计
- 失败/缺失字段标记 `null`，不报错中断

**反爬应对**：
- 百度百科直接 GET 一般可，遇到 cookie wall 用 headless（playwright）兜底
- 不爬豆瓣（覆盖率低，性价比差）

### 6.4 Stage 3 — Synthesize（LLM 综合）

**输入**：`plays.jsonl` 一条 + 该 slug 下所有 raw/* 数据

**输出**：`content/plays/{slug}/draft.md`，结构：

```markdown
---
slug: liu-yue-xue
title: 六月雪
title_alt: []
genre: 闽剧
heritage: null
plot_type: 公案
era_setting: 元代
adapted_from: 关汉卿《窦娥冤》
productions:
  - slug: 1985-recording
    label: 1985 黄愿亭录音版
    troupe: null
    year: 1985
    media_type: 录音
    leads: [黄愿亭, 林锦芳]
    parts:
      - file: 002-福建地方戏曲闽剧《六月雪》全剧 1985年录音 黄愿亭 林锦芳.flv
        label: 全剧
  - slug: modern-3-parts
    ...
sources:
  - { field: plot_summary, source: baidu_baike, url: "...", confidence: high }
  - { field: leads_1985, source: filename, confidence: high }
  - { field: era_setting, source: llm_inferred_from_plot, confidence: medium }
needs_review:
  - era_setting        # 待人工确认
  - production[1].year # 现代版年份缺失
---

## 剧情简介

（200-500 字，从百科 + LLM 综合）

## 主要角色

- 窦娥：含冤受刑的孝妇...
- ...

## 唱段亮点

（如有）

## 演出历史

（剧团 / 年代 / 重要场次）

## 资料来源

- [百度百科 · 六月雪](https://...)
- ...
```

**LLM 模型选择**：
- 默认 Sonnet 4.6（性价比高）
- 文本综合质量要求高的剧目（招牌剧）切到 Opus 4.7
- 启用 prompt caching：把"闽剧综合规则" + few-shot examples 缓存复用

**预算估算**：
- 200 部 × 平均 5K input + 2K output = 200 × 7K ≈ 1.4M tokens
- Sonnet 价格 $3/M input + $15/M output ≈ ~$10-15 总花费
- 完全可控

### 6.5 Stage 4 — 人工 Review

- 编辑 `content/plays/{slug}/draft.md`
- 重点 review `needs_review` 标记的字段
- 修正 LLM 错误（地方戏特别容易在剧团/年代上出错）
- 可借助 Claude（外部对话）批量帮看

**质量门槛**（V1 完成定义之一）：80% 的剧目至少完成 plot_summary + leads + troupe 三项。

### 6.6 Stage 5 — Import

`pipelines/import` Go 程序：

1. 遍历 `content/plays/*/draft.md`
2. 解析 frontmatter（gopkg.in/yaml.v3）+ markdown 长文
3. UPSERT works / productions / parts / actors / troupes / production_actors / field_sources
4. 处理引用：actor name → actor slug（不存在则创建占位记录待人工补 bio）
5. 同时维护 FTS5 索引
6. import 成功后将 draft.md 重命名为 imported.md（git 仍可追踪）

---

## 7. 前端设计

### 7.1 渲染策略

- **SSG 优先**：所有 works/productions/actors/troupes 详情页 build 时静态生成
- **ISR**：列表页 ISR（revalidate 1 小时），未来内容更新无需重 build
- **SSR**：仅 `/search`（query 多变，不预生成）
- **CSR**：搜索框、筛选器（client-side 交互）

### 7.2 URL 结构

```
/                                              # 首页
/plays                                         # 全部剧目（分页/筛选）
/plays/{work-slug}                             # 剧目页
/plays/{work-slug}/{production-slug}           # 版本页（单版本剧 work 页直接展示该版本）
/actors                                        # 演员列表
/actors/{slug}                                 # 演员页
/troupes                                       # 剧团列表
/troupes/{slug}                                # 剧团页
/search?q=                                     # 搜索（SSR）
/about                                         # 关于
/api/sitemap.xml                               # 动态 sitemap（next-sitemap）
/robots.txt
```

### 7.3 页面模板（V1 共 10 个）

1. **首页 `/`**：精选剧目（手动 curated 8-12 部）+ 全部剧目入口 + 简短项目介绍 + 站内统计（剧目数、演员数、剧团数）
2. **剧目列表 `/plays`**：网格卡片，封面 + 剧名 + 行当标签；筛选侧栏（行当、剧团、年代、是否非遗）；分页（每页 24）
3. **剧目页 `/plays/{slug}`**：剧名（含异名）、剧情简介、源流（adapted_from/era_setting）、行当、版本列表（每个 production 一张卡）、相关演员
4. **版本页 `/plays/{slug}/{prod-slug}`**：版本信息（剧团、年份、媒介）、主演列表（含角色）、分卷列表（v1 仅显示文件名+时长，v2 加播放器）
5. **演员列表 `/actors`**：拼音首字母分组，含基础资料
6. **演员页 `/actors/{slug}`**：bio + 名下作品（按 work 分组，每个 work 列出该演员参与的 productions）
7. **剧团列表 `/troupes`**
8. **剧团页 `/troupes/{slug}`**：bio + 代表剧目（按 work 分组）
9. **搜索 `/search?q=`**：联合搜索 works/actors/troupes，分组展示，命中片段高亮
10. **关于 `/about`**：项目目的、数据来源、版权立场、联系方式（GitHub issue 之类）

### 7.4 SEO 策略

- **全站开放索引**（V1 没有版权敏感的视频内容，全开放）
- `next-sitemap` 自动生成 sitemap.xml + robots.txt
- **JSON-LD 结构化数据**：
  - works → `CreativeWork` + `TheaterEvent`（祖类）
  - productions → `TheaterEvent` 实例
  - actors → `Person`
  - troupes → `Organization` / `PerformingGroup`
- 每页 `<title>` `<meta description>` `<og:*>` `<twitter:card>` 完整
- 中文 SEO 友好的语义结构（h1 唯一、面包屑、列表用 `<ul>` 等）
- Lighthouse SEO 目标 ≥ 95

### 7.5 设计语言

- 风格：复古书卷气 / 水墨风（戏曲传统美学）
- 字体：思源宋体（Noto Serif SC）正文 + 思源黑体（Noto Sans SC）标题
- 配色：中性米色背景 + 深红/墨色点缀
- 移动端优先（戏迷年龄结构偏大，但子辈帮看用手机的概率高）
- 暗色模式：**V1 包含**。CSS variables + Tailwind `dark:` 类，默认跟随系统（`prefers-color-scheme`），导航栏一个切换按钮，选择持久化到 localStorage

### 7.6 数据获取方式

- Build 时：Next.js `generateStaticParams` + `fetch('http://localhost:8787/api/...')` 拉 Go 服务
- 运行时（搜索/筛选）：直接 fetch Go API
- 类型：`openapi-typescript` 从 `shared/openapi.yaml` 生成

---

## 8. 阶段计划与工作量预估

| 阶段 | 内容 | 估时（业余） |
|---|---|---|
| 0 | Monorepo 骨架（Go workspace、Next.js、SQLite schema、OpenAPI、Makefile） | 1-2 天 |
| 1 | Ingest pipeline（514 文件名 → plays.jsonl，含 LLM 聚类） | 1-2 天 |
| 2 | Crawl + Synthesize（多源爬取 + Claude API 综合 → drafts） | 3-5 天 |
| 3 | 人工 review 200 个 draft（核心质量保证） | **5-10 天**（最大不可压缩工作量） |
| 4 | Import pipeline（drafts → SQLite + FTS5） | 1 天 |
| 5 | Go API 服务端（OpenAPI 实现 + 端到端测试） | 2-3 天 |
| 6 | Next.js 前端页面（10 个模板，含设计还原） | 5-7 天 |
| 7 | SEO + 搜索 + 封面图收集与生成 | 2-3 天 |
| 8 | 端到端联调 + Lighthouse 调优 | 1-2 天 |
| **合计** | | **约 21-35 天**（业余约 1.5-2.5 月） |

---

## 9. V1 完成定义

- [ ] ~200 部剧目元数据完整入库（80% 含 plot_summary + leads + troupe）
- [ ] `db/snapshots/latest.sql` 提交到 git
- [ ] Go API 实现全部 V1 endpoints 并通过 OpenAPI 验证
- [ ] Next.js 站本地能跑（`make dev` 一行启动）
- [ ] 10 个页面模板全部渲染正常，含基本设计实现
- [ ] Sitemap 生成、JSON-LD 注入、OG tags 完整
- [ ] Lighthouse SEO ≥ 95，Performance ≥ 90（移动端模拟）
- [ ] 搜索（FTS5）能命中剧名、剧情、演员、剧团
- [ ] README 至少有项目介绍、运行说明、贡献指引

---

## 10. 已锁定决策

| # | 项 | 决定 |
|---|---|---|
| 1 | 域名 | `xiquhub.com`（已注册） |
| 2 | LLM 调用预算 | 接受 $10-30 估算 |
| 3 | 封面图来源 | V1 用 ffmpeg 从视频抽 3-5 帧人工选一；缺失时用占位 SVG（剧名书法字 + 中性背景） |
| 4 | 首页精选剧目算法 | 加权排序：含国家级非遗 +3；production 数 ≥ 2 +2；含明确剧团信息 +1；随机微扰 ±0.5 防固化。取 Top 12 上首页。后期可叠加人工种子名单覆盖 |
| 5 | 暗色模式 | V1 **包含**。详见 7.5 |
| 6 | 分析工具 | V1 **不装**；V2 视需要评估自部署 Umami |
| 7 | V1 部署目标 | **仅本地**（`make dev` 一键起 Go API + Next.js）。生产部署到 Cloudflare 推迟到 V2 |

---

## 11. 词汇表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 剧目 | Work | 抽象作品（如《六月雪》） |
| 录制/版本 | Production | 一次具体的演出录制 |
| 分卷/分集 | Part | 物理文件 |
| 行当 | Hangdang / Role Type | 生/旦/净/末/丑等 |
| 唱腔 | Singing Style | 流派 |
| 折子戏 | Excerpt | 单出戏（V1 暂不区分） |
| 全本 | Full Play | 整部剧 |
| 非遗 | Intangible Cultural Heritage | 非物质文化遗产 |
| 主演 | Lead Actor | `is_lead = 1` |

---

## 12. 不在本 Spec 范围

以下事项**不在 V1 spec 范围**，将来需单独立项：

- 视频转码（FLV → HLS）流程与工具链
- 视频播放器选型（Vidstack / Plyr / media-chrome）
- AI 视频修复（Topaz / Real-ESRGAN）流程
- Cloudflare 部署细节（Workers TS 重写、D1 migration、R2 上传脚本）
- 用户系统（如未来需要）
- 评论 / 弹幕 / 收藏（如未来需要）
- 与剧团/院团的合作授权流程

---

**文档状态**：设计完成。待用户 review 后转入 `writing-plans` 输出可执行的实施计划。
