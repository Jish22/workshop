// --------- Build/version marker ----------
console.log("script.js :: build=headerfix2");

// --------- Brand ----------
const siteName = "TheWrkShop";
document.querySelectorAll(".sitename").forEach(el => (el.textContent = siteName));

// --------- Utilities ----------
function todayCentralISO() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

// --------- Header injection (safe) ----------
async function injectHTML(selector, url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return;
    const text = await res.text();

    // skip if it looks like a whole HTML doc (e.g., 404 page)
    if (/<!doctype html/i.test(text) || /<html[\s>]/i.test(text)) return;

    const host = document.querySelector(selector);
    if (host) host.innerHTML = text;
  } catch (err) {
    console.warn("Header injection failed:", err);
  }
}

// Shared destinations keep the header, breadcrumbs, and footer consistent.
const siteSections = {
  devotionals: { label: 'Devotionals', href: '/daily-archive.html' },
  podcasts: { label: 'Podcasts', href: '/podcasts.html' },
  tools: { label: 'Tools', href: '/resources.html' },
  studies: { label: 'Studies', href: '/studies/' },
  groups: { label: 'Groups', href: '/get-known.html' },
  leadership: { label: 'Leadership', href: '/leadership/' },
  blog: { label: 'Blog', href: '/blog-archive.html' },
  library: { label: 'Browse Everything', href: '/library/' },
  start: { label: 'Start Here', href: '/upstream/' }
};
function sectionForPath(path) {
  if (/^\/(daily(?:[/.]|-archive\.html))/.test(path)) return 'devotionals';
  if (path === '/podcasts.html') return 'podcasts';
  if (/^\/(resources(?:[/.])|tools\/|patterns\/|prayer\/|belief\/|one-verse-man\/|after-the-amen\/|assessment\.html|infographics\/|sub-pages\/resources\/)/.test(path)) return 'tools';
  if (path.startsWith('/studies/')) return 'studies';
  if (['/get-known.html', '/request-membership.html'].includes(path)) return 'groups';
  if (path.startsWith('/leadership/')) return 'leadership';
  if (path.startsWith('/blog/') || path === '/blog-archive.html') return 'blog';
  if (path.startsWith('/library/')) return 'library';
  if (path.startsWith('/upstream/')) return 'start';
  return null;
}
function enhanceSiteNavigation() {
  const key = sectionForPath(location.pathname);
  const section = siteSections[key];
  document.querySelectorAll('#site-header [data-section]').forEach(link => {
    if (link.dataset.section === key) {
      link.setAttribute('aria-current', location.pathname === section.href ? 'page' : 'location');
      link.closest('details')?.classList.add('has-current-section');
    }
  });
  const more = document.getElementById('nav-more');
  document.addEventListener('click', event => {
    if (more && !more.contains(event.target)) more.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && more?.open) {
      more.open = false;
      more.querySelector('summary').focus();
    }
  });
  // Use text nodes for page titles so content can never become injected markup.
  if (section && !document.querySelector('.site-breadcrumbs')) {
    const nav = document.createElement('nav');
    nav.className = 'site-breadcrumbs';
    nav.setAttribute('aria-label', 'Breadcrumb');
    const list = document.createElement('ol');
    const add = (label, href) => {
      const item = document.createElement('li');
      const node = document.createElement(href ? 'a' : 'span');
      node.textContent = label;
      if (href) node.href = href;
      else node.setAttribute('aria-current', 'page');
      item.append(node); list.append(item);
    };
    add('Home', '/');
    const isHub = location.pathname === section.href || location.pathname === section.href + 'index.html';
    add(section.label, isHub ? null : section.href);
    if (!isHub) add(document.querySelector('h1')?.textContent.trim() || document.title.split('|')[0].trim(), null);
    nav.append(list);
    document.getElementById('site-header')?.after(nav);
  }
  const footer = document.querySelector('footer .footer-links');
  if (footer) {
    footer.replaceChildren();
    const destinations = [{label:'The Daily', href:'/daily.html'}, ...Object.values(siteSections),
      {label:'Our Story', href:'/#about'}, {label:'Contact', href:'/#contact'}, {label:'Privacy', href:'/privacy/'}];
    destinations.forEach(destination => {
      const link = document.createElement('a');
      link.href = destination.href; link.textContent = destination.label;
      if (destination.href === section?.href) link.setAttribute('aria-current', 'location');
      footer.append(link);
    });
  }
}

