/**
 * 客户端搜索索引
 *
 * 在构建期生成的静态 JSON，浏览器按需拉取后在本地做匹配。
 * 之所以不引入 Pagefind 之类的方案：那些工具要在构建完成后再扫一遍产物目录，
 * 多一个后置步骤与一套额外的索引格式；而文章元数据在构建期本来就是现成的，
 * 直接产出 JSON 更简单，也更容易控制字段。
 *
 * 体积控制：excerpt 截断到 300 字，不塞入完整正文。
 * 完整正文已经存在于每篇文章的 HTML 里，重复一份只会让索引无谓膨胀。
 */
import { getPosts, postPath, toPlainText } from '$lib/content';

export const prerender = true;

export const GET = () => {
	const posts = getPosts().map((post) => ({
		slug: post.slug,
		path: postPath(post.slug),
		title: post.title,
		description: post.description,
		tags: post.tags,
		date: post.date,
		minutes: post.minutes,
		excerpt: toPlainText(post.content).replace(/\s+/g, ' ').slice(0, 300)
	}));

	return new Response(JSON.stringify({ generatedAt: new Date().toISOString(), posts }), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
