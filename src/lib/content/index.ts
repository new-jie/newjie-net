/**
 * 内容索引
 *
 * 文章以 .svx 文件形式存放在 src/content/posts/，通过 import.meta.glob 在
 * 构建期静态收集（不是运行时读文件系统），因此：
 *
 * 1. 新增文章只需丢一个 .svx 文件，无需改任何代码
 * 2. 校验失败会在构建期直接失败并指出文件与字段
 * 3. 纯静态站没有运行时文件系统可言，glob 是唯一可行的收集方式
 *
 * 索引是惰性构建并缓存的：devalue 序列化不会把 markdown 正文带进
 * 客户端，因此首页不会因为文章多而变大。
 */
import { dev } from '$app/environment';
import { parseFrontmatter } from '$lib/frontmatter';
import { createSlugger } from '$lib/slug';
import { postFrontmatterSchema, slugify, type PostFrontmatter } from './schema';

/**
 * 文章模块映射。
 *
 * 必须使用以 `/` 开头的**绝对路径** glob（相对项目根 = src 目录），
 * 不要用 '../content/posts/*.svx' 这类相对路径：
 * 在本项目的构建环境下相对路径 glob 会静默匹配为空对象——不报错，
 * 只是 getPosts() 返回空数组，于是动态路由的 entries() 返回空、
 * 所有文章页面都不生成，最后只得到一句含糊的
 * "routes were marked as prerenderable, but were not prerendered"。
 * 这个坑很隐蔽，改动此处务必用 npm run build 后的 build/ 目录内容验证。
 */
const componentModules = import.meta.glob<{ default: unknown }>('/src/content/posts/*.svx');
const rawModules = import.meta.glob<string>('/src/content/posts/*.svx', {
	eager: true,
	query: '?raw',
	import: 'default'
});

export interface PostEntry extends PostFrontmatter {
	/** URL 片段 */
	slug: string;
	/** 源文件名，用于构建期报错定位 */
	file: string;
	/** 正文（不含 frontmatter） */
	content: string;
	/** 预估阅读时长（分钟） */
	minutes: number;
}

export interface TocItem {
	depth: number;
	text: string;
	id: string;
}

/**
 * 可安全序列化到客户端的文章摘要。
 *
 * 不要把完整的 PostEntry 塞进 load 返回值：里面的 content 是整篇 markdown 正文，
 * SvelteKit 会把它 devalue 序列化进 HTML。首页列 20 篇就是几百 KB 的冗余数据。
 */
export interface PostPreview {
	slug: string;
	title: string;
	description: string;
	date: string;
	updated?: string;
	tags: string[];
	minutes: number;
	pinned: boolean;
	cover?: string;
}

export const toPreview = (post: PostEntry): PostPreview => ({
	slug: post.slug,
	title: post.title,
	description: post.description,
	date: post.date,
	updated: post.updated,
	tags: post.tags,
	minutes: post.minutes,
	pinned: post.pinned,
	cover: post.cover
});

/**
 * 文章 URL 路径。集中在这里生成，避免各处编码方式不一致。
 *
 * 为什么必须集中：`entries()` 返回的 slug 会被 SvelteKit 用于解析路由，
 * 而页面里的链接是 URL。若一边用 encodeURI、一边用 encodeURIComponent，
 * 或只编码部分字符，预渲染器会认为「页面上有链接指向没有生成的页面」而报 404。
 * 中文标题生成的 slug 会踩这个坑，纯 ASCII slug 不会——所以很容易漏测。
 *
 * 本站在所有位置统一使用 encodeURIComponent 的结果。
 *
 * 注意：SvelteKit 会自动给 href 属性做属性转义，
 * 而转义后的 & 在 URL 里仍是合法字符，两者不会冲突。
 */
export const postPath = (slug: string): string => `/posts/${encodeURIComponent(slug)}/`;

/** 标签 URL 路径 */
export const tagPath = (tag: string): string => `/tags/${encodeURIComponent(tag)}/`;

