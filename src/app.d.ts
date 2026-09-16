// See https://svelte.dev/docs/kit/types#app.d.ts
//
// 本站是纯静态站点（adapter-static），没有 Worker 运行时，
// 因此这里不需要声明 D1 / KV / R2 之类的 Cloudflare 绑定。
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
