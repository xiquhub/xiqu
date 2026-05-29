# 闽剧档案站 · Claude 协作守则

## 项目背景

V1 闽剧公益数字档案站，非营利、无广告。199 部剧、514 个视频文件（已 ffmpeg
转 mp4），托管在 `server.yunxy.top:4768` (Caddy)。前端 Next.js 16 + Tailwind v4，
反馈通过 Web3Forms 直发 `xiquhub@gmail.com`。

数据真源：`docs/works/{slug}.md` + `pipelines/ingest/out/plays.jsonl`。

## 内容书写原则

### 不要在用户可见内容里露 LLM 痕迹

**不要写**这些字眼到 markdown 正文或 frontmatter：

- "Gemini / GPT / Claude / LLM 综合"
- "AI 生成"
- "待人工核校 / 未经权威源核实"
- ⚠️ 警告框
- `confidence: low/medium/high` 渲染到用户面前
- "资料来源：Gemini (...)" 列表项

**正确做法**：

- 资料就是资料。能放出来就直说，不加免责
- 觉得资料不可信就**不要放**，而不是放出来再加警告
- 来源追踪可以记在 `sources` frontmatter 里（数据用），但**不渲染到正文**
- `needs_research` 这种字段保持 `false`，前端不要因它显示警告

### 数据获取方式不暴露给用户

不管资料来自 Web 搜索、百度百科、Gemini、人工补全——**对读者一视同仁**，呈现为
"闽剧档案的资料"。读者关心的是剧情和演员，不是流水线。

### 例外：诚实表达"暂无"

如果某剧目真的找不到资料，**直接说"暂无 XX 资料"**，不要：

- 编造内容填空白
- 加 LLM 警告把空白伪装成内容

例如：
```markdown
## 剧情简介

暂无剧情资料。如有了解此剧的朋友，欢迎通过反馈功能补充。
```

而不是写一段 LLM 编的内容 + ⚠️ 警告。

## 工程约定（已锁定）

- 后端：Go + SQLite（本地）/ Cloudflare Workers + D1（V2 部署）
- 前端：Next.js 16 + Tailwind 4，dev port 默认 3000，被占则换 3001
- 数据 source of truth：`docs/works/{slug}.md` frontmatter；`plays.jsonl` 为
  ingest 中间产物
- 视频：`/Volumes/MoveHD/xiqu/{slug}/{prod}/{file_en}.mp4`，Caddy 静态服务，CORS 全开
- 封面图：`apps/web/public/covers/{slug}.{ext}`（已本地化），无图时前端 SVG 占位

## 反复出现的"别再做"

- 别再用 Gemini 给资料加"待核校"标签——上述原则已锁
- 别再在 markdown 正文写 `⚠️` warning 块
- 别再渲染 `gemini://` 类 URL 到 sources 列表
- 别在用户可见处使用 confidence: low/medium/high 词汇
- 没把握的资料就不写，比写假的+警告强
