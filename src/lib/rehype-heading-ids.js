/**
 * rehype 插件：给 markdown 标题加 id
 *
 * mdsvex 默认不给标题生成锚点，所以目录里的 `#some-heading` 链接会失效。
 * 这里在编译期直接改写 hast，不引入 rehype-slug 之类的额外依赖。
 *
 * 为什么是 .js 而不是 .ts：
 * 本文件由 svelte.config.js import，而 svelte.config.js 是 **Node 直接加载**的，
 * 不经过 Vite 的 TS 转译链。Node 的 ESM 解析不会为 './rehype-heading-ids'
 * 补上 '.ts' 扩展名，会直接报 ERR_MODULE_NOT_FOUND。
 * 所以这里用 .js + JSDoc 类型注解：Node 能加载，svelte-check 也仍然会检查类型。
 *
 * 注意：文件内部 import 的 './slug.ts' 带显式扩展名，Node 26 的类型剥离会正确处理。
 */
import { createSlugger } from './slug.ts';

/**
 * @typedef {object} HastNode
 * @property {string} type
 * @property {string} [tagName]
 * @property {string} [value]
 * @property {Record<string, unknown>} [properties]
 * @property {HastNode[]} [children]
 */

/**
 * 递归提取节点的纯文本，用于生成 slug
 * @param {HastNode} node
 * @returns {string}
 */
const textOf = (node) => {
	if (node.type === 'text') return node.value ?? '';
	if (!node.children) return '';
	return node.children.map(textOf).join('');
};

/**
 * 深度优先遍历，遇到标题节点就写 id
 * @param {HastNode} node
 * @param {(text: string) => string} slugger
 */
const walk = (node, slugger) => {
	if (!node.children) return;

	for (const child of node.children) {
		if (/^h[1-6]$/.test(child.tagName ?? '')) {
			const text = textOf(child);
			if (text.trim()) {
				child.properties ??= {};
				// 已有 id 就不覆盖，允许作者手写 <h2 id="...">
				if (!child.properties.id) child.properties.id = slugger(text);
			}
		}
		walk(child, slugger);
	}
};

/**
 * @returns {(tree: HastNode) => void}
 */
export const rehypeHeadingIds = () => (tree) => {
	walk(tree, createSlugger());
};

export default rehypeHeadingIds;
