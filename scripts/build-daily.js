// scripts/build-daily.js
import fs from 'fs/promises';
import { normalizeFlowBlock, flowPlainText, renderFlowHtml, FLOW_CSS } from '../netlify/shared/flow-block.js';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  todayCentralISO,
  toHuman,
  fill,
  dailyFileNameFor as fileNameFor
} from './shared/render-content.js';
import { SITE_URL, dailyBodyHtml } from '../netlify/shared/daily-email.js';
import { nextStepsHtml } from './shared/next-steps.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CONTENT_DIR = path.join(ROOT, 'content', 'daily');
const DATA_DIR = path.join(ROOT, 'data');
const DAILY_DIR = path.join(ROOT, 'daily');
const TPL_PATH = path.join(ROOT, 'templates', 'daily.html');
const REDIRECTS = path.join(ROOT, '_redirects');

const START_DATE = '2025-09-02';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function titleCaseFromKey(key = '') {
  return String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, ch => ch.toUpperCase());
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map(v => cleanString(v))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\n{2,}/)
      .map(v => cleanString(v))
      .filter(Boolean);
  }

  return [];
}

function normalizeScriptures(entry) {
  const scriptures = [];

  if (Array.isArray(entry.scriptures)) {
    for (const s of entry.scriptures) {
      if (!s || typeof s !== 'object') continue;
      const ref = cleanString(s.ref || s.verse_ref);
      const text = cleanString(s.text || s.verse_text);
      if (ref || text) scriptures.push({ ref, text });
    }
  }

  if (!scriptures.length) {
    const ref = cleanString(entry.verse_ref);
    const text = cleanString(entry.verse_text);
    if (ref || text) scriptures.push({ ref, text });
  }

  return scriptures;
}

function normalizeBlock(block) {
  if (typeof block === 'string') {
    const text = cleanString(block);
    return text ? { type: 'paragraph', text } : null;
  }

  if (!block || typeof block !== 'object') return null;

  const type = cleanString(block.type || 'paragraph').toLowerCase();

  if (type === 'paragraph' || type === 'callout' || type === 'quote' || type === 'subhead') {
    const text = cleanString(block.text);
    if (!text) return null;
    const prefix = cleanString(block.prefix);
    return prefix ? { type, text, prefix } : { type, text };
  }

  if (type === 'lines' || type === 'bullet_list' || type === 'numbered_list') {
    const items = normalizeStringArray(block.items || block.text || block.content);
    if (!items.length) return null;
    return { type, items };
  }

  if (type === 'flow') return normalizeFlowBlock(block);

  return null;
}

function normalizeSection(section) {
  if (!section || typeof section !== 'object') return null;

  const key = cleanString(section.key || '').toLowerCase() || '';
  const label = cleanString(section.label) || titleCaseFromKey(key || 'section');

  let blocksSource = Array.isArray(section.blocks) ? section.blocks : null;

  if (!blocksSource) {
    if (section.items) {
      const style = cleanString(section.style || 'bullet_list').toLowerCase();
      const blockType = style === 'numbered_list' ? 'numbered_list' : 'bullet_list';
      blocksSource = [{ type: blockType, items: section.items }];
    } else if (section.content) {
      if (Array.isArray(section.content)) {
        blocksSource = section.content.map(text => ({ type: 'paragraph', text }));
      } else {
        blocksSource = [{ type: cleanString(section.style || 'paragraph'), text: section.content }];
      }
    } else if (section.text) {
      blocksSource = [{ type: cleanString(section.style || 'paragraph'), text: section.text }];
    } else {
      blocksSource = [];
    }
  }

  const blocks = blocksSource
    .map(normalizeBlock)
    .filter(Boolean);

  if (!blocks.length) return null;

  return {
    key,
    label,
    blocks
  };
}

function legacySectionsFromEntry(entry) {
  const sections = [];

  if (entry.read_this_out_loud || entry.readAloud) {
    sections.push({
      key: 'read_this_out_loud',
      label: 'Read This Out Loud',
      blocks: normalizeStringArray(entry.read_this_out_loud || entry.readAloud)
        .map(text => ({ type: 'paragraph', text }))
    });
  }

  const insightParts = normalizeStringArray(entry.insight || entry.body);
  if (insightParts.length) {
    sections.push({
      key: 'devotional',
      label: 'The Devotional',
      blocks: insightParts.map(text => ({ type: 'paragraph', text }))
    });
  }

  if (entry.shift) {
    sections.push({
      key: 'shift',
      label: 'The Shift',
      blocks: normalizeStringArray(entry.shift).map(text => ({ type: 'paragraph', text }))
    });
  }

  if (entry.jesus_set_the_pattern) {
    sections.push({
      key: 'jesus_set_the_pattern',
      label: 'Jesus Set the Pattern',
      blocks: normalizeStringArray(entry.jesus_set_the_pattern).map(text => ({ type: 'paragraph', text }))
    });
  }

  if (entry.truth) {
    sections.push({
      key: 'truth',
      label: 'The Truth',
      blocks: normalizeStringArray(entry.truth).map(text => ({ type: 'paragraph', text }))
    });
  }

  if (entry.reflection) {
    sections.push({
      key: 'reflection',
      label: 'Reflection',
      blocks: [{ type: 'bullet_list', items: normalizeStringArray(entry.reflection) }]
    });
  }

  if (entry.one_minute_win || entry['one-minute_win'] || entry.action_step) {
    sections.push({
      key: 'action_step',
      label: 'Action Step',
      blocks: normalizeStringArray(entry.one_minute_win || entry['one-minute_win'] || entry.action_step)
        .map(text => ({ type: 'paragraph', text }))
    });
  }

  if (entry.declaration) {
    sections.push({
      key: 'declaration',
      label: 'Declaration',
      blocks: normalizeStringArray(entry.declaration).map(text => ({ type: 'paragraph', text }))
    });
  }

  if (entry.one_sentence_to_carry) {
    sections.push({
      key: 'one_sentence_to_carry',
      label: 'One Sentence to Carry',
      blocks: normalizeStringArray(entry.one_sentence_to_carry).map(text => ({ type: 'quote', text }))
    });
  }

  return sections.filter(Boolean);
}

