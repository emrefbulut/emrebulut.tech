/**
 * index.html'den en/index.html uretir.
 *
 * Site duz HTML olarak yayinlandigi icin Ingilizce surum, calisma zamaninda
 * metin degistirmek yerine build sirasinda uretilip commit'lenir. Boylece
 * arama motorlari Ingilizce icerigi indeksleyebilir, paylasilan baglanti dogru
 * dilde acilir ve tarayiciya hicbir ceviri verisi gonderilmez.
 *
 *   node scripts/build-en.mjs          -> en/index.html dosyasini yazar
 *   node scripts/build-en.mjs --check  -> guncel degilse hata ile ciker (CI)
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { literalReplacements, pageMeta, translations } from "./i18n.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(projectRoot, "index.html");
const TARGET = path.join(projectRoot, "en", "index.html");

/** Ceviri metinlerini HTML metin dugumu olarak guvenli hale getirir. */
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Oznitelik degeri olarak guvenli hale getirir. */
function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function replaceOnce(html, pattern, replacement, description) {
  const matches = html.match(pattern);
  if (!matches) {
    throw new Error(`Beklenen kalip bulunamadi: ${description}`);
  }

  if (pattern.global && matches.length > 1) {
    throw new Error(`Kalip birden fazla kez eslesti (${matches.length}): ${description}`);
  }

  return html.replace(pattern, replacement);
}

function translateElements(html, dictionary) {
  const missing = new Set();

  // data-i18n tasiyan ogeler yalnizca duz metin icerir (icice ayni etiket yok),
  // bu yuzden acilis etiketi ile ilk kapanis etiketi arasi guvenle degistirilebilir.
  const translated = html.replace(
    /(<(\w+)(?=[^>]*\sdata-i18n="([^"]+)")[^>]*>)([\s\S]*?)(<\/\2>)/g,
    (match, openTag, _tagName, key, _inner, closeTag) => {
      const value = dictionary[key];
      if (value === undefined) {
        missing.add(key);
        return match;
      }

      return `${openTag}${escapeHtml(value)}${closeTag}`;
    }
  );

  if (missing.size > 0) {
    throw new Error(`Ceviri eksik: ${[...missing].join(", ")}`);
  }

  return translated;
}

function translateAriaLabels(html, dictionary) {
  return html.replace(
    /<(\w+)([^>]*\sdata-i18n-aria="([^"]+)"[^>]*)>/g,
    (match, tagName, attributes, key) => {
      const value = dictionary[key];
      if (value === undefined) {
        throw new Error(`Ceviri eksik (aria): ${key}`);
      }

      const rewritten = attributes.replace(
        /\saria-label="[^"]*"/,
        ` aria-label="${escapeAttribute(value)}"`
      );

      return `<${tagName}${rewritten}>`;
    }
  );
}

function translateToggleLabels(html, dictionary) {
  return html
    .replace(/data-label-show="[^"]*"/g, `data-label-show="${escapeAttribute(dictionary["projects.toggle.show"])}"`)
    .replace(/data-label-hide="[^"]*"/g, `data-label-hide="${escapeAttribute(dictionary["projects.toggle.hide"])}"`);
}

function applyLiterals(html, replacements) {
  return Object.entries(replacements).reduce(
    (current, [from, to]) => current.split(`>${from}<`).join(`>${escapeHtml(to)}<`),
    html
  );
}

/**
 * en/index.html bir alt dizinde durdugu icin koke goreli varlik yollari
 * bir seviye yukari tasinir. Mutlak yollar (/, https://, #, mailto:, data:)
 * oldugu gibi kalir.
 */
function rewriteAssetPaths(html) {
  return html.replace(/\b(href|src)="(?!https?:|\/|#|mailto:|data:)([^"]+)"/g, (_match, attribute, value) => {
    return `${attribute}="../${value}"`;
  });
}

function buildEnglishPage(source) {
  const dictionary = translations.en;
  const meta = pageMeta.en;
  let html = source;

  html = translateElements(html, dictionary);
  html = translateAriaLabels(html, dictionary);
  html = translateToggleLabels(html, dictionary);
  html = applyLiterals(html, literalReplacements.en);
  html = rewriteAssetPaths(html);

  html = replaceOnce(html, /<html lang="tr">/, `<html lang="${meta.lang}">`, "html lang");
  html = replaceOnce(
    html,
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(meta.title)}</title>`,
    "title"
  );
  html = replaceOnce(
    html,
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${escapeAttribute(meta.description)}">`,
    "meta description"
  );
  html = replaceOnce(
    html,
    /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${meta.canonical}">`,
    "canonical"
  );
  html = replaceOnce(
    html,
    /<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${meta.canonical}">`,
    "og:url"
  );
  html = replaceOnce(
    html,
    /<meta property="og:locale" content="[^"]*">/,
    `<meta property="og:locale" content="${meta.ogLocale}">`,
    "og:locale"
  );
  html = replaceOnce(
    html,
    /<meta property="og:locale:alternate" content="[^"]*">/,
    `<meta property="og:locale:alternate" content="${meta.ogLocaleAlternate}">`,
    "og:locale:alternate"
  );
  html = html
    .replace(
      /<meta property="og:title" content="[^"]*">/,
      `<meta property="og:title" content="${escapeAttribute(meta.title)}">`
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*">/,
      `<meta name="twitter:title" content="${escapeAttribute(meta.title)}">`
    )
    .replace(
      /<meta property="og:description" content="[^"]*">/,
      `<meta property="og:description" content="${escapeAttribute(meta.ogDescription)}">`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*">/,
      `<meta name="twitter:description" content="${escapeAttribute(meta.ogDescription)}">`
    );

  // Dil secici: aktif isareti Ingilizce tarafa gecer.
  html = replaceOnce(
    html,
    /<nav class="lang-toggle" aria-label="[^"]*">[\s\S]*?<\/nav>/,
    `<nav class="lang-toggle" aria-label="${escapeAttribute(meta.langNavLabel)}">
        <a class="lang-option" href="/" hreflang="tr">TR</a>
        <span class="lang-sep">|</span>
        <a class="lang-option active" href="/en/" hreflang="en" aria-current="page">EN</a>
      </nav>`,
    "lang toggle"
  );

  return `${html.trimEnd()}\n`;
}

async function main() {
  const source = await readFile(SOURCE, "utf8");
  const generated = buildEnglishPage(source);
  const checkOnly = process.argv.includes("--check");

  if (checkOnly) {
    let existing = null;
    try {
      existing = await readFile(TARGET, "utf8");
    } catch {
      existing = null;
    }

    if (existing !== generated) {
      console.error(
        "en/index.html guncel degil. `node scripts/build-en.mjs` calistirip sonucu commit'leyin."
      );
      process.exit(1);
    }

    console.log("en/index.html guncel.");
    return;
  }

  await mkdir(path.dirname(TARGET), { recursive: true });
  await writeFile(TARGET, generated, "utf8");
  console.log(`Yazildi: ${path.relative(projectRoot, TARGET)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
