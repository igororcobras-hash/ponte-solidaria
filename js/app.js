// ============================================================
// Ponte Solidária — telas e navegação
// ============================================================
(function () {
  'use strict';

  const t = (k, v) => I18N.t(k, v);
  const root = document.getElementById('app');
  let store = null;
  let me = null;
  let isAdmin = false;
  let helpKey = 'help_home';
  let renderSeq = 0;
  let installEvent = null;

  // ---------- utilidades ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const initials = (n) => (n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const num = (v) => { const n = Number(String(v || '').replace(/\./g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
  const pct = (a, b) => (b > 0 ? Math.max(0, Math.min(100, Math.round((a / b) * 100))) : 0);
  const go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };
  // Modo de uso: 'audio' (deficiência visual) ou 'read' (ler e preencher)
  const getMode = () => { try { return localStorage.getItem('ps_mode'); } catch (e) { return null; } };
  const isAudio = () => getMode() === 'audio';
  function setMode(m) {
    try { localStorage.setItem('ps_mode', m); } catch (e) {}
    document.documentElement.dataset.mode = m;
  }
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));

  const svg = (d, size) => '<svg width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  const IC = {
    back: svg('<path d="m15 18-6-6 6-6"/>'),
    help: svg('<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>', 18),
    home: svg('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>', 22),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>', 22),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>', 22),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', 18),
    check: svg('<path d="M20 6 9 17l-5-5"/>', 14),
    checkBig: svg('<path d="M20 6 9 17l-5-5"/>', 22),
    shield: svg('<path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>', 14),
    lock: svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', 14),
    speaker: svg('<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>', 22),
    close: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>', 18),
    file: svg('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>', 18),
    heart: svg('<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 12 5.5 5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>', 18),
    mic: svg('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v4M8 21h8"/>', 28),
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', 40),
    ear: svg('<path d="M6 8.5a6 6 0 1 1 12 0c0 3-2 4-3 5.5S14 17 13 19a3 3 0 0 1-5.5-1"/><path d="M9 9a3 3 0 0 1 6 0"/>', 40),
    logo: '<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#0E6B63"/><path d="M7 21c3-6 6-9 9-9s6 3 9 9" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M10 21v-3M16 21v-6M22 21v-3" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>'
  };

  // ---------- avisos e erros ----------
  let toastTimer = null;
  function toast(msg) {
    let el = $('#toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3500);
  }
  function errText(e) {
    const code = (e && e.code) || 'generic';
    const s = t('err_' + code, { mb: store ? store.maxMb : 50 });
    return s === 'err_' + code ? t('err_generic') : s;
  }
  async function busy(btn, fn) {
    if (btn) btn.disabled = true;
    try { return await fn(); }
    catch (e) { console.error(e); toast(errText(e)); }
    finally { if (btn && btn.isConnected) btn.disabled = false; }
  }

  // ---------- voz ----------
  function speak(text, lang, onend) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = 0.95;
      if (onend) { u.onend = onend; u.onerror = onend; }
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
      return true;
    } catch (e) { if (onend) onend(); return false; }
  }
  function stopSpeech() { try { speechSynthesis.cancel(); } catch (e) {} }

  // ---------- ajuda ----------
  function openHelp() {
    const steps = t(helpKey);
    const list = Array.isArray(steps) ? steps : [];
    const prevFocus = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'sheet-backdrop';
    wrap.innerHTML =
      '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="help-title">' +
      '<div class="row between"><h2 class="h2" id="help-title" style="font-size:1.3rem">' + esc(t('help_title')) + '</h2>' +
      '<button class="icon-btn" style="background:var(--bg)" data-close aria-label="' + esc(t('help_close')) + '">' + IC.close + '</button></div>' +
      '<ol class="steps">' + list.map((s, i) => '<li><span class="n" aria-hidden="true">' + (i + 1) + '</span><span>' + esc(s) + '</span></li>').join('') + '</ol>' +
      '<button class="btn block" data-speak>' + IC.speaker + '<span>' + esc(t('help_listen')) + '</span></button>' +
      '<p class="small muted" style="margin:0;text-align:center">' + esc(t('help_sr')) + '</p></div>';
    document.body.appendChild(wrap);
    let speaking = false;
    const spBtn = $('[data-speak]', wrap);
    const setLabel = () => { $('span', spBtn).textContent = speaking ? t('help_stop') : t('help_listen'); };
    const close = () => { stopSpeech(); wrap.remove(); document.removeEventListener('keydown', onKey); if (prevFocus && prevFocus.focus) prevFocus.focus(); };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        const f = $$('button', wrap); const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
    $('[data-close]', wrap).onclick = close;
    spBtn.onclick = () => {
      if (speaking) { stopSpeech(); speaking = false; setLabel(); return; }
      const text = t('help_title') + '. ' + list.map((s, i) => (i + 1) + '. ' + s).join(' ');
      speaking = true; setLabel();
      speak(text, I18N.speechLang(), () => { speaking = false; if (spBtn.isConnected) setLabel(); });
    };
    $('[data-close]', wrap).focus();
    // no Modo Áudio a ajuda já começa falando, junto com os comandos de voz
    if (isAudio()) {
      speaking = true; setLabel();
      const text = t('help_title') + '. ' + list.map((s, i) => (i + 1) + '. ' + s).join(' ') + ' ' + t('v_global');
      speak(text, I18N.speechLang(), () => { speaking = false; if (spBtn.isConnected) setLabel(); });
    }
  }

  // ---------- moldura ----------
  function shell(opts) {
    const back = opts.back
      ? '<a class="icon-btn" href="' + esc(opts.back) + '" aria-label="' + esc(t('back')) + '">' + IC.back + '</a><div class="title">' + esc(opts.title || '') + '</div>'
      : '<div class="brand">' + IC.logo + '<span>' + esc(t('app_name')) + '</span></div>';
    const navItem = (href, icon, label, key) =>
      '<a href="' + href + '"' + (opts.nav === key ? ' aria-current="page"' : '') + '>' + icon + '<span>' + esc(label) + '</span></a>';
    const nav = opts.noNav ? '' :
      '<nav class="bottomnav" aria-label="Menu">' +
      navItem('#/', IC.home, t('nav_home'), 'home') +
      navItem('#/minha', IC.user, t('nav_mine'), 'mine') +
      navItem('#/ajustes', IC.gear, t('nav_settings'), 'settings') + '</nav>';
    const demo = store && store.mode === 'demo' ? '<div class="demo-banner">' + esc(t('demo_banner')) + '</div>' : '';
    const audio = isAudio() && !opts.noVoice;
    const audioBar = audio ? '<div class="audio-banner">' + IC.speaker + '<span>' + esc(t('audio_banner')) + '</span></div>' : '';
    const mic = audio ? '<button class="mic-btn' + (opts.noNav ? ' no-nav' : '') + '" id="mic-btn" aria-pressed="false" aria-label="' + esc(t('mic_label')) + '">' + IC.mic + '<span>' + esc(t('mic')) + '</span></button>' : '';
    root.innerHTML = demo + audioBar +
      '<header class="topbar">' + back +
      '<button class="help-btn" id="help-btn" aria-label="' + esc(t('help') + ': ' + t('help_title')) + '">' + IC.help + '<span>' + esc(t('help')) + '</span></button></header>' +
      '<main class="main' + (audio ? ' with-mic' : '') + '" id="main" tabindex="-1">' + opts.html + '</main>' + mic + nav;
    helpKey = opts.help;
    $('#help-btn').onclick = openHelp;
    if (audio) {
      $('#mic-btn').onclick = () => Voice.listen();
      const h1 = $('#main h1');
      Voice.announce(opts.say || (h1 ? h1.textContent : ''));
    }
    document.title = (opts.title ? opts.title + ' · ' : '') + t('app_name');
    window.scrollTo(0, 0);
    const h = $('#main h1') || $('#main');
    if (h) { if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  function loadingView() { root.innerHTML = '<div class="loading" role="status">' + esc(t('loading')) + '</div>'; }

  // ---------- componentes ----------
  const catKeys = ['education', 'health', 'housing', 'work', 'food', 'other'];
  function personCard(p) {
    return '<a class="card person" data-name="' + esc(p.name) + '" href="#/p/' + encodeURIComponent(p.uid) + '">' +
      '<div class="row"><div class="avatar" aria-hidden="true">' + esc(initials(p.name)) + '</div>' +
      '<div style="flex:1;min-width:0"><div style="font-weight:800">' + esc(p.name) + (p.age ? ', ' + esc(p.age) : '') + '</div>' +
      '<div class="small muted">' + esc(p.city || '') + '</div></div>' +
      '<span class="badge">' + IC.check + esc(t('verified')) + '</span></div>' +
      (p.givesBack ? '<span class="badge warm" style="align-self:flex-start">' + IC.heart + esc(t('gives_back')) + '</span>' : '') +
      '<div style="font-size:1.02rem">' + esc(p.goalTitle || '') + '</div>' +
      progress(p) + '</a>';
  }
  function progress(p) {
    return '<div style="display:flex;flex-direction:column;gap:6px"><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct(p.raised, p.goalAmount) + '" aria-label="' + esc(t('raised_of', { a: I18N.money(p.raised), b: I18N.money(p.goalAmount) })) + '"><span style="width:' + pct(p.raised, p.goalAmount) + '%"></span></div>' +
      '<div class="row between small muted"><span><b style="color:var(--ink)">' + esc(I18N.money(p.raised)) + '</b> ' + esc(t('raised_of', { a: '', b: I18N.money(p.goalAmount) }).trim()) + '</span><span>' + esc(t('donors', { n: p.donorsCount || 0 })) + '</span></div></div>';
  }
  function mediaHtml(item) {
    if (!item.url) return '<span class="small muted">' + IC.file + ' ' + esc(t('proof_sample')) + '</span>';
    if (item.kind === 'photo') return '<img class="media" src="' + esc(item.url) + '" alt="' + esc(item.title || '') + '" loading="lazy">';
    if (item.kind === 'video') return '<video class="media" src="' + esc(item.url) + '" controls preload="metadata"></video>';
    return '<a class="btn secondary small" href="' + esc(item.url) + '" target="_blank" rel="noopener" download="' + esc(item.fileName || 'arquivo') + '">' + IC.file + esc(t('open_file')) + '</a>';
  }

  // ---------- telas ----------
  function viewLanguage() {
    let sel = I18N.saved() || I18N.guess();
    const first = !I18N.saved();
    const draw = () => {
      const info = I18N.LANGS.find((l) => l[0] === sel) || I18N.LANGS[0];
      I18N.set(sel);
      const html =
        '<div class="narrow">' +
        '<h1 class="h1" lang="' + esc(info[0]) + '" dir="' + (info[4] || 'ltr') + '" style="font-size:2rem;padding-top:8px">' + esc(info[3]) + '</h1>' +
        '<p class="muted" style="margin:0">Escolha seu idioma · Choose your language · Elige tu idioma</p>' +
        '<label class="search"><span class="sr-only">' + esc(t('lang_search')) + '</span>' + IC.search +
        '<input id="lang-q" type="search" placeholder="' + esc(t('lang_search')) + '" autocomplete="off"></label>' +
        '<div class="lang-list" role="radiogroup" aria-label="' + esc(t('language')) + '" id="lang-list"></div>' +
        (I18N.isFull(sel) ? '' : '<p class="notice warm" style="margin:0">' + esc(t('lang_partial')) + '</p>') +
        '<p class="small muted" style="margin:0;text-align:center">' + esc(t('lang_note')) + '</p>' +
        '<button class="btn block" id="lang-go" lang="' + esc(info[0]) + '">' + esc(t('continue')) + '</button></div>';
      shell({ html, help: 'help_lang', noNav: first, back: first ? null : '#/ajustes', title: t('language') });
      const listEl = $('#lang-list');
      const drawList = (q) => {
        q = (q || '').toLowerCase().trim();
        const items = I18N.LANGS.filter((l) => !q || l[1].toLowerCase().includes(q) || l[2].toLowerCase().includes(q) || l[0].toLowerCase().includes(q));
        listEl.innerHTML = items.length ? items.map((l) =>
          '<button class="lang-item" role="radio" aria-checked="' + (l[0] === sel) + '" data-code="' + esc(l[0]) + '">' +
          '<span style="display:flex;flex-direction:column;gap:2px"><span class="native" lang="' + esc(l[0]) + '">' + esc(l[1]) + '</span><span class="small muted">' + esc(l[2]) + '</span></span>' +
          (l[0] === sel ? '<span style="color:var(--accent)">' + IC.checkBig + '</span>' : '') + '</button>').join('')
          : '<div class="empty">' + esc(t('lang_none')) + '</div>';
        $$('.lang-item', listEl).forEach((b) => {
          b.onclick = () => {
            sel = b.dataset.code;
            const l = I18N.LANGS.find((x) => x[0] === sel);
            speak(l[3] + ' ' + l[1], sel);
            draw();
            const again = $('.lang-item[data-code="' + sel + '"]');
            if (again) again.focus();
          };
        });
      };
      drawList('');
      $('#lang-q').oninput = (e) => drawList(e.target.value);
      $('#lang-go').onclick = () => { I18N.set(sel, true); go(first || !getMode() ? '#/modo' : '#/ajustes'); };
    };
    draw();
  }

  // Escolha do modo: metade de cima = Áudio, metade de baixo = Ler e Preencher
  function viewMode() {
    const first = !getMode();
    shell({
      help: 'help_mode', noNav: first, noVoice: true, back: first ? null : '#/ajustes', title: t('mode_label'),
      html:
        '<h1 class="sr-only">' + esc(t('mode_title')) + '</h1>' +
        '<div class="mode-wrap">' +
        '<button class="mode-btn audio" id="mode-audio">' + IC.ear +
        '<span class="mode-name">' + esc(t('mode_audio')) + '</span><span class="mode-sub">' + esc(t('mode_audio_sub')) + '</span>' +
        '<span class="mode-desc">' + esc(t('mode_audio_desc')) + '</span></button>' +
        '<button class="mode-btn read" id="mode-read">' + IC.eye +
        '<span class="mode-name">' + esc(t('mode_read')) + '</span>' +
        '<span class="mode-desc">' + esc(t('mode_read_desc')) + '</span></button></div>' +
        '<p class="small muted" style="margin:0;text-align:center">' + esc(t('mode_tb_note')) + '</p>'
    });
    // a pergunta é sempre falada, porque quem não enxerga ainda não escolheu o modo
    setTimeout(() => speak(t('mode_prompt'), I18N.speechLang()), 150);
    const pick = (m) => {
      setMode(m);
      stopSpeech();
      if (m === 'audio') speak(t('v_mode_audio_on'), I18N.speechLang());
      go(first ? '#/' : '#/ajustes');
    };
    $('#mode-audio').onclick = () => pick('audio');
    $('#mode-read').onclick = () => pick('read');
  }

  let homeState = { q: '', cat: 'all' };
  async function viewHome(seq) {
    const profiles = await store.listProfiles('verified');
    if (seq !== renderSeq) return;
    const chips = ['all'].concat(catKeys).map((c) =>
      '<button class="chip" data-cat="' + c + '" aria-pressed="' + (homeState.cat === c) + '">' + esc(t('cat_' + c)) + '</button>').join('');
    const sayPeople = profiles.length
      ? t('home_title') + ' ' + t('v_people', {
        n: profiles.length,
        list: profiles.slice(0, 8).map((p) => p.name + ', ' + p.goalTitle + ', ' + t('v_raised', { a: I18N.money(p.raised), b: I18N.money(p.goalAmount) })).join('; ')
      }) + ' ' + t('v_tip_home')
      : t('home_title') + ' ' + t('home_none');
    shell({
      nav: 'home', help: 'help_home', say: sayPeople,
      html:
        '<h1 class="h1">' + esc(t('home_title')) + '</h1>' +
        '<label class="search"><span class="sr-only">' + esc(t('search_ph')) + '</span>' + IC.search +
        '<input id="home-q" type="search" placeholder="' + esc(t('search_ph')) + '" value="' + esc(homeState.q) + '"></label>' +
        '<div class="chips" role="group" aria-label="' + esc(t('category')) + '">' + chips + '</div>' +
        '<h2 class="label-up">' + esc(t('home_section')) + '</h2>' +
        '<div id="home-list" aria-live="polite"></div>'
    });
    const draw = () => {
      const q = homeState.q.toLowerCase().trim();
      const items = profiles.filter((p) =>
        (homeState.cat === 'all' || p.category === homeState.cat) &&
        (!q || [p.name, p.city, p.goalTitle, p.story].join(' ').toLowerCase().includes(q)));
      $('#home-list').innerHTML = items.length ? '<div class="grid">' + items.map(personCard).join('') + '</div>'
        : '<p class="empty">' + esc(t(profiles.length ? 'home_empty' : 'home_none')) + '</p>' +
          (profiles.length ? '' : '<a class="btn block" href="#/entrar">' + esc(t('signup')) + '</a>');
    };
    draw();
    $('#home-q').oninput = (e) => { homeState.q = e.target.value; draw(); };
    $$('.chip').forEach((c) => {
      c.onclick = () => {
        homeState.cat = c.dataset.cat;
        $$('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
        draw();
      };
    });
  }

  function canSee(p, uid) { return p && (p.status === 'verified' || (me && me.uid === uid) || isAdmin); }

  async function viewProfile(seq, uid) {
    const p = await store.getProfile(uid);
    if (seq !== renderSeq) return;
    if (!canSee(p, uid)) return shell({ back: '#/', title: '', help: 'help_profile', nav: 'home', html: '<p class="empty">' + esc(t('not_found')) + '</p>' });
    const proofs = await store.listProofs(uid);
    if (seq !== renderSeq) return;
    const own = me && me.uid === uid;
    const statusBadge = p.status === 'verified'
      ? '<span class="badge">' + IC.shield + esc(t('verified')) + '</span>'
      : '<span class="badge warm">' + esc(t(p.status === 'rejected' ? 'status_rejected' : 'status_pending')) + '</span>';
    const proofHtml = proofs.length ? proofs.map((pr) =>
      '<div class="card" style="gap:8px"><div class="row between"><b>' + esc(pr.title) + '</b>' +
      (pr.visibility === 'public' ? '<span class="badge gray">' + esc(t('proof_public')) + '</span>' : '<span class="badge gray">' + IC.lock + esc(t('proof_restricted')) + '</span>') + '</div>' +
      mediaHtml(pr) + '</div>').join('') : '<p class="muted" style="margin:0">—</p>';
    shell({
      back: '#/', title: p.name, nav: 'home', help: 'help_profile',
      say: [p.name, p.age ? t('years', { n: p.age }) : '', p.city, t('goal_current') + ': ' + p.goalTitle,
        t('v_raised', { a: I18N.money(p.raised), b: I18N.money(p.goalAmount) }), t('story') + ': ' + p.story, t('v_tip_profile')].filter(Boolean).join('. '),
      html:
        '<div class="narrow">' +
        '<div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center">' +
        '<div class="avatar big" aria-hidden="true">' + esc(initials(p.name)) + '</div>' +
        '<h1 class="h1">' + esc(p.name) + '</h1>' +
        '<div class="muted">' + [p.age ? t('years', { n: p.age }) : '', p.city, p.category ? t('cat_' + p.category) : ''].filter(Boolean).map(esc).join(' · ') + '</div>' +
        statusBadge +
        (p.givesBack ? '<span class="badge warm">' + IC.heart + esc(t('gives_back')) + '</span>' : '') + '</div>' +
        '<section class="card"><h2 class="label-up">' + esc(t('goal_current')) + '</h2><div class="h2">' + esc(p.goalTitle) + '</div>' + progress(p) + '</section>' +
        '<section style="display:flex;flex-direction:column;gap:8px"><h2 class="h2">' + esc(t('story')) + '</h2><p style="margin:0;white-space:pre-line;color:var(--ink-2)">' + esc(p.story) + '</p></section>' +
        '<section style="display:flex;flex-direction:column;gap:10px"><h2 class="h2">' + esc(t('proofs')) + '</h2>' +
        (!me ? '<p class="notice" style="margin:0">' + esc(t('login_to_see')) + '</p>' : '') + proofHtml + '</section>' +
        '<a class="btn secondary block" href="#/p/' + encodeURIComponent(uid) + '/linha">' + esc(t('see_timeline')) + '</a>' +
        (!own && p.status === 'verified' ? '<a class="btn block" href="#/p/' + encodeURIComponent(uid) + '/doar">' + IC.heart + esc(t('donate_to', { name: p.name.split(' ')[0] })) + '</a>' : '') +
        '</div>'
    });
  }

  let tlFilter = 'all';
  async function viewTimeline(seq, uid) {
    const p = await store.getProfile(uid);
    if (seq !== renderSeq) return;
    if (!canSee(p, uid)) return go('#/');
    const entries = await store.listTimeline(uid);
    if (seq !== renderSeq) return;
    const spent = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + Number(e.amount || 0), 0);
    const chips = [['all', 'tl_all'], ['milestone', 'tl_milestones'], ['expense', 'tl_expenses']].map((c) =>
      '<button class="chip" data-f="' + c[0] + '" aria-pressed="' + (tlFilter === c[0]) + '">' + esc(t(c[1])) + '</button>').join('');
    const evTitle = (e) => e.type === 'donation' ? t('ev_donation') + ': ' + I18N.money(e.amount) : e.type === 'verified' ? t('ev_verified') : (e.title || t('ev_' + e.type));
    shell({
      back: '#/p/' + encodeURIComponent(uid), title: t('timeline'), nav: 'home', help: 'help_timeline',
      say: [t('timeline') + ', ' + p.name, I18N.money(p.raised) + ' ' + t('tl_received'), I18N.money(spent) + ' ' + t('tl_spent'),
        entries.slice(0, 4).map((e) => I18N.date(e.createdAt) + ': ' + evTitle(e)).join('. ')].join('. '),
      html:
        '<div class="narrow">' +
        '<div><h1 class="h1">' + esc(t('timeline')) + '</h1><div class="muted">' + esc(p.name) + ' · ' + esc(p.goalTitle) + '</div></div>' +
        '<div class="stats">' +
        '<div class="stat"><b>' + esc(I18N.money(p.raised)) + '</b><span class="small muted">' + esc(t('tl_received')) + '</span></div>' +
        '<div class="stat"><b>' + esc(I18N.money(spent)) + '</b><span class="small muted">' + esc(t('tl_spent')) + '</span></div>' +
        '<div class="stat"><b>' + esc(p.donorsCount || 0) + '</b><span class="small muted">' + esc(t('donors', { n: '' }).trim()) + '</span></div></div>' +
        '<div class="chips" role="group">' + chips + '</div>' +
        '<ol class="tl" id="tl-list" aria-live="polite"></ol>' +
        '<div class="notice warm"><b>' + esc(t('chain_title')) + '</b><br>' + esc(t('chain_text')) + '</div></div>'
    });
    const titleOf = (e) => {
      if (e.type === 'donation') return t('ev_donation') + ': ' + I18N.money(e.amount);
      if (e.type === 'verified') return t('ev_verified');
      return e.title || t('ev_' + e.type);
    };
    const draw = () => {
      const list = entries.filter((e) => tlFilter === 'all' || (tlFilter === 'milestone' ? ['milestone', 'verified', 'update'].includes(e.type) : e.type === tlFilter));
      $('#tl-list').innerHTML = list.length ? list.map((e) =>
        '<li><div class="rail t-' + esc(e.type) + '"><span class="dot"></span><span class="line"></span></div>' +
        '<div class="body"><span class="label-up" style="font-size:0.72rem">' + esc(I18N.date(e.createdAt)) + ' · ' + esc(t('ev_' + e.type)) + '</span>' +
        '<b>' + esc(titleOf(e)) + '</b>' +
        (e.text ? '<span style="color:var(--ink-2)">' + esc(e.text) + '</span>' : '') +
        (e.type === 'expense' && e.amount ? '<span class="small muted">' + esc(I18N.money(e.amount)) + '</span>' : '') +
        (e.url ? mediaHtml(e) : '') + '</div></li>').join('') : '<p class="empty">' + esc(t('tl_empty')) + '</p>';
    };
    draw();
    $$('.chip').forEach((c) => {
      c.onclick = () => { tlFilter = c.dataset.f; $$('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === c))); draw(); };
    });
  }

  async function viewDonate(seq, uid) {
    if (!me) return go('#/entrar?next=' + encodeURIComponent('#/p/' + uid + '/doar'));
    const p = await store.getProfile(uid);
    if (seq !== renderSeq) return;
    if (!p || p.status !== 'verified') return go('#/');
    const first = p.name.split(' ')[0];
    let amount = 50;
    shell({
      back: '#/p/' + encodeURIComponent(uid), title: t('donate_to', { name: first }), nav: 'home', help: 'help_donate',
      say: [t('donate_to', { name: first }), t('donate_how'), t('pix_key') + ': ' + (p.pixKey || ''), t('v_tip_donate')].join('. '),
      html:
        '<form class="narrow" id="don-form" novalidate>' +
        '<h1 class="h1">' + esc(t('donate_to', { name: first })) + '</h1>' +
        '<p class="notice" style="margin:0">' + esc(t('donate_how')) + '</p>' +
        '<div class="card"><span class="label-up">' + esc(t('pix_key')) + '</span>' +
        '<div class="pix"><code id="pix">' + esc(p.pixKey || '—') + '</code><button type="button" class="btn secondary small" id="copy">' + IC.copy + esc(t('copy')) + '</button></div></div>' +
        '<fieldset style="border:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px"><legend class="h2" style="margin-bottom:10px">' + esc(t('amount')) + '</legend>' +
        '<div class="amounts">' + [10, 25, 50, 100, 200, 500].map((v) => '<button type="button" class="amount-btn" data-v="' + v + '" aria-pressed="' + (v === amount) + '">' + esc(I18N.money(v)) + '</button>').join('') + '</div>' +
        '<label class="field"><span class="sr-only">' + esc(t('amount')) + '</span><input class="input" id="amt" inputmode="decimal" value="50" aria-label="' + esc(t('amount')) + '"></label></fieldset>' +
        '<label class="field"><span>' + esc(t('receipt')) + '</span><input class="input" type="file" id="rcpt" accept="image/*,application/pdf"></label>' +
        '<label class="check">' + esc(t('anonymous')) + '<input type="checkbox" id="anon"></label>' +
        '<button class="btn block" type="submit" id="don-go">' + esc(t('register_donation')) + '</button></form>'
    });
    $('#copy').onclick = async () => {
      try { await navigator.clipboard.writeText(p.pixKey || ''); toast(t('copied')); }
      catch (e) { const r = document.createRange(); r.selectNodeContents($('#pix')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    };
    $$('.amount-btn').forEach((b) => {
      b.onclick = () => { amount = Number(b.dataset.v); $('#amt').value = amount; $$('.amount-btn').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); };
    });
    $('#amt').oninput = () => { $$('.amount-btn').forEach((x) => x.setAttribute('aria-pressed', String(Number(x.dataset.v) === num($('#amt').value)))); };
    $('#don-form').onsubmit = (e) => {
      e.preventDefault();
      const val = num($('#amt').value);
      if (!(val > 0)) { toast(t('amount_invalid')); $('#amt').focus(); return; }
      const anon = $('#anon').checked;
      busy($('#don-go'), async () => {
        await store.createDonation({
          beneficiaryUid: uid, beneficiaryName: p.name, donorUid: me.uid,
          donorName: anon ? '' : (me.name || ''), anonymous: anon, amount: val
        }, $('#rcpt').files[0] || null);
        $('#main').innerHTML =
          '<div class="narrow" style="align-items:center;text-align:center;padding-top:40px">' +
          '<div class="avatar big" style="color:var(--accent)">' + IC.checkBig + '</div>' +
          '<h1 class="h1" tabindex="-1">' + esc(t('donation_ok_title')) + '</h1>' +
          '<p style="margin:0">' + esc(t('donation_ok_text', { name: first })) + '</p>' +
          '<a class="btn block" href="#/p/' + encodeURIComponent(uid) + '/linha">' + esc(t('follow')) + '</a>' +
          '<a class="btn ghost block" href="#/">' + esc(t('nav_home')) + '</a></div>';
        $('#main h1').focus();
        if (isAudio()) Voice.announce(t('donation_ok_title') + ' ' + t('donation_ok_text', { name: first }));
      });
    };
  }

  let authMode = 'signup';
  function viewAuth(next) {
    const after = () => go(next || '#/minha');
    if (me) return after();
    const demo = store.mode === 'demo';
    const signup = authMode === 'signup';
    shell({
      back: '#/', title: signup ? t('signup') : t('login'), nav: 'mine', help: 'help_auth',
      say: (signup ? t('signup') : t('login')) + '. ' + t('v_tip_form'),
      html:
        '<form class="narrow" id="auth-form" novalidate>' +
        '<h1 class="h1">' + esc(signup ? t('signup') : t('login')) + '</h1>' +
        (signup ? '<label class="field"><span>' + esc(t('name')) + '</span><input class="input" id="f-name" autocomplete="name" required></label>' : '') +
        '<label class="field"><span>' + esc(t('email')) + '</span><input class="input" id="f-email" type="email" autocomplete="email" required></label>' +
        '<label class="field"><span>' + esc(t('password')) + '</span><input class="input" id="f-pass" type="password" autocomplete="' + (signup ? 'new-password' : 'current-password') + '" minlength="6" required></label>' +
        (signup ? '<fieldset style="border:none;padding:0;margin:0" class="radio-cards"><legend class="h2" style="margin-bottom:10px">' + esc(t('i_am')) + '</legend>' +
          '<label class="radio-card"><input type="radio" name="role" value="donor" checked>' + esc(t('role_donor')) + '</label>' +
          '<label class="radio-card"><input type="radio" name="role" value="beneficiary">' + esc(t('role_beneficiary')) + '</label></fieldset>' : '') +
        '<button class="btn block" type="submit" id="auth-go">' + esc(signup ? t('signup') : t('login')) + '</button>' +
        '<button class="btn ghost block" type="button" id="auth-switch">' + esc(signup ? t('have_account') : t('no_account')) + '</button>' +
        '<div class="divider">' + esc(t('or')) + '</div>' +
        '<button class="btn secondary block" type="button" id="auth-google">' + esc(t('google')) + '</button>' +
        (demo ? '<div class="card"><span class="label-up">' + esc(t('demo_title')) + '</span><div class="row wrap">' +
          '<button type="button" class="btn secondary small" data-demo="demo-moderador">' + esc(t('demo_admin')) + '</button></div></div>' : '') +
        '</form>'
    });
    $('#auth-switch').onclick = () => { authMode = signup ? 'login' : 'signup'; viewAuth(next); };
    $('#auth-google').onclick = (e) => busy(e.currentTarget, async () => { await store.signInGoogle(); });
    $$('[data-demo]').forEach((b) => { b.onclick = () => busy(b, async () => { await store.demoSignIn(b.dataset.demo); }); });
    $('#auth-form').onsubmit = (e) => {
      e.preventDefault();
      const email = $('#f-email').value, pass = $('#f-pass').value;
      busy($('#auth-go'), async () => {
        if (signup) {
          const name = $('#f-name').value.trim();
          if (!name) { $('#f-name').focus(); return; }
          const role = ($('input[name="role"]:checked') || {}).value || 'donor';
          await store.signUp(email, pass, name, role);
        } else {
          await store.signIn(email, pass);
        }
      });
    };
    pendingNext = next;
  }
  let pendingNext = null;

  async function viewMine(seq) {
    if (!me) return go('#/entrar?next=' + encodeURIComponent('#/minha'));
    if (!me.role) return viewChooseRole();
    if (me.role === 'beneficiary') return viewMineBeneficiary(seq);
    const list = await store.listMyDonations(me.uid);
    if (seq !== renderSeq) return;
    shell({
      nav: 'mine', help: 'help_mine_donor',
      say: t('my_donations') + '. ' + (list.length ? list.slice(0, 5).map((d) => (d.beneficiaryName || '') + ', ' + I18N.money(d.amount) + ', ' + t(d.status === 'confirmed' ? 'confirmed' : 'pending')).join('. ') : t('no_my_donations')),
      html:
        '<div class="narrow"><h1 class="h1">' + esc(t('my_donations')) + '</h1>' +
        (isAdmin ? '<a class="btn secondary block" href="#/moderar">' + IC.shield + esc(t('moderation')) + '</a>' : '') +
        (list.length ? list.map((d) =>
          '<div class="card" style="gap:6px"><div class="row between"><b>' + esc(d.beneficiaryName || '') + '</b><b>' + esc(I18N.money(d.amount)) + '</b></div>' +
          '<div class="row between small"><span class="muted">' + esc(I18N.date(d.createdAt)) + '</span>' +
          '<span class="badge ' + (d.status === 'confirmed' ? '' : 'warm') + '">' + esc(t(d.status === 'confirmed' ? 'confirmed' : 'pending')) + '</span></div>' +
          '<a class="small" href="#/p/' + encodeURIComponent(d.beneficiaryUid) + '/linha">' + esc(t('follow')) + '</a></div>').join('')
          : '<p class="empty">' + esc(t('no_my_donations')) + '</p>') +
        '<a class="btn block" href="#/">' + esc(t('find_people')) + '</a></div>'
    });
  }

  function viewChooseRole() {
    shell({
      nav: 'mine', help: 'help_auth',
      html:
        '<form class="narrow" id="role-form"><h1 class="h1">' + esc(t('choose_role')) + '</h1>' +
        '<div class="radio-cards"><label class="radio-card"><input type="radio" name="role" value="donor" checked>' + esc(t('role_donor')) + '</label>' +
        '<label class="radio-card"><input type="radio" name="role" value="beneficiary">' + esc(t('role_beneficiary')) + '</label></div>' +
        '<button class="btn block" id="role-go">' + esc(t('continue')) + '</button></form>'
    });
    $('#role-form').onsubmit = (e) => {
      e.preventDefault();
      busy($('#role-go'), async () => {
        await store.updateUser(me.uid, { role: $('input[name="role"]:checked').value, name: me.name || '', email: me.email || '', createdAt: Date.now() });
      });
    };
  }

  async function viewMineBeneficiary(seq) {
    const [p, proofs, dons] = await Promise.all([store.getProfile(me.uid), store.listProofs(me.uid), store.listDonationsFor(me.uid)]);
    if (seq !== renderSeq) return;
    const v = p || {};
    const status = p ? '<p class="notice ' + (p.status === 'verified' ? '' : p.status === 'rejected' ? 'danger' : 'warm') + '" style="margin:0">' + esc(t('status_' + p.status)) + '</p>' : '';
    const opt = (val, lbl, cur) => '<option value="' + val + '"' + (val === cur ? ' selected' : '') + '>' + esc(lbl) + '</option>';
    shell({
      nav: 'mine', help: 'help_mine_benef',
      say: [t('mine_title'), p ? t('status_' + p.status) : '', dons.filter((d) => d.status === 'pending').length ? t('donations_received') + ': ' + dons.filter((d) => d.status === 'pending').length : '', t('v_tip_form')].filter(Boolean).join('. '),
      html:
        '<div class="narrow"><h1 class="h1">' + esc(t('mine_title')) + '</h1>' + status +
        (isAdmin ? '<a class="btn secondary block" href="#/moderar">' + IC.shield + esc(t('moderation')) + '</a>' : '') +

        '<form class="card" id="prof-form"><h2 class="h2">' + esc(t('my_profile')) + '</h2>' +
        '<label class="field"><span>' + esc(t('name')) + '</span><input class="input" id="p-name" required value="' + esc(v.name || me.name || '') + '"></label>' +
        '<div class="row" style="align-items:flex-start"><label class="field" style="flex:0 0 96px"><span>' + esc(t('age')) + '</span><input class="input" id="p-age" inputmode="numeric" value="' + esc(v.age || '') + '"></label>' +
        '<label class="field" style="flex:1;min-width:0"><span>' + esc(t('city')) + '</span><input class="input" id="p-city" value="' + esc(v.city || '') + '"></label></div>' +
        '<label class="field"><span>' + esc(t('category')) + '</span><select class="input" id="p-cat">' + catKeys.map((c) => opt(c, t('cat_' + c), v.category || 'other')).join('') + '</select></label>' +
        '<label class="field"><span>' + esc(t('goal_title')) + '</span><input class="input" id="p-goal" required value="' + esc(v.goalTitle || '') + '"></label>' +
        '<label class="field"><span>' + esc(t('goal_amount')) + '</span><input class="input" id="p-amount" inputmode="decimal" value="' + esc(v.goalAmount || '') + '"></label>' +
        '<label class="field"><span>' + esc(t('story')) + '</span><textarea class="input" id="p-story" placeholder="' + esc(t('story_ph')) + '">' + esc(v.story || '') + '</textarea></label>' +
        '<label class="field"><span>' + esc(t('pix_own')) + '</span><input class="input" id="p-pix" value="' + esc(v.pixKey || '') + '"></label>' +
        '<button class="btn block" id="p-save">' + esc(t('save')) + '</button>' +
        (p ? '<a class="btn ghost block" href="#/p/' + encodeURIComponent(me.uid) + '">' + esc(t('view_public')) + '</a>' : '') + '</form>' +

        '<section class="card"><h2 class="h2">' + esc(t('proofs')) + '</h2>' +
        (p ? '<form id="proof-form" style="display:flex;flex-direction:column;gap:12px">' +
          '<label class="field"><span>' + esc(t('proof_title')) + '</span><input class="input" id="pr-title" required></label>' +
          '<label class="field"><span>' + esc(t('proof_file')) + '</span><input class="input" type="file" id="pr-file" accept="image/*,video/*,application/pdf" required></label>' +
          '<label class="field"><span>' + esc(t('visibility')) + '</span><select class="input" id="pr-vis">' + opt('donors', t('vis_donors'), 'donors') + opt('public', t('vis_public'), 'donors') + '</select></label>' +
          '<button class="btn block" id="pr-go">' + esc(t('add_proof')) + '</button></form>' +
          proofs.map((pr) => '<div class="row between" style="border-top:1px solid var(--line);padding-top:10px"><span>' + esc(pr.title) + ' <span class="small muted">· ' + esc(t(pr.visibility === 'public' ? 'proof_public' : 'proof_restricted')) + '</span></span>' +
            '<button class="btn danger small" data-del="' + esc(pr.id) + '">' + esc(t('delete')) + '</button></div>').join('')
          : '<p class="muted" style="margin:0">' + esc(t('fill_profile_first')) + '</p>') + '</section>' +

        (p ? '<form class="card" id="up-form"><h2 class="h2">' + esc(t('post_update')) + '</h2>' +
          '<label class="field"><span>' + esc(t('update_type')) + '</span><select class="input" id="u-type">' + opt('update', t('ev_update'), 'update') + opt('expense', t('ev_expense'), '') + opt('milestone', t('ev_milestone'), '') + '</select></label>' +
          '<label class="field"><span>' + esc(t('update_title')) + '</span><input class="input" id="u-title" required></label>' +
          '<label class="field"><span>' + esc(t('update_text')) + '</span><textarea class="input" id="u-text"></textarea></label>' +
          '<label class="field"><span>' + esc(t('update_amount')) + '</span><input class="input" id="u-amount" inputmode="decimal"></label>' +
          '<label class="field"><span>' + esc(t('attach')) + '</span><input class="input" type="file" id="u-file" accept="image/*,video/*,application/pdf"></label>' +
          '<button class="btn block" id="u-go">' + esc(t('send')) + '</button></form>' : '') +

        (p ? '<section class="card"><h2 class="h2">' + esc(t('donations_received')) + '</h2>' +
          (dons.length ? dons.map((d) =>
            '<div style="display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--line);padding-top:10px">' +
            '<div class="row between"><b>' + esc(d.anonymous ? t('anonymous_donor') : (d.donorName || t('anonymous_donor'))) + '</b><b>' + esc(I18N.money(d.amount)) + '</b></div>' +
            '<div class="row between small"><span class="muted">' + esc(I18N.date(d.createdAt)) + '</span>' +
            (d.status === 'confirmed' ? '<span class="badge">' + esc(t('confirmed')) + '</span>' : '<button class="btn small" data-confirm="' + esc(d.id) + '">' + esc(t('confirm_received')) + '</button>') + '</div>' +
            (d.receiptUrl ? '<a class="small" href="' + esc(d.receiptUrl) + '" target="_blank" rel="noopener" download="comprovante">' + esc(t('receipt')) + '</a>' : '') + '</div>').join('')
            : '<p class="muted" style="margin:0">' + esc(t('no_donations')) + '</p>') + '</section>' : '') +

        (p && p.status === 'verified' ? '<section class="notice warm"><b>' + esc(t('give_back_title')) + '</b><p style="margin:6px 0 12px">' + esc(p.givesBack ? t('give_back_on') : t('give_back_text')) + '</p>' +
          (p.givesBack ? '' : '<button class="btn" id="give-back">' + IC.heart + esc(t('give_back_btn')) + '</button>') + '</section>' : '') +
        '</div>'
    });

    $('#prof-form').onsubmit = (e) => {
      e.preventDefault();
      const name = $('#p-name').value.trim(), goal = $('#p-goal').value.trim();
      if (!name) return $('#p-name').focus();
      if (!goal) return $('#p-goal').focus();
      busy($('#p-save'), async () => {
        const data = {
          name, age: num($('#p-age').value) || null, city: $('#p-city').value.trim(), category: $('#p-cat').value,
          goalTitle: goal, goalAmount: num($('#p-amount').value), story: $('#p-story').value.trim(), pixKey: $('#p-pix').value.trim()
        };
        if (p && p.status === 'rejected') data.status = 'pending';
        await store.saveProfile(me.uid, data);
        toast(t('saved')); route();
      });
    };
    const prf = $('#proof-form');
    if (prf) prf.onsubmit = (e) => {
      e.preventDefault();
      const file = $('#pr-file').files[0], title = $('#pr-title').value.trim();
      if (!title) return $('#pr-title').focus();
      if (!file) return $('#pr-file').focus();
      busy($('#pr-go'), async () => { await store.addProof(me.uid, file, { title, visibility: $('#pr-vis').value }); toast(t('saved')); route(); });
    };
    $$('[data-del]').forEach((b) => { b.onclick = () => busy(b, async () => { await store.deleteProof(me.uid, b.dataset.del); route(); }); });
    const upf = $('#up-form');
    if (upf) upf.onsubmit = (e) => {
      e.preventDefault();
      const title = $('#u-title').value.trim();
      if (!title) return $('#u-title').focus();
      busy($('#u-go'), async () => {
        const amt = num($('#u-amount').value);
        await store.addTimeline(me.uid, { type: $('#u-type').value, title, text: $('#u-text').value.trim(), amount: amt || null }, $('#u-file').files[0] || null);
        toast(t('saved')); route();
      });
    };
    $$('[data-confirm]').forEach((b) => { b.onclick = () => busy(b, async () => { await store.confirmDonation(b.dataset.confirm); route(); }); });
    const gb = $('#give-back');
    if (gb) gb.onclick = () => busy(gb, async () => { await store.saveProfile(me.uid, { givesBack: true }); route(); });
  }

  async function viewAdmin(seq) {
    if (!me || !isAdmin) return go('#/minha');
    const pend = await store.listProfiles('pending');
    const proofs = await Promise.all(pend.map((p) => store.listProofs(p.uid)));
    if (seq !== renderSeq) return;
    shell({
      back: '#/minha', title: t('moderation'), nav: 'mine', help: 'help_admin',
      html:
        '<div class="narrow"><h1 class="h1">' + esc(t('pending_profiles')) + '</h1>' +
        (pend.length ? pend.map((p, i) =>
          '<article class="card"><div class="row"><div class="avatar" aria-hidden="true">' + esc(initials(p.name)) + '</div><div><b>' + esc(p.name) + '</b><div class="small muted">' + esc(p.city || '') + '</div></div></div>' +
          '<div><b>' + esc(p.goalTitle) + '</b> · ' + esc(I18N.money(p.goalAmount)) + '</div>' +
          '<p style="margin:0;white-space:pre-line;color:var(--ink-2)">' + esc(p.story) + '</p>' +
          '<details><summary>' + esc(t('proofs')) + ' (' + proofs[i].length + ')</summary><div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">' +
          proofs[i].map((pr) => '<div><b>' + esc(pr.title) + '</b><div>' + mediaHtml(pr) + '</div></div>').join('') + '</div></details>' +
          '<div class="row"><button class="btn" style="flex:1" data-ok="' + esc(p.uid) + '">' + esc(t('approve')) + '</button>' +
          '<button class="btn danger" style="flex:1" data-no="' + esc(p.uid) + '">' + esc(t('reject')) + '</button></div></article>').join('')
          : '<p class="empty">' + esc(t('no_pending')) + '</p>') + '</div>'
    });
    $$('[data-ok]').forEach((b) => { b.onclick = () => busy(b, async () => { await store.setProfileStatus(b.dataset.ok, 'verified'); route(); }); });
    $$('[data-no]').forEach((b) => { b.onclick = () => busy(b, async () => { await store.setProfileStatus(b.dataset.no, 'rejected'); route(); }); });
  }

  function viewSettings() {
    const cur = I18N.LANGS.find((l) => l[0] === I18N.get()) || I18N.LANGS[0];
    const large = document.documentElement.dataset.text === 'large';
    shell({
      nav: 'settings', help: 'help_settings',
      html:
        '<div class="narrow"><h1 class="h1">' + esc(t('settings')) + '</h1>' +
        '<section class="card"><h2 class="label-up">' + esc(t('language')) + '</h2><div class="row between"><b lang="' + esc(cur[0]) + '">' + esc(cur[1]) + '</b>' +
        '<a class="btn secondary small" href="#/idioma">' + esc(t('change_lang')) + '</a></div></section>' +
        '<section class="card"><h2 class="label-up">' + esc(t('mode_label')) + '</h2><div class="row between"><b>' + esc(isAudio() ? t('mode_audio') : t('mode_read')) + '</b>' +
        '<a class="btn secondary small" href="#/modo">' + esc(t('mode_label')) + '</a></div></section>' +
        '<section class="card"><h2 class="label-up">' + esc(t('text_size')) + '</h2><div class="row" role="group" aria-label="' + esc(t('text_size')) + '">' +
        '<button class="chip" data-size="normal" aria-pressed="' + !large + '">' + esc(t('normal')) + '</button>' +
        '<button class="chip" data-size="large" aria-pressed="' + large + '">' + esc(t('larger')) + '</button></div></section>' +
        '<section class="card"><h2 class="label-up">' + esc(t('account')) + '</h2>' +
        (me ? '<div>' + esc(t('logged_as', { name: me.name || me.email || '' })) + '</div>' +
          (isAdmin ? '<a class="btn secondary block" href="#/moderar">' + IC.shield + esc(t('moderation')) + '</a>' : '') +
          '<button class="btn secondary block" id="logout">' + esc(t('logout')) + '</button>'
          : '<div class="muted">' + esc(t('not_logged')) + '</div><a class="btn block" href="#/entrar">' + esc(t('login')) + '</a>') + '</section>' +
        '<section class="card"><h2 class="label-up">' + esc(t('install_app')) + '</h2>' +
        (installEvent ? '<button class="btn block" id="install">' + esc(t('install_app')) + '</button>' : '<p class="muted" style="margin:0">' + esc(t('install_hint')) + '</p>') + '</section>' +
        '<section class="card"><h2 class="label-up">' + esc(t('about')) + '</h2><p style="margin:0">' + esc(t('about_text')) + '</p></section>' +
        (store.mode === 'demo' ? '<button class="btn ghost block" id="reset">' + esc(t('reset_demo')) + '</button>' : '') + '</div>'
    });
    $$('[data-size]').forEach((b) => {
      b.onclick = () => {
        const v = b.dataset.size;
        if (v === 'large') document.documentElement.dataset.text = 'large'; else delete document.documentElement.dataset.text;
        try { localStorage.setItem('ps_text', v); } catch (e) {}
        $$('[data-size]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      };
    });
    const lo = $('#logout'); if (lo) lo.onclick = () => busy(lo, async () => { await store.signOut(); go('#/'); });
    const rs = $('#reset'); if (rs) rs.onclick = () => busy(rs, async () => { await store.resetDemo(); go('#/'); });
    const ins = $('#install'); if (ins) ins.onclick = async () => { installEvent.prompt(); installEvent = null; };
  }

  // ---------- rotas ----------
  async function route() {
    const seq = ++renderSeq;
    stopSpeech();
    const hash = location.hash || '#/';
    const [path, query] = hash.slice(1).split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    const params = new URLSearchParams(query || '');
    if (!I18N.saved() && parts[0] !== 'idioma') { location.replace('#/idioma'); return; }
    if (I18N.saved() && !getMode() && parts[0] !== 'idioma' && parts[0] !== 'modo') { location.replace('#/modo'); return; }
    try {
      if (parts[0] === 'idioma') return viewLanguage();
      if (parts[0] === 'modo') return viewMode();
      if (!parts.length) { loadingView(); return await viewHome(seq); }
      if (parts[0] === 'p' && parts[1]) {
        loadingView();
        if (parts[2] === 'linha') return await viewTimeline(seq, parts[1]);
        if (parts[2] === 'doar') return await viewDonate(seq, parts[1]);
        return await viewProfile(seq, parts[1]);
      }
      if (parts[0] === 'entrar') return viewAuth(params.get('next'));
      if (parts[0] === 'minha') { loadingView(); return await viewMine(seq); }
      if (parts[0] === 'moderar') { loadingView(); return await viewAdmin(seq); }
      if (parts[0] === 'ajustes') return viewSettings();
      go('#/');
    } catch (e) {
      console.error(e);
      shell({ html: '<p class="notice danger">' + esc(errText(e)) + '</p>', help: 'help_home', nav: 'home' });
    }
  }

  // ---------- início ----------
  async function start() {
    try { if (localStorage.getItem('ps_text') === 'large') document.documentElement.dataset.text = 'large'; } catch (e) {}
    I18N.set(I18N.saved() || I18N.guess());
    if (getMode()) document.documentElement.dataset.mode = getMode();
    Voice.init({
      go, speak, stop: stopSpeech, me: () => me, helpKey: () => helpKey,
      setMode: (m) => { setMode(m); route(); }
    });
    loadingView();
    store = window.createStore();
    try { await store.init(); }
    catch (e) { root.innerHTML = '<p class="notice danger" style="margin:16px">' + esc(errText(e)) + '</p>'; return; }
    let firstAuth = true;
    store.onAuth(async (u) => {
      me = u;
      isAdmin = u ? await store.isAdmin(u.uid) : false;
      if (firstAuth) { firstAuth = false; return; }
      if (u && location.hash.startsWith('#/entrar')) go(pendingNext || '#/minha');
      else route();
    });
    me = store.currentUser();
    isAdmin = me ? await store.isAdmin(me.uid) : false;
    window.addEventListener('hashchange', route);
    route();
  }

  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; });
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  start();
})();