function normalizeDailyEntry(entry) {
  const scriptures = normalizeScriptures(entry);

  let sections = [];
  if (Array.isArray(entry.sections) && entry.sections.length) {
    sections = entry.sections
      .map(normalizeSection)
      .filter(Boolean);
  } else {
    sections = legacySectionsFromEntry(entry);
  }

  return {
    ...entry,
    scriptures,
    verse_ref: cleanString(entry.verse_ref || scriptures[0]?.ref || ''),
    verse_text: cleanString(entry.verse_text || scriptures[0]?.text || ''),
    sections
  };
}

function blockToPlainText(block) {
  if (!block) return '';
  if (block.type === 'paragraph' || block.type === 'callout' || block.type === 'quote' || block.type === 'subhead') {
    return cleanString(block.text);
  }
  if (block.type === 'lines' || block.type === 'bullet_list' || block.type === 'numbered_list') {
    return normalizeStringArray(block.items).join(' ');
  }
  if (block.type === 'flow') return flowPlainText(block);
  return '';
}

function sectionToPlainText(section) {
  if (!section?.blocks) return '';
  return section.blocks.map(blockToPlainText).filter(Boolean).join('\n');
}

function findSection(entry, keys) {
  const wanted = new Set(keys.map(k => k.toLowerCase()));
  return entry.sections.find(section => wanted.has((section.key || '').toLowerCase())) || null;
}

function renderBlock(block) {
  if (!block) return '';

  if (block.type === 'paragraph') {
    return `<p>${escapeHtml(block.text)}</p>`;
  }

  if (block.type === 'subhead') {
    return `<h4 class="daily-subhead">${escapeHtml(block.text)}</h4>`;
  }

  if (block.type === 'callout') {
    const prefix = cleanString(block.prefix || '👉');
    return `<p class="daily-callout"><span class="daily-callout-prefix">${escapeHtml(prefix)}</span> ${escapeHtml(block.text)}</p>`;
  }

  if (block.type === 'quote') {
    return `<blockquote>${escapeHtml(block.text)}</blockquote>`;
  }

  if (block.type === 'lines') {
    // Lines that belong together stay together (one short group, line breaks inside)
    return `<p class="daily-lines">${block.items.map(item => escapeHtml(item)).join('<br>')}</p>`;
  }

  if (block.type === 'bullet_list') {
    const items = block.items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
    return `<ul>${items}</ul>`;
  }

  if (block.type === 'numbered_list') {
    const items = block.items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
    return `<ol>${items}</ol>`;
  }

  if (block.type === 'flow') return renderFlowHtml(block, escapeHtml);

  return '';
}

function renderSection(section) {
  if (!section) return '';
  const blocksHtml = section.blocks.map(renderBlock).join('\n');
  return `
    <section class="daily-section daily-section-${escapeHtml(section.key || 'section')}">
      <h3 class="daily-section-title">${escapeHtml(section.label || 'Section')}</h3>
      ${blocksHtml}
    </section>
  `.trim();
}

function buildInsightHTML(entry) {
  const hiddenKeys = new Set([
    'action_step',
    'one_minute_win',
    'declaration'
  ]);

  const sections = entry.sections.filter(section => !hiddenKeys.has((section.key || '').toLowerCase()));
  return sections.map(renderSection).join('\n\n');
}

function buildPrimaryVerseRefHTML(entry) {
  const scriptures = entry.scriptures || [];
  if (!scriptures.length) return escapeHtml(entry.verse_ref || '');

  return scriptures
    .map(s => escapeHtml(s.ref || ''))
    .filter(Boolean)
    .join('<br>');
}

function buildPrimaryVerseTextHTML(entry) {
  const scriptures = entry.scriptures || [];
  if (!scriptures.length) return escapeHtml(entry.verse_text || '');

  return scriptures
    .map(s => {
      const ref = cleanString(s.ref);
      const text = cleanString(s.text);
      if (ref && text) return `<strong>${escapeHtml(ref)}</strong><br>${escapeHtml(text)}`;
      if (ref) return `<strong>${escapeHtml(ref)}</strong>`;
      return escapeHtml(text);
    })
    .filter(Boolean)
    .join('<br><br>');
}

