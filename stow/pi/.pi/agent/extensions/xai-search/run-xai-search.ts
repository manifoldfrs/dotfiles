import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import type { XaiAuthRegistry } from "./xai-auth.ts";
import type { FetchLike } from "./xai-client.ts";
import { installedPiPaths, loadXaiSearchEntry } from "./xai-entry-loader.ts";
import { runRunner } from "./xai-runner.ts";

interface PiCodingAgent {
  ModelRuntime: { create: (options: { allowModelNetwork: boolean }) => Promise<unknown> };
  ModelRegistry: new (runtime: unknown) => XaiAuthRegistry;
}

const networkFetch = globalThis.fetch as FetchLike;

process.exitCode = await runRunner(process.argv.slice(2), {
  readFile: (path) => readFile(path, "utf8"),
  async writeOutput(text, outPath) {
    if (outPath) await writeFile(outPath, text, { encoding: "utf8", mode: 0o600 });
    else process.stdout.write(text);
  },
  writeError: (text) => process.stderr.write(`${text}\n`),
  loadEntry: async () => loadXaiSearchEntry(installedPiPaths()),
  // The initial refresh loads stored-credential metadata; allowModelNetwork:false keeps catalogs offline.
  async createRegistry() {
    const pi = (await import(pathToFileURL(installedPiPaths().piCodingAgent).href)) as PiCodingAgent;
    return new pi.ModelRegistry(await pi.ModelRuntime.create({ allowModelNetwork: false }));
  },
  fetch: networkFetch,
  installFetch(fetch) {
    const original = globalThis.fetch;
    globalThis.fetch = fetch as typeof globalThis.fetch;
    return () => {
      globalThis.fetch = original;
    };
  },
});
