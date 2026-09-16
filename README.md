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

在 `src/content/posts/` 下新建一个 `.svx` 文件即可，**不需要改任何代码**。文件名随意（建议用英文，便于在编辑器里识别），URL 由 frontmatter 决定。

### frontmatter

```yaml
---
title: 文章标题                                  # 必填，最长 120 字
description: 摘要，用于列表页、SEO 与 llms.txt   # 必填，最长 300 字
date: 2026-09-16                                 # 必填，严格 YYYY-MM-DD
tags: [SvelteKit, 架构]                          # 可选，自动去重
slug: custom-url-slug                            # 可选，见下方说明
updated: 2026-09-20                              # 可选
draft: false                                     # 可选，true 则只在 npm run dev 时可见
pinned: false                                    # 可选，true 则首页置顶
---
```

**关于 `slug`**：不填就由标题生成。中文标题会保留中文字符，URL 里以百分号编码出现（例如 `/posts/为什么我把博客做成了纯静态站/`），浏览器地址栏会显示成可读的中文。想让 URL 是纯 ASCII 就显式写 `slug`——只能用**小写字母、数字、连字符**，且不能以连字符开头或结尾。

**校验是硬性的**：字段缺失、日期格式不对、slug 格式非法或与其它文章重复，`npm run build` 会直接失败并指出文件名与字段名。这是刻意的——宁可不让你发出去，也不要带着坏数据上线。

### 正文语法

正文就是**标准 Markdown**，加上一个自定义的提示框语法：

```markdown
> [!NOTE]
> 补充说明，不影响主流程。

> [!TIP]
> 更省事的做法。

> [!IMPORTANT]
> 读者跳过可能会出错的关键信息。

> [!WARNING]
> 继续操作有风险。

> [!CAUTION]
> 不可逆后果的强调。

> 这是一个普通引用块，不会被转成提示框。
```

五种提示框分别映射到不同的 MD3 语义色，明暗主题下都自动正确。**没有任何 Svelte 语法要学。**

其它已支持并验证过的：标题（自动生成锚点 + 目录）、代码块（横向滚动、不折行）、表格（窄屏横向滚动）、引用块、图片、行内代码、链接。

### 图片：务必先压缩

图片可以放在 `static/` 下，也可以用外部地址（例如 R2 存储桶）直接引用。**外部引用不会进仓库，推荐。**

但**上传前请务必压缩到 1920px 长边、200–500 KB**。相机原图动辄 8–20 MB，一篇文章放十张就是上百 MB——读者要等几十秒才能看完，移动网络下基本等于打不开，而本站其它部分的传输量只有几 KB。

用 [Squoosh](https://squoosh.app/) 或 `sharp` 批量处理即可，摄影作品用 WebP 质量 80 通常看不出差别。

正文里直接写 Markdown 图片语法即可：

```markdown
![描述文字](https://r2.newjie.net/pics/shots/example/1.jpg)
```

需要保留 WordPress 那种图块结构（含 `class` 或内联尺寸）也可以直接写 HTML，mdsvex 会原样透传：

```html
<figure class="wp-block-image size-large"><img src="..." alt=""/></figure>
```

**注意 `alt` 不要留空。** 它决定读屏软件怎么念这张图，也是搜索引擎理解图片内容的唯一依据；对摄影站点尤其值得花几秒写一句。

阅读时长按 `CJK 字符数 / 400 + 拉丁词数 / 200` 计算——直接用 `reading-time` 之类的库会把整段中文当成一个单词，算出「1 分钟」这种明显错误的值。

### 发布流程

```bash
npm run dev            # 1. 本地写，实时预览（草稿也会显示）

npm run verify         # 2. 提交前自检：图标 / 锚点 / 类型 / 构建

git add -A             # 3. 推送
git commit -m "post: 文章标题"
git push
```

推送到 `main` 后 Cloudflare Workers Builds 会自动构建并部署，通常一两分钟上线。

草稿阶段建议写 `draft: true`：本地 `npm run dev` 能看到，但**不会**出现在生产构建里，可以放心推送。

### 一件不需要知道的事

值得说清楚，因为很容易被误导：`.svx` 文件**技术上支持完整的 Svelte 语法**——`<script>` 块、`$state`、`{#each}` 都能编译运行，我实测确认过。

但**不要用它**。原因有三：

- `src/lib/components/` 里全是布局组件（导航、目录、卡片），没有一个是设计给文章内嵌的；
- 把 Svelte 语法混进散文会毁掉「这就是一个 markdown 文件」这个最重要的性质——以后想换渲染器、或让别的工具处理这些文件，都会被卡住；
- 像提示框这类需求，上面的 Markdown 语法就够了，不需要写组件。

需要新的文章内元素时，正确做法是**扩展 Markdown 语法**（像 `src/lib/remark-callouts.js` 那样加一个 remark 插件），而不是在文章里写 Svelte。

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

8. **不要在"能跑的工作区"里判断构建是否健康。** `src/lib/format.ts` 用了 `process.env`，在本机 `svelte-check` 通过只是因为 esbuild 的类型间接提供了 `process` 声明；`npm ci` 的全新检出会直接报 `Cannot find name 'process'`。已显式加入 `@types/node`。改动构建相关代码后，建议用 `npm ci` 在干净目录验证一次。

9. **npm 11 默认不执行依赖的安装脚本**，而 esbuild 与 workerd 都靠 postinstall 下载平台二进制。缺少二进制时构建会以难以定位的方式失败。`package.json` 的 `allowScripts` 字段已逐个放行，新环境如遇报错可跑 `npm install-scripts ls` 查看被拦截项。

10. **不要在 `src/app.html` 的任何位置写出 SvelteKit 占位符的字面写法，注释里也不行。**
    SvelteKit 把整个 `app.html` 塞进一个 JS 模板字符串，然后对占位符做**全局字符串替换，不看上下文**（见 `@sveltejs/kit/src/core/sync/write_server.js`）。所以在注释里写一句「`%sveltekit.head%` 是占位符，不要改动」，那句注释里的占位符也会被替换，替换文本带引号，会撑破模板字符串，把注释后半截当成正文输出到**每个页面**顶部。

    这个 bug 只在 `npm run build` 的产物里出现，`npm run dev` 走另一条路径，本地开发看不到——所以它一直潜伏到部署前才被发现。需要引用占位符时请用描述性说法（「head 占位符」），不要写百分号形式。

---

## License

[MIT](./LICENSE)
