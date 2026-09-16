/**
 * 图标集
 *
 * m3-svelte 的 Icon 组件接收 iconify 图标对象，而不是图标字体名。
 * 这样每个图标只打包它自己的 path 数据（几百字节），
 * 比引入 Material Symbols 可变字体（数 MB）小得多。
 *
 * 需要新图标时，从 @ktibow/iconset-material-symbols 里挑一个加进来。
 * 注意并非每个图标都有 -outline 变体（例如 arrow-back 就没有），
 * 加完请运行 `npm run check:icons` 校验，否则 Rollup 会报解析失败。
 */
export { default as homeOutline } from '@ktibow/iconset-material-symbols/home-outline.js';
export { default as labelOutline } from '@ktibow/iconset-material-symbols/label-outline.js';
export { default as archiveOutline } from '@ktibow/iconset-material-symbols/archive-outline.js';
export { default as lightModeOutline } from '@ktibow/iconset-material-symbols/light-mode-outline.js';
export { default as darkModeOutline } from '@ktibow/iconset-material-symbols/dark-mode-outline.js';
export { default as brightnessAutoOutline } from '@ktibow/iconset-material-symbols/brightness-auto-outline.js';
export { default as arrowBackOutline } from '@ktibow/iconset-material-symbols/arrow-back.js';
export { default as arrowForwardOutline } from '@ktibow/iconset-material-symbols/arrow-forward.js';
export { default as scheduleOutline } from '@ktibow/iconset-material-symbols/schedule-outline.js';
export { default as rssFeedOutline } from '@ktibow/iconset-material-symbols/rss-feed.js';
export { default as errorOutline } from '@ktibow/iconset-material-symbols/error-outline.js';
