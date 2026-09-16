<script lang="ts">
	/** 日期格式化：中文习惯的「2026 年 9 月 16 日」 */
	interface Props {
		date: string;
		/** 用 <time> 输出机器可读的 datetime */
		datetime?: boolean;
	}

	let { date, datetime = true }: Props = $props();

	const formatted = $derived.by(() => {
		const [y, m, d] = date.split('-').map(Number);
		return `${y} 年 ${m} 月 ${d} 日`;
	});
</script>

{#if datetime}
	<time datetime={date}>{formatted}</time>
{:else}
	<span>{formatted}</span>
{/if}
