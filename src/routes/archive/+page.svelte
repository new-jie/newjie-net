<script lang="ts">
	import PostDate from '$lib/components/PostDate.svelte';

	const { data } = $props();

	const total = $derived(data.years.reduce((sum, year) => sum + year.posts.length, 0));
</script>

<svelte:head>
	<title>归档</title>
	<meta name="description" content="按时间浏览全部文章。" />
</svelte:head>

<div class="container">
	<header class="page-head">
		<h1>归档</h1>
		<p class="lede">共 {total} 篇文章，跨 {data.years.length} 个年份</p>
	</header>

	{#each data.years as year (year.year)}
		<section class="year" aria-labelledby="year-{year.year}">
			<h2 id="year-{year.year}">{year.year}</h2>
			<ul>
				{#each year.posts as post (post.slug)}
					<li>
						<a href={post.path}>{post.title}</a>
						<span class="date"><PostDate date={post.date} /></span>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	h1 {
		margin: 0 0 0.375rem;
		font-size: 2rem;
		line-height: 1.25;
	}

	.lede {
		margin: 0 0 2.5rem;
		color: var(--m3c-on-surface-variant);
	}

	.year {
		margin-bottom: 2rem;
	}

	.year h2 {
		margin: 0 0 0.75rem;
		padding-bottom: 0.375rem;
		border-bottom: 1px solid var(--m3c-outline-variant);
		color: var(--m3c-primary);
		font-size: 1.25rem;
		font-variant-numeric: tabular-nums;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.75rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid color-mix(in srgb, var(--m3c-outline-variant) 40%, transparent);
	}

	li:last-child {
		border-bottom: none;
	}

	li a {
		color: var(--m3c-on-surface);
		text-decoration: none;
		font-weight: 500;
	}

	li a:hover {
		color: var(--m3c-primary);
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.date {
		margin-left: auto;
		color: var(--m3c-on-surface-variant);
		font-size: 0.8125rem;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>
