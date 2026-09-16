import { getArchive } from '$lib/content';
import { postPath } from '$lib/content';

export function load() {
	return {
		years: getArchive().map(({ year, posts }) => ({
			year,
			posts: posts.map((post) => ({
				slug: post.slug,
				title: post.title,
				date: post.date,
				path: postPath(post.slug)
			}))
		}))
	};
}
