// `wrangler types` types the Durable Object namespaces as
// `DurableObjectNamespace<import("./src/worker").ShowRoom>`, because wrangler.jsonc's
// `main` is src/worker.ts. That import would drag the adapter's built worker (and its
// whole SSR graph) into `svelte-check`. Repoint the references at the DO source files so
// the type resolves without touching build output. Run via `pnpm cf:types`.
import { readFile, writeFile } from 'node:fs/promises';

const FILE = new URL('../worker-configuration.d.ts', import.meta.url);
const REPLACEMENTS = [
	['import("./src/worker").ShowRoom', 'import("./src/lib/server/show-room").ShowRoom'],
	[
		'import("./src/worker").ShowDirectory',
		'import("./src/lib/server/show-directory").ShowDirectory'
	],
	// `mainModule: typeof import("./src/worker")` would also drag the entry's build-output
	// import graph into the type program. The mainModule type is unused; neutralise it.
	['typeof import("./src/worker")', 'unknown'],
	['import("./src/worker")', 'unknown']
];

const original = await readFile(FILE, 'utf8');
const patched = REPLACEMENTS.reduce((text, [from, to]) => text.split(from).join(to), original);

if (patched !== original) {
	await writeFile(FILE, patched);
	console.log('Repointed Durable Object type references to their source modules.');
} else {
	console.log('No Durable Object type references to repoint.');
}
