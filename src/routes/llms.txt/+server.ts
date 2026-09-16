/**
 * llms.txt
 *
 * 面向大语言模型的站点索引，遵循 llms.txt 提案的格式：
 * H1 站点名 → 引用块摘要 → 分节链接列表。
 *
 * 为什么值得单独提供一个文件：LLM 抓取器拿到的是渲染后的 HTML，
 * 里面混着导航、页脚、样式类名。一个纯文本的「站点是什么 + 有哪些文章」
 * 索引，能让抓取器用极低成本建立正确的站点认知。
 *
 * 纯文本版本见 /llms-full.txt。
 */
import { getPosts, postPath } from '$lib/content';
import { SITE_NAME, SITE_DESCRIPTION, SITE_ORIGIN, absolute } from '$lib/format';

export const prerender = true;

export const GET = () => {
	const posts = getPosts();

	// 按标签分组，让索引结构反映内容的实际组织方式
	const byTag = new Map<string, typeof posts>();
	for (const post of posts) {
		for (const tag of post.tags) {
			byTag.set(tag, [...(byTag.get(tag) ?? []), post]);
		}
	}
	const tagGroups = [...byTag.entries()].sort((a, b) => a[0].localeCompare(b[0]));

	const pinned = posts.filter((post) => post.pinned);
	const rest = posts.filter((post) => !post.pinned);

	const line = (post: (typeof posts)[number]) =>
		`- [${post.title}](${absolute(postPath(post.slug))}): ${post.description}`;

	const sections = [
		pinned.length ? `## 置顶\n\n${pinned.map(line).join('\n')}` : '',
		rest.length ? `## 全部文章\n\n${rest.map(line).join('\n')}` : '',
		...tagGroups.map(([tag, items]) => `## 标签：${tag}\n\n${items.map(line).join('\n')}`),
		`## 订阅与索引\n\n- [RSS](${absolute('/rss.xml/')}): 新文章订阅源\n- [Sitemap](${absolute('/sitemap.xml/')}): 全部页面清单\n- [全文纯文本](${absolute('/llms-full.txt')}): 本站全部文章的正文纯文本`
	].filter(Boolean);

	const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

本站是纯静态站点，全部内容在构建期生成，无数据库与运行时。
文章以中文撰写，技术术语保留英文原文。
目前共 ${posts.length} 篇文章，覆盖 ${byTag.size} 个标签。

${sections.join('\n\n')}
`;

	return new Response(body, {
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
};
