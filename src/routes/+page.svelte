<script lang="ts">
	import PostCard from '$lib/components/PostCard.svelte';

	const { data } = $props();
</script>

<svelte:head>
	<title>博客</title>
	<meta name="description" content="记录 SvelteKit、Material Design 3 与 Cloudflare Workers 的实践笔记。" />
</svelte:head>

<div class="container">
	<header class="page-head">
		<h1>博客</h1>
		<p class="lede">
			记录前端架构、设计系统与边缘部署的实践笔记。目前共 {data.posts.length} 篇文章。
		</p>
	</header>

	{#if data.posts.length === 0}
		<p class="empty">还没有文章。在 <code>src/content/posts/</code> 下新建 .svx 文件即可。</p>
	{:else}
		{#if data.pinned.length}
			<section class="group" aria-labelledby="pinned-heading">
				<h2 id="pinned-heading" class="group-title">置顶</h2>
				<div class="list">
					{#each data.pinned as post (post.slug)}
						<PostCard {post} />
					{/each}
				</div>
			</section>
		{/if}

		{#if data.latest.length}
			<section class="group" aria-labelledby="latest-heading">
				<h2 id="latest-heading" class="group-title">{data.pinned.length ? '全部文章' : '文章'}</h2>
				<div class="list">
					{#each data.latest as post (post.slug)}
						<PostCard {post} />
					{/each}
				</div>
			</section>
		{/if}
	{/if}
</div>

<style>
	.page-head {
		margin-bottom: 2rem;
	}

	h1 {
		margin: 0 0 0.5rem;
		font-size: 2.25rem;
		line-height: 1.222;
	}

	.lede {
		margin: 0;
		color: var(--m3c-on-surface-variant);
	}

	.group {
		margin-bottom: 2.5rem;
	}

	.group-title {
		margin: 0 0 1rem;
		color: var(--m3c-on-surface-variant);
		font-size: 0.8125rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.list {
		display: grid;
		gap: 1rem;
	}

	/* 宽屏双列，避免单列在 1440px 上出现超长行 */
	@media (min-width: 64rem) {
		.list {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.empty {
		color: var(--m3c-on-surface-variant);
	}

	code {
		padding: 0.125em 0.375em;
		border-radius: var(--m3-shape-extra-small);
		background-color: var(--m3c-surface-container-high);
		font-family: var(--m3-font-mono);
		font-size: 0.875em;
	}
</style>
