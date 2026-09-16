import { error } from '@sveltejs/kit';
import {
	estimateMinutes,
	extractToc,
	getAdjacent,
	getComponent,
	getPost,
	getPosts,
	getRelated,
	toPreview
} from '$lib/content';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

/**
 * 枚举所有公开文章的 slug。
 *
 * 这是纯静态方案的关键一步：动态路由无法被自动发现，必须显式返回所有页面参数，
 * 否则一篇都不会生成。adapter-static 的 strict 模式会在漏写时报错。
 */
export const entries: EntryGenerator = () => getPosts().map((post) => ({ slug: post.slug }));

export const load: PageLoad = async ({ params }) => {
	const post = getPost(params.slug);
	if (!post) error(404, `找不到文章：${params.slug}`);

	const component = await getComponent(post.slug);
	const { prev, next } = getAdjacent(post.slug);

	return {
		post: toPreview(post),
		// 正文与目录是渲染必需的，随首屏一起返回
		content: post.content,
		toc: extractToc(post.content, 3),
		minutes: estimateMinutes(post.content),
		component,
		prev: prev ? toPreview(prev) : undefined,
		next: next ? toPreview(next) : undefined,
		related: getRelated(post.slug, 2).map(toPreview)
	};
};
