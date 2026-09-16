<script lang="ts">
	/**
	 * 标签胶囊
	 *
	 * 用 MD3 的 secondary-container 而不是 primary-container：
	 * 标签是次要信息，用主色会和「链接」抢视觉优先级。
	 */
	import { tagPath } from '$lib/content';

	interface Props {
		tag: string;
		count?: number;
		/** 不可点击时只作展示（例如文章页顶部的标签） */
		link?: boolean;
	}

	let { tag, count, link = true }: Props = $props();

	// 必须用 $derived：tag 是响应式 prop，
	// 写成 const href = tagPath(tag) 只会捕获初始值（svelte 会给出 state_referenced_locally 警告）
	const href = $derived(tagPath(tag));
</script>

{#if link}
	<a class="chip" {href}>
		{tag}{#if count !== undefined}<span class="count">{count}</span>{/if}
	</a>
{:else}
	<span class="chip">{tag}</span>
{/if}

<style>
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.3125rem 0.75rem;
		border: 1px solid var(--m3c-outline-variant);
		border-radius: var(--m3-shape-small);
		background-color: transparent;
		color: var(--m3c-on-surface-variant);
		text-decoration: none;
		font-size: 0.875rem;
		line-height: 1.429;
		white-space: nowrap;
		transition:
			background-color var(--m3-easing-fast),
			color var(--m3-easing-fast),
			border-color var(--m3-easing-fast);
	}

	/* 只有可点击的标签才有悬停反馈 */
	a.chip:hover {
		background-color: var(--m3c-secondary-container);
		border-color: transparent;
		color: var(--m3c-on-secondary-container);
	}

	.count {
		padding-inline: 0.375rem;
		border-radius: var(--m3-shape-full);
		background-color: var(--m3c-surface-container-high);
		color: var(--m3c-on-surface-variant);
		font-size: 0.75rem;
	}
</style>
