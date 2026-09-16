import { getPosts, toPreview } from '$lib/content';

export function load() {
	const posts = getPosts().map(toPreview);
	return {
		posts,
		// 置顶与否已在 getPosts 里排好序，这里只做一次分组
		pinned: posts.filter((post) => post.pinned),
		latest: posts.filter((post) => !post.pinned)
	};
}
