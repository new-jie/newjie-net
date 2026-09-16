/**
 * RSS 2.0 订阅源
 *
 * 作为文件系统路由在构建期固化成静态文件，所以：
 *   - 不产生任何 Worker 调用
 *   - 新文章发布 = 重新构建，天然不需要缓存失效逻辑
 *
 * 内容形式是「摘要 + 原文链接」而不是全文：
 * 全文 feed 会把整站内容再复制一份塞进 XML，并显著放大抓取流量，
 * 而摘要足以让读者判断要不要点进来。
 */
import { getPosts, toPlainText, postPath } from '$lib/content';
import {
	SITE_NAME,
	SITE_DESCRIPTION,
	SITE_ORIGIN,
	SITE_LANGUAGE,
	absolute,
	escapeXml,
	toRfc822
} from '$lib/format';

export const prerender = true;

export const GET = () => {
	const posts = getPosts();

	const items = posts
		.map((post) => {
			const url = absolute(postPath(post.slug));
			// 摘要限长，避免超长 description 让 feed 体积失控
			const excerpt = toPlainText(post.content).replace(/\s+/g, ' ').slice(0, 280);

			return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${toRfc822(post.date)}</pubDate>
${post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join('\n')}
      <description>${escapeXml(post.description || excerpt)}</description>
    </item>`;
		})
		.join('\n');

	// 有文章时用最新一篇的日期作为 feed 的 lastBuildDate
	const lastBuildDate = posts.length > 0 ? toRfc822(posts[0].date) : toRfc822('1970-01-01');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(SITE_ORIGIN)}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>${SITE_LANGUAGE}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(absolute('/rss.xml/'))}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

	return new Response(xml, {
		headers: {
			// 必须显式设置：路由段名里的 .xml 只影响 URL 路径，与 MIME 无关。
			// 少了这一行，浏览器会把 RSS 当纯文本直接显示出来。
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