// --------- DOM Ready ----------
document.addEventListener("DOMContentLoaded", function () {
  // Hamburger menu rebinder
  function rebindNavToggle() {
    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.getElementById('nav-links');
    if (hamburger && navLinks) {
      hamburger.type = "button";
      hamburger.setAttribute('aria-expanded', 'false');

      hamburger.onclick = () => {
        const willOpen = !navLinks.classList.contains('show');
        navLinks.classList.toggle('show', willOpen);
        hamburger.setAttribute('aria-expanded', String(willOpen));
      };

      // Let keyboard users dismiss the expanded navigation.
      hamburger.onkeydown = (event) => {
        if (event.key === 'Escape') {
          navLinks.classList.remove('show');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      };
      navLinks.onkeydown = (event) => {
        if (event.key === 'Escape') {
          navLinks.classList.remove('show');
          hamburger.setAttribute('aria-expanded', 'false');
          hamburger.focus();
        }
      };

      // optional: close when a nav link is tapped
      navLinks.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
          navLinks.classList.remove('show');
          hamburger.setAttribute('aria-expanded', 'false');
          const more = document.getElementById('nav-more');
          if (more) more.open = false;
        }
      });
    }
  }

  rebindNavToggle();

  // Kill any service worker that might cache stale pages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
  }

  // ConvertKit subscription form
  const form = document.getElementById("emailForm");
  const successMessage = document.getElementById("successMessage");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const formId = "8460334";
      const apiKey = "qwXtdRjQfoLppDUjjcd_8Q";
      try {
        const response = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: apiKey, email })
        });
        if (response.ok) {
          try { if (window.gtag) gtag('event', 'newsletter_signup', { source: location.pathname }); } catch (e) {}
          if (successMessage) successMessage.style.display = "block";
          form.reset();
        } else {
          alert("Something went wrong. Please try again.");
        }
      } catch (err) {
        console.error(err);
        alert("There was a problem subscribing.");
      }
    });
  }

  // Contact form — sends to TheWrkShop (see netlify/functions/contact-send.mjs)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const contactMsg = document.getElementById('contactMsg');
    const sayContact = (text, ok) => { if (contactMsg) { contactMsg.textContent = text; contactMsg.classList.toggle('is-error', !ok); } };
    const params = new URLSearchParams(location.search);
    if (params.get('contact') === 'sent') sayContact("Thanks! Your message is on its way. Check your inbox for a confirmation.", true);
    if (params.get('contact') === 'error') sayContact('Something went wrong. Please try again.', false);
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button');
      const body = {
        name: contactForm.name.value.trim(),
        email: contactForm.email.value.trim(),
        message: contactForm.message.value.trim(),
        company: contactForm.company ? contactForm.company.value : ''
      };
      if (!body.name || !body.email || !body.message) { sayContact('Please fill in your name, email and message.', false); return; }
      btn.disabled = true;
      sayContact('Sending…', true);
      try {
        const res = await fetch('/contact/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
        contactForm.reset();
        sayContact("Thanks! Your message is on its way. Check your inbox for a confirmation.", true);
        if (window.gtag) gtag('event', 'contact_form_sent');
      } catch (err) {
        sayContact(err.message || 'Something went wrong. Please try again.', false);
      } finally {
        btn.disabled = false;
      }
    });
  }

  // Daily email signup — saves to TheWrkShop's own list (see netlify/functions/daily-subscribe.mjs)
  document.querySelectorAll('form.daily-signup-form').forEach(f => {
    const msg = f.parentElement.querySelector('.daily-signup-msg');
    const say = (text, ok) => { if (msg) { msg.textContent = text; msg.classList.toggle('is-error', !ok); } };
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (f.email.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say('Please enter a valid email address.', false); return; }
      const btn = f.querySelector('button');
      btn.disabled = true;
      say('Signing you up…', true);
      try {
        const res = await fetch('/email/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            first_name: (f.first_name ? f.first_name.value : '').trim(),
            company: f.company ? f.company.value : '',
            source: location.pathname === '/' || location.pathname === '/index.html' ? 'home'
              : location.pathname.startsWith('/leadership/') ? 'leadership'
              : location.pathname.startsWith('/daily/') ? 'daily-page' : 'daily-today'
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
        f.reset();
        try { if (window.gtag) gtag('event', 'daily_signup', { source: location.pathname, already_active: data.status === 'active' }); } catch (e) {}
        say(data.status === 'active'
          ? (data.message || "You're already on the list.")
          : "Almost done. Check your inbox and tap the confirm button, and the Daily will come to you.", true);
      } catch (err) {
        console.error(err);
        say(err.message || 'Something went wrong. Please try again.', false);
      } finally {
        btn.disabled = false;
      }
    });
  });

  // ✅ Inject header on any page that has #site-header (home + blog + others)
  const needsHeader = document.getElementById('site-header');
  if (needsHeader) {
    injectHTML('#site-header', '/pages/details/header.html').then(() => {
      // Confirm we actually injected something
      if (!needsHeader.innerHTML.trim()) {
        console.warn('Header did not inject (doctype/html detected or 404).');
      }
      document.querySelectorAll(".sitename").forEach(el => (el.textContent = siteName));
      rebindNavToggle();
      enhanceSiteNavigation();
      showGiveIfLive();
    });
  }
});

