<script lang="ts">
	/**
	 * 设计系统验收页
	 *
	 * 这是全站唯一直接 import m3-svelte 组件的路由。
	 *
	 * 为什么其它路由都不许直接用它：m3-svelte 是第三方库，7.x 是较新的主版本线。
	 * 一旦它的 API 变动，改动会被限制在 src/lib/components/ 一层封装里，
	 * 而不会散落到每个页面。本页是刻意的例外——它的用途就是集中展示与验收
	 * 上游组件的真实外观，包一层反而看不到原貌。
	 *
	 * 用 noindex 排除出搜索引擎，它不应该出现在站点导航里。
	 */
	/**
	 * 注意导入路径：这里从具体组件文件导入，而不是从包入口 'm3-svelte' 导入。
	 *
	 * 包入口 './package/index.js' 是普通 .js，没有随附 .d.ts，
	 * svelte-check 无法从中还原组件 props 类型，会把 props 解析成
	 * `$$ComponentProps | undefined`，于是任何带 children 的用法都报类型错误。
	 * 直接指向 .svelte 文件则能正确取到 props 类型。
	 */
	import Button from '$m3/buttons/Button.svelte';
	import Card from '$m3/containers/Card.svelte';
	import Chip from '$m3/forms/Chip.svelte';
	import Divider from '$m3/misc/Divider.svelte';
	import Prose from '$lib/components/Prose.svelte';
	import TagChip from '$lib/components/TagChip.svelte';
	import PostCard from '$lib/components/PostCard.svelte';
	import type { PostPreview } from '$lib/content';

	const buttonVariants = ['elevated', 'filled', 'tonal', 'outlined', 'text'] as const;
	const buttonSizes = ['xs', 's', 'm', 'l', 'xl'] as const;

	// 注意：不要在 {#each} 表达式里写 TS 的 `as` 断言，Svelte 模板解析器会报
	// "Expected token }"。类型断言必须放在 <script> 里。
	const colorRoles: [string, string][] = [
		['primary', '主色'],
		['primary-container', '主色容器'],
		['secondary', '辅助色'],
		['secondary-container', '辅助容器'],
		['tertiary', '强调色'],
		['tertiary-container', '强调容器'],
		['error', '错误色'],
		['error-container', '错误容器'],
		['surface', '表面'],
		['surface-container', '表面容器'],
		['surface-container-high', '表面容器（高）'],
		['surface-container-highest', '表面容器（最高）'],
		['outline', '描边'],
		['outline-variant', '描边（弱）']
	];

	const shapeTokens: [string, string][] = [
		['extra-small', '4px'],
		['small', '8px'],
		['medium', '12px'],
		['large', '16px'],
		['large-increased', '20px'],
		['extra-large', '28px'],
		['full', '全圆']
	];

	const demoPost: PostPreview = {
		slug: 'demo',
		title: '示例文章卡片',
		description: '这张卡片用于检查标题、摘要、日期与标签的排版比例是否协调。',
		date: '2026-09-16',
		tags: ['设计系统', 'Material Design'],
		minutes: 6,
		pinned: false
	};
</script>

