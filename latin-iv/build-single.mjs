// Bundles the app into ONE self-contained HTML file (inline CSS + JS) for hosts that disallow external files.
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
const out = await build({ entryPoints: ['js/ui/app.js'], bundle: true, format: 'esm', splitting: false, minify: true, write: false, target: 'es2020' });
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = readFileSync('css/app.css', 'utf8');
const html = `<title>LATIN IV</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Wheelock's Latin Chapters 1–4 exam preparation.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,600;0,700;0,800;0,900;1,700&display=swap">
<style>${css}</style>
<div id="app" class="app"><aside class="sidebar" id="sidebar"></aside><header class="topbar" id="topbar"></header><main class="main" id="main" tabindex="-1"></main><nav class="tabbar" id="tabbar"></nav></div>
<div id="macron-bar" class="macron-bar" hidden></div><div id="overlay"></div><div id="toasts" aria-live="polite"></div>
<script type="module">${js}</script>`;
writeFileSync(process.argv[2], html);
console.log((html.length / 1024).toFixed(0) + ' KB');
