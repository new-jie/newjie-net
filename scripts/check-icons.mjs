/**
 * 校验 src/lib/icons.ts 里引用的图标在 @ktibow/iconset-material-symbols 中确实存在。
 *
 * 背景：图标集用的是 M3 图标命名，但并非每个图标都有 outline / rounded / sharp 变体
 * （例如 arrow-back 只有默认、rounded、sharp）。写错名字时 Rollup 会报
 * "failed to resolve import"，但不会告诉你是哪个变体缺失。
 *
 * 用法：node scripts/check-icons.mjs
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src', 'lib', 'icons.ts');
const pkgDir = join(root, 'node_modules', '@ktibow', 'iconset-material-symbols');

const code = await readFile(src, 'utf8');
const re = /from\s+'@ktibow\/iconset-material-symbols\/([\w-]+)\.js'/g;
const names = [...code.matchAll(re)].map((m) => m[1]);

if (names.length === 0) {
	console.error('没有从 icons.ts 中解析到任何图标导入');
	process.exit(1);
}

const missing = [];
for (const name of names) {
	const file = join(pkgDir, `${name}.js`);
	if (!existsSync(file)) missing.push(name);
}

console.log(`图标校验：共 ${names.length} 个`);
if (missing.length) {
	console.error(`\n以下 ${missing.length} 个图标不存在：`);
	for (const name of missing) {
		// 给出可用的近似变体，方便直接替换
		const [base] = name.split(/-outline$|-rounded$|-sharp$/);
		const candidates = [];
		for (const suffix of ['', '-outline', '-rounded', '-sharp']) {
			if (existsSync(join(pkgDir, `${base}${suffix}.js`))) candidates.push(`${base}${suffix}`);
		}
		console.error(`  - ${name}${candidates.length ? `  → 可用：${candidates.join(', ')}` : '  → 无同源变体'}`);
	}
	process.exit(1);
}
console.log('全部存在 ✓');
