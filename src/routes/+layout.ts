// 全站预渲染：纯静态站点，所有页面在构建期固化成 HTML。
// adapter-static 的 strict 模式会在这里把关：任何动态路由若漏了 entries()，构建直接失败。
export const prerender = true;

// 与 wrangler.jsonc 的 assets.html_handling = "force-trailing-slash" 必须成对出现。
// 'always' 让 SvelteKit 产出 posts/foo/index.html，Cloudflare 侧强制带斜杠访问。
// 若改成 'never'，Cloudflare 侧要同步改成 "auto-trailing-slash"，否则大量 404。
export const trailingSlash = 'always';
