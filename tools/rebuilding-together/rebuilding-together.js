/* Rebuilding Together: a slow reconnection path for married couples.
   For couples who love each other but have drifted. Twelve weeks, three phases:
   Safety & Stability (1–4), Curiosity & Shared Joy (5–8), Deepening Intimacy Without Pressure (9–12).
   Steps: welcome → before you start (safety + readiness, both or just me) → where are we (temperature)
   → the path (week cards with Scripture, prayer, why it works, checklist, micro-doses from Week 4,
   "noticing the shift" and a journal). Print the whole guide at any time.
   Answers stay in this browser (sessionStorage by default; localStorage only if they tick "keep on this device").
   GA receives start/finish counts only. */
(function () {
  'use strict';
  var KEY = 'tws.rebuilding.v1';
  var app = document.getElementById('rtApp');
  if (!app) return;

  /* ---------- content ---------- */
  var PHASES = [
    { name: 'Safety & Stability', weeks: 'Weeks 1–4', goal: 'Lower defenses and rebuild emotional safety before anything else.',
      daily: ['A 10-minute check-in every day: share a high and a low. No problem-solving.', 'One specific thank-you every day: “I love how you…”', 'No heavy conversations at meals or right before bed.'] },
    { name: 'Curiosity & Shared Joy', weeks: 'Weeks 5–8', goal: 'Rediscover each other as interesting, enjoyable people.',
      daily: ['Try one small new thing together each week: a new café, a recipe, a short day trip.', 'Laugh together on purpose: a comedy, an old story, a silly game.', 'Ask one curious question a day: “What’s something you’re looking forward to?”'] },
    { name: 'Deepening Intimacy Without Pressure', weeks: 'Weeks 9–12', goal: 'Emotional and physical closeness that grows naturally, with no pressure.',
      daily: ['A weekly story night: each of you shares a memory you haven’t told in years.', 'Pray together, short and honest, for each other.', 'Serve someone together: a neighbor, a friend, an anonymous kindness.'] }
  ];
  // n, title, theme, why, verse[ref,text], prayer, science, picture, checklist[], micro[] (wk4+), notice (wk4+), journal
  var WEEKS = [
    { t: 'Eye Contact & Presence', theme: 'The power of being fully here',
      why: 'In a distracted world, eye contact says, “I see you. You matter. I’m here.” For a spouse who feels unseen, that one small act can speak louder than a dozen conversations. This week isn’t about doing more. It’s about being more present for the person God joined you to.',
      v: ['Romans 12:10', 'Be devoted to one another in love. Honor one another above yourselves.'],
      pray: 'Lord, help me see my spouse the way You see them. Slow me down when I’m rushed. Clear my distractions. Teach me to honor them with my full attention, just as You are fully attentive to me.',
      sci: 'Warm eye contact is one of the ways our brains read safety. Research links it to lower stress and stronger feelings of connection. It tells your spouse’s nervous system: this person is safe, and I’m important to him or her.',
      pic: 'Think of a spotlight in a dark theater. Wherever it shines, the audience looks. Eye contact is your spotlight. Point it at your spouse, not your phone, the TV or your worries.',
      list: ['Share a 30-second look over coffee or before leaving for the day.', 'Look into each other’s eyes when you say “thank you.”', 'Turn off the TV or put the phone down when your spouse talks to you.', 'Keep your eyes open and on each other for a moment after you pray together.', 'End the day with a “goodnight” look before the lights go out.'],
      journal: 'When did your spouse seem most engaged this week? How did it feel?' },
    { t: 'Words That Water', theme: 'Speaking life into your spouse',
      why: 'Words have power. Every day your words either water your spouse’s soul or dry it out. When trust feels thin, words can rebuild it brick by brick. You may think they already know how you feel. They still need to hear it.',
      v: ['1 Thessalonians 5:11', 'Therefore encourage one another and build each other up, just as in fact you are doing.'],
      pray: 'Lord, help me see my spouse through Your eyes so I can speak words that heal, not harm. Show me the moments when my encouragement can be the reminder they need that they are loved.',
      sci: 'Being appreciated activates the brain’s reward system. Small, specific compliments create moments of joy and belonging that the brain remembers and connects to the person who gave them.',
      pic: 'Think of a house plant. Neglect dries it out. Consistent watering brings back color and strength.',
      list: ['Give one genuine, specific compliment each morning.', 'Leave a note of encouragement in their car, bag or lunch.', 'Thank them for something they do all the time that you rarely mention.', 'Send a midday “just thinking of you” text.', 'Share a favorite memory together before bed.'],
      journal: 'Which words seemed to brighten your spouse most this week? How did it change the mood between you?' },
    { t: 'Gentle Contact', theme: 'Touch that says “I’m here”',
      why: 'Before a couple rebuilds deeper intimacy, they often need to relearn touch that asks for nothing: a hand brushing past, a squeeze on the arm, a hand on the back. Physical reminders of presence with no hidden agenda.',
      v: ['1 Corinthians 16:14', 'Do everything in love.'],
      pray: 'Lord, let my touch be a gift, not a demand. May my presence bring peace, safety and warmth to my spouse.',
      sci: 'Gentle, expected touch helps the body relax. When your spouse knows your touch comes with no expectations, their brain links it to safety and connection, not pressure.',
      pic: 'Like a warm blanket over cold shoulders, gentle touch brings comfort without asking for anything back.',
      list: ['Brush your hand against theirs when you pass in the kitchen.', 'Lightly touch their arm or shoulder when you talk.', 'Sit side by side during a show or a meal.', 'Rest your hand briefly on their back as you walk past.', 'Share a casual side hug hello or goodbye.'],
      journal: 'What small touches seemed most welcome or natural this week?' },
    { t: 'Hugs Without Hooks', theme: 'Holding without pressure',
      why: 'A hug can feel like a demand or like a safe harbor, and the difference is intention. This week is about hugging without hooks: no unspoken expectation, no hidden agenda. Just presence, warmth and patience.',
      v: ['1 Peter 4:8', 'Above all, love each other deeply, because love covers over a multitude of sins.'],
      pray: 'Lord, let my embrace be a covering, not a cage. Help me give without taking, hold without pushing and love without rushing.',
      sci: 'Longer, relaxed hugs are linked to lower stress and a stronger sense of bonding. Over time, they train the nervous system to connect your presence with safety and comfort.',
      pic: 'Picture standing under a big umbrella in the rain with someone you love. That’s the hug we’re building: shelter from the storm, not pressure to move faster.',
      list: ['Offer a 3–5 second hug hello or goodbye.', 'Add a second or two to the hug each day.', 'Hug after you pray together.', 'Add a gentle pat on the back for reassurance.', 'End the day with a goodnight hug, even a short one.'],
      micro: ['Pray silently for your spouse while you hug.', 'Picture how God sees them before you embrace.', 'Remind yourself: “This is a gift, not a transaction.”'],
      notice: 'Look for little things: a hug that lingers, a softer expression, a warmer “goodnight.”',
      journal: 'Where did you feel safe or close this week? Did you share it?' },
    { t: 'Sitting Closer, Staying Longer', theme: 'Closeness builds familiarity',
      why: 'Sometimes the most healing thing is simply being in each other’s space. Not working through problems. Just being together. This week, lean into closeness: sit nearer, linger longer, and let the walls come down slowly.',
      v: ['Ecclesiastes 4:9–10', 'Two are better than one, because they have a good return for their labor: If either of them falls down, one can help the other up.'],
      pray: 'Lord, thank You for the gift of companionship. Help me value quiet moments together as much as the big milestones.',
      sci: 'Calm, conflict-free time close together teaches the brain a new association: “We’re safe when we’re together.”',
      pic: 'Like a fireplace on a cold evening: the warmth comes from sitting near the flame, not rushing to touch it.',
      list: ['Sit side by side for a show or a meal.', 'Read in the same room, knees or feet lightly touching.', 'Take a short drive with music and no heavy talk.', 'Share a blanket during a movie.', 'Walk slowly through a store or park together.'],
      micro: ['Once a day, be within arm’s reach on purpose.', 'Make light contact without commenting on it. Let it feel natural.'],
      notice: 'When did your spouse stay close instead of moving away?',
      journal: 'What did it feel like to simply be together without an agenda?' },
    { t: 'Warm Contact in Shared Moments', theme: 'Adding comfort to everyday life',
      why: 'Now pair closeness with small comforting touches that last a little longer: a hand on the back during prayer, a light shoulder rub during a show, an arm around them when they least expect it.',
      v: ['Colossians 3:12', 'Therefore, as God’s chosen people, holy and dearly loved, clothe yourselves with compassion, kindness, humility, gentleness and patience.'],
      pray: 'Lord, teach me to show love in ways that bring rest to my spouse’s heart.',
      sci: 'Consistent, warm contact strengthens what researchers call attachment security: the sense that this person is trustworthy and safe to lean on.',
      pic: 'Like a lighthouse beam sweeping the shore, gentle contact is a regular signal: “I’m here. You’re not alone.”',
      list: ['Rest your hand on their arm while you sit together.', 'Give a gentle shoulder squeeze when you pass by.', 'Offer a short back rub during a shared moment.', 'Link arms when you walk somewhere together.', 'Playfully bump shoulders while you cook or work.'],
      micro: ['Add one 10-second touch a day without announcing it.', 'Offer a quick shoulder rub after a long day.'],
      notice: 'Has your spouse started initiating small touches? Note the moments.',
      journal: 'What surprised you about this week?' },
    { t: 'The 15-Second Hug', theme: 'A longer embrace, still no pressure',
      why: 'This week, move from quick greetings to longer, warmer hugs: fifteen seconds of steady, safe contact that says, “We’re okay. I’ve got you.”',
      v: ['1 Corinthians 13:4', 'Love is patient, love is kind.'],
      pray: 'Lord, may my embrace be a reminder of Your love: steady, patient and kind.',
      sci: 'Longer hugs give the body time to calm down and settle. Repeated over days and weeks, they reinforce both emotional connection and commitment.',
      pic: 'Think of a tree with deep roots: the longer it stands in the rain, the more it drinks in life.',
      list: ['Hug for 15 seconds once a day.', 'Pair a hug with a whispered prayer or a word of affirmation.', 'Hold hands for a few minutes during a show or conversation.', 'Share a laugh while you’re close.', 'End the day with a long hug before bed.'],
      micro: ['Add a second or two each day until 20–30 seconds feels natural.', 'Silently thank God for one specific thing about your spouse while you hug.'],
      notice: 'Write down any “melting” moments during longer hugs.',
      journal: 'How has hugging changed since Week 4?' },
    { t: 'Playful Closeness', theme: 'Bringing fun back through touch',
      why: 'Touch doesn’t always have to be tender. Playfulness sparks joy. A playful nudge or a quick spin in the kitchen brings laughter back into your closeness.',
      v: ['Proverbs 17:22', 'A cheerful heart is good medicine, but a crushed spirit dries up the bones.'],
      pray: 'Lord, restore laughter to our connection and joy to our touch.',
      sci: 'Laughing and playing together link your presence with positive, energizing feelings, not just calm ones.',
      pic: 'Like a dash of spice in a familiar recipe, playfulness wakes things up.',
      list: ['Bump hips while you walk.', 'Pull them in for a quick dance to a song you both like.', 'Give a twirl in the kitchen.', 'Nudge them playfully during conversation.', 'Recreate a playful moment from early in your relationship.'],
      micro: ['Add one spontaneous, lighthearted gesture a day.', 'Look for a chance to make your spouse smile.'],
      notice: 'Write down any laughter or smiles that came from playful moments.',
      journal: 'When did you last laugh this hard together? What made it possible?' },
    { t: 'The Gentle Kiss', theme: 'Bringing affection back with care',
      why: 'By now trust has grown, and it can be safe to bring back kissing: slow, respectful, with no expectation beyond the kiss itself. If either of you isn’t ready, stay in the weeks before this one. There’s no rush.',
      v: ['Song of Songs 1:2', 'Let him kiss me with the kisses of his mouth— for your love is more delightful than wine.'],
      pray: 'Lord, let every kiss be a gift, not a transaction. Fill it with kindness and joy.',
      sci: 'Affection that comes with emotional safety strengthens bonding, happiness and comfort all at once.',
      pic: 'Like coming back to a favorite song after years, a gentle kiss can reawaken familiar warmth.',
      list: ['Share a short kiss hello or goodbye.', 'Pair a kiss with a hug once a day.', 'Kiss after prayer or a shared laugh.', 'Offer an unexpected kiss on the forehead or cheek.', 'Let the kiss be the whole point. No rush to more.'],
      micro: ['Start with one kiss a day, a little longer as it feels natural.', 'Think one loving thought before and during the kiss.'],
      notice: 'Write down any changes in how your spouse responds.',
      journal: 'What has rebuilt the most trust so far?' },
    { t: 'Comfort & Care', theme: 'Serving through gentle touch',
      why: 'Rubbing tired shoulders, warming cold hands, easing sore feet. These say, “I see you,” in a way words can’t.',
      v: ['Galatians 5:13', 'You, my brothers and sisters, were called to be free. But do not use your freedom to indulge the flesh; rather, serve one another humbly in love.'],
      pray: 'Lord, help me serve my spouse with my hands as an extension of Your love.',
      sci: 'Caring touch helps the body relax and often brings gratitude and calm. It also says, without words, “Your comfort matters to me.”',
      pic: 'Like drawing a warm bath after a long day, caring touch refreshes and restores.',
      list: ['Offer a back rub after work.', 'Give a foot rub during a show.', 'Rub lotion into their hands.', 'Bring a warm compress for sore muscles.', 'Brush their hair, or help with something small.'],
      micro: ['Each day, look for one physical act of care you can offer.', 'Keep it about their comfort, not yours.'],
      notice: 'Notice gratitude, smiles or sighs of relief.',
      journal: 'How does it feel to serve, and to be served?' },
    { t: 'Extended Affection', theme: 'Letting time deepen touch',
      why: 'Longer hugs, lingering hand-holding, unhurried kisses. These slow moments say, “I’m in no rush to be away from you.”',
      v: ['Song of Songs 2:16', 'My beloved is mine and I am his.'],
      pray: 'Lord, deepen our bond in ways that can’t be rushed.',
      sci: 'Lingering, unhurried closeness trains the body to feel at home in the other person’s presence.',
      pic: 'Like steeping tea, time lets the richness develop.',
      list: ['Hold hands for five minutes or more.', 'Share several long hugs through the day.', 'Let a kiss linger a little longer.', 'Rest together quietly, touching in some way.', 'Take a slow walk holding hands.'],
      micro: ['Each day, choose one touch and let it last longer than usual.'],
      notice: 'Write down signs of comfort or your spouse reaching back.',
      journal: 'What feels different between you than it did twelve weeks ago?' },
    { t: 'Full-Circle Closeness', theme: 'Affection as a natural overflow',
      why: 'Now connection isn’t something you have to plan. It flows. Affection isn’t awkward. It’s a joy. Keep tending what you’ve rebuilt.',
      v: ['Colossians 3:14', 'And over all these virtues put on love, which binds them all together in perfect unity.'],
      pray: 'Lord, thank You for restoring joy and closeness to our marriage. Help us guard this connection and keep growing in love.',
      sci: 'When affection and emotional safety go together over time, the brain’s association with your spouse shifts: from stress, to trust, to desire.',
      pic: 'Like a garden in full bloom, your marriage now shows the fruit of steady tending.',
      list: ['Hug, kiss and touch naturally throughout the day.', 'Show affection in public as a sign of joy.', 'Combine touch with prayer and shared dreams.', 'Surprise your spouse with affection “just because.”', 'Keep playful and tender moments alive every day.'],
      micro: ['Let affection come naturally, but keep initiating.', 'Each day, look for one extra chance to connect.'],
      notice: 'Look back over the twelve weeks. What feels different now?',
      journal: 'Write a short prayer of thanks for what God has rebuilt, and one commitment for the next twelve weeks.' }
  ];
  var TEMPS = ['Distant', 'Curious', 'Comfortable', 'Warm', 'Desire'];
  var START = [
    ['Like roommates. We mostly talk logistics.', 0],
    ['Guarded. Touch or closeness feels like pressure.', 0],
    ['Friendly, but flat. We get along but feel far apart.', 1],
    ['Warm, but busy. The connection is there, it’s just buried.', 2]
  ];

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function track(name) { try { if (window.gtag) window.gtag('event', name); } catch (e) {} }
  function bible(ref) { return 'https://www.biblegateway.com/passage/?search=' + encodeURIComponent(ref.replace(/–/g, '-')) + '&version=NIV'; }
  function refLink(ref) { return '<a href="' + bible(ref) + '" target="_blank" rel="noopener">' + esc(ref) + '</a>'; }
  function verse(v) { return '<blockquote class="rt-verse"><p>“' + esc(v[1]) + '”</p><cite>' + esc(v[0]) + ' (NIV)</cite></blockquote>'; }
  function phaseOf(n) { return n <= 4 ? 0 : n <= 8 ? 1 : 2; }
  function fresh() { return { stage: 'intro', keep: false, harm: null, betray: null, who: null, temp: null, week: 1, view: 1, chk: {}, notes: {}, done: {}, started: false, finished: false }; }
  function store(keep) { try { return keep ? window.localStorage : window.sessionStorage; } catch (e) { return null; } }
  var st = null;
  [true, false].forEach(function (k) { if (st) return; try { var s = store(k); var v = s && JSON.parse(s.getItem(KEY) || 'null'); if (v && typeof v === 'object') st = v; } catch (e) {} });
  if (!st) st = fresh();
  var F = fresh(); Object.keys(F).forEach(function (k) { if (st[k] == null && F[k] != null) st[k] = F[k]; });
  function save() { var s = store(st.keep), o = store(!st.keep); try { if (s) s.setItem(KEY, JSON.stringify(st)); } catch (e) {} try { if (o) o.removeItem(KEY); } catch (e) {} }
  function clearAll() { [true, false].forEach(function (k) { try { var s = store(k); if (s) s.removeItem(KEY); } catch (e) {} }); st = fresh(); }
  function count(o) { return Object.keys(o).length; }
  function chkCount(n) { var c = st.chk[n] || {}; return Object.keys(c).filter(function (k) { return c[k]; }).length; }
  function doneCount() { return Object.keys(st.done).filter(function (k) { return st.done[k]; }).length; }

  var STOP = '<div class="rt-stop"><h3>Please don’t start here.</h3><p>This path is built on safety. If there’s violence, threats or fear in your home, slowly rebuilding affection is not the next step, and no one should ever be pressured toward closeness with someone who hurts them. Your safety comes first.</p><ul><li>If you’re in danger now, call <strong>911</strong>.</li><li>National Domestic Violence Hotline: <strong>1-800-799-7233</strong>, or text START to 88788.</li><li>Talk with a licensed counselor and a pastor you trust.</li></ul><p>If you’re the one who has been violent or threatening, that’s where change has to start. Please reach out for help today.</p></div>';

  /* ---------- screens ---------- */
  function intro() {
    var resume = st.started;
    return '<span class="pt-label">For couples who love each other but have drifted</span>' +
      '<p class="rt-big">Maybe the spark has dimmed. Maybe you’re living more like roommates than partners. Maybe there’s hurt, or just plain exhaustion. Here’s the good news: love can grow again.</p>' +
      '<p>Not the quick, movie-scene kind of passion that fades after a montage, but the steady, “I’m with you for life” kind. This isn’t a quick fix, and that’s the point. We’re going to take this slow, on purpose, week by week, so your hearts, your habits and even your nervous systems have time to catch up to what God wants to do.</p>' +
      '<div class="rt-arc" aria-label="Distance, curiosity, comfort, warmth, desire">' + TEMPS.map(function (t, i) { return '<span>' + t + '</span>' + (i < TEMPS.length - 1 ? '<i>→</i>' : ''); }).join('') + '</div>' +
      '<p><strong>The goal isn’t to rush into the bedroom.</strong> It’s to rebuild trust, kindness and safety. The rest follows in God’s timing.</p>' +
      '<h3 class="rt-sect">Four guiding principles</h3><ul class="rt-rules"><li><strong>Zero pressure.</strong> Trust grows when the fear of expectation disappears. Every touch is a gift, never a lead-in.</li><li><strong>Consistency beats intensity.</strong> Small, repeated actions change the temperature over time.</li><li><strong>Both say yes to the pace.</strong> Never move on until you’re both comfortable. Repeat a week as often as you need.</li><li><strong>Celebrate small wins.</strong> A softer tone or a laugh that doesn’t feel forced is progress.</li></ul>' +
      '<label class="rt-keep"><input type="checkbox" data-a="keep"' + (st.keep ? ' checked' : '') + '> Keep our progress on this device for the twelve weeks. <span class="pt-muted">(Leave it unchecked on a shared or family device. Unchecked, closing the tab erases everything.)</span></label>' +
      '<div class="pt-actions"><button type="button" class="pt-btn pt-btn--ember" data-a="begin">' + (resume ? 'Pick up at Week ' + st.week : 'Let’s start') + '</button><button type="button" class="pt-btn pt-btn--ghost" data-a="printall">Print the whole 12-week guide</button></div>';
  }

  function check() {
    var h = '<span class="pt-label">Before you start</span><h2 class="pt-h3" tabindex="-1">Three honest questions</h2><p class="pt-small pt-muted">Private. Your answers stay on this device.</p>' +
      '<div class="rt-q"><p><strong>1. Is there any physical violence or threats in your marriage, or are you afraid of your spouse?</strong></p><div class="rt-chips">' + ['Yes', 'No'].map(function (o, k) { return '<button type="button" data-a="harm" data-v="' + k + '" aria-pressed="' + (st.harm === k) + '">' + o + '</button>'; }).join('') + '</div></div>';
    if (st.harm === 0) return h + STOP + '<div class="pt-actions"><button type="button" class="pt-btn pt-btn--ghost" data-a="home">← Back</button></div>';
    if (st.harm === 1) {
      h += '<div class="rt-q"><p><strong>2. Is there an affair, an addiction or another betrayal that hasn’t been dealt with?</strong></p><div class="rt-chips">' + ['Yes', 'We’re working on it with a counselor or pastor', 'No'].map(function (o, k) { return '<button type="button" data-a="betray" data-v="' + k + '" aria-pressed="' + (st.betray === k) + '">' + o + '</button>'; }).join('') + '</div>' +
        (st.betray === 0 ? '<div class="rt-warn"><p>Deep betrayal needs more than a 12-week path. Please bring in a licensed marriage counselor and a pastor first. Healing that wound usually needs truth, repentance and help you can’t give each other alone. This path can come alongside that work later.</p></div>' : st.betray === 1 ? '<div class="rt-warn rt-ok"><p>Good. Keep that help going. Share this path with your counselor or pastor and let them guide the pace.</p></div>' : '') + '</div>';
    }
    if (st.betray != null) {
      h += '<div class="rt-q"><p><strong>3. Who is doing this?</strong></p><div class="rt-chips">' + ['Both of us', 'Just me, for now'].map(function (o, k) { return '<button type="button" data-a="who" data-v="' + k + '" aria-pressed="' + (st.who === k) + '">' + o + '</button>'; }).join('') + '</div>' +
        (st.who === 1 ? '<div class="rt-warn rt-ok"><p>That’s a real place to start. Do your part with no pressure and no announcements. Focus on Weeks 1 and 2, which ask nothing of your spouse. Only move into touch when it’s clearly welcome. And don’t use this to grade your spouse. It’s for changing how you love, not tracking how they respond.</p></div>' : '') + '</div>';
    }
    if (st.who != null) {
      h += '<div class="rt-q"><p><strong>Where are you right now?</strong> Pick the closest.</p>' + START.map(function (s, k) { return '<button type="button" class="pt-option" data-a="temp" data-v="' + k + '" aria-pressed="' + (st.temp === k) + '">' + esc(s[0]) + '</button>'; }).join('') + '</div>';
      if (st.temp != null) {
        var at = START[st.temp][1];
        h += '<div class="rt-arc rt-arc-on">' + TEMPS.map(function (t, i) { return '<span class="' + (i === at ? 'is-here' : '') + '">' + t + '</span>' + (i < TEMPS.length - 1 ? '<i>→</i>' : ''); }).join('') + '</div>' +
          '<p class="pt-small">Wherever you are, start at Week 1. The early weeks rebuild the safety everything else stands on. If they feel easy, great. Do them anyway.</p>';
      }
    }
    h += '<div class="pt-actions"><button type="button" class="pt-btn pt-btn--ghost" data-a="home">← Back</button>' + (st.temp != null ? '<button type="button" class="pt-btn pt-btn--ember" data-a="toPath">Start Week 1 →</button>' : '') + '</div>';
    return h;
  }

  function weekCard(n, forPrint) {
    var W = WEEKS[n - 1], c = st.chk[n] || {}, notes = st.notes[n] || {};
    var h = '<article class="rt-week">' +
      '<span class="rt-num">Week ' + n + ' · ' + esc(PHASES[phaseOf(n)].name) + '</span><h2 class="rt-wt" tabindex="-1">' + esc(W.t) + '</h2><p class="rt-theme">' + esc(W.theme) + '</p>' +
      '<p>' + esc(W.why) + '</p>' + verse(W.v) +
      '<div class="rt-box"><span class="pt-label">Pray</span><p class="rt-pray">' + esc(W.pray) + '</p></div>' +
      '<div class="rt-two"><div><span class="pt-label">Why it works</span><p>' + esc(W.sci) + '</p></div><div><span class="pt-label">Picture it</span><p>' + esc(W.pic) + '</p></div></div>' +
      '<h3 class="rt-sect">This week, pick two or three a day</h3><ul class="rt-list">' + W.list.map(function (x, i) {
        return '<li><label><input type="checkbox" data-chk="' + n + '-' + i + '"' + (c[i] ? ' checked' : '') + '><span>' + esc(x) + '</span></label></li>';
      }).join('') + '</ul>';
    if (W.micro) h += '<h3 class="rt-sect">Micro-doses <span class="pt-optional">(' + (n <= 8 ? 'every other day' : 'every day') + ')</span></h3><ul class="rt-micro">' + W.micro.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<p class="pt-small rt-mind"><strong>Rewire how you see them:</strong> before each act, pause and remind yourself, “This is God’s son or daughter before they are my spouse.” Fault-finding slowly turns into faith-seeing.</p>';
    if (W.notice) h += '<div class="pt-field"><label for="rtN' + n + '">Noticing the shift <span class="pt-optional">' + esc(W.notice) + '</span></label><textarea id="rtN' + n + '" data-note="' + n + '-shift" rows="2" maxlength="1000">' + esc(notes.shift) + '</textarea></div>';
    h += '<div class="pt-field"><label for="rtJ' + n + '">Journal <span class="pt-optional">' + esc(W.journal) + '</span></label><textarea id="rtJ' + n + '" data-note="' + n + '-journal" rows="3" maxlength="1500">' + esc(notes.journal) + '</textarea></div>';
    if (forPrint) h += '<div class="rt-lines"></div><div class="rt-lines"></div>';
    return h + '</article>';
  }

  function path() {
    var n = st.view, ph = phaseOf(n), P = PHASES[ph];
    var h = '<div class="rt-top"><span class="pt-label">Week ' + n + ' of 12</span><span class="pt-count">' + doneCount() + ' weeks done</span></div>' +
      '<div class="rt-map" role="tablist" aria-label="Weeks">' + WEEKS.map(function (W, i) {
        var k = i + 1; return '<button type="button" role="tab" data-a="view" data-v="' + k + '" aria-selected="' + (k === n) + '" class="rt-p' + phaseOf(k) + (st.done[k] ? ' is-done' : '') + (k === st.week ? ' is-current' : '') + '" title="' + esc(W.t) + '">' + k + '</button>';
      }).join('') + '</div>' +
      '<div class="rt-phase rt-p' + ph + '"><span class="pt-label">Phase ' + (ph + 1) + ' · ' + esc(P.weeks) + '</span><strong>' + esc(P.name) + '</strong><p>' + esc(P.goal) + '</p><details' + (n === 1 || n === 5 || n === 9 ? ' open' : '') + '><summary>Every day this phase</summary><ul>' + P.daily.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul></details></div>' +
      (st.who === 1 && n >= 3 ? '<p class="rt-warn rt-ok pt-small">Doing this on your own? Only move into touch when it’s clearly welcome. Weeks 1 and 2 are always safe to repeat.</p>' : '') +
      weekCard(n, false) +
      '<div class="rt-done"><label><input type="checkbox" data-a="done"' + (st.done[n] ? ' checked' : '') + '> We’ve done Week ' + n + ' and we’re both ready to move on.</label><p class="pt-small pt-muted">Not ready? Stay here another week. Repeating is not failing.</p></div>' +
      '<div class="pt-actions pt-no-print">' + (n > 1 ? '<button type="button" class="pt-btn pt-btn--ghost" data-a="view" data-v="' + (n - 1) + '">← Week ' + (n - 1) + '</button>' : '<button type="button" class="pt-btn pt-btn--ghost" data-a="toCheck">← Before you start</button>') +
        (n < 12 ? '<button type="button" class="pt-btn" data-a="view" data-v="' + (n + 1) + '">Week ' + (n + 1) + ' →</button>' : '<button type="button" class="pt-btn pt-btn--ember" data-a="finish">Finish →</button>') + '</div>' +
      '<div class="pt-actions pt-no-print"><button type="button" class="pt-btn pt-btn--ghost" data-a="printweek">Print this week</button><button type="button" class="pt-btn pt-btn--ghost" data-a="printall">Print the whole guide</button><button type="button" class="pt-btn pt-btn--ghost" data-a="clear">Clear our answers</button></div>' +
      '<p class="pt-muted pt-small pt-no-print">' + (st.keep ? 'Your progress is kept on this device until you clear it.' : 'Your progress stays in this browser tab only. To keep it for twelve weeks, go back to the start and tick “Keep our progress on this device.”') + '</p>';
    return h;
  }

  function finish() {
    return '<span class="pt-label">Twelve weeks</span><h2 class="pt-h3" tabindex="-1">Look how far you’ve come</h2>' +
      '<p class="rt-big">' + doneCount() + ' of 12 weeks marked done. Whatever the number, every small, kind step counted.</p>' +
      verse(['Colossians 3:14', 'And over all these virtues put on love, which binds them all together in perfect unity.']) +
      '<h3 class="rt-sect">Keep it going</h3><ul class="rt-rules"><li>Keep the daily check-in and the specific thank-you. They’re the foundation.</li><li>Pick your two favorite weeks and repeat them every few months.</li><li>Go through the whole path again next year, as a tune-up.</li><li>Find another couple to walk with, and when you’re ready, help a couple who’s where you were.</li></ul>' +
      '<div class="rt-box"><span class="pt-label">A prayer for the two of you</span><p class="rt-pray">Lord, thank You for what You’ve rebuilt between us. Where trust was thin, You’ve been patient. Where we were distant, You’ve drawn us close. Guard what You’ve grown. Keep us kind, keep us curious and keep us close to You, the One who holds us together. Amen.</p></div>' +
      '<div class="pt-actions pt-no-print"><button type="button" class="pt-btn" data-a="printall">Print the whole guide with our notes</button><button type="button" class="pt-btn pt-btn--ghost" data-a="view" data-v="12">← Week 12</button></div>' +
      '<div class="pt-actions pt-no-print"><button type="button" class="pt-btn pt-btn--ghost" data-a="restart">Start the path again</button><button type="button" class="pt-btn pt-btn--ghost" data-a="clear">Clear our answers</button></div>';
  }

  function printAll() {
    return '<div class="rt-printall"><h2 class="pt-h3">Rebuilding Together: the 12-week path</h2>' +
      PHASES.map(function (P, i) {
        return '<div class="rt-phase rt-p' + i + '"><span class="pt-label">Phase ' + (i + 1) + ' · ' + esc(P.weeks) + '</span><strong>' + esc(P.name) + '</strong><p>' + esc(P.goal) + '</p><ul>' + P.daily.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul></div>' +
          WEEKS.slice(i * 4, i * 4 + 4).map(function (W, k) { return weekCard(i * 4 + k + 1, true); }).join('');
      }).join('') + '</div>';
  }

  /* ---------- render + events ---------- */
  var mode = null;
  function render(focus) {
    var s = st.stage, html;
    if (mode === 'all') html = printAll();
    else html = s === 'check' ? check() : s === 'path' ? path() : s === 'finish' ? finish() : intro();
    app.innerHTML = html;
    if (focus) {
      var top = app.getBoundingClientRect().top + window.pageYOffset - 80;
      if (Math.abs(window.pageYOffset - top) > 40) window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      var h = app.querySelector('[tabindex="-1"]'); if (h) h.focus({ preventScroll: true });
    }
  }
  function go(stage) { st.stage = stage; if (stage === 'finish' && !st.finished) { st.finished = true; track('rebuilding_finish'); } save(); render(true); }
  function doPrint(all) {
    document.body.classList.toggle('rt-print-week', !all);
    if (all) { mode = 'all'; render(false); }
    setTimeout(function () { window.print(); }, 60);
  }
  window.addEventListener('afterprint', function () { document.body.classList.remove('rt-print-week'); if (mode) { mode = null; render(false); } });

  app.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b || b.disabled || b.tagName === 'INPUT') return;
    var a = b.getAttribute('data-a'), v = +b.getAttribute('data-v');
    if (a === 'begin') { if (!st.started) { st.started = true; track('rebuilding_start'); } if (st.temp != null && st.harm === 1) { st.view = st.week; go('path'); } else go('check'); }
    else if (a === 'home') go('intro');
    else if (a === 'harm') { st.harm = v; if (v === 0) { st.betray = null; st.who = null; st.temp = null; } save(); render(); }
    else if (a === 'betray') { st.betray = v; save(); render(); }
    else if (a === 'who') { st.who = v; save(); render(); }
    else if (a === 'temp') { st.temp = v; save(); render(); }
    else if (a === 'toPath') { st.view = st.week || 1; go('path'); }
    else if (a === 'toCheck') go('check');
    else if (a === 'view') { st.view = v; go('path'); }
    else if (a === 'finish') go('finish');
    else if (a === 'printall') doPrint(true);
    else if (a === 'printweek') doPrint(false);
    else if (a === 'restart') { st.week = 1; st.view = 1; st.done = {}; st.chk = {}; st.notes = {}; st.finished = false; go('path'); }
    else if (a === 'clear') { if (window.confirm('Erase all your answers, checkmarks and notes on this device?')) { clearAll(); render(true); } }
  });
  app.addEventListener('change', function (e) {
    var t = e.target, a = t.getAttribute('data-a');
    if (a === 'keep') { st.keep = t.checked; save(); return; }
    if (a === 'done') {
      st.done[st.view] = t.checked;
      if (t.checked && st.view >= st.week && st.view < 12) st.week = st.view + 1;
      save(); var c = app.querySelector('.rt-top .pt-count'); if (c) c.textContent = doneCount() + ' weeks done';
      var btn = app.querySelector('.rt-map [data-v="' + st.view + '"]'); if (btn) btn.classList.toggle('is-done', t.checked);
      return;
    }
    var ck = t.getAttribute('data-chk');
    if (ck) { var p = ck.split('-'); st.chk[p[0]] = st.chk[p[0]] || {}; st.chk[p[0]][p[1]] = t.checked; save(); }
  });
  app.addEventListener('input', function (e) {
    var nt = e.target.getAttribute('data-note'); if (!nt) return;
    var p = nt.split('-'); st.notes[p[0]] = st.notes[p[0]] || {}; st.notes[p[0]][p[1]] = e.target.value; save();
  });

  render(false);
})();

/* Share row: Share / Copy link / Print for this page only. */
(function () {
  'use strict';
  document.querySelectorAll('.rt-share').forEach(function (bar) {
    var url = bar.getAttribute('data-url'), title = bar.getAttribute('data-title');
    var native = bar.querySelector('[data-share="native"]');
    if (native) { if (!navigator.share) native.style.display = 'none'; else native.addEventListener('click', function () { navigator.share({ title: title, url: url }).catch(function () {}); }); }
    var copy = bar.querySelector('[data-share="copy"]');
    if (copy) copy.addEventListener('click', function () {
      var done = function () { copy.textContent = 'Copied ✓'; setTimeout(function () { copy.textContent = 'Copy link'; }, 2000); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copy this link:', url); });
      else window.prompt('Copy this link:', url);
    });
    var print = bar.querySelector('[data-share="print"]');
    if (print) print.addEventListener('click', function () { var b = document.querySelector('#rtApp [data-a="printall"]'); if (b) b.click(); else window.print(); });
  });
})();
