/**
 * MD3 配色生成器
 *
 * 从单个 seed 色生成 Material 3 Expressive 的完整 light/dark 配色，
 * 输出 m3-svelte 可直接消费的 CSS（`--m3c-*` 变量 + `light-dark()`）。
 *
 * 用法：node scripts/gen-theme.mjs [输出路径]
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
	Hct,
	DynamicScheme,
	Variant,
	TonalPalette,
	MaterialDynamicColors
} from '@ktibow/material-color-utilities-nightly';
import { genCSS, colors as m3colors } from 'm3-svelte/etc/colors';
import themeConfig from './theme.config.mjs';

const { seed, specVersion, secondaryChroma, tertiaryHueOffset, tertiaryChroma, output } = themeConfig;

const SPEC = specVersion;
const mdc = new MaterialDynamicColors();

/** argb(32位) → #rrggbb。必须用无符号右移，不能用 & 0xffffff（会截断 R 通道高位）。 */
const hex = (argb) => {
	const u = argb >>> 0;
	return (
		'#' +
		[u >>> 16, u >>> 8, u]
			.map((v) => (v & 0xff).toString(16).padStart(2, '0'))
			.join('')
	);
};

const fromHex = (h) => Hct.fromInt((parseInt(h.slice(1), 16) | 0xff000000) >>> 0);

// ---------- WCAG 对比度校验 ----------
const srgbToLin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const relLum = (argb) => {
	const u = argb >>> 0;
	const [r, g, b] = [(u >>> 16) & 0xff, (u >>> 8) & 0xff, u & 0xff].map((v) => srgbToLin(v / 255));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
	const [x, y] = [relLum(a), relLum(b)].sort((m, n) => n - m);
	return (x + 0.05) / (y + 0.05);
};

const CONTRAST_PAIRS = [
	['正文 onSurface/surface', 'onSurface', 'surface'],
	['次要正文 onSurfaceVariant/surface', 'onSurfaceVariant', 'surface'],
	['卡片正文 onSurface/surfaceContainer', 'onSurface', 'surfaceContainer'],
	['链接 primary/surface', 'primary', 'surface'],
	['按钮 onPrimary/primary', 'onPrimary', 'primary'],
	['主色容器 onPrimaryContainer/primaryContainer', 'onPrimaryContainer', 'primaryContainer'],
	['辅助色 secondary/surface', 'secondary', 'surface'],
	['辅助容器 onSecondaryContainer/secondaryContainer', 'onSecondaryContainer', 'secondaryContainer'],
	['强调色 tertiary/surface', 'tertiary', 'surface'],
	['强调容器 onTertiaryContainer/tertiaryContainer', 'onTertiaryContainer', 'tertiaryContainer'],
	['错误色 error/surface', 'error', 'surface'],
	['错误容器 onErrorContainer/errorContainer', 'onErrorContainer', 'errorContainer']
];

// ---------- 生成 ----------
const hct = fromHex(seed);

// 用 Expressive 变体求 primary / neutral / neutralVariant 三组调色板。
// 注意：Variant.EXPRESSIVE 会把 secondary 和 tertiary 色相硬编码轮转到绿色附近，
// 与蓝色主色放在一起过于跳脱，因此下面覆写这两组。
const blueprint = new DynamicScheme({
	sourceColorHct: hct,
	variant: Variant.EXPRESSIVE,
	contrastLevel: 0,
	isDark: false,
	platform: 'phone',
	specVersion: SPEC
});

// secondary：同色相低彩度 → 读作中性冷灰蓝，承担边框/次要文字/次级按钮
const secondaryPalette = TonalPalette.fromHueAndChroma(hct.hue, secondaryChroma);
// tertiary：色相偏移后低彩度 → 柔和的邻近色，只用于标签、强调点缀
const tertiaryHue = (hct.hue + tertiaryHueOffset + 360) % 360;
const tertiaryPalette = TonalPalette.fromHueAndChroma(tertiaryHue, tertiaryChroma);

const mkScheme = (isDark) =>
	new DynamicScheme({
		sourceColorHct: hct,
		variant: Variant.EXPRESSIVE,
		contrastLevel: 0,
		isDark,
		platform: 'phone',
		specVersion: SPEC,
		primaryPalette: blueprint.primaryPalette,
		neutralPalette: blueprint.neutralPalette,
		neutralVariantPalette: blueprint.neutralVariantPalette,
		secondaryPalette,
		tertiaryPalette
	});