<svelte:head>
	<title>设计系统</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="container">
	<header class="page-head">
		<h1>设计系统</h1>
		<p class="lede">
			M3 Expressive 验收页：配色角色、排版、组件与本项目自研组件的真实渲染结果。
		</p>
	</header>

	<section aria-labelledby="color-heading">
		<h2 id="color-heading">配色角色</h2>
		<p class="note">
			切换右上角主题按钮可在亮色 / 暗色 / 跟随系统间循环。下面的色块全部来自
			<code>--m3c-*</code> 变量，明暗两套值由 <code>light-dark()</code> 承载。
		</p>
		<div class="swatches">
			{#each colorRoles as [name, label] (name)}
				<figure class="swatch">
					<div
						class="chip-color"
						style="background-color: var(--m3c-{name}); color: var(--m3c-on-{name});"
					>
						Aa 中文
					</div>
					<figcaption>
						<code>--m3c-{name}</code>
						<span class="label-zh">{label}</span>
					</figcaption>
				</figure>
			{/each}
		</div>
	</section>

	<Divider />

	<section aria-labelledby="button-heading">
		<h2 id="button-heading">按钮</h2>
		<p class="note">五种变体（elevated / filled / tonal / outlined / text）× 五档尺寸。</p>

		<div class="stack">
			{#each buttonVariants as variant (variant)}
				<div class="row">
					<span class="row-label">{variant}</span>
					<div class="row-items">
						{#each buttonSizes as size (size)}
							<Button {variant} {size}>按钮 {size}</Button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</section>

	<Divider />

	<section aria-labelledby="card-heading">
		<h2 id="card-heading">卡片</h2>
		<div class="cards">
			<Card variant="elevated">
				<strong>elevated</strong>
				<p>靠阴影分层，适合需要浮起的内容。</p>
			</Card>
			<Card variant="filled">
				<strong>filled</strong>
				<p>用表面容器色分层，阴影最轻，适合列表。</p>
			</Card>
			<Card variant="outlined">
				<strong>outlined</strong>
				<p>靠描边分层，信息密度最高。</p>
			</Card>
		</div>
	</section>

	<Divider />

	<section aria-labelledby="chip-heading">
		<h2 id="chip-heading">标签</h2>
		<!--
			Chip 的 props 是「a / label / button」三分支联合类型：
			传 href → <a>；传 label: true → <label>；传 onclick → <button>。
			三者都不传时 TypeScript 会落到 label 分支并报「缺少 label 属性」。
			所以这里显式给 href，既满足类型也符合「可点击筛选」的语义。
		-->
		<div class="row-items">
			<Chip variant="assist" href="#chip-heading">辅助操作</Chip>
			<Chip variant="general" href="#chip-heading" selected>已选中</Chip>
			<Chip variant="input" href="#chip-heading">输入项</Chip>
			<TagChip tag="自研组件" count={3} />
			<TagChip tag="不可点击" link={false} />
		</div>
		<p class="note">
			前三个来自 m3-svelte（注意 <code>variant</code> 是必填的），
			后两个是 <code>src/lib/components/TagChip.svelte</code>——
			检查自研组件的圆角、描边与状态层是否与上游一致。
		</p>
	</section>

	<Divider />

	<section aria-labelledby="shapes-heading">
		<h2 id="shapes-heading">形状与阴影</h2>
		<div class="shapes">
			{#each shapeTokens as [name, px] (name)}
				<div class="shape-cell">
					<div class="shape-box" style="border-radius: var(--m3-shape-{name});"></div>
					<code>{name}</code>
					<span class="label-zh">{px}</span>
				</div>
			{/each}
		</div>
	</section>

	<Divider />

	<section aria-labelledby="prose-heading">
		<h2 id="prose-heading">正文排版</h2>
		<Prose>
			<p>
				这是正文排版的实际效果。中文正文需要比拉丁字母更大的行高，本站用 1.85；
				行宽限制在约 42rem，也就是一行 40 个汉字左右，超过这个宽度阅读时容易串行。
				段落之间留出比行距更大的间距，让中文段落有明确的呼吸感。
			</p>
			<p>
				中英混排时使用以中文字体为主的字体栈（PingFang SC / 微软雅黑 / Noto Sans CJK），
				这些字体自带配套的拉丁字形，因此 <code>inline code</code> 与英文单词
				（例如 <strong>SvelteKit</strong>、<em>Material Design 3</em>）不会与中文产生
				字面大小与基线的错位。
			</p>
			<blockquote>
				<p>引用块用主色左边框标记，背景取表面容器色。</p>
			</blockquote>
			<pre><code>{`const contrast = (a, b) => {
  const [x, y] = [relLum(a), relLum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};`}</code></pre>
			<table>
				<thead>
					<tr><th>角色</th><th>亮色</th><th>暗色</th></tr>
				</thead>
				<tbody>
					<tr><td>primary</td><td>#3b5caa</td><td>#95b1ff</td></tr>
					<tr><td>surface</td><td>#faf8ff</td><td>#060d20</td></tr>
				</tbody>
			</table>
		</Prose>
	</section>

	<Divider />

	<section aria-labelledby="postcard-heading">
		<h2 id="postcard-heading">自研文章卡片</h2>
		<div class="cards">
			<!-- href="#" 是刻意的：示例卡片没有对应的真实文章，
			     用真实链接会让预渲染器去爬一个 404 并中断构建 -->
			<PostCard post={demoPost} href="#" />
			<PostCard post={{ ...demoPost, pinned: true, slug: 'demo-pinned' }} href="#" />
		</div>
		<p class="note">右为置顶态。注意置顶卡用的是低强度的主色容器底色，而不是高饱和填充。</p>
	</section>
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

	section {
		margin-block: 2rem;
	}

	h2 {
		margin: 0 0 0.5rem;
		font-size: 1.375rem;
	}

	.note {
		margin: 0 0 1.25rem;
		color: var(--m3c-on-surface-variant);
		font-size: 0.875rem;
		line-height: 1.7;
	}

	code {
		padding: 0.125em 0.35em;
		border-radius: var(--m3-shape-extra-small);
		background-color: var(--m3c-surface-container-high);
		font-family: var(--m3-font-mono);
		font-size: 0.8125rem;
	}

	/* ---- 色块 ---- */

	.swatches {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
		gap: 0.75rem;
	}

	.swatch {
		margin: 0;
	}

	.chip-color {
		display: grid;
		place-items: center;
		height: 4rem;
		border: 1px solid var(--m3c-outline-variant);
		border-radius: var(--m3-shape-medium);
		font-weight: 600;
	}

	.swatch figcaption {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		margin-top: 0.375rem;
	}

	.swatch figcaption code {
		background: none;
		padding: 0;
		color: var(--m3c-on-surface-variant);
	}

	.label-zh {
		color: var(--m3c-on-surface-variant);
		font-size: 0.75rem;
		opacity: 0.85;
	}

	/* ---- 按钮 ---- */

	.stack {
		display: grid;
		gap: 1rem;
	}

	.row {
		display: grid;
		grid-template-columns: 6rem 1fr;
		align-items: center;
		gap: 1rem;
	}

	.row-label {
		color: var(--m3c-on-surface-variant);
		font-family: var(--m3-font-mono);
		font-size: 0.8125rem;
	}

	.row-items {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	/* ---- 卡片 ---- */

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
		gap: 1rem;
		align-items: start;
	}

	.cards :global(p) {
		margin: 0.375rem 0 0;
		color: var(--m3c-on-surface-variant);
		font-size: 0.875rem;
	}

	/* ---- 形状 ---- */

	.shapes {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
		gap: 0.75rem;
	}

	.shape-cell {
		display: grid;
		justify-items: center;
		gap: 0.375rem;
	}

	.shape-box {
		width: 4rem;
		height: 4rem;
		background-color: var(--m3c-primary-container);
		border: 1px solid var(--m3c-outline-variant);
	}
</style>
