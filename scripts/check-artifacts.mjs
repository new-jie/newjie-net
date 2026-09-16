/**
 * 构建产物校验：确认纯静态站的关键文件都生成了。
 *
 * 为什么需要它：预渲染出问题的表现往往不是报错，而是「某个页面悄悄没生成」。
 * 例如 import.meta.glob 匹配为空时构建会成功，但所有文章页都不存在——
 * 只有主动检查产物才能发现。
 *
 * 本脚本把 CI 与本地要校验的内容统一到一处，
 * 避免两边各写一套 shell/Node 逻辑之后慢慢分叉。
 *
 * 用法：node scripts/check-artifacts.mjs
 * 前置：先跑 npm run build
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const build = join(root, 'build');

if (!existsSync(build)) {
	console.error('找不到 build/，请先运行 npm run build');
	process.exit(1);
}

const problems = [];
const CALLOUT_KINDS = ['note', 'tip', 'important', 'warning', 'caution'];

/** ---------- 1. 必须存在的文件 ---------- */
const REQUIRED = [
	'index.html',
	'404/index.html',
	'archive/index.html',
	'tags/index.html',
	'rss.xml',
	'sitemap.xml',
	'robots.txt',
	'llms.txt',
	'llms-full.txt',
	'search-index.json'
];

for (const rel of REQUIRED) {
	if (existsSync(join(build, rel))) {
		console.log(`  ✓ ${rel}`);
	} else {
		problems.push(`缺少 build/${rel}`);
	}
}

/** ---------- 2. 动态路由是否真的枚举出了页面 ---------- */
const postsDir = join(build, 'posts');
const postDirs = existsSync(postsDir)
	? readdirSync(postsDir).filter((d) => existsSync(join(postsDir, d, 'index.html')))
	: [];

if (postDirs.length > 0) {
	console.log(`  ✓ 文章页 ${postDirs.length} 个`);
} else {
	problems.push(
		'没有生成任何文章页——检查 src/lib/content/index.ts 的 import.meta.glob 是否匹配为空（必须用以 /src/ 开头的绝对路径）'
	);
}

const tagsDir = join(build, 'tags');
const tagCount = existsSync(tagsDir)
	? readdirSync(tagsDir).filter((d) => existsSync(join(tagsDir, d, 'index.html'))).length
	: 0;
console.log(`  ✓ 标签页 ${tagCount} 个`);

/** ---------- 3. 数据端点不能是空文件 ---------- */
for (const rel of ['rss.xml', 'sitemap.xml', 'llms.txt', 'llms-full.txt', 'search-index.json']) {
	const path = join(build, rel);
	if (!existsSync(path)) continue;
	const size = readFileSync(path, 'utf8').length;
	if (size < 50) problems.push(`build/${rel} 只有 ${size} 字节，疑似生成失败`);
}

/** ---------- 4. 首页必须真的列出了文章（而非走了空状态分支） ---------- */
if (postDirs.length > 0) {
	const home = readFileSync(join(build, 'index.html'), 'utf8');
	if (!/href="\/posts\//.test(home)) {
		problems.push('产物里存在文章页，但首页没有任何文章链接');
	}
}

/** ---------- 5. 提示框语法是否真的渲染成了 div ----------
 * 这类失效是完全静默的：引用块照常输出，页面不报错，只是没了样式。
 * 2026-09 踩过一次——`[!NOTE]` 被解析成 linkReference 节点而非 text 节点，
 * 检测逻辑永远匹配不上。所以必须显式校验。 */
let declaredTotal = 0;
let renderedTotal = 0;
let leakedMarker = false;

const srcPosts = join(root, 'src', 'content', 'posts');
if (existsSync(srcPosts)) {
	for (const file of readdirSync(srcPosts).filter((f) => f.endsWith('.svx'))) {
		const raw = readFileSync(join(srcPosts, file), 'utf8');
		// 草稿不进生产构建
		if (/^draft:\s*true\s*$/m.test(raw)) continue;
		// 跳过围栏代码块，避免把文档里的示例语法算进来
		const declared = [
			...raw
				.replace(/^```[\s\S]*?^```/gm, '')
				.matchAll(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/gm)
		];
		declaredTotal += declared.length;
	}
}

for (const dir of postDirs) {
	const body = readFileSync(join(postsDir, dir, 'index.html'), 'utf8');
	renderedTotal += (body.match(/class="callout callout-[a-z]+"/g) ?? []).length;
	if (/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/.test(body)) leakedMarker = true;
}

if (declaredTotal > 0) {
	if (renderedTotal < declaredTotal) {
		problems.push(
			`源码声明 ${declaredTotal} 个提示框，产物中只有 ${renderedTotal} 个渲染成了 div（检查 remarkCallouts 插件）`
		);
	} else {
		console.log(`  ✓ 提示框 ${renderedTotal} 个（源码声明 ${declaredTotal} 个）`);
	}
	if (leakedMarker) {
		problems.push('产物正文里残留 [!TYPE] 标记文本，说明提示框检测只匹配了部分语法形态');
	}
}

/** ---------- 结果 ---------- */
if (problems.length) {
	console.error('\n产物校验失败：');
	for (const p of problems) console.error(`  ✗ ${p}`);
	process.exit(1);
}
console.log('\n全部关键产物校验通过 ✓');
