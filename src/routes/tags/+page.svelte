<script lang="ts">
	import TagChip from '$lib/components/TagChip.svelte';

	const { data } = $props();
</script>

<svelte:head>
	<title>标签</title>
	<meta name="description" content="按标签浏览全部文章。" />
</svelte:head>

<div class="container">
	<header class="page-head">
		<h1>标签</h1>
		<p class="lede">共 {data.tags.length} 个标签</p>
	</header>

	{#if data.tags.length === 0}
		<p class="empty">还没有标签。</p>
	{:else}
		<ul class="cloud">
			{#each data.tags as item (item.tag)}
				<li><TagChip tag={item.tag} count={item.count} /></li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	h1 {
		margin: 0 0 0.375rem;
		font-size: 2rem;
		line-height: 1.25;
	}

	.lede {
		margin: 0 0 2rem;
		color: var(--m3c-on-surface-variant);
	}

	.cloud {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.empty {
		color: var(--m3c-on-surface-variant);
	}
</style>
