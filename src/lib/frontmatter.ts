/**
 * 极简 YAML frontmatter 解析器
 *
 * 只支持本博客 frontmatter 实际用到的子集：
 *   标量            title: 你好
 *   带引号标量      title: "你好"
 *   布尔            draft: true
 *   日期            date: 2026-09-16
 *   数字            order: 3
 *   行内数组        tags: [svelte, cloudflare]
 *   块数组          tags:
 *                     - svelte
 *
 * 之所以不引入 gray-matter / js-yaml：博客 frontmatter 是受控输入，
 * 引入完整 YAML 解析器会把几十 KB 的依赖带进构建期。若以后需要复杂
 * 嵌套结构，再换成 js-yaml 即可（只需替换本文件）。
 */

const stripQuotes = (v: string): string => {
	const s = v.trim();
	if (s.length >= 2) {
		const first = s[0];
		const last = s[s.length - 1];
		if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
			return s.slice(1, -1);
		}
	}
	return s;
};

const parseScalar = (raw: string): unknown => {
	const v = raw.trim();
	if (v === '') return '';
	if (v === 'true') return true;
	if (v === 'false') return false;
	if (v === 'null' || v === '~') return null;
	// 行内数组
	if (v.startsWith('[') && v.endsWith(']')) {
		const inner = v.slice(1, -1).trim();
		if (inner === '') return [];
		return inner.split(',').map((item) => stripQuotes(item));
	}
	// 纯数字（但不吞掉像 2026-09-16 这样的日期）
	if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
	return stripQuotes(v);
};

export class FrontmatterError extends Error {}

/**
 * 从原始文件内容中拆出 frontmatter 与正文。
 * 以 `---` 开头才算有 frontmatter；否则正文即全部内容。
 */
export const parseFrontmatter = (
	raw: string,
	file: string
): { data: Record<string, unknown>; content: string } => {
	const normalized = raw.replace(/^\uFEFF/, '');
	if (!normalized.startsWith('---')) {
		return { data: {}, content: normalized };
	}

	const end = normalized.indexOf('\n---', 3);
	if (end === -1) {
		throw new FrontmatterError(`${file}: frontmatter 起始的 --- 没有找到配对的结束 ---`);
	}

	const block = normalized.slice(normalized.indexOf('\n', 3) + 1, end);
	const content = normalized.slice(normalized.indexOf('\n', end + 1) + 1);

	const data: Record<string, unknown> = {};
	let currentKey: string | null = null;
	let listItems: string[] | null = null;

	const flushList = () => {
		if (currentKey && listItems) data[currentKey] = listItems;
		listItems = null;
	};

	for (const line of block.split('\n')) {
		if (line.trim() === '' || line.trimStart().startsWith('#')) continue;

		// 块数组项
		const listMatch = line.match(/^\s+-\s*(.*)$/);
		if (listMatch && currentKey) {
			listItems ??= [];
			listItems.push(stripQuotes(listMatch[1]));
			continue;
		}

		const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
		if (!kv) {
			throw new FrontmatterError(`${file}: 无法解析 frontmatter 行 "${line}"`);
		}

		flushList();
		const [, key, rest] = kv;
		currentKey = key;
		if (rest.trim() === '') {
			// 值在后续行（块数组）
			listItems = [];
			continue;
		}
		data[key] = parseScalar(rest);
		currentKey = null;
	}
	flushList();

	return { data, content: content.replace(/^\n+/, '') };
};
