<script lang="ts">
	/**
	 * 正文排版容器
	 *
	 * mdsvex 编译出的 HTML 是「外来」内容，Svelte 的作用域样式默认不会作用于它，
	 * 因此这里用 :global() 包住整块 Markdown 产物。
	 *
	 * 排版依据 MD3 type scale，但针对中文做了调整：
	 *   - 正文 1.0625rem / 1.85（中文比拉丁字母需要更大行高）
	 *   - 行宽限制在 42rem 左右（约 40 个汉字），超过就换行读不下去
	 *   - 段间距大于行距，中文段落之间需要更明显的呼吸感
	 */
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="prose">
	{@render children()}
</div>

<style>
	.prose {
		--prose-measure: 42rem;
		color: var(--m3c-on-surface);
		font-size: 1.0625rem;
		line-height: 1.85;
	}

	.prose :global(> *:first-child) {
		margin-top: 0;
	}

	.prose :global(p) {
		margin: 0 0 1.25em;
	}

	.prose :global(h2),
	.prose :global(h3),
	.prose :global(h4) {
		margin: 2.5em 0 0.75em;
		line-height: 1.35;
		font-weight: 650;
		/* 标题左侧留出锚点空间，滚动定位时不被顶部导航遮住 */
		scroll-margin-top: 5rem;
	}

	.prose :global(h2) {
		padding-bottom: 0.375rem;
		border-bottom: 1px solid var(--m3c-outline-variant);
		font-size: 1.5rem;
	}

	.prose :global(h3) {
		font-size: 1.25rem;
	}

	.prose :global(h4) {
		font-size: 1.0625rem;
		color: var(--m3c-on-surface-variant);
	}

	.prose :global(a) {
		color: var(--m3c-primary);
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}

	.prose :global(a:hover) {
		text-decoration-thickness: 2px;
	}

	.prose :global(strong) {
		font-weight: 650;
	}

	.prose :global(ul),
	.prose :global(ol) {
		margin: 0 0 1.25em;
		padding-left: 1.5em;
	}

	.prose :global(li) {
		margin-bottom: 0.375em;
	}

	.prose :global(li::marker) {
		color: var(--m3c-primary);
	}

	.prose :global(blockquote) {
		margin: 1.5em 0;
		padding: 0.75em 1.125em;
		border-left: 3px solid var(--m3c-primary);
		border-radius: 0 var(--m3-shape-small) var(--m3-shape-small) 0;
		background-color: var(--m3c-surface-container);
		color: var(--m3c-on-surface-variant);
	}

	.prose :global(blockquote > *:last-child) {
		margin-bottom: 0;
	}

	/* ---- 代码 ---- */

	.prose :global(code) {
		font-family: var(--m3-font-mono);
		font-size: 0.875em;
	}

	/* 行内代码 */
	.prose :global(:not(pre) > code) {
		padding: 0.125em 0.375em;
		border-radius: var(--m3-shape-extra-small);
		background-color: var(--m3c-surface-container-high);
		color: var(--m3c-on-surface);
		/* 中英混排时行内代码不该撑高行距 */
		white-space: nowrap;
	}

	.prose :global(pre) {
		position: relative;
		margin: 1.5em 0;
		padding: 1rem 1.125rem;
		overflow-x: auto;
		border: 1px solid var(--m3c-outline-variant);
		border-radius: var(--m3-shape-medium);
		background-color: var(--m3c-surface-container);
		line-height: 1.7;
		/* 代码块内的长行不要自动折行，横向滚动更易读 */
		tab-size: 2;
	}

	.prose :global(pre code) {
		font-size: 0.875rem;
		white-space: pre;
	}

	/* ---- 表格 ---- */

	.prose :global(table) {
		width: 100%;
		margin: 1.5em 0;
		border-collapse: collapse;
		font-size: 0.9375rem;
		/* 窄屏时横向滚动而不是挤压 */
		display: block;
		overflow-x: auto;
	}

	.prose :global(thead) {
		background-color: var(--m3c-surface-container-high);
	}

	.prose :global(th),
	.prose :global(td) {
		padding: 0.625rem 0.875rem;
		text-align: left;
		border-bottom: 1px solid var(--m3c-outline-variant);
	}

	.prose :global(th) {
		font-weight: 650;
		white-space: nowrap;
	}

	.prose :global(tbody tr:last-child td) {
		border-bottom: none;
	}

	/* ---- 其他 ---- */

	.prose :global(hr) {
		margin: 2.5em 0;
		border: none;
		border-top: 1px solid var(--m3c-outline-variant);
	}

	.prose :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: var(--m3-shape-medium);
	}

	.prose :global(figure) {
		margin: 1.5em 0;
	}

	.prose :global(figcaption) {
		margin-top: 0.5em;
		color: var(--m3c-on-surface-variant);
		font-size: 0.875rem;
		text-align: center;
	}

	/* 键盘可达性：标题锚点被 tab 到时给出视觉反馈 */
	.prose :global(h2:target),
	.prose :global(h3:target) {
		color: var(--m3c-primary);
	}
</style>
