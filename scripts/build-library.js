// scripts/build-library.js
// Builds /library/ — one plain-HTML page that links to every published Daily,
// Leadership post and Blog post. The archive pages fill their lists with
// JavaScript; this page gives search engines (and anyone without JS) a
// complete, crawlable index of the whole library.
//
// Runs after build:daily and build:blog (it reads their data/*.json output).

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const OUT_DIR = path.join(ROOT, 'library');
const SITE_URL = 'https://thewrkshop.com';
const LEADERSHIP_CATEGORY = 'Leadership & Culture';

function esc(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, file), 'utf-8'));
  } catch {
    return fallback;
  }
}

function monthLabel(iso) {
  const [y, m] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function shortDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function dailyName(e) {
  if (e.headline) return e.headline;
  return [e.title, e.subtitle].filter(Boolean).join(': ') || 'Daily';
}

async function main() {
  const daily = (await readJson('daily-archive.json', [])).filter(e => e && e.href && e.date);
  const blog = (await readJson('blog-archive.json', [])).filter(e => e && e.href && e.date);

  daily.sort((a, b) => b.date.localeCompare(a.date));
  blog.sort((a, b) => b.date.localeCompare(a.date));

  const leadership = daily.filter(e => e.category === LEADERSHIP_CATEGORY);

  const leadershipHtml = leadership.length
    ? `<ul class="lib-list">
${leadership.map(e => `        <li><a href="${esc(e.href)}">${esc(dailyName(e))}</a>${e.tagline ? `<span class="lib-note">${esc(e.tagline)}</span>` : ''}</li>`).join('\n')}
      </ul>
      <p><a class="lib-more" href="/leadership/">All Leadership &amp; Culture posts →</a></p>`
    : '<p>Coming soon.</p>';

  const blogHtml = blog.length
    ? `<ul class="lib-list">
${blog.map(e => `        <li><a href="${esc(e.href)}">${esc(e.title || 'Untitled')}</a><span class="lib-note">${esc(shortDate(e.date))}${e.category ? ` · ${esc(e.category)}` : ''}</span></li>`).join('\n')}
      </ul>`
    : '<p>Coming soon.</p>';

  // Dailies grouped by month, newest first
  const months = new Map();
  for (const e of daily) {
    const key = e.date.slice(0, 7);
    if (!months.has(key)) months.set(key, []);
    months.get(key).push(e);
  }
  const dailyHtml = [...months.entries()].map(([key, list]) => `
      <details class="lib-month" name="devotional-months">
      <summary><h3>${esc(monthLabel(key + '-01'))}</h3><span class="lib-count">${list.length} readings</span></summary>
      <div class="lib-month-content">
      <ul class="lib-list">
${list.map(e => `        <li><a href="${esc(e.href)}">${esc(dailyName(e))}</a><span class="lib-note">${esc(shortDate(e.date))}${e.verse_ref ? ` · ${esc(e.verse_ref)}` : ''}</span></li>`).join('\n')}
      </ul></div></details>`).join('\n');

  const studies = [
    { href: '/studies/reflex-vs-response/', title: 'The Reflex vs. the Response' },
    { href: '/studies/doing-vs-dwelling/', title: 'The Doing vs. the Dwelling' },
    { href: '/studies/simon-peter-shepherd/', title: 'Simon → Peter → Shepherd' }
  ];

  const all = [
    ...studies.map(e => ({ url: SITE_URL + e.href, name: e.title })),
    ...leadership.map(e => ({ url: SITE_URL + e.href, name: dailyName(e) })),
    ...blog.map(e => ({ url: SITE_URL + e.href, name: e.title || 'Untitled' })),
    ...daily.filter(e => e.category !== LEADERSHIP_CATEGORY).map(e => ({ url: SITE_URL + e.href, name: dailyName(e) }))
  ];

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'TheWrkShop Library',
    url: `${SITE_URL}/library/`,
    isPartOf: { '@id': 'https://thewrkshop.com/#website' },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: all.length,
      itemListElement: all.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: x.url, name: x.name }))
    }
  }).replace(/</g, '\\u003c');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>The Library: Every Devotional, Leadership Post and Article | TheWrkShop</title>
  <link rel="stylesheet" href="/style.css"/>
  <link rel="icon" type="image/x-icon" href="/assets/favicon/favicon.ico?v=2">
  <meta name="description" content="Browse every TheWrkShop daily devotional, leadership lesson and blog article in one place, organized by topic and date."/>
  <link rel="canonical" href="${SITE_URL}/library/"/>
  <link rel="alternate" type="application/rss+xml" title="TheWrkShop — The Daily" href="${SITE_URL}/daily/feed.xml"/>
  <meta property="og:site_name" content="TheWrkShop"/>
  <meta property="og:type" content="website"/>
  <meta property="og:title" content="The Library | TheWrkShop"/>
  <meta property="og:description" content="Every daily devotional, leadership lesson and article from TheWrkShop in one place."/>
  <meta property="og:url" content="${SITE_URL}/library/"/>
  <meta property="og:image" content="${SITE_URL}/assets/og/site.png"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <script type="application/ld+json">${jsonLd}</script>
  <style>
    .page-hero { background:#3e2c23; color:#f4f1ee; padding:3rem 1rem; text-align:center; }
    .page-hero h1 { font-size:clamp(1.8rem,3vw,2.6rem); margin:0 0 .4rem; line-height:1.2; }
    .page-hero p { opacity:.95; max-width:720px; margin:0 auto; line-height:1.6; }
    .lib-wrap { max-width:860px; margin:0 auto; padding:2rem 1rem 3rem; }
    .lib-jump { display:flex; flex-wrap:wrap; gap:.5rem; margin:0 0 1.5rem; }
    .lib-jump a { color:#3e2c23; background:#f4f1ee; border:1px solid rgba(62,44,35,.25); border-radius:999px; padding:.35rem .9rem; text-decoration:none; font-weight:600; }
    .lib-section { background:#f4f1ee; color:#2b2b2b; border:1px solid rgba(0,0,0,.08); border-radius:14px; padding:1.25rem; box-shadow:0 2px 6px rgba(0,0,0,.07); margin:0 0 1.25rem; }
    .lib-section h2 { color:#3e2c23; margin:0 0 .75rem; }
    .lib-section h3 { color:#6b4a36; font-size:1rem; margin:1.25rem 0 .4rem; text-transform:uppercase; letter-spacing:.06em; }
    .lib-list { list-style:none; margin:0; padding:0; }
    .lib-list li { padding:.45rem 0; border-bottom:1px solid rgba(0,0,0,.06); line-height:1.45; }
    .lib-list li:last-child { border-bottom:0; }
    .lib-list a { color:#3e2c23; font-weight:600; text-decoration:none; }
    .lib-list a:hover { text-decoration:underline; }
    .lib-note { display:block; color:#6b5b53; font-size:.88rem; }
    .lib-more { color:#3e2c23; font-weight:700; }
    /* Native accordions remain usable with a keyboard and without JavaScript. */
    .page-hero { background:var(--wash); color:var(--ink); padding:56px 24px; }
    .lib-jump a { background:transparent; color:var(--ink); border-color:var(--line); border-radius:4px; font-size:13px; }
    .lib-section { background:var(--paper); border:1px solid var(--line); border-radius:6px; box-shadow:none; padding:0; scroll-margin-top:110px; }
    .lib-section > summary, .lib-month > summary { display:flex; align-items:center; gap:16px; cursor:pointer; padding:24px; list-style:none; }
    .lib-section > summary::-webkit-details-marker, .lib-month > summary::-webkit-details-marker { display:none; }
    .lib-section > summary::after, .lib-month > summary::after { content:'+'; margin-left:auto; color:var(--ink); font-size:24px; font-weight:400; }
    .lib-section[open] > summary::after, .lib-month[open] > summary::after { content:'−'; }
    .lib-section > summary:hover, .lib-month > summary:hover { background:var(--wash); }
    .lib-section > summary:focus-visible, .lib-month > summary:focus-visible { outline:3px solid #b47737; outline-offset:3px; }
    .lib-section > summary h2 { font-size:23px; margin:0; color:var(--ink); }
    .lib-count { font-size:12px; color:var(--muted); white-space:nowrap; }
    .lib-section-content { padding:0 24px 24px; border-top:1px solid var(--line); }
    .lib-section-content > p { margin-top:20px; }
    .lib-month { border-bottom:1px solid var(--line); }
    .lib-month > summary { padding:18px 0; }
    .lib-month > summary h3 { margin:0; text-transform:none; letter-spacing:0; font-size:17px; color:var(--ink); }
    .lib-month > summary::after { font-size:20px; }
    .lib-month-content { padding-bottom:12px; }
    .lib-list li { padding:14px 0; }
    .lib-list a, .lib-more { color:var(--ink); }
    .lib-note { color:var(--muted); margin-top:4px; }
    @media(max-width:480px) { .lib-section > summary { flex-wrap:wrap; gap:10px; padding:20px; } .lib-section > summary h2 { font-size:20px; } .lib-section-content { padding:0 20px 20px; } }
    @media print { .lib-jump { display:none; } .lib-section { break-inside:auto; } }
  </style>
  <!-- Google Analytics (same GA4 property as the homepage's Firebase analytics) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-N48478JV2Z"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-N48478JV2Z');</script>
</head>
<body>
  <div id="site-header"></div>

  <section class="page-hero">
    <h1>The Library</h1>
    <p>Choose a section to explore. Open a month to browse its devotionals.</p>
  </section>

  <main class="lib-wrap">
    <nav class="lib-jump" aria-label="Library sections">
      <a href="#leadership">Leadership &amp; Culture</a>
      <a href="#blog">Blog</a>
      <a href="#daily">Daily Devotionals</a>
      <a href="#studies">Bible Studies</a>
    </nav>

    <details class="lib-section" id="studies" name="library-sections">
      <summary><h2>Bible Studies</h2><span class="lib-count">${studies.length} studies</span></summary>
      <div class="lib-section-content"><ul class="lib-list">
${studies.map(e => `        <li><a href="${esc(e.href)}">${esc(e.title)}</a></li>`).join('\n')}
      </ul><p><a class="lib-more" href="/studies/">Explore all Bible studies →</a></p></div>
    </details>

    <details class="lib-section" id="leadership" name="library-sections">
      <summary><h2>Leadership &amp; Culture</h2><span class="lib-count">${leadership.length} posts</span></summary>
      <div class="lib-section-content">
      ${leadershipHtml}
      </div>
    </details>

    <details class="lib-section" id="blog" name="library-sections">
      <summary><h2>Blog</h2><span class="lib-count">${blog.length} posts</span></summary>
      <div class="lib-section-content">
      ${blogHtml}
      <p><a class="lib-more" href="/blog-archive.html">Blog archive →</a></p>
      </div>
    </details>

    <details class="lib-section" id="daily" name="library-sections">
      <summary><h2>Daily Devotionals</h2><span class="lib-count">${daily.length} readings</span></summary>
      <div class="lib-section-content">
      ${dailyHtml || '<p>Coming soon.</p>'}
      <p><a class="lib-more" href="/daily-archive.html">Search the Daily archive →</a></p>
      </div>
    </details>
  </main>

  <footer>
    <div class="footer-content">
      <nav class="footer-links" aria-label="Browse">
        <a href="/upstream/">Start Here</a>
        <a href="/daily.html">The Daily</a>
        <a href="/leadership/">Leadership</a>
        <a href="/get-known.html">Groups</a>
        <a href="/library/">Library</a>
        <a href="/blog-archive.html">Blog</a>
        <a href="/podcasts.html">Podcast</a>
        <a href="/resources.html">Resources</a>
        <a href="/#contact">Contact</a>
        <a href="/privacy/">Privacy</a>
      </nav>
      <div class="footer-logo"><img src="/assets/images/thewrkshop-logo-transparent-trimmed.png" alt="TheWrkShop" width="233" height="180"></div>
      <p>&copy; 2026 <span class="sitename">TheWrkShop</span>. All rights reserved.</p>
    </div>
  </footer>

  <script src="/script.js"></script>
  <script>
    function openLibrarySection(hash) {
      const section = document.getElementById(hash.slice(1));
      if (section?.matches('details.lib-section')) section.open = true;
    }
    document.querySelectorAll('.lib-jump a').forEach(link => {
      link.addEventListener('click', () => openLibrarySection(link.hash));
    });
    window.addEventListener('hashchange', () => openLibrarySection(location.hash));
    openLibrarySection(location.hash);
  </script>
</body>
</html>
`;

  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(path.join(OUT_DIR, 'index.html'), html, 'utf-8');
  console.log(`Built /library/ with ${daily.length} dailies (${leadership.length} leadership) and ${blog.length} blog posts.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