async function mergeRedirectLines(linesToEnsure) {
  let existing = '';
  try {
    existing = await fs.readFile(REDIRECTS, 'utf-8');
  } catch {
    existing = '';
  }

  const existingLines = existing
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const seen = new Set(existingLines);

  for (const line of linesToEnsure) {
    if (line && !seen.has(line)) {
      existingLines.push(line);
      seen.add(line);
    }
  }

  // Netlify uses the first matching rule: keep the catch-all "200" passthroughs
  // last so redirects and release guards above them actually apply.
  const isPassthrough = l => /\s200!?$/.test(l);
  const ordered = [...existingLines.filter(l => !isPassthrough(l)), ...existingLines.filter(isPassthrough)];
  await fs.writeFile(REDIRECTS, ordered.join('\n') + '\n', 'utf-8');
}

async function ensurePassthroughs() {
  await mergeRedirectLines([
    '/daily/*   /daily/:splat   200',
    '/blog/*   /blog/:splat   200'
  ]);
  console.log('✅ Ensured passthrough rules for /daily/* and /blog/*.');
}

async function readDailyEntries() {
  let files = [];
  try {
    files = (await fs.readdir(CONTENT_DIR)).filter(f => f.endsWith('.json'));
  } catch {
    files = [];
  }

  const entries = [];

  for (const f of files) {
    const fullPath = path.join(CONTENT_DIR, f);
    const raw = await fs.readFile(fullPath, 'utf-8');
    const j = JSON.parse(raw);
    const entry = normalizeDailyEntry(j);

    if (!entry.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
      throw new Error(`Bad/missing "date" in ${f}`);
    }

    if (!entry.verse_ref && !(entry.scriptures && entry.scriptures.length)) {
      throw new Error(`Missing scripture data in ${f}`);
    }

    entries.push(entry);
  }

  entries.sort((a, b) => a.date.localeCompare(b.date));
  return entries;
}

async function rebuildDailyOutputDir() {
  try {
    await fs.rm(DAILY_DIR, { recursive: true, force: true });
    await fs.rm(LEADERSHIP_DIR, { recursive: true, force: true });
  } catch {}
  await fs.mkdir(DAILY_DIR, { recursive: true });
}

function partitionEntries(entries, today) {
  const allowed = entries.filter(e => e.date >= START_DATE);
  const visible = allowed.filter(e => e.date <= today);
  const future = allowed.filter(e => e.date > today);
  const older = entries.filter(e => e.date < START_DATE);

  return { allowed, visible, future, older };
}

async function writeArchiveJson(visible) {
  const archive = visible
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(e => ({
      date: e.date,
      title: e.title || '',
      subtitle: e.subtitle || '',
      verse_ref: e.verse_ref || '',
      href: pagePathFor(e),
      ...(cleanString(e.headline) ? { headline: cleanString(e.headline) } : {}),
      ...(cleanString(e.category) ? { category: cleanString(e.category) } : {}),
      ...(cleanString(e.tagline) ? { tagline: cleanString(e.tagline) } : {})
    }));

  await fs.writeFile(
    path.join(DATA_DIR, 'daily-archive.json'),
    JSON.stringify(archive, null, 2)
  );
}

async function writeLatestDailyJson(visible) {
  const todayEntry = visible.length ? visible[visible.length - 1] : null;

  if (!todayEntry) {
    try {
      await fs.unlink(path.join(DATA_DIR, 'daily.json'));
    } catch {}
    return;
  }

  const declarationSection = findSection(todayEntry, ['declaration']);
  const actionSection = findSection(todayEntry, ['action_step', 'one_minute_win']);
  const teaser = [todayEntry.tagline || '', ...todayEntry.sections
    .map(sectionToPlainText)]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);

  const dailyData = {
    date: todayEntry.date,
    href: pagePathFor(todayEntry),
    share_base: `${SITE_URL}/share/${shareKeyFor(todayEntry)}/`,
    title: todayEntry.title || '',
    subtitle: todayEntry.subtitle || '',
    ...(cleanString(todayEntry.headline) ? { headline: cleanString(todayEntry.headline) } : {}),
    ...(cleanString(todayEntry.headline_sub) ? { headline_sub: cleanString(todayEntry.headline_sub) } : {}),
    ...(cleanString(todayEntry.category) ? { category: cleanString(todayEntry.category) } : {}),
    tagline: todayEntry.tagline || '',
    verse_ref: todayEntry.verse_ref || '',
    verse_text: todayEntry.verse_text || '',
    scriptures: todayEntry.scriptures || [],
    sections: todayEntry.sections || [],
    insight: todayEntry.sections.map(sectionToPlainText).filter(Boolean),
    insight_teaser: teaser,
    one_minute_win: actionSection ? sectionToPlainText(actionSection) : '',
    declaration: declarationSection ? sectionToPlainText(declarationSection) : ''
  };

  await fs.writeFile(
    path.join(DATA_DIR, 'daily.json'),
    JSON.stringify(dailyData, null, 2)
  );
}

