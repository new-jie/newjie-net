# 博客

一个用 **SvelteKit + Material Design 3 Expressive** 构建的纯静态中文博客，部署在 **Cloudflare Workers** 上。

**在线地址**：https://www.newjie.net

---

## 这是什么

没有数据库、没有服务端运行时、没有登录系统。构建产物是一堆 HTML 文件，直接躺在 Cloudflare 的全球边缘网络上。

架构取舍的完整推导见文章《为什么我把博客做成了纯静态站》。

| 特性 | 实现方式 |
| --- | --- |
| 路由 / SSR / 预渲染 / 客户端接管 | SvelteKit，`prerender = true` 全站预渲染 |
| 导出 | `@sveltejs/adapter-static`，产物写入 `build/` |
| 设计系统 | `m3-svelte` 7.x（M3 Expressive），配色由种子色生成 |
| 配色 | 58 个 MD3 色彩角色，明暗两套，24 项 WCAG AA 校验 |
| 内容 | `.svx` 文件（Markdown + Svelte 组件），构建期编译 |
| 部署 | Cloudflare Workers 静态资源，**无 Worker 脚本**（结构化零成本） |

---

## 技术栈与版本约束

版本号是精确锁定的，**不要随手升 `vite`**：

| 包 | 版本 | 说明 |
| --- | --- | --- |
| `svelte` | 5.57.0 | runes 模式，`compilerOptions.runes = true` 强制 |
| `@sveltejs/kit` | 2.70.3 | 不要升 3.x，`adapter-cloudflare@8` 才需要它 |
| `@sveltejs/adapter-static` | 3.0.10 | |
| `vite` | **7.3.6** | 见下方互斥说明 |
| `@sveltejs/vite-plugin-svelte` | **6.2.4** | 7.x 的 peer 是 `vite ^8` |
| `vite-plugin-functions-mixins` | 0.4.1 | peer 是 `vite ^7.2.4` |
| `m3-svelte` | 7.2.0 | 需要上面这个插件编译它的样式 |
| `wrangler` | 4.132.0 | |

**为什么锁 Vite 7**：`vite-plugin-functions-mixins` 的 peer 是 `vite ^7.2.4`，而 `@sveltejs/vite-plugin-svelte` 7.x 的 peer 是 `vite ^8`。两者互斥，所以只能走 `vite 7.3.6 + vite-plugin-svelte 6.2.4` 这条线。升级 Vite 前请先确认 functions-mixins 已支持 Vite 8。

---

## 本地开发

需要 Node ≥ 20.19（开发时用的是 Node 26）。

```bash
npm install
npm run dev            # 开发服务器
npm run build          # 构建到 build/
npm run preview:cf     # 用 workerd 本地预览真实运行时行为
```

复制 `.env.example` 为 `.env` 可覆盖站点域名（不改则用 `src/lib/format.ts` 里的默认值）。

---

## 常用脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 开发服务器 |
| `npm run build` | 构建静态产物到 `build/` |
| `npm run preview:cf` | 用 wrangler 起 workerd 预览（验证真实部署行为） |
| `npm run check` | `svelte-check` 类型检查 |
| `npm run check:icons` | 校验 `src/lib/icons.ts` 里的图标名真实存在 |
| `npm run check:anchors` | 校验目录锚点与正文标题 id 一致 |
| `npm run gen:theme` | 重新生成配色（含对比度校验） |
| `npm run verify` | **提交前跑这个**：图标 + 锚点 + 类型 + 构建 |
| `npm run deploy` | 构建并部署到 Cloudflare Workers |

---

## 写文章

在 `src/content/posts/` 下新建 `.svx` 文件即可，无需改任何代码。

```yaml
---
title: 文章标题
description: 摘要，用于列表页、SEO 与 llms.txt
date: 2026-09-16
tags: [SvelteKit, 架构]
slug: custom-url-slug        # 可选；不填则由标题生成
updated: 2026-09-20          # 可选
draft: false                 # true 则只在 dev 环境可见
pinned: false                # true 则首页置顶
---
```

正文是标准 Markdown，可以直接内嵌 Svelte 组件。标题会自动获得锚点 id，无需手写。

**frontmatter 会被 zod 校验**：字段写错、日期格式不对、slug 重复，构建期直接失败并指出文件与字段名，不会静默上线。

阅读时长按 `CJK 字符数 / 400 + 拉丁词数 / 200` 计算——直接用 `reading-time` 之类的库会把整段中文当成一个单词，算出「1 分钟」这种明显错误的值。

---

## 换配色

只改一个种子色：

```bash
# 编辑 scripts/theme.config.mjs 里的 seed
npm run gen:theme
```

会重新生成 `src/lib/theme/tokens.css` 里的 58 个色彩角色（明暗两套），并跑一遍 WCAG 对比度校验——任何一项低于 4.5 都会让脚本以非零退出码结束。

生成器还修补了两个上游缺陷：M3 Expressive 变体把辅色派生成绿色（用父类覆写 palette 解决），以及 Material Color Spec 2025/2026 的 `tertiary_container` 缺少对比度曲线导致明暗同色。

---

## 目录结构

