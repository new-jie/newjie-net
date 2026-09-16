/** 日期与 XML 相关的共享格式化工具（RSS / sitemap / 页面共用） */

/**
 * RFC 822 日期（RSS 的 pubDate 要求）。
 * 用 UTC 输出，避免构建机时区影响产物内容——否则同一份代码在不同 CI 上
 * 生成的 RSS 会不一致，产生无意义的 diff。
 */
export const toRfc822 = (isoDate: string): string => {
	const date = new Date(`${isoDate}T00:00:00Z`);
	return date.toUTCString();
};

/**
 * 站点 canonical 基地址。
 *
 * 优先读环境变量 SITE_ORIGIN，未设置时回落到下面的默认域名。
 * 它会被烘焙进 RSS / Sitemap / llms.txt 的绝对地址——纯静态站没有运行时
 * 环境变量，所以只能在构建期注入。
 *
 * 本地开发：在项目根目录建 .env（参考 .env.example）
 * Cloudflare Workers Builds：在构建设置里配置同名变量
 * 换域名时改这一行默认值即可，不必额外配置环境变量。
 */
export const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://www.newjie.net').replace(/\/+$/, '');

export const SITE_NAME = '博客';
export const SITE_DESCRIPTION = '记录 SvelteKit、Material Design 3 与 Cloudflare Workers 的实践笔记。';
export const SITE_LANGUAGE = 'zh-CN';

/** 拼接绝对地址 */
export const absolute = (path: string): string =>
	`${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;

/** XML 文本转义。RSS 与 sitemap 都必须做，否则标题里的 & < > 会让整个 feed 解析失败。 */
export const escapeXml = (value: string): string =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