async function buildDailyPages(visible) {
  const tpl = await fs.readFile(TPL_PATH, 'utf-8');

  for (let i = 0; i < visible.length; i++) {
    const e = visible[i];
    const prev = i > 0 ? visible[i - 1] : null;
    const next = i < visible.length - 1 ? visible[i + 1] : null;

    const declarationSection = findSection(e, ['declaration']);
    const actionSection = findSection(e, ['action_step', 'one_minute_win']);

    const seo = seoFor(e);

    const html = fill(tpl, {
      SEO_TITLE: escapeHtml(seo.title),
      SEO_DESCRIPTION: escapeHtml(seo.description),
      SOCIAL_TITLE: escapeHtml(seo.socialTitle),
      SOCIAL_TITLE_ENC: escapeHtml(encodeURIComponent(seo.socialTitle)),
      CANONICAL_URL: escapeHtml(seo.url),
      CANONICAL_URL_ENC: escapeHtml(encodeURIComponent(seo.url)),
      OG_IMAGE: escapeHtml(seo.image),
      OG_IMAGE_ALT_TAGS: seo.imageAlt
        ? `<meta property="og:image:alt" content="${escapeHtml(seo.imageAlt)}"/>\n  <meta name="twitter:image:alt" content="${escapeHtml(seo.imageAlt)}"/>`
        : '',
      JSON_LD: jsonLdFor(e, seo),
      SERIES_HTML: eyebrowHtml(e),
      HERO_TITLE: hasLeadershipPage(e) ? 'Leadership &amp; Culture' : 'Daily',
      NEXT_STEPS_HTML: nextStepsHtml(e, hasLeadershipPage(e) ? 'leadership' : 'daily'),
      SIGNUP_TITLE: hasLeadershipPage(e) ? 'Get posts like this in your inbox' : 'Get the Daily in your inbox',
      SIGNUP_TEXT: hasLeadershipPage(e)
        ? 'Leadership posts like this one come out as part of The Daily. Get each one by email the morning it comes out.'
        : 'Join the men receiving each new Daily by email the morning it comes out.',
      HERO_SUB: hasLeadershipPage(e)
        ? 'For leaders, managers, coaches, pastors and parents.'
        : 'Scripture, reflection, and one clear step to live it out.',
      TITLE: escapeHtml(cleanString(e.headline) || e.title || 'Untitled'),
      SUBTITLE_HTML: (() => {
        const sub = cleanString(e.headline) ? cleanString(e.headline_sub) : cleanString(e.subtitle);
        return sub ? `<span class="daily-subtitle" id="dSubtitle">${escapeHtml(sub)}</span>` : '';
      })(),
      SERIES_NOTE_HTML: cleanString(e.series)
        ? `<p class="daily-series-note">Part of the series <em>${escapeHtml(cleanString(e.series))}</em></p>`
        : '',
      TAGLINE_HTML: (e.tagline ? `<p class="daily-tagline" id="dTagline">${escapeHtml(e.tagline)}</p>` : '')
        + (cleanString(e.hero_image)
          ? `<figure class="daily-hero-image" style="margin:1rem auto 1.25rem;max-width:480px;"><img src="${escapeHtml(cleanString(e.hero_image))}" alt="${escapeHtml(cleanString(e.hero_image_alt) || cleanString(e.headline) || e.title || '')}" style="display:block;width:100%;height:auto;border-radius:12px;" loading="eager"></figure>`
          : ''),
      AUDIO_HTML: (() => {
        const file = cleanString(e.audio_file);
        if (/^\/[A-Za-z0-9/_.-]+$/.test(file)) {
          const label = cleanString(e.audio_label) || 'Listen to the Conversation';
          const note = cleanString(e.audio_note) || 'An audio discussion of this post.';
          const type = /\.mp3$/i.test(file) ? 'audio/mpeg' : 'audio/mp4';
          return `<div class="daily-audio daily-audio--player"><p class="daily-audio-title"><span class="daily-audio-icon" aria-hidden="true">🎧</span> ${escapeHtml(label)}</p><audio class="daily-audio-player" controls preload="metadata" aria-label="${escapeHtml(label)}"><source src="${escapeHtml(file)}" type="${type}"><a href="${escapeHtml(file)}">Download the audio</a></audio><p class="daily-audio-note">${escapeHtml(note)}</p></div>`;
        }
        const url = cleanString(e.audio_link);
        if (!/^https:\/\//i.test(url)) return '';
        const label = cleanString(e.audio_label) || 'Listen to the Conversation';
        const note = cleanString(e.audio_note) || 'An audio discussion of this post. Opens in a new tab.';
        return `<div class="daily-audio"><a class="daily-audio-btn" href="${escapeHtml(url)}" target="_blank" rel="noopener" aria-label="${escapeHtml(label)} (opens in a new tab)"><span class="daily-audio-icon" aria-hidden="true">🎧</span><span>${escapeHtml(label)}</span></a><p class="daily-audio-note">${escapeHtml(note)}</p></div>`;
      })(),
      HUMAN_DATE: toHuman(e.date),
      DATE: e.date,
      VERSE_REF: buildPrimaryVerseRefHTML(e),
      VERSE_TEXT: buildPrimaryVerseTextHTML(e),
      INSIGHT_HTML: buildInsightHTML(e),
      ONE_MINUTE_WIN: actionSection ? sectionToPlainText(actionSection) : (e.one_minute_win || ''),
      DECLARATION: declarationSection ? sectionToPlainText(declarationSection) : (e.declaration || ''),
      PREV_HREF: prev ? pagePathFor(prev) : '#',
      NEXT_HREF: next ? pagePathFor(next) : '#',
      SHARE_BASE: escapeHtml(`${SITE_URL}/share/${shareKeyFor(e)}/`)
    });

    // Drop the Action Step / Declaration boxes when this daily doesn't have them
    const cleaned = html
      .replace(/\s*<section class="daily-section">\s*<h3>Action Step<\/h3>\s*<div class="action-step" id="dActionStep">\s*<\/div>\s*<\/section>/, '')
      .replace(/\s*<section class="daily-section">\s*<h3>Declaration<\/h3>\s*<p class="declaration-text" id="dDeclaration">\s*<\/p>\s*<\/section>/, '');

    const outFile = pageFileFor(e);
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, cleaned, 'utf-8');
  }
}


