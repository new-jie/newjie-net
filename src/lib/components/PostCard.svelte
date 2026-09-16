<script lang="ts">
	/**
	 * 文章卡片
	 *
	 * 整张卡可点击，但用的是「标题里放链接 + ::after 铺满整卡」的经典写法，
	 * 而不是给 <div> 加 onclick：
	 *   1. 无 JS 也能跳转
	 *   2. 读屏软件能正确念出链接文字
	 *   3. 搜索引擎能跟进
	 *   4. 右键「在新标签页打开」正常工作
	 */
	import type { PostPreview } from '$lib/content';
	import { postPath } from '$lib/content';
	import PostDate from './PostDate.svelte';
	import TagChip from './TagChip.svelte';

	interface Props {
		post: PostPreview;
		/**
		 * 覆盖卡片链接。默认由 slug 推导。
		 * 设计系统验收页用它传 '#"，避免示例数据被预渲染器当成真实文章链接去爬取
		 * （爬不到就报 404 并中断构建）。
		 */
		href?: string;
	}

	let { post, href }: Props = $props();

	const target = $derived(href ?? postPath(post.slug));
</script>

<article class="card" class:pinned={post.pinned}>
	{#if post.pinned}
		<p class="flag">置顶</p>
	{/if}

	<h2 class="title">
		<a href={target}>{post.title}</a>
	</h2>

	<p class="desc">{post.description}</p>

	<footer class="meta">
		<PostDate date={post.date} />
		<span class="sep" aria-hidden="true">·</span>
		<span>约 {post.minutes} 分钟</span>
		{#if post.tags.length}
			<span class="sep" aria-hidden="true">·</span>
			<span class="tags">
				{#each post.tags as tag (tag)}
					<TagChip {tag} />
				{/each}
			</span>
		{/if}
	</footer>
</article>

<style>
	.card {
		position: relative;
		display: grid;
		gap: 0.5rem;
		padding: 1.25rem 1.25rem 1rem;
		border: 1px solid var(--m3c-outline-variant);
		border-radius: var(--m3-shape-large);
		background-color: var(--m3c-surface-container-low);
		transition:
			background-color var(--m3-easing-fast),
			border-color var(--m3-easing-fast),
			box-shadow var(--m3-easing-fast);
	}

	.card:hover {
		background-color: var(--m3c-surface-container);
		box-shadow: 0 1px 3px 1px color-mix(in srgb, var(--m3c-shadow) 15%, transparent);
	}

	/* 置顶卡用主色容器描边做低强度强调，不用整块高饱和底色 */
	.card.pinned {
		border-color: var(--m3c-primary);
		background-color: var(--m3c-primary-container-subtle);
	}

	.flag {
		position: absolute;
		top: -0.625rem;
		left: 1.25rem;
		margin: 0;
		padding: 0.125rem 0.625rem;
		border-radius: var(--m3-shape-full);
		background-color: var(--m3c-primary);
		color: var(--m3c-on-primary);
		font-size: 0.75rem;
		line-height: 1.333;
	}

	.title {
		margin: 0;
		font-size: 1.375rem;
		line-height: 1.273;
		font-weight: 600;
	}

	/* 用 ::after 把点击区域铺满整张卡 */
	.title a {
		color: var(--m3c-on-surface);
		text-decoration: none;
	}

	.title a::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
	}

	.title a:focus-visible {
		outline: none;
	}

	/* 焦点环画在卡片上，而不是被 ::after 覆盖的文字上 */
	.card:has(.title a:focus-visible) {
		outline: 2px solid var(--m3c-primary);
		outline-offset: 2px;
	}

	.desc {
		margin: 0;
		color: var(--m3c-on-surface-variant);
		font-size: 0.9375rem;
		line-height: 1.6;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.25rem;
		color: var(--m3c-on-surface-variant);
		font-size: 0.8125rem;
	}

	.sep {
		opacity: 0.6;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	/* 标签需要浮到 ::after 之上才可点 */
	.tags :global(.chip) {
		position: relative;
		z-index: 1;
	}
</style>