// --------- Give button ----------
// The build writes /data/giving.json: live only on the staging preview, or on the live site
// from the launch date set in scripts/shared/seasonal.js (GIVE_LAUNCH).
async function showGiveIfLive() {
  try {
    const res = await fetch('/data/giving.json', { cache: 'no-store' });
    if (!res.ok) return;
    const { live } = await res.json();
    if (live) document.querySelectorAll('.nav-give').forEach(el => { el.hidden = false; });
  } catch {}
}

// --------- Daily Feature loader ----------
// Cut long text at a word boundary so cards never end mid-word (matches scripts/build-home.js)
function trimTeaser(text, max = 180) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const at = cut.lastIndexOf(' ');
  return (at > 60 ? cut.slice(0, at) : cut).replace(/[\s,;:.–—-]+$/, '') + '…';
}
(async function loadDailyFeature(){
  const ctx = document.querySelector('.daily-feature');
  if (!ctx) return;

  const el = {
    title:   ctx.querySelector('.df-title'),
    subtitle: ctx.querySelector('.df-subtitle'),
    teaser:  ctx.querySelector('.df-teaser'),
    date:    ctx.querySelector('.df-date'),
    ref:     ctx.querySelector('.verse-ref'),
    snip:    ctx.querySelector('.verse-snippet'),
    cta:     ctx.querySelector('.df-cta')
  };

  const baseSlug = (s='') => s.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/['"]/g,'')
    .replace(/[^A-Za-z0-9\s:–—-]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();

  const scriptureSlug = ref => baseSlug(ref).replace(/[:–—]/g,'-').replace(/\s+/g,'-').replace(/-+/g,'-');
  const titleSlug = t => baseSlug(t).replace(/[:–—]/g,'-').replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,60).replace(/-+$/,'');

  const humanShort = iso => {
    const dt = new Date(iso + 'T00:00:00');
    return dt.toLocaleDateString(undefined,{month:'short', day:'numeric'});
  };

  try {
    const r = await fetch('/data/daily.json', { cache: 'no-store' });
    if (!r.ok) return;
    const d = await r.json();

    // Lead with the topic headline when the Daily has one (the series name never leads)
    const mainTitle = d.headline || d.subtitle || d.title;
    const subTitle = d.headline ? (d.headline_sub || '') : (d.subtitle && d.subtitle !== mainTitle ? d.subtitle : '');
    if (el.title && mainTitle) el.title.textContent = mainTitle;
    if (el.subtitle) { el.subtitle.textContent = subTitle; el.subtitle.hidden = !subTitle; }
    if (el.teaser) {
      const teaser = d.tagline || d.insight_teaser || (Array.isArray(d.insight) ? d.insight[0] : (d.insight || ''));
      el.teaser.textContent = trimTeaser(teaser);
    }
    if (el.ref && d.verse_ref) el.ref.textContent = d.verse_ref;
    if (el.snip && d.verse_text) el.snip.textContent = '“' + d.verse_text + '”';
    if (el.date && d.date) {
      el.date.textContent = humanShort(d.date);
      el.date.setAttribute('datetime', d.date);
    }

    let href = 'daily.html';
    try {
      const ra = await fetch('/data/daily-archive.json', { cache: 'no-store' });
      if (ra.ok) {
        const list = await ra.json();
        const item = Array.isArray(list) ? list.find(x => x.date === d.date) : null;
        if (item && item.href) href = item.href;
      }
    } catch {}

    if (!href || href === 'daily.html') {
      if (d.verse_ref && d.title && d.date) {
        href = '/daily/' + scriptureSlug(d.verse_ref) + '_' + titleSlug(d.title) + '_' + d.date + '.html';
      }
    }

    if (d.date && d.date > todayCentralISO()) href = '/daily-archive.html';

    if (el.cta && href) el.cta.setAttribute('href', href);
  } catch {}
})();

// --------- Leadership feature (latest 3 leadership posts) ----------
(async function loadLeadershipCards(){
  const wrap = document.getElementById('leadCards');
  if (!wrap) return;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  try {
    const r = await fetch('/data/daily-archive.json?ts=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return;
    const list = await r.json();
    const today = todayCentralISO();
    const posts = (Array.isArray(list) ? list : [])
      .filter(p => p.category === 'Leadership & Culture' && p.href && p.date <= today)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3);
    if (!posts.length) return;
    wrap.innerHTML = posts.map(p => `
      <article class="blog-card">
        <h3><a href="${esc(p.href)}">${esc(p.headline || p.subtitle || p.title)}</a></h3>
        ${p.tagline ? `<p class="excerpt">${esc(p.tagline)}</p>` : ''}
      </article>`).join('');
  } catch {}
})();

// --------- Latest Blog mini-card ----------
(async function loadLatestBlog(){
  const card = document.getElementById('latestBlogCard');
  if (!card) return;

  const teaser = card.querySelector('.mini-teaser');
  const cta = card.querySelector('a.cta');

  try {
    const r = await fetch('/data/blog.json?ts=' + Date.now(), { cache:'no-store' });
    if (!r.ok) return;

    const b = await r.json();
    if (teaser && b.title) {
      teaser.textContent = `${b.title} • ${b.reading_minutes || 0} min`;
    }
    if (cta && b.href) {
      cta.setAttribute('href', b.href);
    }
  } catch(e) {
    if (teaser) teaser.textContent = 'See all blog posts';
    if (cta) cta.setAttribute('href', '/blog-archive.html');
  }
})();

// --------- Latest Podcast mini-card ----------
(async function loadLatestPodcast(){
  const card = document.getElementById('latestPodcastCard');
  if (!card) return;

  const teaser = card.querySelector('.mini-teaser');
  const cta    = card.querySelector('a.cta');

  // helper: normalize duration string
  function formatDuration(raw) {
    if (!raw) return '';
    // If it's already HH:MM:SS or MM:SS
    if (raw.includes(':')) {
      const parts = raw.split(':').map(x => parseInt(x, 10) || 0);
      let h=0, m=0, s=0;
      if (parts.length === 3) [h, m, s] = parts;
      else if (parts.length === 2) [m, s] = parts;
      // Round seconds if >=30
      if (s >= 30) m++;
      if (m >= 60) { h++; m -= 60; }
      if (h) return `${h}h ${m}m`;
      return `${m}m`;
    }
    // Otherwise assume it's total seconds
    const sec = parseInt(raw, 10);
    if (isNaN(sec)) return raw;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60 + (sec % 60 >= 30 ? 1 : 0));
    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m`;
    return `${sec}s`;
  }

  try {
    const r = await fetch('/data/podcast.json?ts=' + Date.now(), { cache:'no-store' });
    if (!r.ok) throw new Error('No podcast data');
    const p = await r.json();

    const mins = formatDuration(p.duration);
    if (teaser && p.title) teaser.textContent = `${p.title}${mins ? ' • ' + mins : ''}`;
    if (cta) {
      cta.href = p.page_url || p.audio_url || '#';
      cta.target = '_blank';
      cta.rel = 'noopener';
    }
  } catch {
    if (teaser) teaser.textContent = 'See all podcast episodes';
    if (cta) cta.href = '/podcasts.html';
  }
})();

// --------- Blog row (3 latest) ----------
(async function hydrateHomeBlogRow(){
  const wrap = document.getElementById('blogCards');
  if (!wrap) return;

  const todayISO = todayCentralISO();

  const cardHTML = (post) => {
    const mins = post.reading_minutes || 0;
    const cat  = post.category || 'Article';
    const href = post.href || '#';
    const title = post.title || 'Untitled';
    const excerpt = post.excerpt || '';
    return `
      <article class="blog-card">
        <h3><a href="${href}">${title}</a></h3>
        <p class="meta">${mins} min • ${cat}</p>
        <p class="excerpt">${excerpt}</p>
      </article>
    `;
  };

  try {
    const r = await fetch('/data/blog-archive.json?ts=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return;
    const list = await r.json();

    const posts = (Array.isArray(list) ? list : [])
      .filter(p => p.date && p.date <= todayISO)
      .sort((a,b) => b.date.localeCompare(a.date))
      .slice(0, 3);

    if (!posts.length) return;
    wrap.innerHTML = posts.map(cardHTML).join('');
  } catch {}
})();

// --------- Smooth-scroll on home ----------
(function () {
  const isHome = location.pathname === '/' || location.pathname.endsWith('/index.html');
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[data-scroll]').forEach(a => {
      a.addEventListener('click', (e) => {
        const sel = a.getAttribute('data-scroll');
        if (isHome) {
          const target = document.querySelector(sel);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (history.replaceState) history.replaceState(null, '', '/');
          }
        }
      });
    });
  });
})();

// --------- Text-to-Speech (Daily "Listen") ----------
// Prefer the most natural British voice the device offers, then Australian.
// Edge: Microsoft "Natural" voices; Chrome: Google UK English; Apple: Daniel/Lee.
const MALE_VOICE_RE = /\b(male|ryan|thomas|william|daniel|arthur|lee|gordon|oliver|george|alfie|elliot|ethan|noah|harry|james|malcolm|jack|darren|duncan|neil|ken|tim|rishi)\b/i;
const FEMALE_VOICE_RE = /\b(female|libby|sonia|maisie|mia|bella|hollie|abbie|natasha|annette|carly|elsie|freya|joanne|kim|tina|karen|kate|serena|martha|catherine|moira|tessa|samantha|aria|jenny|zira|hazel|susan|fiona)\b/i;

function scoreVoice(v) {
  const name = v.name || '';
  const lang = (v.lang || '').replace('_', '-').toLowerCase();
  let score;
  if (lang.startsWith('en-gb')) score = 40;
  else if (lang.startsWith('en-au')) score = 35;
  else if (lang.startsWith('en')) score = 5;
  else return -1;
  if (/natural|neural|online|premium|enhanced/i.test(name)) score += 30;
  if (/google/i.test(name)) score += 15;
  if (MALE_VOICE_RE.test(name)) score += 40;
  if (FEMALE_VOICE_RE.test(name)) score -= 20;
  if (/compact|espeak|novelty|whisper|zarvox|bad news|bells|trinoids|fred|albert|jester|organ|bubbles|cellos|boing|hysterical|superstar|wobble|grandpa|grandma|eddy|flo|reed|rocko|sandy|shelley/i.test(name)) score -= 60;
  return score;
}

function pickVoice() {
  const voices = window.speechSynthesis.getVoices() || [];
  let best = null, bestScore = 0;
  voices.forEach(v => {
    const s = scoreVoice(v);
    if (s > bestScore) { best = v; bestScore = s; }
  });
  return best;
}

// Load the voice list as soon as the page opens, so it's ready by the first tap
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => window.speechSynthesis.getVoices());
}

function voicesReady() {
  return new Promise(resolve => {
    if (window.speechSynthesis.getVoices().length) return resolve();
    const done = () => { window.speechSynthesis.removeEventListener('voiceschanged', done); resolve(); };
    window.speechSynthesis.addEventListener('voiceschanged', done);
    setTimeout(done, 1500);
  });
}

// Break text into sentence-sized chunks (long single utterances cut off in Chrome).
function chunkText(text, max = 160) {
  const sentences = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+["”’)]*\s*|[^.!?]+$/g) || [text];
  const chunks = [];
  let cur = '';
  sentences.forEach(sent => {
    if ((cur + sent).length > max && cur) { chunks.push(cur.trim()); cur = ''; }
    cur += sent;
  });
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

// ---- Read-aloud player: one play/pause control with optional sentence navigation ----
const tts = {
  chunks: [], idx: 0, playing: false, session: 0,
  voiceName: null, targetSelector: null, button: null, idleLabel: '▶ Read aloud',
  bars: []
};

// Read only the devotional text (skip buttons, badges, the control bar, nav links).
function ttsTextFrom(el) {
  const skip = el.querySelectorAll('.tts-controls, .daily-listen, .daily-meta, .daily-series, .daily-audio, .share-row, .daily-series-note, button, .badge, .nav-archive, .df-actions, time');
  const prev = [];
  skip.forEach(n => { prev.push(n.style.display); n.style.display = 'none'; });
  const raw = el.innerText || '';
  skip.forEach((n, i) => { n.style.display = prev[i]; });
  // Give headings and short lines a full stop so the voice pauses between them.
  return raw.split(/\n+/).map(l => l.trim()).filter(Boolean)
    .map(l => /[.!?:;"”’)]$/.test(l) ? l : l + '.').join(' ');
}

function ttsCurrentVoice() {
  const voices = window.speechSynthesis.getVoices() || [];
  return (tts.voiceName && voices.find(v => v.name === tts.voiceName)) || pickVoice();
}

function ttsUpdateUI() {
  const total = tts.chunks.length;
  const pos = total ? Math.min(tts.idx + 1, total) : 0;
  if (tts.button) {
    tts.button.textContent = tts.playing ? 'Ⅱ Pause reading'
      : (total ? '▶ Resume reading' : tts.idleLabel);
    tts.button.setAttribute('aria-pressed', String(tts.playing));
  }
  const staging = location.hostname.startsWith('staging--');
  tts.bars.forEach(bar => {
    bar.hidden = !total;
    bar.querySelector('[data-tts="back"]').disabled = !total || tts.idx === 0;
    bar.querySelector('[data-tts="fwd"]').disabled = !total || tts.idx >= total - 1;
    const status = bar.querySelector('.tts-status');
    status.textContent = total ? `Passage ${pos} of ${total}` : '';
    if (staging && tts.voiceName) status.textContent += ` · ${tts.voiceName}`;
  });
}

function ttsSpeakCurrent(session) {
  if (session !== tts.session) return;
  if (tts.idx >= tts.chunks.length) {           // finished
    tts.playing = false; tts.idx = 0; tts.chunks = []; ttsUpdateUI(); return;
  }
  const utter = new SpeechSynthesisUtterance(tts.chunks[tts.idx]);
  const voice = ttsCurrentVoice();
  if (voice) { utter.voice = voice; utter.lang = voice.lang; } else { utter.lang = 'en-GB'; }
  utter.rate = 0.95;
  utter.pitch = 0.82; // deeper voice
  utter.volume = 1.0;
  window.__ttsUtterance = utter; // keep a reference so Chrome doesn't drop it mid-read
  utter.onend = () => {
    if (session !== tts.session) return;
    tts.idx++; ttsUpdateUI(); ttsSpeakCurrent(session);
  };
  utter.onerror = (e) => {
    if (session !== tts.session) return;
    if (e && (e.error === 'interrupted' || e.error === 'canceled')) return;
    tts.idx++; ttsUpdateUI(); ttsSpeakCurrent(session);
  };
  window.speechSynthesis.speak(utter);
}

function ttsPlayFrom(i) {
  window.speechSynthesis.cancel();
  const session = ++tts.session;
  tts.idx = Math.max(0, Math.min(i, tts.chunks.length - 1));
  tts.playing = true;
  ttsUpdateUI();
  ttsSpeakCurrent(session);
}

function ttsLoad(targetSelector) {
  const el = document.querySelector(targetSelector);
  if (!el) return false;
  if (tts.targetSelector !== targetSelector || !tts.chunks.length) {
    tts.chunks = chunkText(ttsTextFrom(el));
    tts.idx = 0;
    tts.targetSelector = targetSelector;
  }
  return tts.chunks.length > 0;
}

async function ttsStart() {
  if (!('speechSynthesis' in window)) { alert('Your browser does not support Text-to-Speech.'); return; }
  if (!ttsLoad(tts.targetSelector)) return;
  // Start speech right inside the tap: iPhones block speech that starts later.
  if (!window.speechSynthesis.getVoices().length) {
    const unlock = new SpeechSynthesisUtterance(' ');
    unlock.volume = 0;
    window.speechSynthesis.speak(unlock);
    const session = ++tts.session;
    await voicesReady();
    if (session !== tts.session) return;
  }
  if (!tts.voiceName) {
    const v = pickVoice();
    tts.voiceName = v ? v.name : null;
    console.log('TTS voice:', v ? `${v.name} (${v.lang})` : 'device default');
  }
  ttsPlayFrom(tts.idx);
}

function ttsPause() {
  tts.playing = false;
  tts.session++;                 // stop the read loop; resume restarts the current sentence
  window.speechSynthesis.cancel();
  ttsUpdateUI();
}

function ttsStep(delta) {
  if (!tts.chunks.length) return;
  const target = Math.max(0, Math.min(tts.idx + delta, tts.chunks.length - 1));
  if (tts.playing) ttsPlayFrom(target);
  else { tts.idx = target; ttsUpdateUI(); }
}

function ttsBuildBar(anchor) {
  const bar = document.createElement('div');
  bar.className = 'tts-controls';
  bar.hidden = true;
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Audio controls');
  bar.innerHTML = `
    <button type="button" class="tts-btn" data-tts="back" aria-label="Previous passage">← Back</button>
    <button type="button" class="tts-btn" data-tts="fwd" aria-label="Next passage">Forward →</button>
    <span class="tts-status" aria-live="polite"></span>`;
  anchor.insertAdjacentElement('afterend', bar);
  bar.querySelector('[data-tts="back"]').addEventListener('click', () => ttsStep(-1));
  bar.querySelector('[data-tts="fwd"]').addEventListener('click', () => ttsStep(1));
  tts.bars.push(bar);
}

document.addEventListener('DOMContentLoaded', () => {
  const setups = [
    { id: 'listenDailyBtn', target: '.daily-article, .daily-feature', idle: '▶ Read aloud' },
    { id: 'listenHomeBtn',  target: '.daily-feature', idle: '🔊 Listen to Today’s Devotional' }
  ];

  setups.forEach(({ id, target, idle }) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    if (!('speechSynthesis' in window)) {
      btn.closest('.daily-listen')?.setAttribute('hidden', '');
      btn.hidden = true;
      return;
    }
    // Keep secondary controls hidden until a reading has been loaded.
    ttsBuildBar(btn.parentElement);
    const choose = () => {
      if (tts.button !== btn) {        // switching which devotional is being read
        if (tts.playing) ttsPause();
        tts.button = btn; tts.idleLabel = idle; tts.targetSelector = target; tts.chunks = []; tts.idx = 0;
      }
    };
    tts.button = tts.button || btn; tts.idleLabel = tts.idleLabel || idle; tts.targetSelector = tts.targetSelector || target;
    btn.addEventListener('click', () => {
      choose();
      if (tts.playing) ttsPause(); else ttsStart();
    });
  });

  ttsUpdateUI();

  window.addEventListener('beforeunload', () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  });
});

// --------- Pathway click tracking ("Go deeper" cards, homepage resources) ----------
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[data-next-step], #resource-grid a.resource-card');
  if (!a || !window.gtag) return;
  try {
    gtag('event', 'pathway_click', {
      step: a.getAttribute('data-next-step') || 'home_resources',
      destination: a.getAttribute('href'),
      from_page: location.pathname
    });
  } catch (err) {}
});
