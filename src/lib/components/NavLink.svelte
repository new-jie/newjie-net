<script lang="ts">
	/**
	 * 导航链接（MD3 Navigation Rail 项 + 快捷跳转）
	 *
	 * 用原生 <a> 而不是 SvelteKit 的 goto()，这样：
	 * 1. 无 JS 也能跳转（纯静态站的重要兜底）
	 * 2. 搜索引擎与 LLM 抓取器能直接跟进链接
	 * SvelteKit 会自动拦截站内 <a> 点击做客户端路由，不需要额外代码。
	 */
	import type { IconifyIcon } from '@iconify/types';
	import { page } from '$app/state';

	interface Props {
		href: string;
		label: string;
		icon: IconifyIcon;
	}

	let { href, label, icon }: Props = $props();

	// trailingSlash: 'always'，所以比较时把末尾斜杠归一化
	const normalize = (path: string) => (path !== '/' && path.endsWith('/') ? path.slice(0, -1) : path);

	const active = $derived(normalize(page.url.pathname) === normalize(href));
</script>

<a {href} class="nav-link" aria-current={active ? 'page' : undefined}>
	<span class="icon" aria-hidden="true">
		<svg width="24" height="24" viewBox="0 0 {icon.width} {icon.height}">
			{@html icon.body}
		</svg>
	</span>
	<span class="label">{label}</span>
</a>

<style>
	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0.875rem;
		border-radius: var(--m3-shape-full);
		color: var(--m3c-on-surface-variant);
		text-decoration: none;
		font-size: 0.875rem;
		line-height: 1.429;
		transition:
			background-color var(--m3-easing-fast),
			color var(--m3-easing-fast);
	}

	.nav-link:hover {
		background-color: var(--m3c-secondary-container);
		color: var(--m3c-on-secondary-container);
	}

	.nav-link[aria-current='page'] {
		background-color: var(--m3c-secondary-container);
		color: var(--m3c-on-secondary-container);
		font-weight: 600;
	}

	/* MD3 状态层：用图标底色暗示选中态 */
	.nav-link[aria-current='page'] .icon {
		background-color: var(--m3c-primary);
		color: var(--m3c-on-primary);
	}

	.icon {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--m3-shape-full);
		transition: background-color var(--m3-easing-fast);
	}

	.icon :global(svg) {
		fill: currentColor;
	}

	/* 窄屏时只留图标，靠 title/sr-only 传达含义 */
	@media (max-width: 40rem) {
		.label {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
		}

		.nav-link {
			padding: 0.5rem 0.625rem;
		}
	}
</style>