// ---------- SEO / social metadata ----------
// Optional per-post fields in content/daily/*.json:
//   seo_title        – what Google shows as the blue link (keep under ~60 chars)
//   seo_description  – the snippet under it (aim for 140–160 chars)
//   hero_image       – optional site path to an image shown under the title
//   og_image         – site path to a 1200x630 social card (scripts/og/make-og-card.py)
//   og_image_alt     – alt text for that card (og:image:alt / twitter:image:alt)
//   audio_file       – optional site path to an audio file (e.g. /assets/audio/<slug>.m4a); shows a built-in player under the title
//   audio_link       – optional https link to an audio version (e.g. a NotebookLM audio overview); shows a 🎧 button under the title
//   audio_label / audio_note – optional button text / small line under it
//   related_scriptures – extra passages the post discusses but doesn't quote up top (structured data only)
//   category         – e.g. "Leadership & Culture" (posts in this category appear on /leadership/)
//   series           – e.g. "The Battle Before the Battle"
// Every field is optional; posts without them get sensible defaults.

const DEFAULT_OG_IMAGE = '/assets/og/the-daily.png';
const LEADERSHIP_DIR = path.join(ROOT, 'leadership');
const DEFAULT_DESCRIPTION = 'Daily devotional: scripture, reflection, and a practical next step.';
const LEADERSHIP_CATEGORY = 'Leadership & Culture';

// Where a post lives on the site. Leadership posts with a "slug" get a clean
// /leadership/<slug>/ address; everything else stays at /daily/<file>.html.
function hasLeadershipPage(e) {
  return cleanString(e.category) === LEADERSHIP_CATEGORY && /^[a-z0-9-]+$/.test(cleanString(e.slug));
}

function pagePathFor(e) {
  return hasLeadershipPage(e) ? `/leadership/${cleanString(e.slug)}/` : `/daily/${fileNameFor(e)}`;
}

function pageFileFor(e) {
  return hasLeadershipPage(e)
    ? path.join(LEADERSHIP_DIR, cleanString(e.slug), 'index.html')
    : path.join(DAILY_DIR, fileNameFor(e));
}

function absoluteUrl(p = '') {
  if (/^https?:\/\//i.test(p)) return p;
  return `${SITE_URL}/${String(p).replace(/^\/+/, '')}`;
}

function truncate(text = '', max = 160) {
  const t = String(text).replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:\s]+$/, '') + '…';
}

function displayTitle(e) {
  if (cleanString(e.headline)) return cleanString(e.headline);
  return [e.title || 'Daily', e.subtitle].filter(Boolean).join(': ');
}

function seoFor(e) {
  const url = `${SITE_URL}${pagePathFor(e)}`;
  const seoTitle = cleanString(e.seo_title) || `${displayTitle(e)} | TheWrkShop`;
  const description = truncate(cleanString(e.seo_description) || cleanString(e.tagline) || `${displayTitle(e)}. ${DEFAULT_DESCRIPTION}`);
  return {
    url,
    title: seoTitle,
    socialTitle: cleanString(e.seo_title).replace(/\s*\|\s*TheWrkShop\s*$/i, '') || displayTitle(e),
    description,
    image: absoluteUrl(cleanString(e.og_image) || DEFAULT_OG_IMAGE),
    imageAlt: cleanString(e.og_image_alt)
  };
}

function seriesHubHref(e) {
  return cleanString(e.category) === LEADERSHIP_CATEGORY ? '/leadership/' : '';
}

// Small label above the title: the category, linked to its hub when it has one.
function eyebrowHtml(e) {
  const category = cleanString(e.category);
  const series = cleanString(e.series);
  const href = seriesHubHref(e);
  if (category && href) return `<a class="daily-series" href="${href}">${escapeHtml(category)}</a>`;
  if (category) return `<span class="daily-series">${escapeHtml(category)}</span>`;
  return ''; // the series name goes in the note at the bottom, never above the title
}

