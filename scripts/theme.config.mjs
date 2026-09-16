/**
 * 主题配置 —— 改这里，然后运行 `npm run gen:theme` 重新生成配色。
 */
export default {
	/** 品牌种子色。整套 light/dark 配色由它推导。 */
	seed: '#0B57D0',

	/** Material Color Spec 版本。'2025' 与 '2026' 对本 seed 输出一致；'2021' 与新版 delegate 不兼容。 */
	specVersion: '2025',

	/**
	 * secondary 彩度（0-120）。越低越接近中性灰，越高越像主色。
	 * 16 = 冷灰蓝，适合边框、次要文字、次级按钮。
	 */
	secondaryChroma: 16,

	/** tertiary 相对 primary 的色相偏移（度）。+45 = 偏紫，-45 = 偏青。 */
	tertiaryHueOffset: 45,

	/** tertiary 彩度。仅用于标签与强调点缀，建议 24-40。 */
	tertiaryChroma: 32,

	/** 生成产物路径。 */
	output: 'src/lib/theme/tokens.css'
};
