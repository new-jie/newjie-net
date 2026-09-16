import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import { rehypeHeadingIds } from './src/lib/rehype-heading-ids.js';
import { remarkCallouts } from './src/lib/remark-callouts.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.svx'],

	preprocess: [
		mdsvex({
			extensions: ['.svx'],
			// remark 在 markdown AST 阶段运行，用于扩展语法（> [!NOTE] 提示框）
			remarkPlugins: [remarkCallouts],
			// rehype 在 HTML AST 阶段运行，用于给标题加 id。
			// 没有它目录里的 #anchor 链接会全部失效。
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
