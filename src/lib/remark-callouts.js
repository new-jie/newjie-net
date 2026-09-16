/**
 * remark 插件：GitHub 风格提示框
 *
 * 把这种纯 Markdown 写法：
 *
 *   > [!NOTE]
 *   > 这里是内容。
 *
 * 转成带 class 的 div，样式见 src/lib/components/Prose.svelte。
 *
 * 设计意图：写文章时不需要引入任何 Svelte 语法或自定义组件标签，
 * 用的仍然是 Markdown 本身。作者只管语义，不管外观。
 *
 * ⚠️ 关键实现细节（踩过一次，别再踩）：
 * `[!NOTE]` 在 Markdown 语法里长得像「引用式链接」`[label]`，
 * 所以它不会作为 text 节点出现，而是被解析成 **linkReference 节点**：
 *
 *   { type: 'linkReference', referenceType: 'shortcut',
 *     label: '!NOTE', identifier: '!note', children: [...] }
 *
 * 如果按「首个 text 节点以 [!TYPE] 开头」来判断，永远匹配不上，
 * 且不会报任何错——表现为提示框完全不生效，引用块原样输出。
 *
 * 为什么是 .js 而不是 .ts：本文件由 svelte.config.js import，
 * 而 svelte.config.js 由 Node 直接加载、不经过 Vite 的 TS 转译链，
 * Node 的 ESM 解析不会为 './xxx' 自动补 '.ts' 扩展名。详见 README 的坑 5。
 */

/**
 * @typedef {'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION'} CalloutKind
 */

/** 支持的提示类型 → 显示标题 */
const KINDS = /** @type {Record<CalloutKind, string>} */ ({
	NOTE: '说明',
	TIP: '提示',
	IMPORTANT: '重要',
	WARNING: '警告',
	CAUTION: '注意'
});

/**
 * @typedef {object} MdNode
 * @property {string} type
 * @property {string} [value]
 * @property {string} [label]
 * @property {string} [referenceType]
 * @property {MdNode[]} [children]
 * @property {Record<string, unknown>} [data]
 */

/** text 节点形态的标记（覆盖 `> [!NOTE]` 与 `> [!NOTE] 内容` 两种写法） */
const TEXT_MARKER_RE = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/;
/** linkReference 节点的 label 形态 */
const LINK_LABEL_RE = /^!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)$/;

const isBlankText = (/** @type {MdNode} */ node) =>
	node.type === 'text' && typeof node.value === 'string' && node.value.trim() === '';

/**
 * 从 blockquote 的首个段落里剥出 [!KIND] 标记。
 * 会就地移除标记节点，只保留正文。
 *
 * @param {MdNode} paragraph
 * @returns {CalloutKind | null} 类型标识；未命中返回 null
 */
const extractKind = (paragraph) => {
	const children = paragraph.children;
	if (!children?.length) return null;

	const first = children[0];

	// 形态一：linkReference（`[!NOTE]` 独占一行或后接内容时的标准解析结果）
	if (first.type === 'linkReference' && first.referenceType === 'shortcut') {
		const match = (first.label ?? '').match(LINK_LABEL_RE);
		if (match) {
			children.shift();
			if (children.length && isBlankText(children[0])) children.shift();
			return /** @type {CalloutKind} */ (match[1]);
		}
		return null;
	}

	// 形态二：纯文本（某些 remark 扩展会把标记当普通文字）
	if (first.type === 'text' && typeof first.value === 'string') {
		const match = first.value.match(TEXT_MARKER_RE);
		if (!match) return null;
		first.value = first.value.slice(match[0].length);
		return /** @type {CalloutKind} */ (match[1]);
	}

	return null;
};

/**
 * @returns {(tree: MdNode) => void}
 */
export const remarkCallouts = () => {
	/**
	 * 递归处理。就地替换 children 数组里的 blockquote 节点。
	 * @param {MdNode} node
	 */
	const walk = (node) => {
		if (!node.children) return;

		node.children = node.children.map((child) => {
			if (child.type !== 'blockquote' || !child.children?.length) {
				walk(child);
				return child;
			}

			const kind = extractKind(child.children[0]);
			if (!kind) {
				walk(child);
				return child;
			}

			// 标记独占一段时首段会被掏空，需要移除
			const inner = child.children.filter(
				(p) => !(p.type === 'paragraph' && p.children?.length === 0)
			);

			/** @type {MdNode} */
			const title = {
				type: 'paragraph',
				children: [{ type: 'text', value: KINDS[kind] }],
				data: { hProperties: { className: ['callout-title'] } }
			};

			/** @type {MdNode} */
			const wrapper = {
				type: 'blockquote',
				children: [title, ...inner],
				data: {
					hName: 'div',
					hProperties: { className: ['callout', `callout-${kind.toLowerCase()}`] }
				}
			};

			walk(wrapper);
			return wrapper;
		});
	};

	return (tree) => walk(tree);
};

export default remarkCallouts;
