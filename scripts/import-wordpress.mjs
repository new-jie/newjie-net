/**
 * WordPress 导出（WXR）导入器
 *
 * 从 WordPress 的 XML 导出文件生成 .svx 文章。
 *
 * 设计取舍：
 *
 * 1. 正文里的 <figure><img> 原样保留，不转成 Markdown 的 ![]() 语法。
 *    实测 mdsvex 会透传原始 HTML，所以保真度更高；转成 Markdown 会丢掉
 *    WordPress 图块的 class 与尺寸样式（width:840px 那种）。
 *
 * 2. 图片引用的是外部域名（R2 存储桶），不下载到本地。
 *    站点迁移前图片在 r2.eo.newjie.net，已统一改写到 r2.newjie.net。
 *
 * 3. 每个 slug 尽量用 ASCII 形式。WordPress 的 post_name 是百分号编码的
 *    中文，虽然也能用（本站 slugify 同样支持中文），但 ASCII 更可读、更易分享。
 *
 * 用法：
 *   node scripts/import-wordpress.mjs <导出文件.xml>
 *   node scripts/import-wordpress.mjs <导出文件.xml> --dry   仅预览不写文件
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(root, 'src', 'content', 'posts');

/** 图片域名改写：迁移前的旧域名 → 现在使用的域名 */
const IMAGE_DOMAIN_MAP = [['r2.eo.newjie.net', 'r2.newjie.net']];

/**
 * slug 映射表：键是正文里图片所在的目录名（R2 上的 pics/shots/<目录>/）。
 *
 * 用图片目录名而不是 WordPress 的 post_name 做键：post_name 是百分号编码的
 * 中文（`%e6%91%84...`），解码后还带 `·` 之类的字符，做键既不可读也易错；
 * 而图片目录名是作者自己起的、有语义的标识，稳定且自解释。
 */
const SLUG_BY_IMAGE_DIR = {
	yinChuanZhongA: 'yinchuan-zhong-a-axis',
	hohhotNaoBao: 'hohhot-naobao-village',
	weiNanHuaShan: 'weinan-huashan',
	yinChuanGuJin: 'yinchuan-old-and-new'
};

/** 直接跳过、不导入的条目 */
const SKIP = [
	{
		test: (p) => p.title === '世界，您好！',
		reason: 'WordPress 自带的示例文章，不是真实内容'
	}
];

// ---------- 解析 ----------

const argPath = process.argv[2];
const dryRun = process.argv.includes('--dry');

if (!argPath) {
	console.error('用法: node scripts/import-wordpress.mjs <导出文件.xml> [--dry]');
	process.exit(1);
}

const xml = readFileSync(argPath, 'utf8');

const tag = (block, name) => {
	const m = block.match(new RegExp(`<${name}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`));
	return m ? m[1].trim() : '';
};

const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

