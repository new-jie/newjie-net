# Shaka Player（本站内置副本）

本目录是 **shaka-player 5.2.10** 的本地内置副本，从 npm 包完整解压而来，
供全站页面按需引用，不依赖 CDN。

许可证：Apache-2.0，见 `LICENSE`（**再分发时必须保留**）。

---

## 上游信息

| 项 | 值 |
| --- | --- |
| 包名 | `shaka-player` |
| 版本 | `5.2.10` |
| 来源 | npm 包 / GitHub `shaka-project/shaka-player` tag `v5.2.10` |

---

## 实际被页面引用的文件（只有 3 个）

| 文件 | 大小 | 用途 |
| --- | --- | --- |
| `dist/shaka-player.ui.js` | 1.0 MB | 库 + UI 主包（含 `shaka.ui.Overlay`） |
| `dist/controls.modern.css` | 32 KB | 控件样式，**保留 CSS 变量**，可运行时换肤 |
| `ui/locales/zh.json` | 1.5 KB | 官方简体中文语言包 |

> 用的是 `controls.modern.css` 而不是 `controls.css`：
> 后者是给老浏览器（Chrome 38 / Safari 8 等）的兼容版，CSS 变量在构建期就被拍平了，
> 运行时无法覆盖。现代浏览器一律用 `modern` 那版。

---

## 已删除的内容（相对上游 npm 包）

为控制仓库体积，从完整的 83.9 MB 中剔除了以下**纯调试用途**的产物，
当前为 **596 个文件 / 17.3 MB**：

| 已删 | 数量 | 体积 | 说明 |
| --- | --- | --- | --- |
| `**/*.map` | 22 | 47.5 MB | source map，仅用于调试 Shaka 自身源码 |
| `**/*.debug.js` 等 | 31 | 19.1 MB | 未压缩调试构建 |

**同时清理了 3 个文件末尾的 `sourceMappingURL` 注释**
（`dist/shaka-player.ui.js`、`dist/controls.modern.css`、`dist/controls.css`），
否则浏览器开发者工具会持续报 `*.map` 404。

**保留**：`lib/`、`ui/`、`externs/`、`third_party/` 全部源码（约 4.6 MB），
以及 `dist/` 下所有非 debug 构建 —— 需要翻实现或换构建版本时直接用。

---

## 未来升级步骤

1. 下载新版 npm 包，解压覆盖本目录；
2. 重新删除 `**/*.map` 与 `**/*.debug.*`；
3. 重新清理这 3 个文件末尾的 `sourceMappingURL` 注释：
   - `dist/shaka-player.ui.js`
   - `dist/controls.modern.css`
   - `dist/controls.css`
4. 更新本文件顶部的版本号。

页面引用的路径不含版本号，所以**升级无需修改任何 HTML**。

---

## 一点已知情况

`controls.modern.css` 与 `controls.css` 里有一条 **Google Fonts 外链**：

```
https://fonts.gstatic.com/s/roboto/v51/KFOMCnqEu92Fr1ME7kSnGlTylUAMQXC89YmC2DPNWubEbVmUiA8.ttf
```

这是 Shaka 默认 UI 字体的 `@font-face` 声明 —— 字体**不是**本地文件，所以不存在断链。
若该域名不可达，浏览器会回退到后声明的 `sans-serif`，控件仍可正常使用。
如需彻底去除外部依赖，可把该字体下载到本地并把这条 `@font-face` 的 `src` 改成相对路径。

---

## 目录内其它文件的说明

以下文件**不被站点引用**，属于上游包自带内容，留在仓库仅供查阅：

- `index.html`、`support.html` —— Shaka 官方的演示页与兼容性检测页
- `lib/`、`ui/`、`externs/`、`third_party/` —— 源码
- `dist/` 下的 `*.dash.js`、`*.hls.js`、`*.experimental.js`、`*.transmuxer-worker.js` ——
  其它构建变体（Dash 版 571 KB、HLS 版 604 KB 等）。
  本站播放的是**渐进式 MP4 单文件**，用 `shaka-player.ui.js` 即可，不需要这些。
- `.csslintrc`、`eslint.config.mjs`、`cspell.config.yaml`、`jsconfig.json` 等 —— 上游构建配置
- `tarball` —— npm 打包残留，0 字节空文件

> 注意：因为 Workers 的 `assets.directory` 指向站点根目录，
> `vendor/` 下的文件在部署后是**可被公开访问**的
> （例如 `/vendor/shaka-player/index.html`）。
> 这些是上游公开内容，无敏感信息，但如不希望被访问，可在 `.assetsignore` 中排除。
