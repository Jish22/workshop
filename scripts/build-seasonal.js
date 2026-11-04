// Out of season, seasonal pages (e.g. Easter.html) redirect to the homepage and leave the sitemap.
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { todayCentralISO } from './shared/render-content.js';
import { SEASONAL_PAGES, isInSeason, isStagingPreview } from './shared/seasonal.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REDIRECTS = path.join(ROOT, '_redirects');

const today = todayCentralISO();
let lines = [];
try { lines = (await fs.readFile(REDIRECTS, 'utf-8')).split('\n').filter(Boolean); } catch {}

const isSeasonalRule = (l) => SEASONAL_PAGES.some(p => [p.path, p.path.replace(/\.html$/, '')].includes(l.split(/\s+/)[0]));
lines = lines.filter(l => !isSeasonalRule(l));

const isLive = (p) => isInSeason(p, today) || (p.previewOnStaging && isStagingPreview());
const off = SEASONAL_PAGES.filter(p => !isLive(p));
// Cover both /page.html and the pretty /page address.
const rules = off.flatMap(p => [p.path, p.path.replace(/\.html$/, '')].map(u => `${u}   /   302!`));

// Rules go ahead of the catch-all "200" passthroughs so they apply.
const isPassthrough = (l) => /\s200!?$/.test(l);
const ordered = [...lines.filter(l => !isPassthrough(l)), ...rules, ...lines.filter(isPassthrough)];
await fs.writeFile(REDIRECTS, ordered.join('\n') + '\n', 'utf-8');

// The header Give button reads this to know whether to show itself.
const give = SEASONAL_PAGES.find(p => p.file === 'give.html');
await fs.mkdir(path.join(ROOT, 'data'), { recursive: true });
await fs.writeFile(path.join(ROOT, 'data', 'giving.json'), JSON.stringify({ live: isLive(give) }) + '\n', 'utf-8');

for (const p of SEASONAL_PAGES) {
  console.log(`${p.file}: ${isLive(p) ? 'in season (live)' : 'out of season (redirects home)'} on ${today}`);
}
