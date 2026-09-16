import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import { rehypeHeadingIds } from './src/lib/rehype-heading-ids.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.svx'],

	preprocess: [
		mdsvex({
			extensions: ['.svx'],
			// 给标题加 id，否则目录里的 #anchor 链接会失效。
			// 注意这里直接 import 项目内的 .ts：svelte.config.js 由 Vite 加载，
			// 所以走的是项目的 TS 转译链，不需要额外构建步骤。
			rehypePlugins: [rehypeHeadingIds]
		})
	],

	compilerOptions: {
		// 强制 runes 模式，避免混用 legacy 语法
		runes: true
	},

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: true,
			// strict: 任一动态路由漏了 prerender/entries 就直接构建失败
			strict: true
		}),

		// 注意：trailingSlash 不是 kit 选项，它是 page option，
		// 在 src/routes/+layout.ts 里设置，必须与 wrangler.jsonc 的
		// assets.html_handling 保持一致（'always' ↔ force-trailing-slash）。
		alias: {
			$content: 'src/content',
			// m3-svelte 的 exports 只暴露 '.' 与 './etc/*'，不允许深路径导入。
			// 而从包入口导入时，TypeScript 会走 index.js → 各 .svelte，
			// 在部分组件上无法还原 props 类型（表现为 $$ComponentProps 类型错误）。
			// 这个别名把组件目录直接暴露出来，让类型能落到具体的 .svelte.d.ts 上。
			$m3: 'node_modules/m3-svelte/package'
		}
	}
};

export default config;
