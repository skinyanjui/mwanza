import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders production HTML without development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.doesNotMatch(html, developmentPreviewMeta);
});

test("homepage chrome uses the shared brand system", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-brand`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  const html = await response.text();
  assert.match(html, /<title>Mwenza Kenya \| Essential services, handled\.<\/title>/);
  assert.match(html, /class="skip-link"[^>]*>Skip to content/);
  assert.match(html, /src="\/mwenza-mark\.png"/);
  assert.match(html, />Business<\/a>/);
  assert.match(html, />Government<\/a>/);
  assert.match(html, /class="hero-booking"/);
  assert.match(html, /role="search"/);
  assert.match(html, /role="radiogroup"/);
  assert.match(html, /Book Laundry/);
  assert.match(html, /href="\/book\?service=laundry"/);
  const heroHtml = html.slice(html.indexOf('class="hero-booking"'), html.indexOf('class="marketplace-assurance"'));
  assert.match(heroHtml, /<svg\b/);
  assert.doesNotMatch(heroHtml, /<img\b/);
  assert.doesNotMatch(heroHtml, /service-laundry\.webp/);
  assert.match(html, /Pick the help you need at home/);
  assert.doesNotMatch(html, /<select[^>]*aria-label="Choose service"/);
  assert.doesNotMatch(html, /class="marketplace-toggle"/);
  assert.doesNotMatch(html, />For business</);
  assert.doesNotMatch(html, /Life’s tasks, handled/);
  assert.doesNotMatch(html, /Your life, handled/);

  const cssHref = html.match(/href="(\/assets\/index-[^"]+\.css)"/)?.[1];
  assert.ok(cssHref, "expected bundled stylesheet href");
  const cssPath = fileURLToPath(new URL(`../dist/client${cssHref}`, import.meta.url));
  const css = readFileSync(cssPath, "utf8");
  assert.match(css, /geist-sans-variable\.woff2/);
  assert.match(css, /font-family:Geist/);
  assert.match(css, /\.hero-booking/);
});