function jsonLdFor(e, seo) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: truncate(seo.socialTitle, 110),
    description: seo.description,
    datePublished: e.date,
    dateModified: e.date,
    url: seo.url,
    mainEntityOfPage: seo.url,
    image: seo.image,
    inLanguage: 'en-US',
    author: { '@id': 'https://thewrkshop.com/#organization' },
    publisher: { '@id': 'https://thewrkshop.com/#organization' },
    isPartOf: { '@id': 'https://thewrkshop.com/#website' }
  };
  if (cleanString(e.category)) data.articleSection = cleanString(e.category);
  if (Array.isArray(e.keywords) && e.keywords.length) data.keywords = e.keywords.join(', ');
  const refs = [
    ...(e.scriptures || []).map(s => s.ref),
    ...(Array.isArray(e.related_scriptures) ? e.related_scriptures : [])
  ].map(cleanString).filter(Boolean);
  if (refs.length) data.about = refs.map(ref => ({ '@type': 'CreativeWork', name: ref }));
  // keep "</script>" out of the inline JSON
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

// ---------- Leadership hub (/leadership/) ----------

async function buildLeadershipHub(visible) {
  const posts = visible
    .filter(e => cleanString(e.category) === LEADERSHIP_CATEGORY)
    .slice()
    .reverse();

  const outDir = LEADERSHIP_DIR;
  await fs.mkdir(outDir, { recursive: true });

  const tplPath = path.join(ROOT, 'templates', 'leadership.html');
  const tpl = await fs.readFile(tplPath, 'utf-8');

  const cards = posts.length
    ? posts.map(e => {
        const seo = seoFor(e);
        return `
      <article class="lead-card">
        <h2><a href="${pagePathFor(e)}">${escapeHtml(cleanString(e.headline) || e.subtitle || e.title || 'Daily')}</a></h2>
        ${cleanString(e.headline_sub) ? `<p class="lead-sub">${escapeHtml(cleanString(e.headline_sub))}</p>` : ''}
        ${e.tagline ? `<p class="lead-tagline">${escapeHtml(e.tagline)}</p>` : ''}
        <p class="lead-meta"><time datetime="${e.date}">${toHuman(e.date)}</time>${e.verse_ref ? ` · ${escapeHtml(e.verse_ref)}` : ''}</p>
        <a class="lead-read" href="${pagePathFor(e)}" aria-label="Read ${escapeHtml(seo.socialTitle)}">Read →</a>
      </article>`;
      }).join('\n')
    : '<p>New leadership posts are on the way.</p>';

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Leadership & Culture',
    url: `${SITE_URL}/leadership/`,
    isPartOf: { '@id': 'https://thewrkshop.com/#website' },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: posts.map((e, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}${pagePathFor(e)}`,
        name: seoFor(e).socialTitle
      }))
    }
  };

  const html = fill(tpl, {
    CARDS_HTML: cards,
    JSON_LD: JSON.stringify(itemList).replace(/</g, '\\u003c')
  });
  await fs.writeFile(path.join(outDir, 'index.html'), html, 'utf-8');
  return posts.length;
}

// ---------- Email feed (Kit RSS-to-email reads this) ----------

function xmlEscape(value = '') {
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function writeDailyFeed(visible) {
  const items = visible.slice(-20).reverse().map(e => {
    const url = `${SITE_URL}${pagePathFor(e)}`;
    const title = [e.title || 'Daily', e.subtitle].filter(Boolean).join(' — ');
    const pubDate = new Date(`${e.date}T06:01:00Z`).toUTCString(); // just after midnight Central
    const html = dailyBodyHtml(e, url).replace(/]]>/g, ']]&gt;');
    return `    <item>
      <title>${xmlEscape(title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${html}]]></description>
      <content:encoded><![CDATA[${html}]]></content:encoded>
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TheWrkShop — The Daily</title>
    <link>${SITE_URL}/daily.html</link>
    <atom:link href="${SITE_URL}/daily/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Daily devotionals for men from TheWrkShop: scripture, reflection, and one clear step to live it out.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>
`;
  await fs.writeFile(path.join(DAILY_DIR, 'feed.xml'), xml, 'utf-8');
}

// ---------- Share pages for single gems and charts ----------
// Sharing one Hidden Gem, chart or audit links to /share/<key>/gem-N/ (or chart-N/, audit-N/).
// That page's preview card (assets/og/share/<key>/<id>.jpg, made by
// scripts/og/make-share-cards.py) shows just that piece, so texts and social
// posts show what was shared instead of the whole daily. Numbering must match
// make-share-cards.py and assets/js/daily-share.js.

const SHARE_DIR = path.join(ROOT, 'share');

function shareKeyFor(e) {
  return hasLeadershipPage(e) ? cleanString(e.slug) : e.date;
}

function shareItemsFor(e) {
  const hidden = new Set(['action_step', 'one_minute_win', 'declaration']);
  const gems = [];
  const charts = [];
  const audits = [];
  for (const s of e.sections || []) {
    const key = cleanString(s.key).toLowerCase();
    if (hidden.has(key)) continue;
    const blocks = s.blocks || [];
    if (key === 'hidden_gems' || key === 'gem') {
      for (const b of blocks) {
        if ((b.type === 'callout' || b.type === 'quote') && cleanString(b.text)) gems.push(cleanString(b.text));
      }
    }
    for (const b of blocks) {
      if (b.type === 'flow' && b.steps && b.steps.length >= 2) {
        charts.push({ heading: cleanString(s.label) || cleanString(b.title) || 'Watch the Progression', block: b });
      }
    }
    if (key.includes('audit')) {
      const parts = auditParts(blocks);
      if (parts.some(pt => pt.kind === 'q')) audits.push({ heading: cleanString(s.label) || 'The Audit', parts });
    }
  }
  return { gems, charts, audits };
}

// The Audit in its written order: questions, the lines between them, the closing question(s).
function auditParts(blocks) {
  const parts = [];
  for (const b of blocks || []) {
    if (b.type === 'bullet_list' || b.type === 'numbered_list') {
      for (const it of b.items || []) if (cleanString(it)) parts.push({ kind: 'q', text: cleanString(it) });
    } else if (b.type === 'callout') {
      if (cleanString(b.text)) parts.push({ kind: 'key', text: cleanString(b.text) });
    } else if (b.type === 'lines') {
      for (const it of b.items || []) if (cleanString(it)) parts.push({ kind: 'note', text: cleanString(it) });
    } else if (b.type === 'paragraph' || b.type === 'quote' || b.type === 'subhead') {
      if (cleanString(b.text)) parts.push({ kind: 'note', text: cleanString(b.text) });
    }
  }
  return parts;
}

function quotedGem(text) {
  return /[“”"]/.test(text) ? text : `“${text}”`;
}

async function buildSharePages(visible) {
  await fs.rm(SHARE_DIR, { recursive: true, force: true });
  let count = 0;
  for (const e of visible) {
    const { gems, charts, audits } = shareItemsFor(e);
    if (!gems.length && !charts.length && !audits.length) continue;
    const key = shareKeyFor(e);
    const dayUrl = `${SITE_URL}${pagePathFor(e)}`;
    const headline = displayTitle(e);
    const fallbackImage = absoluteUrl(cleanString(e.og_image) || DEFAULT_OG_IMAGE);

    const items = [
      ...gems.map((text, i) => ({ id: `gem-${i + 1}`, kind: 'gem', text })),
      ...charts.map((c, i) => ({ id: `chart-${i + 1}`, kind: 'chart', ...c })),
      ...audits.map((a, i) => ({ id: `audit-${i + 1}`, kind: 'audit', ...a }))
    ];

    for (const it of items) {
      const cardRel = `assets/og/share/${key}/${it.id}.jpg`;
      let image = fallbackImage;
      try { await fs.access(path.join(ROOT, cardRel)); image = `${SITE_URL}/${cardRel}`; } catch {}
      const shareUrl = `${SITE_URL}/share/${key}/${it.id}/`;
      const target = `${dayUrl}#${it.id}`;
      const isGem = it.kind === 'gem';
      const isAudit = it.kind === 'audit';
      const qCount = isAudit ? it.parts.filter(pt => pt.kind === 'q').length : 0;
      const title = isGem ? quotedGem(it.text) : `${it.heading}: ${headline}`;
      const description = isGem
        ? `A Hidden Gem from “${headline}.” Read the whole daily at TheWrkShop.com.`
        : isAudit
          ? `${qCount} questions to ask yourself, from “${headline}.” Read the whole daily at TheWrkShop.com.`
          : `A chart from “${headline}.” Read the whole daily at TheWrkShop.com.`;
      const imageAlt = isGem
        ? `${it.text} — TheWrkShop.com`
        : `${isAudit ? '' : 'Chart: '}${it.heading}, from ${headline}. TheWrkShop.com`;
      const auditHtml = isAudit
        ? `<div class="share-audit">${it.parts.map(pt => pt.kind === 'note'
            ? `<p class="share-audit-note">${escapeHtml(pt.text)}</p>`
            : `<p class="share-audit-q${pt.kind === 'key' ? ' share-audit-key' : ''}">${escapeHtml(pt.text)}</p>`).join('')}</div>`
        : '';
      const body = isGem
        ? `<p class="share-kicker">Hidden Gem</p>\n      <blockquote class="share-gem">${escapeHtml(quotedGem(it.text))}</blockquote>`
        : isAudit
          ? `<p class="share-kicker">${escapeHtml(headline)}</p>\n      <h1 class="share-chart-title">${escapeHtml(it.heading)}</h1>\n      ${auditHtml}`
          : `<p class="share-kicker">${escapeHtml(headline)}</p>\n      <h1 class="share-chart-title">${escapeHtml(it.heading)}</h1>\n      ${renderFlowHtml(it.block, escapeHtml)}`;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeHtml(title)} | TheWrkShop</title>
  <meta name="robots" content="noindex, follow"/>
  <link rel="canonical" href="${escapeHtml(dayUrl)}"/>
  <link rel="stylesheet" href="/style.css"/>
  <link rel="icon" type="image/x-icon" href="/assets/favicon/favicon.ico?v=2">
  <meta name="description" content="${escapeHtml(description)}"/>
  <meta property="og:site_name" content="TheWrkShop"/>
  <meta property="og:type" content="article"/>
  <meta property="og:title" content="${escapeHtml(title)}"/>
  <meta property="og:description" content="${escapeHtml(description)}"/>
  <meta property="og:url" content="${escapeHtml(shareUrl)}"/>
  <meta property="og:image" content="${escapeHtml(image)}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:image:alt" content="${escapeHtml(imageAlt)}"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${escapeHtml(title)}"/>
  <meta name="twitter:description" content="${escapeHtml(description)}"/>
  <meta name="twitter:image" content="${escapeHtml(image)}"/>
  <meta name="twitter:image:alt" content="${escapeHtml(imageAlt)}"/>
  <style>
    .share-wrap { max-width: 640px; margin: 0 auto; padding: 2rem 1.1rem 3rem; }
    .share-card { background: #f4f1ee; border-radius: 16px; padding: 2rem 1.5rem; box-shadow: 0 6px 24px rgba(0,0,0,.08); text-align: center; }
    .share-kicker { font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #8a6a52; margin: 0 0 1rem; }
    .share-gem { font-family: Georgia, serif; font-size: 1.7rem; font-weight: 700; line-height: 1.35; color: #3e2c23; margin: 0; border: 0; padding: 0; }
    .share-chart-title { font-family: Georgia, serif; font-size: 1.6rem; color: #3e2c23; margin: 0 0 .5rem; }
    .share-from { color: #6b5b53; margin: 1.5rem 0 1.25rem; }
    .share-from strong { color: #3e2c23; }
    .share-cta { display: inline-block; background: #3e2c23; color: #f4f1ee; font-weight: 700; text-decoration: none; border-radius: 999px; padding: .8rem 1.4rem; }
    .share-cta:hover { background: #2c1f18; }
    .share-alt { margin: 1rem 0 0; font-size: .95rem; }
    .share-alt a { color: #3e2c23; }
    .share-audit { max-width: 480px; margin: 1rem auto 0; }
    .share-audit-q { background: #fff; color: #3e2c23; border: 1px solid rgba(62,44,35,.2); border-radius: 10px; padding: .7rem .9rem; font-weight: 700; line-height: 1.35; margin: 0 0 .6rem; }
    .share-audit-key { background: #3e2c23; color: #f4f1ee; border-color: #3e2c23; }
    .share-audit-note { color: #6b5b53; font-style: italic; margin: .2rem 0 .6rem; }
${FLOW_CSS}
  </style>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-N48478JV2Z"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-N48478JV2Z');</script>
</head>
<body>
  <div id="site-header"></div>
  <main class="share-wrap">
    <article class="share-card">
      ${body}
      <p class="share-from">From <strong>${escapeHtml(headline)}</strong> · <time datetime="${e.date}">${toHuman(e.date)}</time></p>
      <a class="share-cta" href="${escapeHtml(target)}">Read the whole daily →</a>
      <p class="share-alt"><a href="/daily.html">Get The Daily by email</a></p>
    </article>
  </main>
  <script src="/script.js"></script>
</body>
</html>
`;
      const out = path.join(SHARE_DIR, key, it.id, 'index.html');
      await fs.mkdir(path.dirname(out), { recursive: true });
      await fs.writeFile(out, html, 'utf-8');
      count++;
    }
  }
  return count;
}

function guardAndMoveLines(visible, older, future) {
  return [
    // posts that moved to /leadership/<slug>/ keep their old daily link working
    ...visible.filter(hasLeadershipPage).map(e => `/daily/${fileNameFor(e)}   ${pagePathFor(e)}   301!`),
    ...older.map(e => `/daily/${fileNameFor(e)}   /daily-archive.html   302!`),
    ...future.map(e => `/daily/${fileNameFor(e)}   /daily-archive.html   302!`)
  ];
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const entries = await readDailyEntries();
  const today = todayCentralISO();
  // On the staging preview, build upcoming dailies (up to 31 days ahead) so a queued series can be
  // reviewed page by page before release. The "today" daily (homepage, daily.json) stays the real
  // today. Production (thewrkshop.com) still only shows dailies dated today or earlier.
  const isStagingPreview = process.env.CONTEXT === 'branch-deploy' && process.env.BRANCH === 'staging';
  const buildUntil = isStagingPreview
    ? new Date(new Date(today + 'T12:00:00Z').getTime() + 31 * 864e5).toISOString().slice(0, 10)
    : today;

  const { visible, future, older } = partitionEntries(entries, buildUntil);

  // Netlify uses the first matching rule, so moves and guards go before the passthroughs
  await mergeRedirectLines(guardAndMoveLines(visible, older, future));
  await ensurePassthroughs();

  await rebuildDailyOutputDir();
  await writeArchiveJson(visible);
  await writeLatestDailyJson(visible.filter(e => e.date <= today));
  await buildDailyPages(visible);
  const shareCount = await buildSharePages(visible);
  const leadershipCount = await buildLeadershipHub(visible);
  await writeDailyFeed(visible);

  console.log(
    `Built ${visible.length} daily pages in [${START_DATE}..${today}]. Older blocked: ${older.length}. Future blocked: ${future.length}. Leadership hub: ${leadershipCount} posts. Share pages: ${shareCount}.`
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});