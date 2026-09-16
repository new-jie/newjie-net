/**
 * 校验文章标题锚点：正文标题的 id 必须与目录链接一致。
 *
 * 为什么需要这个脚本：
 *   正文标题的 id 由 src/lib/rehype-heading-ids.ts 在 markdown 编译期写入，
 *   目录链接由 src/lib/content/index.ts 的 extractToc() 生成。
 *   两者若算法不一致，目录点击会静默失效——页面不报错，只是跳不动。
 *   这类 bug 很难在上线前发现，所以在构建前用脚本强制校验。
 *
 * 用法：node scripts/check-anchors.mjs
 * 依赖 Node 22+ 的类型剥离能力直接 import 项目里的 .ts 模块。
 */

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// 显式相对路径，Node 才能解析到 .ts 模块（$lib 别名只在 Vite 里有效）
const { createSlugger } = await import('../src/lib/slug.ts');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const postsDir = join(root, 'src', 'content', 'posts');

/** 与 src/lib/frontmatter.ts 一致的正文提取（这里只需要正文部分） */
const bodyOf = (raw) => {
	const normalized = raw.replace(/^\uFEFF/, '');
	if (!normalized.startsWith('---')) return normalized;
	const end = normalized.indexOf('\n---', 3);
	if (end === -1) return normalized;
	return normalized.slice(normalized.indexOf('\n', end + 1) + 1);
};

const files = (await readdir(postsDir)).filter((f) => f.endsWith('.svx'));

let problems = 0;
let checkedHeadings = 0;
let checkedLinks = 0;

for (const file of files) {
	const raw = await readFile(join(postsDir, file), 'utf8');
	const body = bodyOf(raw);

	// ---- 模拟 rehype 插件：对每个标题节点调用同一个 slugger ----
	const rehypeSlugger = createSlugger();
	const rehypeIds = [];
	const withoutCode = body.replace(/^```[\s\S]*?^```/gm, '');
	for (const line of withoutCode.split('\n')) {
		const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
		if (!m) continue;
		rehypeIds.push(rehypeSlugger(m[2]));
	}

	// ---- 模拟 extractToc：maxDepth=3，但深层标题也参与计数 ----
	const tocSlugger = createSlugger();
	const tocIds = [];
	for (const line of withoutCode.split('\n')) {
		const m = line.match(/^(#{2,6})\s+(.+?)\s*#*\s*$/);
		if (!m) continue;
		const id = tocSlugger(m[2]);
		if (m[1].length <= 3) tocIds.push(id);
	}

	checkedHeadings += rehypeIds.length;
	checkedLinks += tocIds.length;

	const rehypeSet = new Set(rehypeIds);
	const dangling = tocIds.filter((id) => !rehypeSet.has(id));

	if (dangling.length) {
		problems += dangling.length;
		console.error(`  ✗ ${file}`);
		for (const id of dangling) console.error(`      目录链接 #${id} 在正文标题中不存在`);
	} else {
		console.log(`  ✓ ${file}  （${rehypeIds.length} 个标题，${tocIds.length} 条目录项）`);
	}
}

console.log(`\n锚点校验：${files.length} 篇文章，${checkedHeadings} 个标题，${checkedLinks} 条目录链接`);
if (problems) {
	console.error(`发现 ${problems} 个失效锚点`);
	process.exit(1);
}
console.log('全部锚点均有对应标题 ✓');
