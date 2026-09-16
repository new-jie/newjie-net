/**
 * Sitemap
 *
 * 与 RSS 一样在构建期生成静态文件。
 * 只收录公开页面：草稿与 404 页面不能进来。
 */
import { getPosts, getTags, postPath, tagPath } from '$lib/content';
import { absolute, escapeXml } from '$lib/format';

export const prerender = true;

interface UrlEntry {
	loc: string;
	lastmod?: string;
	changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
	priority?: string;
}

export const GET = () => {
	const posts = getPosts();
	const tags = getTags();

	// 首页与列表页用最新文章的日期作为 lastmod
	const latest = posts[0]?.updated ?? posts[0]?.date;

	const entries: UrlEntry[] = [
		{ loc: absolute('/'), lastmod: latest, changefreq: 'daily', priority: '1.0' },
		{ loc: absolute('/archive/'), lastmod: latest, changefreq: 'weekly', priority: '0.6' },
		{ loc: absolute('/tags/'), lastmod: latest, changefreq: 'weekly', priority: '0.5' },
		...posts.map((post) => ({
			loc: absolute(postPath(post.slug)),
			lastmod: post.updated ?? post.date,
			changefreq: 'monthly' as const,
			priority: post.pinned ? '0.9' : '0.8'
		})),
		...tags.map(({ tag }) => ({
			loc: absolute(tagPath(tag)),
			lastmod: latest,
			changefreq: 'weekly' as const,
			priority: '0.4'
		}))
	];

	const urls = entries
		.map((entry) => {
			const parts = [`    <loc>${escapeXml(entry.loc)}</loc>`];
			if (entry.lastmod) parts.push(`    <lastmod>${entry.lastmod}</lastmod>`);
			if (entry.changefreq) parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
			if (entry.priority) parts.push(`    <priority>${entry.priority}</priority>`);
			return `  <url>\n${parts.join('\n')}\n  </url>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

	return new Response(xml, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