/**
 * 阅读时长估算。
 *
 * 不要直接用 reading-time 之类的库：它们按空格分词，中文会被当成一个超长单词，
 * 结果是「1 分钟」这种明显错误的数字。
 * 这里按 CJK 字符数 / 400 + 拉丁词数 / 200 计算。
 */
export const estimateMinutes = (content: string): number => {
	const cjk = (content.match(/[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) ?? []).length;
	const latinWords = (content.replace(/[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
	const minutes = cjk / 400 + latinWords / 200;
	return Math.max(1, Math.round(minutes));
};

/** 统计 CJK 与拉丁字符总数，用于 llms.txt 的规模描述 */
export const countChars = (content: string): number => content.replace(/\s+/g, '').length;

const buildIndex = (): PostEntry[] => {
	const entries: PostEntry[] = [];

	for (const [path, raw] of Object.entries(rawModules)) {
		// '../content/posts/foo.svx' → 'foo.svx'
		const file = path.split('/').pop() ?? path;

		let parsed: ReturnType<typeof parseFrontmatter>;
		try {
			parsed = parseFrontmatter(raw, file);
		} catch (error) {
			throw new Error(`[内容管线] ${file}: ${(error as Error).message}`);
		}

		const result = postFrontmatterSchema.safeParse(parsed.data);
		if (!result.success) {
			const issues = result.error.issues
				.map((issue) => `  · ${issue.path.join('.') || '(根)'}: ${issue.message}`)
				.join('\n');
			throw new Error(`[内容管线] ${file} 的 frontmatter 校验失败：\n${issues}`);
		}

		const data = result.data;
		const slug = data.slug ?? slugify(data.title);

		if (!slug) {
			throw new Error(`[内容管线] ${file}: 无法从标题生成 URL 片段，请显式指定 slug 字段`);
		}
		if (entries.some((entry) => entry.slug === slug)) {
			const dup = entries.find((entry) => entry.slug === slug);
			throw new Error(`[内容管线] ${file}: slug "${slug}" 与 ${dup?.file} 重复`);
		}

		entries.push({
			...data,
			slug,
			file,
			content: parsed.content,
			minutes: estimateMinutes(parsed.content)
		});
	}

	return entries.sort((a, b) => {
		// 置顶优先，其次按发布日期倒序
		if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
		return b.date.localeCompare(a.date);
	});
};

let cache: PostEntry[] | null = null;

/** 全部文章（生产构建自动剔除草稿） */
export const getPosts = (): PostEntry[] => {
	cache ??= buildIndex();
	return dev ? cache : cache.filter((post) => !post.draft);
};

export const getPost = (slug: string): PostEntry | undefined =>
	getPosts().find((post) => post.slug === slug);

/** 所有标签及其计数，按文章数倒序 */
export const getTags = (): { tag: string; count: number }[] => {
	const counts = new Map<string, number>();
	for (const post of getPosts()) {
		for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
	}
	return [...counts.entries()]
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
};

/** 按年归档，年份倒序 */
export const getArchive = (): { year: string; posts: PostEntry[] }[] => {
	const byYear = new Map<string, PostEntry[]>();
	for (const post of getPosts()) {
		const year = post.date.slice(0, 4);
		byYear.set(year, [...(byYear.get(year) ?? []), post]);
	}
	return [...byYear.entries()]
		.map(([year, posts]) => ({ year, posts }))
		.sort((a, b) => b.year.localeCompare(a.year));
};

/** 相邻文章导航：列表中的上一篇 / 下一篇 */
export const getAdjacent = (slug: string): { prev?: PostEntry; next?: PostEntry } => {
	const posts = getPosts();
	const i = posts.findIndex((post) => post.slug === slug);
	if (i === -1) return {};
	return { prev: posts[i + 1], next: posts[i - 1] };
};

/** 取指定 slug 列表的文章（用于相关文章推荐） */
export const getRelated = (slug: string, limit = 3): PostEntry[] => {
	const current = getPost(slug);
	if (!current) return [];
	const tags = new Set(current.tags);
	return getPosts()
		.filter((post) => post.slug !== slug && post.tags.some((tag) => tags.has(tag)))
		.slice(0, limit);
};

/** 取编译后的 .svx 组件 */
export const getComponent = async (slug: string): Promise<unknown> => {
	const post = getPost(slug);
	if (!post) throw new Error(`找不到文章：${slug}`);
	// glob 的 key 是 '/src/content/posts/xxx.svx' 形式的绝对路径，
	// 与文件在 src/content/posts 下的相对路径一一对应
	const path = `/src/content/posts/${post.file}`;
	const loader = componentModules[path];
	if (!loader) {
		throw new Error(
			`找不到文章组件：${path}（已收集到的 key：${Object.keys(componentModules).join(', ') || '空'}）`
		);
	}
	const mod = await loader();
	return mod.default;
};

/**
 * 从 markdown 正文抽取目录，并为标题生成锚点 id。
 *
 * 使用与 rehype 插件相同的 createSlugger（见 src/lib/slug.ts），
 * 保证目录链接与正文标题的 id 完全对应。改动任何一边都要同步另一边，
 * scripts/check-anchors.mjs 会校验这一点。
 */
export const extractToc = (content: string, maxDepth = 3): TocItem[] => {
	const items: TocItem[] = [];
	const slugger = createSlugger();

	// 跳过围栏代码块，避免把代码里的 # 当成标题
	const withoutCode = content.replace(/^```[\s\S]*?^```/gm, '');

	for (const line of withoutCode.split('\n')) {
		const match = line.match(/^(#{2,6})\s+(.+?)\s*#*\s*$/);
		if (!match) continue;

		const depth = match[1].length;
		const raw = match[2];
		// 即使超过 maxDepth 也要参与计数，否则与 rehype 插件的去重序号会错位
		const id = slugger(raw);
		if (depth > maxDepth) continue;

		items.push({ depth, text: stripInlineMarkup(raw), id });
	}

	return items;
};

/** 去掉行内标记，得到纯文本标题 */
export const stripInlineMarkup = (text: string): string =>
	text
		.replace(/`([^`]+)`/g, '$1')
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		.replace(/[*_~]/g, '')
		.trim();

/**
 * markdown 转近似纯文本。
 *
 * 用于 RSS 描述与 llms-full.txt：这些消费方（阅读器、大模型抓取器）
 * 不需要渲染，保留原始标记只会变成噪音。
 * 这里不做真正的 markdown 渲染——那需要引入完整解析器，
 * 而目标格式恰恰是「不要格式」。
 */
export const toPlainText = (markdown: string): string =>
	markdown
		// 围栏代码块：整体丢弃（避免把代码当成正文；代码在文章里本来就有索引）
		.replace(/^```[\s\S]*?^```/gm, '')
		// HTML 注释
		.replace(/<!--[\s\S]*?-->/g, '')
		// 标题的行首 #
		.replace(/^#{1,6}\s+/gm, '')
		// 引用与列表符号
		.replace(/^>\s?/gm, '')
		.replace(/^\s*[-*+]\s+/gm, '')
		.replace(/^\s*\d+\.\s+/gm, '')
		// 表格分隔行
		.replace(/^\|[\s:|-]+\|$/gm, '')
		// 表格竖线
		.replace(/^\|/gm, '')
		.replace(/\|$/gm, '')
		.replace(/\s*\|\s*/g, ' ')
		// 行内标记
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		.replace(/[*_~`]/g, '')
		// 水平线
		.replace(/^\s*-{3,}\s*$/gm, '')
		// 压缩连续空行
		.replace(/\n{3,}/g, '\n\n')
		.split('\n')
		.map((line) => line.trim())
		.join('\n')
		.trim();
