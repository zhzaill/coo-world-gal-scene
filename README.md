# 大肥鱼场景 · Gal Scene

A Cortico World extension for Coopanion/Coo with two switchable views: a short visual-novel scene and a live activity timeline. The interface takes the three-form dialogue, branch choices, and backlog pattern from `dafeiyu-vn`; the live view follows DSH-GAL's deterministic activity states (`reading`, `writing`, `searching`, `running`, `waiting`, `failed`, `done`) without an extra model call.

The live view reads the Cortico event store and labels events from `meta.activity`, event type, source, and text. Its input field creates a `gal-scene.input` event with a flush trigger for the active Coo conversation. The extension does not directly control DSH sessions or infer more state than the available events contain.

## Install

In Coo, open Extensions and install `cortico-world-gal-scene`, then restart the application. Open the **大肥鱼场景 / Gal Scene** World and use the segmented control to switch between **剧情 / Story** and **现场 / Live activity**. The story view is local to the panel; the live view polls recent events and can submit a line to Coo.

## Development

```powershell
npm install
npm run typecheck
npm test
npm run build
```

The portrait assets are bundled into `dist/webui.js`, so the panel works offline and needs no extra asset route. The three WebP portraits are reused from the companion project `D:\11\Projects\dafeiyu-vn`; that project's README identifies them as fan-art based on the whale-girl / DeepSeek community character and reserves the original character rights to its creator. This package's MIT license covers the plugin code only, not those portraits or the underlying character.
