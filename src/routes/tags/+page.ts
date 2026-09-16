import { getTags } from '$lib/content';

export function load() {
	return { tags: getTags() };
}
