/**
 * 一次性迁移脚本：把 site/ 的作品集页纳入博客的 static/
 *
 * 迁入内容（页面本身零改动）：
 *   site/portfolio/     → static/portfolio/
 *   site/portfolio-ali/ → static/portfolio-ali/
 *   site/vendor/        → static/vendor/      （shaka-player 整个目录原样保留）
 *
 * 刻意不带入：
 *   site/.git/          嵌套 git 仓库（会让主仓库把它当子模块）
 *   site/index.html     「建设中」占位页
 *   site/assets/        仅 root.css，只被上面那个占位页引用
 *   site/wrangler.jsonc 它指向独立的 newjie-net Worker，博客自己的配置已覆盖
 *   site/.assetsignore  Cloudflare 资源上传规则，仅对独立部署有意义
 *   site/.gitignore     同上
 *
 * 脚本保留在仓库里作为迁移记录，重复执行不会破坏已有文件（先删后拷）。
 * 日常不需要运行它——site/ 已是历史来源，之后的改动直接改 static/ 下对应文件。
 */

import { cpSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'site');
const dest = join(root, 'static');

if (!existsSync(src)) {
	console.error(`找不到来源目录 ${src}`);
	process.exit(1);
}

/** 要迁入的条目 */
const MIGRATE = ['portfolio', 'portfolio-ali', 'vendor'];

/** 顶层要排除的条目（相对 site/） */
const EXCLUDE_TOP = new Set([
	'.git',
	'index.html',
	'assets',
	'wrangler.jsonc',
	'wrangler.toml',
	'.assetsignore',
	'.gitignore'
]);

const walk = (dir, base = dir) => {
	const out = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walk(full, base));
		else out.push({ full, rel: relative(base, full).replace(/\\/g, '/'), size: statSync(full).size });
	}
	return out;
};

console.log('迁入 site/ 作品集内容\n');

for (const name of MIGRATE) {
	const from = join(src, name);
	const to = join(dest, name);

	if (!existsSync(from)) {
		console.log(`  · ${name}：来源不存在，跳过`);
		continue;
	}

	if (existsSync(to)) rmSync(to, { recursive: true, force: true });
	cpSync(from, to, { recursive: true });

	const files = walk(to);
	const bytes = files.reduce((s, f) => s + f.size, 0);
	console.log(`  ✓ ${name.padEnd(14)} ${String(files.length).padStart(4)} 个文件  ${(bytes / 1024 / 1024).toFixed(2)} MB`);
}

console.log('\n排除的条目：');
for (const name of EXCLUDE_TOP) {
	if (existsSync(join(src, name))) {
		const isDir = statSync(join(src, name)).isDirectory();
		console.log(`  · site/${name}${isDir ? '/' : ''}`);
	}
}

console.log('\n迁移完成。来源目录 site/ 保持不变。');
