/**
 * 主题状态（明 / 暗 / 跟随系统）
 *
 * 关键点：m3-svelte 的配色基于 CSS `light-dark()`，
 * 因此切换主题靠改 `<html>` 的 `color-scheme`，而不是增删 `.dark` class。
 *
 * - 'auto' → 'light dark'，交给 prefers-color-scheme
 * - 'light' / 'dark' → 显式指定
 *
 * 首屏由 src/app.html 里的内联脚本提前应用，避免闪烁；
 * 这里只负责后续的响应式同步与持久化。
 *
 * 注意：必须用 SvelteKit 的 browser 常量判断环境，不能用 `typeof localStorage === 'undefined'`。
 * Node 26 起全局存在 localStorage（需要 --localstorage-file），
 * 这个 typeof 判断会在预渲染时误判为浏览器环境，导致构建期访问 localStorage 报错。
 */
import { browser } from '$app/environment';

export type ThemeChoice = 'light' | 'dark' | 'auto';

const KEY = 'theme';

const readStored = (): ThemeChoice => {
	if (!browser) return 'auto';
	try {
		const v = localStorage.getItem(KEY);
		return v === 'light' || v === 'dark' ? v : 'auto';
	} catch {
		return 'auto';
	}
};

let choice = $state<ThemeChoice>(readStored());

const apply = (value: ThemeChoice) => {
	if (!browser) return;
	document.documentElement.style.colorScheme = value === 'auto' ? 'light dark' : value;
};

// 初始化即同步一次，保证客户端接管后的状态与内联脚本一致
apply(choice);

$effect.root(() => {
	$effect(() => {
		apply(choice);
		try {
			if (choice === 'auto') localStorage.removeItem(KEY);
			else localStorage.setItem(KEY, choice);
		} catch {
			/* 忽略隐私模式下的写入失败 */
		}
	});
});

export const theme = {
	get choice() {
		return choice;
	},
	set(next: ThemeChoice) {
		choice = next;
	},
	/** 在「跟随系统 → 暗 → 亮 → 跟随系统」之间循环，用于单按钮切换 */
	cycle() {
		choice = choice === 'auto' ? 'dark' : choice === 'dark' ? 'light' : 'auto';
	}
};
