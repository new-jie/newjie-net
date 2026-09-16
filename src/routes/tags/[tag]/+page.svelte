<script lang="ts">
	import PostCard from '$lib/components/PostCard.svelte';

	const { data } = $props();
</script>

<svelte:head>
	<title>标签：{data.tag}</title>
	<meta name="description" content="标签「{data.tag}」下的全部文章，共 {data.posts.length} 篇。" />
	<link rel="canonical" href={data.tagUrl} />
	<meta name="robots" content={data.posts.length === 0 ? 'noindex' : 'index'} />
</svelte:head>

<div class="container">
	<nav class="crumb" aria-label="面包屑">
		<a href="/tags/">全部标签</a>
	</nav>

	<header class="page-head">
		<h1>{data.tag}</h1>
		<p class="lede">共 {data.posts.length} 篇文章</p>
	</header>

	{#if data.posts.length === 0}
		<p class="empty">这个标签下还没有文章。</p>
	{:else}
		<div class="list">
			{#each data.posts as post (post.slug)}
				<PostCard {post} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.crumb {
		margin-bottom: 1rem;
	}

	.crumb a {
		color: var(--m3c-primary);
		font-size: 0.875rem;
	}

	h1 {
		margin: 0 0 0.375rem;
		font-size: 2rem;
		line-height: 1.25;
	}

	.lede {
		margin: 0 0 2rem;
		color: var(--m3c-on-surface-variant);
	}

	.list {
		display: grid;
		gap: 1rem;
	}

	@media (min-width: 64rem) {
		.list {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.empty {
		color: var(--m3c-on-surface-variant);
	}
</style>
