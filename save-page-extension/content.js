(async function savePageAsSingleFile() {
  // Simple on-page indicator so the user knows it's working.
  const banner = document.createElement("div");
  banner.textContent = "Saving page as single file…";
  Object.assign(banner.style, {
    position: "fixed", top: "10px", right: "10px", zIndex: 2147483647,
    background: "#111", color: "#fff", padding: "8px 14px",
    borderRadius: "6px", font: "13px/1.4 sans-serif", opacity: "0.9"
  });
  document.documentElement.appendChild(banner);

  const setStatus = (msg) => { banner.textContent = msg; };

  try {
    const html = await buildSingleFileHtml(document, setStatus);
    downloadHtml(html, suggestFileName());
    setStatus("Saved ✓");
  } catch (err) {
    console.error("Save Page As Single File failed:", err);
    setStatus("Save failed — see console");
  } finally {
    setTimeout(() => banner.remove(), 2500);
  }
})();

function suggestFileName() {
  const base = (document.title || location.hostname)
    .replace(/[\\/:*?"<>|]+/g, " ")
    .trim()
    .slice(0, 80) || "page";
  return `${base}.html`;
}

function downloadHtml(html, filename) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

// Fetches a same-page resource (image, stylesheet, font, etc.) and
// returns it as a base64 data: URI. Only ever contacts URLs that are
// already referenced by the page itself — nothing else.
async function toDataUri(url) {
  try {
    const resp = await fetch(url, { credentials: "omit" });
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null; // CORS-blocked or unreachable — leave original reference
  }
}

// Rewrites url(...) references inside a CSS text (fonts, background
// images) to data URIs, resolved relative to baseUrl.
async function inlineCssUrls(cssText, baseUrl) {
  const urlRegex = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
  const matches = [...cssText.matchAll(urlRegex)];
  const replacements = new Map();

  for (const match of matches) {
    const raw = match[2];
    if (raw.startsWith("data:")) continue;
    if (replacements.has(raw)) continue;
    try {
      const absolute = new URL(raw, baseUrl).href;
      const dataUri = await toDataUri(absolute);
      if (dataUri) replacements.set(raw, dataUri);
    } catch {
      /* skip malformed URL */
    }
  }

  let result = cssText;
  for (const [raw, dataUri] of replacements) {
    result = result.split(raw).join(dataUri);
  }
  return result;
}

async function buildSingleFileHtml(doc, setStatus) {
  const clone = doc.documentElement.cloneNode(true);
  const baseUrl = doc.baseURI;

  // 1. Remove all scripts — the saved file is a static snapshot,
  //    which avoids re-running page code and is safer to open later.
  clone.querySelectorAll("script").forEach((el) => el.remove());

  // 2. Inline <link rel="stylesheet"> as <style>, resolving url(...)
  //    references inside the CSS too.
  setStatus("Inlining stylesheets…");
  const linkEls = [...clone.querySelectorAll('link[rel~="stylesheet"]')];
  for (const link of linkEls) {
    const href = link.getAttribute("href");
    if (!href) { link.remove(); continue; }
    try {
      const absolute = new URL(href, baseUrl).href;
      const resp = await fetch(absolute, { credentials: "omit" });
      if (!resp.ok) throw new Error("fetch failed");
      let cssText = await resp.text();
      cssText = await inlineCssUrls(cssText, absolute);
      const styleEl = doc.createElement("style");
      styleEl.textContent = cssText;
      link.replaceWith(styleEl);
    } catch {
      // Leave the original <link> in place if it can't be fetched
      // (e.g. blocked by CORS) so the page still references it.
    }
  }

  // 3. Inline existing <style> blocks' url(...) references (fonts, bg images).
  const styleEls = [...clone.querySelectorAll("style")];
  for (const styleEl of styleEls) {
    styleEl.textContent = await inlineCssUrls(styleEl.textContent, baseUrl);
  }

  // 4. Inline <img> sources.
  setStatus("Inlining images…");
  const imgEls = [...clone.querySelectorAll("img[src]")];
  for (const img of imgEls) {
    const src = img.getAttribute("src");
    if (!src || src.startsWith("data:")) continue;
    try {
      const absolute = new URL(src, baseUrl).href;
      const dataUri = await toDataUri(absolute);
      if (dataUri) img.setAttribute("src", dataUri);
    } catch {
      /* leave original src */
    }
    img.removeAttribute("srcset"); // avoid the browser picking a non-inlined variant
  }

  // 5. Inline elements styled via inline `style="background-image:url(...)"`.
  const inlineStyled = [...clone.querySelectorAll('[style*="url("]')];
  for (const el of inlineStyled) {
    const styleAttr = el.getAttribute("style");
    el.setAttribute("style", await inlineCssUrls(styleAttr, baseUrl));
  }

  // 6. Resolve relative links/anchors to absolute URLs so navigation
  //    from the saved copy still works.
  clone.querySelectorAll("a[href]").forEach((a) => {
    try { a.setAttribute("href", new URL(a.getAttribute("href"), baseUrl).href); }
    catch { /* leave as-is */ }
  });

  // 7. Record provenance so it's clear this is an offline snapshot.
  const meta = doc.createElement("meta");
  meta.setAttribute("name", "saved-from");
  meta.setAttribute("content", location.href);
  clone.querySelector("head")?.prepend(meta);

  return "<!DOCTYPE html>\n" + clone.outerHTML;
}
