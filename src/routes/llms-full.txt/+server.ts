/**
 * llms-full.txt
 *
 * 全部文章的正文纯文本，供大模型一次性抓取。
 *
 * 关键取舍：**丢掉围栏代码块**（见 toPlainText）。
 * 保留代码会让文件体积翻倍，而代码在原文页面里本来就完整可访问；
 * 对「理解文章在讲什么」这个目的，散文部分才是信息密度最高的。
 *
 * 如果需要带代码的完整版本，把 toPlainText 换成只做标题与链接清理的
 * 轻量版本即可——但请先评估体积：本站三篇文章就会从约 10KB 涨到 20KB 以上。
 */
import { getPosts, toPlainText, postPath } from '$lib/content';
import { SITE_NAME, SITE_DESCRIPTION, absolute } from '$lib/format';

export const prerender = true;

export const GET = () => {
	const posts = getPosts();

	const header = `# ${SITE_NAME} — 全部文章正文

> ${SITE_DESCRIPTION}

本文件包含本站全部 ${posts.length} 篇文章的正文（已去除 Markdown 标记与代码块）。
每篇文章以 "===== 文章标题 =====" 分隔，并标注原文地址与日期。
`;

	const sections = posts.map((post) => {
		const url = absolute(postPath(post.slug));
		const headings = post.tags.length ? `标签：${post.tags.join('、')}\n` : '';
		return `===== ${post.title} =====
原文：${url}
日期：${post.date}${post.updated ? `（更新于 ${post.updated}）` : ''}
${headings}
${toPlainText(post.content)}`;
	});

	const body = `${header}\n${sections.join('\n\n\n')}\n`;

	return new Response(body, {
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
};
