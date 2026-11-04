// Seasonal pages: shown only during their window, redirected home the rest of the year.
// The site rebuilds every night at 12:01 am Central (daily release), so windows open and close on their own.

// Western (Gregorian) Easter Sunday for a year, as YYYY-MM-DD.
export function easterDate(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const addDays = (iso, n) => {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// Give page + header Give button: hidden on the live site until GIVE_LAUNCH (YYYY-MM-DD, Central),
// then stays up. Leave '' to keep it off the live site. The staging preview always shows it.
export const GIVE_LAUNCH = '';

// Easter page: Palm Sunday through two weeks after Easter.
export const SEASONAL_PAGES = [
  { file: 'Easter.html', path: '/Easter.html', window: (year) => { const e = easterDate(year); return [addDays(e, -7), addDays(e, 14)]; } },
  { file: 'give.html', path: '/give.html', previewOnStaging: true, window: () => [GIVE_LAUNCH || '9999-12-31', '9999-12-31'] }
];

export const isStagingPreview = () => process.env.CONTEXT === 'branch-deploy' && process.env.BRANCH === 'staging';

// todayIso = YYYY-MM-DD in Central time.
export function isInSeason(page, todayIso) {
  const [from, to] = page.window(Number(todayIso.slice(0, 4)));
  return todayIso >= from && todayIso <= to;
}
