# Save Page As Single File

A minimal, from-scratch Chrome extension that saves the current tab as one
self-contained `.html` file — CSS, images and fonts are inlined as data
URIs, so the file works offline and keeps the original layout.

## What it does
- Clones the current page's DOM.
- Inlines external stylesheets and their `url(...)` references (fonts,
  background images) as `<style>` blocks.
- Inlines `<img>` sources as base64 data URIs.
- Removes all `<script>` tags, so the saved file is a static snapshot
  (it can't run page code when reopened).
- Resolves relative links to absolute URLs so they keep working.
- Triggers a normal browser download of the resulting file.

## What it does NOT do
- No network requests to anything other than resources already
  referenced by the page you're saving (its own images/CSS/fonts).
- No analytics, telemetry, or external servers of any kind.
- No `eval`, no remote code, no background polling.
- Permissions are limited to `activeTab`, `scripting`, and `downloads` —
  it only ever touches the tab you actively click the icon on.

## Known limitations
- Cross-origin images/fonts served without CORS headers can't be
  fetched by page-context JavaScript, so those are left as regular
  (non-inlined) references instead of failing the whole save.
- Content injected by JavaScript *after* the page's initial load is
  captured only if it's already in the DOM at the moment you click the
  icon (e.g. wait for infinite-scroll content to load first).
- Very large pages (many/huge images) can take a few seconds and
  produce a large file.

## Install (unpacked, for local/manual use)
1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.
4. Open any page, click the extension's toolbar icon, and the page will
   download as a single `.html` file.

## Reading the source
The whole extension is 3 short files, so you can review everything in a
few minutes:
- `manifest.json` — permissions and entry points.
- `background.js` — ~10 lines; only injects `content.js` on click.
- `content.js` — the actual save logic, fully commented.