const light = mkScheme(false);
const dark = mkScheme(true);

// ---------- 修补上游已知缺陷 ----------
// Material Color Spec 2025/2026 的 delegate 里 tertiary_container / on_tertiary_container
// 没有挂对比度曲线，导致 light 与 dark 取到同一个 tone（明暗同色，暗色模式下会刺眼）。
// 这里按 M3 tone 规范重建：容器 light=T90 / dark=T30，前景 light=T10 / dark=T90。
const tcLight = tertiaryPalette.tone(90);
const tcDark = tertiaryPalette.tone(30);
const otcLight = tertiaryPalette.tone(10);
const otcDark = tertiaryPalette.tone(90);

// ---------- 校验并打印 ----------
const checkScheme = (scheme, label) => {
	console.log(`\n  对比度校验 · ${label}（AA 正文 >= 4.5，大字/UI >= 3.0）`);
	let failed = 0;
	for (const [name, fg, bg] of CONTRAST_PAIRS) {
		const ratio = contrast(mdc[fg]().getArgb(scheme), mdc[bg]().getArgb(scheme));
		const verdict = ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA-large' : 'FAIL';
		if (verdict === 'FAIL') failed++;
		const flat = `${fg}/${bg}`;
		console.log(`    ${name.padEnd(44)} ${flat.padEnd(42)} ${ratio.toFixed(2).padStart(6)}  ${verdict}`);
	}
	return failed;
};

console.log('MD3 配色生成');
console.log(`  seed            ${seed}`);
console.log(`  变体            Variant.EXPRESSIVE`);
console.log(`  色规范          spec ${SPEC}`);
console.log(`  seed HCT        H=${hct.hue.toFixed(1)} C=${hct.chroma.toFixed(1)} T=${hct.tone.toFixed(1)}`);
console.log(`  secondary       同色相 ${hct.hue.toFixed(1)}° 彩度 ${secondaryChroma}`);
console.log(`  tertiary        色相 ${tertiaryHue.toFixed(1)}° 彩度 ${tertiaryChroma}`);

const failLight = checkScheme(light, 'LIGHT');
const failDark = checkScheme(dark, 'DARK');

console.log('\n  tertiary_container 修补（上游缺陷）');
console.log(`    tertiary-container      ${hex(tcLight)} / ${hex(tcDark)}`);
console.log(`    on-tertiary-container   ${hex(otcLight)} / ${hex(otcDark)}`);

const banner = `/* ============================================================================
 * MD3 配色 — 由 scripts/gen-theme.mjs 生成，请勿手改
 * 重新生成：npm run gen:theme
 *
 *   seed        ${seed}
 *   变体        M3 Expressive (Variant.EXPRESSIVE)
 *   色规范      Material Color Spec ${SPEC}
 *   secondary   色相 ${hct.hue.toFixed(1)}° 彩度 ${secondaryChroma}（同色相低彩度冷灰蓝）
 *   tertiary    色相 ${tertiaryHue.toFixed(1)}° 彩度 ${tertiaryChroma}（邻近色，仅用于点缀）
 *
 * 明暗两套色以 CSS light-dark() 压缩在单条声明内，
 * 切换主题 = 修改 <html> 的 color-scheme，不要用 .dark 类。
 * ==========================================================================*/\n`;

const patch = `
/* ---- 修补：Material Color Spec ${SPEC} 的 tertiary_container 缺少对比度曲线，明暗同值 ----
   按 M3 tone 规范重建：容器 light=T90 / dark=T30，前景 light=T10 / dark=T90 */
@layer tokens {
	:root {
		--m3c-tertiary-container: light-dark(${hex(tcLight)}, ${hex(tcDark)});
		--m3c-on-tertiary-container: light-dark(${hex(otcLight)}, ${hex(otcDark)});
	}
}
`;

const css = banner + genCSS(light, dark, m3colors) + patch;

const outPath = resolve(process.argv[2] ?? output);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, css, 'utf8');

console.log(`\n  已写入 ${outPath}（${css.split('\n').length} 行，${m3colors.length} 个角色）`);
if (failLight + failDark > 0) {
	console.error(`\n  警告：有 ${failLight + failDark} 项对比度未达标`);
	process.exitCode = 1;
}
