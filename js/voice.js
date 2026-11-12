// ============================================================
// Modo Áudio: o app fala cada tela e entende comandos de voz.
// Usa a voz do próprio celular (speechSynthesis) e o
// reconhecimento de fala do navegador (SpeechRecognition).
// ============================================================
(function () {
  'use strict';

  const t = (k, v) => I18N.t(k, v);

  // Comandos por idioma (sem acento, minúsculos)
  const CMDS = {
    pt: {
      home: ['inicio', 'pagina inicial', 'tela inicial', 'home'],
      mine: ['minha area', 'minha conta', 'minhas doacoes', 'meu perfil'],
      settings: ['ajustes', 'configuracoes', 'configuracao'],
      language: ['idioma', 'trocar idioma', 'lingua'],
      login: ['entrar na conta', 'fazer login', 'login'],
      back: ['voltar', 'volta'],
      help: ['ajuda', 'comandos', 'o que posso dizer'],
      read: ['ler', 'leia', 'ler tela', 'ler a tela', 'repetir', 'repete', 'o que tem'],
      stop: ['parar', 'pare', 'silencio', 'chega'],
      timeline: ['linha do tempo', 'historico'],
      donate: ['doar', 'fazer doacao', 'quero doar'],
      next: ['proximo campo', 'proximo', 'seguinte'],
      prev: ['campo anterior', 'anterior'],
      write: ['escrever', 'escreva', 'digitar', 'digite'],
      clear: ['apagar', 'limpar'],
      check: ['marcar', 'selecionar', 'escolher'],
      submit: ['enviar', 'salvar', 'confirmar', 'registrar', 'continuar', 'entrar', 'criar conta'],
      copy: ['copiar chave', 'copiar'],
      amount: ['valor'],
      open: ['abrir', 'abra', 'ver', 'mostrar'],
      readMode: ['modo leitura', 'modo ler', 'desligar audio']
    },
    en: {
      home: ['home', 'start', 'main page'],
      mine: ['my area', 'my account', 'my donations', 'my profile'],
      settings: ['settings'],
      language: ['language'],
      login: ['log in', 'login'],
      back: ['back', 'go back'],
      help: ['help', 'commands', 'what can i say'],
      read: ['read', 'read screen', 'read the screen', 'repeat', 'what s here'],
      stop: ['stop', 'quiet', 'silence'],
      timeline: ['timeline', 'history'],
      donate: ['donate', 'make a donation'],
      next: ['next field', 'next'],
      prev: ['previous field', 'previous'],
      write: ['write', 'type'],
      clear: ['clear', 'delete', 'erase'],
      check: ['select', 'check', 'choose'],
      submit: ['send', 'save', 'confirm', 'register', 'continue', 'sign in', 'create account', 'submit'],
      copy: ['copy key', 'copy'],
      amount: ['amount', 'value'],
      open: ['open', 'show', 'see'],
      readMode: ['reading mode', 'read mode', 'turn off audio']
    },
    es: {
      home: ['inicio', 'pagina principal'],
      mine: ['mi area', 'mi cuenta', 'mis donaciones', 'mi perfil'],
      settings: ['ajustes', 'configuracion'],
      language: ['idioma'],
      login: ['iniciar sesion'],
      back: ['volver', 'atras'],
      help: ['ayuda', 'comandos', 'que puedo decir'],
      read: ['leer', 'lee', 'leer pantalla', 'leer la pantalla', 'repetir', 'repite'],
      stop: ['parar', 'silencio', 'detener', 'basta'],
      timeline: ['linea de tiempo', 'historial'],
      donate: ['donar', 'hacer donacion', 'quiero donar'],
      next: ['siguiente campo', 'siguiente'],
      prev: ['campo anterior', 'anterior'],
      write: ['escribir', 'escribe'],
      clear: ['borrar', 'limpiar'],
      check: ['seleccionar', 'marcar', 'elegir'],
      submit: ['enviar', 'guardar', 'confirmar', 'registrar', 'continuar', 'entrar', 'crear cuenta'],
      copy: ['copiar clave', 'copiar'],
      amount: ['monto', 'valor'],
      open: ['abrir', 'abre', 'ver', 'mostrar'],
      readMode: ['modo lectura', 'apagar audio']
    },
    fr: {
      home: ['accueil', 'page d accueil'],
      mine: ['mon espace', 'mon compte', 'mes dons', 'mon profil'],
      settings: ['reglages', 'parametres'],
      language: ['langue'],
      login: ['connexion'],
      back: ['retour', 'revenir'],
      help: ['aide', 'commandes', 'que puis je dire'],
      read: ['lire', 'lis', 'lire l ecran', 'repeter', 'repete'],
      stop: ['stop', 'arrete', 'arreter', 'silence'],
      timeline: ['fil chronologique', 'historique'],
      donate: ['faire un don', 'donner'],
      next: ['champ suivant', 'suivant'],
      prev: ['champ precedent', 'precedent'],
      write: ['ecrire', 'ecris', 'taper'],
      clear: ['effacer', 'vider'],
      check: ['choisir', 'cocher', 'selectionner'],
      submit: ['envoyer', 'enregistrer', 'confirmer', 'continuer', 'se connecter', 'creer un compte', 'valider'],
      copy: ['copier la cle', 'copier'],
      amount: ['montant', 'valeur'],
      open: ['ouvrir', 'ouvre', 'voir', 'afficher'],
      readMode: ['mode lecture', 'couper l audio']
    }
  };
  // palavras faladas para montar e-mail
  const EMAIL = {
    pt: [['arroba', '@'], ['ponto', '.'], ['traco', '-'], ['sublinhado', '_']],
    en: [['at', '@'], ['dot', '.'], ['dash', '-'], ['underscore', '_']],
    es: [['arroba', '@'], ['punto', '.'], ['guion', '-'], ['guion bajo', '_']],
    fr: [['arobase', '@'], ['point', '.'], ['tiret', '-'], ['tiret bas', '_']]
  };

  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, ' ').replace(/[^a-z0-9@.,\sЀ-鿿]/g, ' ').replace(/\s+/g, ' ').trim();
  const uiKey = () => { const c = I18N.get(); return c.startsWith('pt') ? 'pt' : (CMDS[c] ? c : 'en'); };
  const has = (text, list) => list.some((p) => (' ' + text + ' ').includes(' ' + p + ' '));
  const prefix = (text, list) => list.slice().sort((a, b) => b.length - a.length).find((p) => text === p || text.startsWith(p + ' '));

  let api = null;
  let rec = null;
  let listening = false;

  // ---------- fala ----------
  function say(text, onend) { api.speak(text, I18N.speechLang(), onend); }
  function beep() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx(); const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 880; g.gain.value = 0.08; o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.12); setTimeout(() => ctx.close(), 300);
    } catch (e) {}
  }

  function tipFor(helpKey) {
    return ({
      help_home: 'v_tip_home', help_profile: 'v_tip_profile', help_timeline: 'v_tip_profile',
      help_donate: 'v_tip_donate', help_auth: 'v_tip_form', help_mine_benef: 'v_tip_form', help_settings: 'v_tip_form'
    })[helpKey];
  }

  // ---------- campos de formulário ----------
  const fields = () => Array.from(document.querySelectorAll('#main input, #main textarea, #main select'))
    .filter((el) => el.type !== 'hidden' && !el.disabled && el.offsetParent !== null);
  function labelOf(el) {
    const lab = el.closest('label');
    let txt = '';
    if (lab) { const c = lab.cloneNode(true); c.querySelectorAll('input,select,textarea').forEach((x) => x.remove()); txt = c.textContent; }
    return (txt || el.getAttribute('aria-label') || el.placeholder || '').replace(/\s+/g, ' ').trim();
  }
  function describe(el) {
    let value;
    if (el.type === 'radio' || el.type === 'checkbox') value = el.checked ? t('v_checked') : t('v_unchecked');
    else if (el.type === 'file') value = el.files && el.files[0] ? el.files[0].name : t('v_file');
    else if (el.type === 'password') value = el.value ? t('v_filled') : t('v_empty');
    else if (el.tagName === 'SELECT') value = el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : '';
    else value = el.value || t('v_empty');
    return t('v_field', { label: labelOf(el), value });
  }
  // lembra o último campo usado (tocar no botão Falar tira o foco do campo)
  let lastField = null;
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (el && el.matches && el.matches('#main input, #main textarea, #main select')) lastField = el;
  });
  function current() {
    const list = fields();
    const a = document.activeElement;
    if (list.includes(a)) return a;
    return lastField && lastField.isConnected && list.includes(lastField) ? lastField : null;
  }
  function move(step) {
    const list = fields();
    if (!list.length) return say(t('v_no_field'));
    const i = list.indexOf(current());
    const el = list[(i + step + list.length) % list.length];
    el.focus(); el.scrollIntoView({ block: 'center' });
    say(describe(el));
  }
  function write(rawText) {
    let el = current();
    if (!el) { const list = fields().filter((f) => !['radio', 'checkbox', 'file'].includes(f.type) && f.tagName !== 'SELECT'); el = list[0]; if (el) el.focus(); }
    if (!el) return say(t('v_no_field'));
    let text = rawText.trim();
    if (el.type === 'email') {
      let n = ' ' + norm(text) + ' ';
      (EMAIL[uiKey()] || EMAIL.en).slice().sort((a, b) => b[0].length - a[0].length).forEach(([w, s]) => { n = n.split(' ' + w + ' ').join(' ' + s + ' '); });
      text = n.replace(/\s+/g, '');
    } else if (el.inputMode === 'decimal' || el.inputMode === 'numeric') {
      const m = text.match(/\d+([.,]\d+)?/); text = m ? m[0] : '';
    }
    if (['radio', 'checkbox', 'file'].includes(el.type) || el.tagName === 'SELECT') return say(describe(el));
    el.value = (el.value && el.type !== 'email' && el.inputMode !== 'decimal' && el.inputMode !== 'numeric' && el.type !== 'password') ? el.value + ' ' + text : text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    say(el.type === 'password' ? t('v_filled') : t('v_written', { x: text }));
  }
  function submit() {
    const el = current();
    const form = (el && el.form) || document.querySelector('#main form');
    if (!form) return false;
    const btn = form.querySelector('button[type="submit"], button:not([type])');
    if (btn) btn.click(); else form.requestSubmit();
    return true;
  }

  // ---------- leitura da tela ----------
  function readScreen() {
    const live = document.getElementById('main');
    let main = null;
    if (live) {
      // lista suspensa: lê só a opção escolhida
      main = live.cloneNode(true);
      main.style.position = 'absolute'; main.style.left = '-9999px';
      const sel = live.querySelectorAll('select');
      main.querySelectorAll('select').forEach((s, i) => { const span = document.createElement('span'); span.textContent = sel[i].options[sel[i].selectedIndex] ? sel[i].options[sel[i].selectedIndex].text : ''; s.replaceWith(span); });
      document.body.appendChild(main);
    }
    const text = main ? main.innerText.replace(/\n{2,}/g, '\n').replace(/\s*\n\s*/g, '. ').replace(/\.\s*\./g, '.').slice(0, 3000) : '';
    if (main) main.remove();
    say(text);
  }

  // ---------- interpretar comando ----------
  function handle(raw) {
    const c = CMDS[uiKey()];
    const text = norm(raw);
    if (!text) return say(t('v_not_understood'));

    const w = prefix(text, c.write);
    if (w) return write(raw.trim().split(/\s+/).slice(w.split(' ').length).join(' '));

    if (has(text, c.stop)) return api.stop();
    if (has(text, c.readMode)) { api.setMode('read'); return say(t('v_mode_read_on')); }
    if (has(text, c.help)) return help();
    if (has(text, c.next)) return move(1);
    if (has(text, c.prev)) return move(-1);
    if (has(text, c.clear)) { const el = current(); if (!el) return say(t('v_no_field')); el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); return say(t('v_cleared')); }
    if (has(text, c.check)) { const el = current(); if (el && (el.type === 'radio' || el.type === 'checkbox')) { el.click(); return say(describe(el)); } return say(t('v_no_field')); }

    const amt = document.getElementById('amt');
    const num = text.match(/\d+([.,]\d+)?/);
    if (amt && num && (has(text, c.amount) || /^\d/.test(text))) {
      amt.value = num[0]; amt.dispatchEvent(new Event('input', { bubbles: true }));
      return say(t('v_amount_set', { v: I18N.money(Number(num[0].replace(',', '.'))) }));
    }
    const copyBtn = document.getElementById('copy');
    if (copyBtn && has(text, c.copy)) { copyBtn.click(); return say(t('copied')); }

    if (has(text, c.timeline)) { const a = document.querySelector('#main a[href$="/linha"]'); if (a) { a.click(); return; } }
    if (has(text, c.donate)) {
      const a = document.querySelector('#main a[href$="/doar"]'); if (a) { a.click(); return; }
      const m = location.hash.match(/^#\/p\/([^/?]+)/); if (m) return api.go('#/p/' + m[1] + '/doar');
    }
    if (has(text, c.submit) && document.querySelector('#main form')) { if (submit()) return; }
    if (has(text, c.read)) return readScreen();
    if (has(text, c.back)) return history.back();
    if (has(text, c.home)) return api.go('#/');
    if (has(text, c.mine)) return api.go('#/minha');
    if (has(text, c.settings)) return api.go('#/ajustes');
    if (has(text, c.language)) return api.go('#/idioma');
    if (has(text, c.login) || has(text, c.submit)) { if (!api.me()) return api.go('#/entrar'); }

    // abrir alguém pelo nome
    const o = prefix(text, c.open);
    const target = o ? text.slice(o.length).trim() : text;
    const cards = Array.from(document.querySelectorAll('#main [data-name]'));
    const hit = cards.find((el) => {
      const n = norm(el.dataset.name);
      return n && (target.includes(n.split(' ')[0]) || n.includes(target));
    });
    if (hit && target) { say(t('v_opening', { x: hit.dataset.name })); hit.click(); return; }
    if (o && target) return say(t('v_not_found', { x: target }));
    say(t('v_not_understood'));
  }

  function help() {
    const tip = tipFor(api.helpKey());
    say(t('v_global') + ' ' + (tip ? t(tip) : ''));
  }

  // ---------- microfone ----------
  function updateBtn() {
    const b = document.getElementById('mic-btn');
    if (!b) return;
    b.setAttribute('aria-pressed', String(listening));
    b.classList.toggle('on', listening);
    const s = b.querySelector('span'); if (s) s.textContent = listening ? t('mic_listening') : t('mic');
  }
  function listen() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return say(t('v_unsupported'));
    if (listening && rec) { rec.stop(); return; }
    api.stop();
    rec = new SR();
    rec.lang = I18N.speechLang();
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let got = false;
    rec.onresult = (e) => { got = true; const txt = e.results[0][0].transcript; handle(txt); };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') say(t('v_mic_denied'));
      else if (e.error === 'no-speech') say(t('v_not_understood'));
    };
    rec.onend = () => { listening = false; updateBtn(); };
    beep();
    setTimeout(() => {
      try { rec.start(); listening = true; updateBtn(); } catch (e) { listening = false; updateBtn(); }
    }, 180);
  }

  window.Voice = {
    init(a) { api = a; },
    handle,
    listen,
    help,
    readScreen,
    // chamado sempre que uma tela abre no Modo Áudio
    announce(text) {
      const s = (text || '').trim();
      setTimeout(() => say((s ? s + (/[.!?…]$/.test(s) ? ' ' : '. ') : '') + t('v_say_help')), 120);
    },
    supported: () => !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  };
})();
