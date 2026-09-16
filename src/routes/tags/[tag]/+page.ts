import { getPosts, tagPath, toPreview } from '$lib/content';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () =>
	getPosts()
		.flatMap((post) => post.tags)
		.filter((tag, i, all) => all.indexOf(tag) === i)
		.map((tag) => ({ tag }));

export const load: PageLoad = ({ params }) => {
	// params.tag 已被 SvelteKit 解码，可以直接与 frontmatter 里的标签比较
	const posts = getPosts().filter((post) => post.tags.includes(params.tag));

	return {
		tag: params.tag,
		tagUrl: tagPath(params.tag),
		posts: posts.map(toPreview)
	};
};
