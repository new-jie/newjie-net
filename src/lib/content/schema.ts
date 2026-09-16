/**
 * 文章 frontmatter 的校验规则
 *
 * 这是内容管线的护栏：字段写错、日期格式不对、tag 重复，
 * 都会在构建期直接报错并指出是哪个文件，而不是等上线后才发现页面缺东西。
 */
import { z } from 'zod';

/** ISO 日期（YYYY-MM-DD）。用字符串校验后再转 Date，避免时区漂移。 */
const isoDate = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, '日期必须是 YYYY-MM-DD 格式')
	.refine((v) => !Number.isNaN(Date.parse(v)), '不是合法日期');

export const postFrontmatterSchema = z.object({
	/** 文章标题，必填 */
	title: z.string().min(1, '标题不能为空').max(120, '标题过长'),

	/** 摘要，用于列表页、SEO description 与 llms.txt */
	description: z.string().min(1, '摘要不能为空').max(300, '摘要过长'),

	/** 首次发布日 */
	date: isoDate,

	/** 最后更新日，可选 */
	updated: isoDate.optional(),

	/** 标签，可选，自动去重 */
	tags: z
		.array(z.string().min(1))
		.default([])
		.transform((tags) => [...new Set(tags)]),

	/** 草稿：仅在 dev 环境可见，生产构建会被过滤掉 */
	draft: z.boolean().default(false),

	/**
	 * 自定义 URL 片段，可选。
	 * 不填则用标题生成（中文标题会保留中文字符，URL 里以百分号编码出现）。
	 * 想用纯 ASCII 路径就显式指定，例如 slug: material-3-color-system
	 */
	slug: z
		.string()
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug 只能是小写字母、数字和连字符')
		.optional(),

	/** 封面图路径（放 static 目录下），可选 */
	cover: z.string().optional(),

	/** 是否在首页置顶 */
	pinned: z.boolean().default(false)
});

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

/**
 * 由标题生成 URL 片段。
 * 中文等非 ASCII 字符予以保留（浏览器会显示为百分号编码，但可读性优于纯哈希），
 * 拉丁字母转小写、空格与连续分隔符归一为单个连字符。
 */
export const slugify = (title: string): string =>
	title
		.normalize('NFC')
		.trim()
		.toLowerCase()
		.replace(/[\s_]+/g, '-')
		.replace(/[^\p{L}\p{N}-]+/gu, '')
		.replace(/-{2,}/g, '-')
		.replace(/^-|-$/g, '');
