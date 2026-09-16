<script lang="ts">
	import { Icon } from 'm3-svelte';
	import { errorOutline } from '$lib/icons';

	let { status, message }: { status: number; message: string } = $props();
</script>

<svelte:head>
	<title>{status} · 页面不存在</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="container empty">
	<Icon icon={errorOutline} size={56} aria-hidden="true" />
	<h1>{status}</h1>
	<p>{message}</p>
	<a class="back" href="/">返回首页</a>
</div>

<style>
	.empty {
		display: grid;
		justify-items: center;
		gap: 0.5rem;
		padding-block: 5rem;
		text-align: center;
	}

	.empty :global(svg) {
		fill: var(--m3c-on-surface-variant);
	}

	h1 {
		margin: 0;
		font-size: 3rem;
		color: var(--m3c-primary);
	}

	p {
		margin: 0;
		color: var(--m3c-on-surface-variant);
	}

	.back {
		margin-top: 1rem;
		padding: 0.625rem 1.5rem;
		border-radius: var(--m3-shape-full);
		background-color: var(--m3c-primary);
		color: var(--m3c-on-primary);
		text-decoration: none;
	}
</style>