const posts = items.map((block) => ({
	title: tag(block, 'title'),
	content: tag(block, 'content:encoded'),
	postType: tag(block, 'wp:post_type'),
	status: tag(block, 'wp:status'),
	postName: tag(block, 'wp:post_name'),
	dateLocal: tag(block, 'wp:post_date'),
	modifiedLocal: tag(block, 'wp:post_modified'),
	categories: [...block.matchAll(/<category domain="category"[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/g)].map(
		(m) => m[1]
	)
}));

// ---------- 正文转换 ----------

/** 把 WordPress 区块注释 + HTML 转成干净的 Markdown/HTML 混合正文 */
const convertContent = (raw) => {
	let s = raw;

	// 段落块：去掉包裹的 <p></p> 与区块注释，只留文字
	s = s.replace(/<!--\s*wp:paragraph[^>]*-->\s*<p>([\s\S]*?)<\/p>\s*<!--\s*\/wp:paragraph\s*-->/g, (_, text) => {
		const clean = text.replace(/<[^>]+>/g, '').trim();
		return clean ? `\n${clean}\n` : '';
	});

	// 图片块：保留 <figure>，只去掉区块注释，并把属性归一到一行
	s = s.replace(/<!--\s*wp:image[^>]*-->\s*(<figure[\s\S]*?<\/figure>)\s*<!--\s*\/wp:image\s*-->/g, (_, fig) => {
		const one = fig.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
		return `\n${one}\n`;
	});

	// 残留的区块注释
	s = s.replace(/<!--\s*\/?wp:[\s\S]*?-->/g, '');

	// 域名改写
	for (const [from, to] of IMAGE_DOMAIN_MAP) s = s.split(from).join(to);

	// 清理：去掉空段落、压缩多余空行
	s = s
		.split('\n')
		.map((line) => line.trimEnd())
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();

	return s;
};

/**
 * 生成摘要。
 *
 * 摄影作品的正文只有「设备 + 镜头 + 图片」，直接当摘要没有信息量，
 * 因此改成从标题里提取地点，拼一句对读者（和搜索引擎）有意义的描述。
 */
const deriveDescription = (content, title) => {
	// 标题形如「摄影作品 | 银川 · 中阿之轴」→ 取竖线之后的部分
	const place = title.includes('|') ? title.split('|').slice(1).join('|').trim() : title;

	const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
	// 注意：正文里「设备」与「镜头」在同一段落，中间只有空格没有换行，
	// 所以这里不能用 [^ ]+ 匹配值（会在第一个空格处截断）
	const device = text.match(/设备：([\s\S]+?)\s*镜头：/)?.[1]?.trim();
	const lens = text.match(/镜头：([\s\S]+?)(?:\s*$|\s*<)/)?.[1]?.trim();

	const parts = [`${place}的摄影作品`];
	if (device) parts.push(`设备 ${device}`);
	if (lens) parts.push(`镜头 ${lens}`);
	const s = parts.join('，') + '。';

	return s.length > 300 ? s.slice(0, 297) + '…' : s;
};

const slugifyAscii = (text) =>
	text
		.normalize('NFKD')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

/**
 * 决定 slug：优先用图片目录名查表，查不到就用 WordPress post_name 里能提取的
 * ASCII 部分，最后回落到 post_name 原值（中文 slug，本站支持）。
 */
const resolveSlug = (post, content) => {
	const dir = content.match(/\/pics\/shots\/([^/]+)\//)?.[1];
	if (dir && SLUG_BY_IMAGE_DIR[dir]) return { slug: SLUG_BY_IMAGE_DIR[dir], via: `图片目录 ${dir}` };

	// post_name 解码后取 ASCII 片段
	const decoded = decodeURIComponent(post.postName);
	const ascii = slugifyAscii(decoded);
	if (ascii) return { slug: ascii, via: 'post_name 的 ASCII 片段' };

	return { slug: post.postName, via: 'post_name 原值（中文 slug）' };
};

// ---------- 生成 ----------

mkdirSync(OUT_DIR, { recursive: true });

let written = 0;
let skipped = 0;

console.log(`解析 ${argPath}\n`);

for (const post of posts) {
	if (post.postType !== 'post') {
		console.log(`  · 跳过（类型 ${post.postType}）：${post.title}`);
		skipped++;
		continue;
	}
	if (post.status !== 'publish') {
		console.log(`  · 跳过（状态 ${post.status}）：${post.title}`);
		skipped++;
		continue;
	}

	const skipRule = SKIP.find((r) => r.test(post));
	if (skipRule) {
		console.log(`  · 跳过「${post.title}」——${skipRule.reason}`);
		skipped++;
		continue;
	}

	const content = convertContent(post.content);
	const date = post.dateLocal.slice(0, 10);
	const modified = post.modifiedLocal.slice(0, 10);
	const { slug, via } = resolveSlug(post, content);

	const frontmatter = [
		'---',
		`title: ${post.title}`,
		`description: ${deriveDescription(content, post.title)}`,
		`date: ${date}`,
		modified && modified !== date ? `updated: ${modified}` : null,
		`tags: [摄影]`,
		`slug: ${slug}`,
		'---'
	]
		.filter(Boolean)
		.join('\n');

	const body = `${frontmatter}\n\n${content}\n`;
	const file = join(OUT_DIR, `${slug}.svx`);

	const images = (content.match(/<img /g) ?? []).length;
	console.log(`  ✓ ${post.title}`);
	console.log(`      slug=${slug}  (来源：${via})`);
	console.log(`      date=${date}  图片 ${images} 张  ${body.length} 字节`);

	if (!dryRun) writeFileSync(file, body, 'utf8');
	written++;
}

console.log(`\n${dryRun ? '[预览模式] ' : ''}写入 ${written} 篇，跳过 ${skipped} 篇`);
if (!dryRun) console.log(`输出目录：${OUT_DIR}`);
