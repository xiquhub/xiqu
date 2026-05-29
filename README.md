# 闽剧档案 · xiquhub

闽剧（福州地方戏曲）数字档案站。收录 199 部剧目、514 个视频文件、剧情资料、演员剧团信息。

🌐 **在线访问**

- 主站：<https://xiquhub.com>（Cloudflare Pages）
- 二级入口：<https://archive.xiquhub.com>（GitHub Pages）
- Pages.dev：<https://xiqu-archive.pages.dev>

📊 **当前规模**

| 项 | 数量 |
|---|---|
| 剧目（works） | 199 |
| 录制版本（productions） | 200+ |
| 分卷视频文件 | 514 |
| 国家级非物质文化遗产 | 1（《贻顺哥烛蒂》） |
| 已收录封面图 | 116 |

## 项目结构

```
xiqu/
├─ apps/web/             # Next.js 16 静态站
│  ├─ app/               # App Router 路由
│  ├─ components/        # React 组件
│  ├─ lib/               # 数据层（读 docs/works）
│  └─ public/covers/     # 剧目封面图
├─ apps/server/          # Go HTTP API stub（V1 未启用，未来 D1）
├─ pipelines/ingest/     # Go CLI：filenames → plays.jsonl
├─ docs/
│  ├─ works/             # 199 剧目 markdown，frontmatter 是真源
│  ├─ superpowers/specs  # 设计文档
│  └─ superpowers/plans  # 实施计划
├─ db/                   # SQLite schema + 备份
└─ shared/openapi.yaml   # API 契约
```

## 技术栈

| 层 | 选型 | 备注 |
|---|---|---|
| 前端 | Next.js 16 + Tailwind v4 | 静态导出（`output: 'export'`） |
| 字体 | Noto Serif SC + Noto Sans SC | 思源宋体/黑体 |
| 主题 | next-themes | 米色档案 / 墨绿夜读 |
| 搜索 | MiniSearch（客户端，中文逐字分词） | 全文索引剧目+演员+剧团 |
| 视频 | mp4 + 原生 `<video>` + Range | 已批量 ffmpeg stream-copy from FLV |
| 数据 | Markdown frontmatter（gray-matter） | `docs/works/{slug}.md` |
| 反馈表单 | Web3Forms | 直发邮件，无后端 |
| 视频源 | Caddy（mac mini）+ nginx HTTPS 反代（Linux server） | server.yunxy.top:8075/videos |
| Web 托管 | Cloudflare Pages（主）+ GitHub Pages（镜像） | tag 触发自动部署 |

## 本地开发

```bash
# 1. 安装
pnpm install

# 2. 启动 dev（默认 3000，被占自动 3001）
pnpm --filter web dev

# 3. 生产构建（静态导出到 apps/web/out/）
pnpm --filter web build
```

需要环境变量 `apps/web/.env.local`（看 `.env.local.example`）：

```env
NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY=...
NEXT_PUBLIC_VIDEO_BASE_URL=https://server.yunxy.top:8075/videos
```

## 部署

主仓库部署是 **tag 驱动**——打 tag 自动触发 `.github/workflows/deploy.yml`：

```bash
# 提升版本
git tag v1.0.0
git push origin v1.0.0
# 等 2-3 分钟，Actions 自动 build + deploy CF Pages + GH Pages
```

部署目标：

1. **Cloudflare Pages** → https://xiquhub.com（主站）
2. **GitHub Pages** → https://archive.xiquhub.com（二级入口，通过 `apps/web/public/CNAME` 绑定自定义域名）

需要的 GitHub Secrets（在 repo Settings → Secrets and variables → Actions 添加）：

| Secret | 来源 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | <https://dash.cloudflare.com/profile/api-tokens> → Edit Cloudflare Workers 模板 |
| `CLOUDFLARE_ACCOUNT_ID` | CF Dashboard 右侧栏 |

## 内容贡献

- 找到剧情、演员、剧团资料补全：[站内反馈表单](https://xiquhub.com/about)
- 发现资料错误：同上
- 直接 PR：欢迎修改 `docs/works/{slug}.md`，frontmatter 字段见现有文件

## 数据来源

- 视频文件名解析（剧团、主演、年份）
- 百度百科、维基百科、闽剧网、B 站视频简介
- 福州新闻网、福建省政府文化栏目、地方志
- 戏迷、研究者通过站内反馈持续补全

## 版权立场

- 剧目元信息（剧情、人物、源流）属公共领域戏曲文化知识，均经原创整理或来源标注
- 封面图来自公开网络搜索，仅作 placeholder
- 视频不在本站托管，由独立的内容服务器提供
- 相关录像版权方希望调整任何条目的展示方式，请通过站内反馈处理

## License

文档（`docs/`）：CC BY-SA 4.0
代码（`apps/`、`pipelines/`、`db/`、`shared/`）：MIT
