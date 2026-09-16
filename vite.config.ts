import { sveltekit } from '@sveltejs/kit/vite';
import { functionsMixins } from 'vite-plugin-functions-mixins';
import { defineConfig } from 'vite';

// functionsMixins 必须在 sveltekit 之前：
// m3-svelte 的样式使用了 @function / @mixin / @apply 与 --translucent() 等
// 尚未进入标准的 CSS 语法，需要这个插件把它们编译成浏览器可用的 CSS。
//
// 关键：插件的 deps 默认为空数组，此时它一个 CSS 文件都不扫描，
// 注册表为空 → 所有 --translucent()/--m3-density() 都会编译失败并打印
// "Unknown function --translucent. Registry size is 0."。
// 必须显式列出需要扫描的依赖包。
//
// 注意：该插件的 peer 是 vite ^7.2.4，而 @sveltejs/vite-plugin-svelte 7.x 的
// peer 是 vite ^8 —— 两者互斥。因此本项目锁定 vite 7.3.6 + vite-plugin-svelte 6.2.4。
// 升级 vite 前务必先确认 functions-mixins 已支持 vite 8。
export default defineConfig({
	plugins: [functionsMixins({ deps: ['m3-svelte'] }), sveltekit()]
});
