import * as esbuild from 'esbuild';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const outdir = `${root}dist`;
rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });
const asset = (name) => `data:image/webp;base64,${readFileSync(`${root}assets/${name}`).toString('base64')}`;
await esbuild.build({
  entryPoints: [{ in: `${root}src/webui/client.ts`, out: 'webui' }],
  outdir, bundle: true, format: 'esm', target: 'es2022', platform: 'browser',
  minify: true, sourcemap: true,
  define: {
    __GAL_TALL__: JSON.stringify(asset('char-tall.webp')),
    __GAL_MID__: JSON.stringify(asset('char-mid.webp')),
    __GAL_CHIBI__: JSON.stringify(asset('char-chibi.webp')),
  },
});
const css = `${root}src/webui/style.css`;
const { copyFileSync } = await import('node:fs');
copyFileSync(css, `${outdir}/webui.css`);
console.log('built dist/webui.js and dist/webui.css');
