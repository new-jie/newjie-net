<script lang="ts">
	/**
	 * 文章目录
	 *
	 * 用 IntersectionObserver 做滚动高亮。SSR 阶段不注册观察器，
	 * 因此首屏输出与客户端一致，不会 hydration 不匹配。
	 */
	import { browser } from '$app/environment';
	import type { TocItem } from '$lib/content';

	interface Props {
		items: TocItem[];
	}

	let { items }: Props = $props();

	let activeId = $state('');

	$effect(() => {
		if (!browser || items.length === 0) return;

		const headings = items
			.map((item) => document.getElementById(item.id))
			.filter((el): el is HTMLElement => el !== null);

		if (headings.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				// 取当前进入视口、且位置最靠上的标题
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
				if (visible.length > 0) activeId = visible[0].target.id;
			},
			{
				// 顶部留出 sticky 导航的高度，底部收窄，避免「刚进视口就高亮」
				rootMargin: '-5rem 0px -70% 0px',
				threshold: 0
			}
		);

		for (const heading of headings) observer.observe(heading);
		return () => observer.disconnect();
	});
</script>

{#if items.length > 0}
	<nav class="toc" aria-labelledby="toc-heading">
		<h2 id="toc-heading">本页目录</h2>
		<ol>
			{#each items as item (item.id)}
				<li class:child={item.depth > 2}>
					<a href="#{item.id}" aria-current={activeId === item.id ? 'location' : undefined}>
						{item.text}
					</a>
				</li>
			{/each}
		</ol>
	</nav>
{/if}

<style>
	.toc {
		position: sticky;
		top: 1.5rem;
		max-height: calc(100dvh - 3rem);
		overflow-y: auto;
		padding-left: 1rem;
		border-left: 2px solid var(--m3c-outline-variant);
	}

	h2 {
		margin: 0 0 0.75rem;
		color: var(--m3c-on-surface-variant);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	ol {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	li.child {
		padding-left: 0.875rem;
	}

	a {
		display: block;
		padding: 0.25rem 0.375rem;
		border-radius: var(--m3-shape-extra-small);
		color: var(--m3c-on-surface-variant);
		text-decoration: none;
		font-size: 0.8125rem;
		line-height: 1.45;
		transition:
			color var(--m3-easing-fast),
			background-color var(--m3-easing-fast);
	}

	a:hover {
		background-color: var(--m3c-surface-container-high);
		color: var(--m3c-on-surface);
	}

	a[aria-current='location'] {
		color: var(--m3c-primary);
		font-weight: 600;
	}
</style>
