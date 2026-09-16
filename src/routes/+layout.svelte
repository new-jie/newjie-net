<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import NavLink from '$lib/components/NavLink.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { homeOutline, labelOutline, archiveOutline, rssFeedOutline } from '$lib/icons';

	let { children }: { children: Snippet } = $props();

	const year = new Date().getFullYear();

	const nav = [
		{ href: '/', label: '首页', icon: homeOutline },
		{ href: '/tags/', label: '标签', icon: labelOutline },
		{ href: '/archive/', label: '归档', icon: archiveOutline }
	];
</script>

<a class="skip-link" href="#main">跳到正文</a>

<div class="shell">
	<header class="rail">
		<a class="brand" href="/" aria-label="返回首页">
			<span class="brand-mark" aria-hidden="true">B</span>
			<span class="brand-text">博客</span>
		</a>

		<nav aria-label="主导航">
			<ul>
				{#each nav as item (item.href)}
					<li><NavLink href={item.href} label={item.label} icon={item.icon} /></li>
				{/each}
			</ul>
		</nav>

		<div class="rail-actions">
			<ThemeToggle />
			<a class="feed" href="/rss.xml/" title="RSS 订阅">
				<svg width="20" height="20" viewBox="0 0 {rssFeedOutline.width} {rssFeedOutline.height}" aria-hidden="true">
					{@html rssFeedOutline.body}
				</svg>
				<span class="visually-hidden">RSS 订阅</span>
			</a>
		</div>
	</header>

	<main id="main">
		{@render children()}
	</main>

	<footer class="site-footer">
		<p>
			<span>© {year} 博客</span>
			<span class="dot" aria-hidden="true">·</span>
			<a href="/rss.xml/">RSS</a>
			<span class="dot" aria-hidden="true">·</span>
			<a href="/sitemap.xml/">Sitemap</a>
			<span class="dot" aria-hidden="true">·</span>
			<a href="/llms.txt">llms.txt</a>
		</p>
		<p class="built-with">
			由 SvelteKit 构建，Material 3 Expressive 设计，部署于 Cloudflare Workers
		</p>
	</footer>
</div>

<style>
	.shell {
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: 1fr auto;
		grid-template-areas:
			'rail main'
			'rail footer';
		min-height: 100dvh;
	}

	.rail {
		grid-area: rail;
		position: sticky;
		top: 0;
		align-self: start;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		width: 15rem;
		height: 100dvh;
		padding: 1.25rem 0.75rem;
		background-color: var(--m3c-surface-container);
		border-right: 1px solid var(--m3c-outline-variant);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding-inline: 0.5rem;
		color: var(--m3c-on-surface);
		text-decoration: none;
		font-size: 1.125rem;
		font-weight: 700;
	}

	.brand-mark {
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--m3-shape-medium);
		background-color: var(--m3c-primary);
		color: var(--m3c-on-primary);
	}

	.rail nav ul {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.rail-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-top: auto;
		padding-inline: 0.25rem;
	}

	.feed {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--m3-shape-full);
		color: var(--m3c-on-surface-variant);
		transition:
			background-color var(--m3-easing-fast),
			color var(--m3-easing-fast);
	}

	.feed:hover {
		background-color: var(--m3c-surface-container-high);
		color: var(--m3c-on-surface);
	}

	.feed svg {
		fill: currentColor;
	}

	main {
		grid-area: main;
		min-width: 0;
		padding-block: 2.5rem 3rem;
	}

	.site-footer {
		grid-area: footer;
		padding: 1.5rem 1rem 2.5rem;
		color: var(--m3c-on-surface-variant);
		font-size: 0.875rem;
	}

	.site-footer p {
		margin: 0.25rem 0;
	}

	.site-footer a {
		color: var(--m3c-primary);
	}

	.dot {
		margin-inline: 0.5rem;
	}

	.built-with {
		opacity: 0.8;
	}

	/* 窄屏：导航栏改为顶部横向条 */
	@media (max-width: 60rem) {
		.shell {
			grid-template-columns: 1fr;
			grid-template-areas:
				'rail'
				'main'
				'footer';
		}

		.rail {
			position: sticky;
			top: 0;
			z-index: 10;
			flex-direction: row;
			align-items: center;
			width: 100%;
			height: auto;
			gap: 1rem;
			padding: 0.5rem 0.75rem;
			border-right: none;
			border-bottom: 1px solid var(--m3c-outline-variant);
		}

		.rail nav ul {
			flex-direction: row;
			gap: 0.125rem;
		}

		.rail-actions {
			margin-top: 0;
			margin-left: auto;
			padding-inline: 0;
		}

		.brand-text {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
		}
	}
</style>
