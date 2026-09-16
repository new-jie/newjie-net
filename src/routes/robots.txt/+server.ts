/**
 * robots.txt
 *
 * 因为站点是纯静态的，这里不需要任何动态逻辑——但注意一个副作用：
 * 一旦在 robots.txt 里声明 sitemap，就必须保证 /sitemap.xml/ 路径正确，
 * 少一个末尾斜杠会 301 跳转，部分抓取器不跟随。
 */
import { SITE_ORIGIN } from '$lib/format';

export const prerender = true;

export const GET = () => {
	const body = `User-agent: *
Allow: /

# 构建产物与源文件不需要被索引
Disallow: /_app/

Sitemap: ${SITE_ORIGIN}/sitemap.xml/
`;

	return new Response(body, {
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
};
