/**
 * 标题锚点 slug 生成
 *
 * 这个模块被两处共用：
 *   1. src/lib/rehype-heading-ids.ts —— 给 markdown 编译出的 <h2>/<h3> 加 id
 *   2. src/lib/content/index.ts     —— 生成目录里的跳转链接
 *
 * 两处必须使用完全相同的算法，否则目录链接会静默失效（点击没反应，但页面不报错）。
 * scripts/check-anchors.mjs 会在构建前校验两者的一致性。
 *
 * 规则对齐 github-slugger：转小写、空格转连字符、去掉标点、保留中文与字母数字，
 * 同一文档内重复标题追加 -1、-2……
 */

export const slugifyHeading = (text: string): string => {
	const stripped = text
		// 行内代码
		.replace(/`([^`]+)`/g, '$1')
		// 链接保留文字
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		// 图片保留 alt
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
		// 强调、加粗、删除线标记
		.replace(/[*_~]/g, '')
		.trim();

	const slug = stripped
		.normalize('NFC')
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^\p{L}\p{N}-]+/gu, '')
		.replace(/-{2,}/g, '-')
		.replace(/^-|-$/g, '');

	return slug || 'section';
};

/** 带去重计数的 slug 生成器，同一文档内实例化一次 */
export const createSlugger = () => {
	const seen = new Map<string, number>();
	return (text: string): string => {
		const base = slugifyHeading(text);
		const count = seen.get(base) ?? 0;
		seen.set(base, count + 1);
		return count === 0 ? base : `${base}-${count}`;
	};
};