```
src/
├─ app.html              主题引导脚本（内联阻塞，防暗色闪烁）
├─ app.css               层叠层顺序 + 中文优先字体栈
├─ content/posts/        文章（.svx）
├─ lib/
│  ├─ components/        自研 MD3 组件（路由层只用这些）
│  ├─ content/           内容管线：glob 收集、frontmatter 解析、目录抽取
│  ├─ theme/tokens.css   生成的配色（勿手改）
│  ├─ icons.ts           按需引入的图标（几百字节/个，不引图标字体）
│  └─ format.ts          RSS / Sitemap 共享的格式化与站点信息
└─ routes/
   ├─ posts/[slug]/      文章页（entries() 枚举 slug）
   ├─ tags/、archive/    标签与归档
   ├─ styleguide/        M3 设计系统验收页（noindex）
   ├─ rss.xml/           → application/xml
   ├─ sitemap.xml/       → application/xml
   ├─ robots.txt/        → text/plain
   ├─ llms.txt/          → text/plain，面向大模型的站点索引
   ├─ llms-full.txt/     → text/plain，全部文章正文纯文本
   └─ search-index.json/ → application/json，客户端搜索数据
scripts/
├─ gen-theme.mjs         配色生成器
├─ theme.config.mjs      种子色配置
├─ check-icons.mjs       图标名校验
└─ check-anchors.mjs     锚点一致性校验
```

---

## 部署到 Cloudflare Workers

本站是**纯静态站，不需要 Worker 脚本**。`wrangler.jsonc` 里连 `main` 都没有，所有请求由静态资源层直出，因此不产生 Worker 调用费用。

### 关键配置

```jsonc
{
  "name": "blog",
  "compatibility_date": "2026-09-16",
  "assets": {
    "directory": "./build",
    "not_found_handling": "404-page",
    "html_handling": "force-trailing-slash"
  }
}
```

**`html_handling` 必须与 SvelteKit 的 `trailingSlash` 成对配置**，配错的表现是大量 404：

| SvelteKit `trailingSlash` | 产物形态 | Cloudflare `html_handling` |
| --- | --- | --- |
| `'never'`（默认） | `posts/foo.html` | `auto-trailing-slash` |
| `'always'`（本项目） | `posts/foo/index.html` | **`force-trailing-slash`** |

Cloudflare 的 `auto-trailing-slash` 规则是「文件不带斜杠、目录索引带斜杠」，它并不理解 `trailingSlash: 'always'` 的语义。

### 用 GitHub 自动部署

1. 把仓库推到 GitHub。
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Import a repository**（或选中已有的 `blog` Worker → **Settings → Builds** → **Connect**）。
3. 选择本仓库，构建设置：

   | 字段 | 值 |
   | --- | --- |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |
   | Root directory | `/`（留空） |

4. **Variables and Secrets** 里加 `SITE_ORIGIN = https://www.newjie.net`，并确保它对**构建阶段**可见（纯静态站的域名是构建期烘焙进去的）。

之后每次推送到 `main` 都会自动构建并部署；PR 会生成预览版本。

### 手动部署

```bash
npm run deploy        # = vite build && wrangler deploy
```

需要先 `npx wrangler login`。

---

## 已知坑（都已解决，勿踩回去）

记录在这里是因为它们都**不报错或报错信息极具误导性**：

1. **`import.meta.glob` 用相对路径会静默匹配为空。** 必须用以 `/src/` 开头的绝对路径（`/src/content/posts/*.svx`）。用 `'../content/posts/*.svx'` 时它返回空对象且不报错，结果是所有文章页都不生成，只得到一句含糊的 `routes were marked as prerenderable, but were not prerendered`。

2. **`vite-plugin-functions-mixins` 的 `deps` 默认是空数组**，此时它一个 CSS 文件都不扫描，M3 样式里的 `--translucent()` / `--m3-density()` 全部编译失败（日志刷 `Unknown function --translucent. Registry size is 0.`）。必须显式写 `deps: ['m3-svelte']`。

3. **中文 slug 的 URL 编码必须全局统一。** 预渲染器要求页面上的链接与实际生成的路径完全一致，编码方式不一致会报 404。已集中到 `postPath()` / `tagPath()` 两个函数。

4. **`trailingSlash` 不是 `kit` 的选项**，它是 page option，写在 `src/routes/+layout.ts` 里。写进 `svelte.config.js` 的 `kit` 会被直接拒绝。

5. **`svelte.config.js` 由 Node 直接加载**，不走 Vite 的 TS 链，所以它 import 的文件不能用 `.ts` 扩展名解析（会 `ERR_MODULE_NOT_FOUND`）。`src/lib/rehype-heading-ids.js` 因此是 `.js` + JSDoc 类型注解。同时 tsconfig 需要开 `allowImportingTsExtensions`，因为它内部要 `import './slug.ts'`。

6. **`m3-svelte` 的 `Chip` 组件 `variant` 是必填的**，且 props 是 a/label/button 三分支联合类型——不传 `href` / `onclick` / `label` 时 TypeScript 会落到 label 分支并报「缺少 label 属性」。

7. **`import.meta.glob` 的 `?raw` 取源码、默认导出取组件**，两者路径 key 相同，别把 key 写错成相对路径（见第 1 条）。

---

## License

[MIT](./LICENSE)
