<script lang="ts">
	/**
	 * 主题切换按钮：跟随系统 → 暗色 → 亮色 → 跟随系统
	 * 图标状态由 $derived 计算，不需要在渲染期读写 DOM，
	 * 因此 SSR 与客户端首次渲染的输出完全一致（不会 hydration 不匹配）。
	 */
	import { Icon } from 'm3-svelte';
	import { theme } from '$lib/theme/theme.svelte';
	import { lightModeOutline, darkModeOutline, brightnessAutoOutline } from '$lib/icons';

	const icon = $derived(
		theme.choice === 'dark'
			? darkModeOutline
			: theme.choice === 'light'
				? lightModeOutline
				: brightnessAutoOutline
	);

	const label = $derived(
		theme.choice === 'dark'
			? '当前暗色主题，点击切换为亮色'
			: theme.choice === 'light'
				? '当前亮色主题，点击切换为跟随系统'
				: '当前跟随系统主题，点击切换为暗色'
	);
</script>

<button type="button" class="theme-toggle" onclick={() => theme.cycle()} title={label}>
	<Icon {icon} size={24} aria-hidden="true" />
	<span class="visually-hidden">{label}</span>
</button>

<style>
	.theme-toggle {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
		border: none;
		border-radius: var(--m3-shape-full);
		background-color: transparent;
		color: var(--m3c-on-surface-variant);
		cursor: pointer;
		transition:
			background-color var(--m3-easing-fast),
			color var(--m3-easing-fast);
	}

	.theme-toggle:hover {
		background-color: var(--m3c-surface-container-high);
		color: var(--m3c-on-surface);
	}

	.theme-toggle :global(svg) {
		fill: currentColor;
	}
</style>
