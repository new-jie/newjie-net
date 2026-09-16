<script lang="ts">
	import type { Component } from 'svelte';
	import { postPath } from '$lib/content';
	import PostDate from '$lib/components/PostDate.svelte';
	import PostCard from '$lib/components/PostCard.svelte';
	import Prose from '$lib/components/Prose.svelte';
	import TagChip from '$lib/components/TagChip.svelte';
	import Toc from '$lib/components/Toc.svelte';

	const { data } = $props();

	const canonical = $derived(postPath(data.post.slug));

	// mdsvex 编译出的 .svx 组件。Svelte 5 支持把组件赋值给首字母大写的变量后
	// 直接 <Article /> 渲染（已取代 <svelte:component>）。
	// 类型必须写成 Component，否则 TS 会推断为 never 而报「不可构造」。
	const Article = $derived(data.component as Component);
</script>

<svelte:head>
	<title>{data.post.title}</title>
	<meta name="description" content={data.post.description} />
	<link rel="canonical" href={canonical} />

	<!-- Open Graph / Twitter -->
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.post.title} />
	<meta property="og:description" content={data.post.description} />
	<meta property="article:published_time" content={data.post.date} />
	{#if data.post.updated}
		<meta property="article:modified_time" content={data.post.updated} />
	{/if}
	{#each data.post.tags as tag (tag)}
		<meta property="article:tag" content={tag} />
	{/each}
	<meta name="twitter:card" content="summary_large_image" />

	<!-- 结构化数据：让搜索引擎理解这是一篇文章 -->
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: data.post.title,
		description: data.post.description,
		datePublished: data.post.date,
		dateModified: data.post.updated ?? data.post.date,
		keywords: data.post.tags.join(', '),
		wordCount: data.content.replace(/\s+/g, '').length,
		inLanguage: 'zh-CN'
	})}<\/script>`}
</svelte:head>

<article class="post">
	<header class="post-head">
		<h1>{data.post.title}</h1>
		<p class="meta">
			<PostDate date={data.post.date} />
			{#if data.post.updated && data.post.updated !== data.post.date}
				<span class="sep" aria-hidden="true">·</span>
				<span>更新于 <PostDate date={data.post.updated} /></span>
			{/if}
			<span class="sep" aria-hidden="true">·</span>
			<span>约 {data.minutes} 分钟</span>
		</p>
		{#if data.post.tags.length}
			<ul class="tags">
				{#each data.post.tags as tag (tag)}
					<li><TagChip {tag} /></li>
				{/each}
			</ul>
		{/if}
	</header>

	<div class="body">
		<Prose>
			<Article />
		</Prose>

		<aside class="aside">
			<Toc items={data.toc} />
		</aside>
	</div>

	<nav class="adjacent" aria-label="相邻文章">
		{#if data.prev}
			<a class="adj prev" href={postPath(data.prev.slug)}>
				<span class="dir">上一篇</span>
				<span class="name">{data.prev.title}</span>
			</a>
		{:else}
			<span></span>
		{/if}
		{#if data.next}
			<a class="adj next" href={postPath(data.next.slug)}>
				<span class="dir">下一篇</span>
				<span class="name">{data.next.title}</span>
			</a>
		{/if}
	</nav>

	{#if data.related.length}
		<section class="related" aria-labelledby="related-heading">
			<h2 id="related-heading">相关文章</h2>
			<div class="related-list">
				{#each data.related as post (post.slug)}
					<PostCard {post} />
				{/each}
			</div>
		</section>
	{/if}
</article>

<style>
	.post {
		width: 100%;
		max-width: 72rem;
		margin-inline: auto;
		padding-inline: 1rem;
	}

	.post-head {
		margin-bottom: 2.5rem;
	}

	h1 {
		margin: 0 0 0.75rem;
		max-width: 46rem;
		font-size: 2.25rem;
		line-height: 1.222;
		font-weight: 700;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0 0 0.75rem;
		color: var(--m3c-on-surface-variant);
		font-size: 0.875rem;
	}

	.sep {
		opacity: 0.6;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* 正文 + 侧栏：窄屏单列（目录移到正文上方），宽屏两列 */
	.body {
		display: grid;
		gap: 2rem;
	}

	@media (min-width: 64rem) {
		.body {
			grid-template-columns: minmax(0, 46rem) minmax(0, 1fr);
			gap: 3.5rem;
		}

		.aside {
			order: 2;
		}
	}

	@media (max-width: 63.999rem) {
		.aside {
			order: -1;
			margin-bottom: 1rem;
		}
	}

	/* ---- 相邻文章 ---- */

	.adjacent {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		margin-top: 3rem;
	}

	.adj {
		display: grid;
		gap: 0.25rem;
		padding: 1rem 1.25rem;
		border: 1px solid var(--m3c-outline-variant);
		border-radius: var(--m3-shape-large);
		text-decoration: none;
		transition:
			background-color var(--m3-easing-fast),
			border-color var(--m3-easing-fast);
	}

	.adj:hover {
		background-color: var(--m3c-surface-container);
		border-color: var(--m3c-primary);
	}

	.adj.next {
		text-align: right;
	}

	.dir {
		color: var(--m3c-on-surface-variant);
		font-size: 0.75rem;
	}

	.name {
		color: var(--m3c-on-surface);
		font-weight: 600;
		line-height: 1.4;
	}

	/* ---- 相关文章 ---- */

	.related {
		margin-top: 3rem;
	}

	.related h2 {
		margin: 0 0 1rem;
		color: var(--m3c-on-surface-variant);
		font-size: 0.8125rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.related-list {
		display: grid;
		gap: 1rem;
	}

	@media (min-width: 48rem) {
		.related-list {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 40rem) {
		h1 {
			font-size: 1.75rem;
		}

		.adjacent {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
