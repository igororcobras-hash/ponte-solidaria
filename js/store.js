// ============================================================
// Camada de dados. Duas versões com a mesma interface:
//  - LocalStore: modo demonstração (salva no navegador)
//  - FirebaseStore: produção (Firebase Auth + Firestore, plano gratuito)
// ============================================================
(function () {
  'use strict';

  const now = () => Date.now();
  const rid = () => Math.random().toString(36).slice(2, 10) + now().toString(36);
  const byDateDesc = (a, b) => (b.createdAt || 0) - (a.createdAt || 0);

  class AppError extends Error {
    constructor(code) { super(code); this.code = code; }
  }

  // Plano gratuito: sem Cloud Storage. Fotos são reduzidas no navegador e
  // guardadas dentro do próprio documento; PDF só pequeno; vídeo vai por link.
  const MAX_PDF_KB = 600;
  const MAX_IMG_KB = 300;

  function readDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new AppError('upload_failed'));
      r.readAsDataURL(file);
    });
  }

  async function compressImage(file) {
    const src = await readDataUrl(file);
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new AppError('upload_failed'));
      i.src = src;
    });
    let w = img.naturalWidth, h = img.naturalHeight;
    let side = Math.min(1280, Math.max(w, h));
    let q = 0.75, out = '';
    for (let n = 0; n < 8; n++) {
      const k = Math.min(1, side / Math.max(w, h));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      out = c.toDataURL('image/jpeg', q);
      if (out.length * 0.75 <= MAX_IMG_KB * 1024) return out;
      side = Math.round(side * 0.8); q = Math.max(0.5, q - 0.06);
    }
    throw new AppError('file_too_big');
  }

  // Devolve { url, kind, fileName } pronto para gravar no documento.
  async function prepareFile(file) {
    if (!file) return null;
    const t = file.type || '';
    if (t.startsWith('video/')) throw new AppError('video_use_link');
    if (t.startsWith('image/')) return { url: await compressImage(file), kind: 'photo', fileName: file.name };
    if (t === 'application/pdf') {
      if (file.size > MAX_PDF_KB * 1024) throw new AppError('pdf_too_big');
      return { url: await readDataUrl(file), kind: 'doc', fileName: file.name };
    }
    throw new AppError('file_type');
  }

  function cleanLink(l) {
    l = (l || '').trim();
    if (!l) return '';
    if (!/^https?:\/\//i.test(l)) l = 'https://' + l;
    try { return new URL(l).href; } catch (e) { throw new AppError('bad_link'); }
  }

  // ----------------------------------------------------------
  // MODO DEMONSTRAÇÃO
  // ----------------------------------------------------------
  const LS_DB = 'ps_db_v2';
  const LS_SESSION = 'ps_session_v1';
  const DEMO_MAX_MB = 4; // o navegador tem pouco espaço

  // Começa vazio: sem pessoas fictícias. Só existe uma conta de moderação para teste.
  function seed() {
    return {
      users: { 'demo-moderador': { name: 'Moderação (teste)', email: 'moderador@demo', role: 'donor', createdAt: now() } },
      admins: { 'demo-moderador': true },
      profiles: {}, proofs: {}, timeline: {}, donations: []
    };
  }

  class LocalStore {
    constructor() { this.mode = 'demo'; this.listeners = []; this.maxMb = DEMO_MAX_MB; }

    async init() {
      try { this.db = JSON.parse(localStorage.getItem(LS_DB) || 'null'); } catch (e) { this.db = null; }
      if (!this.db) { this.db = seed(); this._save(); }
      try { this.uid = localStorage.getItem(LS_SESSION) || null; } catch (e) { this.uid = null; }
    }

    _save() {
      try { localStorage.setItem(LS_DB, JSON.stringify(this.db)); }
      catch (e) { throw new AppError('storage_full'); }
    }
    _setSession(uid) {
      this.uid = uid;
      try { uid ? localStorage.setItem(LS_SESSION, uid) : localStorage.removeItem(LS_SESSION); } catch (e) {}
      const u = this.currentUser();
      this.listeners.forEach((f) => f(u));
    }
    async _hash(s) {
      try {
        const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
        return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('');
      } catch (e) { return 'plain:' + s; }
    }
    onAuth(cb) { this.listeners.push(cb); cb(this.currentUser()); }
    currentUser() {
      const u = this.uid && this.db.users[this.uid];
      return u ? Object.assign({ uid: this.uid }, u) : null;
    }
    async signUp(email, pass, name, role) {
      email = email.trim().toLowerCase();
      if (pass.length < 6) throw new AppError('weak_password');
      if (Object.values(this.db.users).some((u) => u.email === email)) throw new AppError('email_in_use');
      const uid = rid();
      this.db.users[uid] = { name, email, role, passHash: await this._hash(pass), createdAt: now() };
      this._save();
      this._setSession(uid);
    }
    async signIn(email, pass) {
      email = email.trim().toLowerCase();
      const h = await this._hash(pass);
      const entry = Object.entries(this.db.users).find(([, u]) => u.email === email && u.passHash === h);
      if (!entry) throw new AppError('bad_login');
      this._setSession(entry[0]);
    }
    async signInGoogle() { throw new AppError('google_needs_firebase'); }
    async demoSignIn(uid) { if (this.db.users[uid]) this._setSession(uid); }
    async signOut() { this._setSession(null); }
    async resetDemo() { this.db = seed(); this._save(); this._setSession(null); }

    async getUser(uid) { const u = this.db.users[uid]; return u ? Object.assign({ uid }, u) : null; }
    async updateUser(uid, data) {
      Object.assign(this.db.users[uid], data); this._save();
      if (uid === this.uid) this._setSession(uid);
    }
    async isAdmin(uid) { return !!(uid && this.db.admins[uid]); }

    async listProfiles(status) {
      return Object.values(this.db.profiles).filter((p) => !status || p.status === status).sort(byDateDesc);
    }
    async getProfile(uid) { return this.db.profiles[uid] ? Object.assign({}, this.db.profiles[uid]) : null; }
    async saveProfile(uid, data) {
      const cur = this.db.profiles[uid];
      if (cur) Object.assign(cur, data);
      else this.db.profiles[uid] = Object.assign({ uid, status: 'pending', raised: 0, donorsCount: 0, givesBack: false, createdAt: now() }, data);
      this._save();
    }
    async setProfileStatus(uid, status) {
      this.db.profiles[uid].status = status;
      if (status === 'verified') await this.addTimeline(uid, { type: 'verified' });
      this._save();
    }

    async listProofs(uid) { return (this.db.proofs[uid] || []).slice().sort(byDateDesc); }
    async addProof(uid, file, meta) {
      const f = await prepareFile(file);
      const link = cleanLink(meta && meta.link);
      if (!f && !link) throw new AppError('need_file_or_link');
      (this.db.proofs[uid] = this.db.proofs[uid] || []).push(Object.assign({ id: rid(), kind: f ? f.kind : 'link', url: f ? f.url : null, fileName: f ? f.fileName : null, createdAt: now() }, meta, { link: link || null }));
      this._save();
    }
    async deleteProof(uid, id) {
      this.db.proofs[uid] = (this.db.proofs[uid] || []).filter((p) => p.id !== id); this._save();
    }

    async listTimeline(uid) { return (this.db.timeline[uid] || []).slice().sort(byDateDesc); }
    async addTimeline(uid, entry, file) {
      const f = await prepareFile(file);
      const link = cleanLink(entry && entry.link);
      (this.db.timeline[uid] = this.db.timeline[uid] || []).push(Object.assign({ id: rid(), createdAt: now(), url: f ? f.url : null, kind: f ? f.kind : (link ? 'link' : null) }, entry, { link: link || null }));
      this._save();
    }

    async createDonation(data, file) {
      const f = await prepareFile(file);
      this.db.donations.push(Object.assign({ id: rid(), status: 'pending', createdAt: now(), receiptUrl: f ? f.url : null }, data));
      this._save();
    }
    async listDonationsFor(uid) { return this.db.donations.filter((d) => d.beneficiaryUid === uid).sort(byDateDesc); }
    async listMyDonations(uid) { return this.db.donations.filter((d) => d.donorUid === uid).sort(byDateDesc); }
    async confirmDonation(id) {
      const d = this.db.donations.find((x) => x.id === id);
      if (!d || d.status !== 'pending') return;
      d.status = 'confirmed';
      const p = this.db.profiles[d.beneficiaryUid];
      p.raised = (p.raised || 0) + Number(d.amount || 0);
      p.donorsCount = (p.donorsCount || 0) + 1;
      await this.addTimeline(d.beneficiaryUid, { type: 'donation', amount: Number(d.amount || 0) });
      this._save();
    }
  }

  // ----------------------------------------------------------
  // FIREBASE (produção)
  // ----------------------------------------------------------
  const FB_VER = '10.12.2';
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = () => reject(new AppError('offline'));
      document.head.appendChild(s);
    });
  }
  function mapFbError(e) {
    const c = (e && e.code) || '';
    if (c === 'auth/email-already-in-use') return new AppError('email_in_use');
    if (c === 'auth/weak-password') return new AppError('weak_password');
    if (c === 'auth/invalid-email') return new AppError('bad_email');
    if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials'].includes(c)) return new AppError('bad_login');
    if (c === 'permission-denied') return new AppError('no_permission');
    if (e instanceof AppError) return e;
    console.error(e);
    return new AppError('generic');
  }
  const wrap = (fn) => async function (...args) {
    try { return await fn.apply(this, args); } catch (e) { throw mapFbError(e); }
  };

  class FirebaseStore {
    constructor(cfg) { this.cfg = cfg; this.mode = 'firebase'; this.listeners = []; this.user = null; }

    async init() {
      const base = 'https://www.gstatic.com/firebasejs/' + FB_VER + '/';
      for (const m of ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-firestore-compat.js']) {
        await loadScript(base + m);
      }
      firebase.initializeApp(this.cfg);
      this.auth = firebase.auth();
      this.fs = firebase.firestore();
      try { await this.auth.getRedirectResult(); } catch (e) {}
      await new Promise((resolve) => {
        let first = true;
        this.auth.onAuthStateChanged(async (u) => {
          await this._load(u);
          if (first) { first = false; resolve(); }
        });
      });
    }
    async _load(u) {
      if (!u) { this.user = null; }
      else {
        let doc = null;
        try { doc = await this.fs.collection('users').doc(u.uid).get(); } catch (e) {}
        this.user = Object.assign({ uid: u.uid, email: u.email, name: u.displayName || '', role: null }, doc && doc.exists ? doc.data() : {});
      }
      this.listeners.forEach((f) => f(this.user));
    }
    onAuth(cb) { this.listeners.push(cb); cb(this.user); }
    currentUser() { return this.user; }
    async demoSignIn() { throw new AppError('generic'); }
    async resetDemo() {}
    async signOut() { await this.auth.signOut(); }

    async listProfiles(status) {
      let q = this.fs.collection('profiles');
      if (status) q = q.where('status', '==', status);
      const s = await q.get();
      return s.docs.map((d) => d.data()).sort(byDateDesc);
    }
    async getProfile(uid) {
      try { const d = await this.fs.collection('profiles').doc(uid).get(); return d.exists ? d.data() : null; }
      catch (e) { return null; }
    }
    async listProofs(uid) {
      try {
        const s = await this.fs.collection('profiles').doc(uid).collection('proofs').get();
        return s.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort(byDateDesc);
      } catch (e) {
        // sem permissão para os restritos: tenta só os públicos
        try {
          const s = await this.fs.collection('profiles').doc(uid).collection('proofs').where('visibility', '==', 'public').get();
          return s.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort(byDateDesc);
        } catch (e2) { return []; }
      }
    }
    async listTimeline(uid) {
      try {
        const s = await this.fs.collection('profiles').doc(uid).collection('timeline').get();
        return s.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort(byDateDesc);
      } catch (e) { return []; }
    }
    async getUser(uid) {
      const d = await this.fs.collection('users').doc(uid).get();
      return d.exists ? Object.assign({ uid }, d.data()) : null;
    }
  }

  // métodos que podem falhar com erros do Firebase
  Object.assign(FirebaseStore.prototype, {
    signUp: wrap(async function (email, pass, name, role) {
      const cred = await this.auth.createUserWithEmailAndPassword(email.trim(), pass);
      await cred.user.updateProfile({ displayName: name });
      await this.fs.collection('users').doc(cred.user.uid).set({ name, email: email.trim().toLowerCase(), role, createdAt: now() });
      await this._load(cred.user);
    }),
    signIn: wrap(async function (email, pass) {
      await this.auth.signInWithEmailAndPassword(email.trim(), pass);
    }),
    signInGoogle: wrap(async function () {
      const provider = new firebase.auth.GoogleAuthProvider();
      try { await this.auth.signInWithPopup(provider); }
      catch (e) {
        if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) await this.auth.signInWithRedirect(provider);
        else throw e;
      }
    }),
    updateUser: wrap(async function (uid, data) {
      await this.fs.collection('users').doc(uid).set(data, { merge: true });
      if (this.user && uid === this.user.uid) await this._load(this.auth.currentUser);
    }),
    isAdmin: async function (uid) {
      if (!uid) return false;
      try { const d = await this.fs.collection('admins').doc(uid).get(); return d.exists; } catch (e) { return false; }
    },
    saveProfile: wrap(async function (uid, data) {
      const ref = this.fs.collection('profiles').doc(uid);
      const d = await ref.get();
      if (d.exists) await ref.update(data);
      else await ref.set(Object.assign({ uid, status: 'pending', raised: 0, donorsCount: 0, givesBack: false, createdAt: now() }, data));
    }),
    setProfileStatus: wrap(async function (uid, status) {
      await this.fs.collection('profiles').doc(uid).update({ status, reviewedAt: now() });
      if (status === 'verified') await this.fs.collection('profiles').doc(uid).collection('timeline').add({ type: 'verified', createdAt: now() });
    }),
    addProof: wrap(async function (uid, file, meta) {
      const f = await prepareFile(file);
      const link = cleanLink(meta && meta.link);
      if (!f && !link) throw new AppError('need_file_or_link');
      await this.fs.collection('profiles').doc(uid).collection('proofs').add(Object.assign({ kind: f ? f.kind : 'link', url: f ? f.url : null, fileName: f ? f.fileName : null, createdAt: now() }, meta, { link: link || null }));
    }),
    deleteProof: wrap(async function (uid, id) {
      const ref = this.fs.collection('profiles').doc(uid).collection('proofs').doc(id);
      await ref.delete();
    }),
    addTimeline: wrap(async function (uid, entry, file) {
      const f = await prepareFile(file);
      const link = cleanLink(entry && entry.link);
      await this.fs.collection('profiles').doc(uid).collection('timeline').add(Object.assign({ createdAt: now(), url: f ? f.url : null, kind: f ? f.kind : (link ? 'link' : null) }, entry, { link: link || null }));
    }),
    createDonation: wrap(async function (data, file) {
      const f = await prepareFile(file);
      await this.fs.collection('donations').add(Object.assign({ status: 'pending', createdAt: now(), receiptUrl: f ? f.url : null }, data));
    }),
    listDonationsFor: wrap(async function (uid) {
      const s = await this.fs.collection('donations').where('beneficiaryUid', '==', uid).get();
      return s.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort(byDateDesc);
    }),
    listMyDonations: wrap(async function (uid) {
      const s = await this.fs.collection('donations').where('donorUid', '==', uid).get();
      return s.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort(byDateDesc);
    }),
    confirmDonation: wrap(async function (id) {
      const dRef = this.fs.collection('donations').doc(id);
      let info = null;
      await this.fs.runTransaction(async (tx) => {
        const d = await tx.get(dRef);
        if (!d.exists || d.data().status !== 'pending') return;
        const data = d.data();
        const pRef = this.fs.collection('profiles').doc(data.beneficiaryUid);
        const p = await tx.get(pRef);
        tx.update(dRef, { status: 'confirmed', confirmedAt: now() });
        tx.update(pRef, {
          raised: (p.data().raised || 0) + Number(data.amount || 0),
          donorsCount: (p.data().donorsCount || 0) + 1
        });
        info = data;
      });
      if (info) await this.fs.collection('profiles').doc(info.beneficiaryUid).collection('timeline').add({ type: 'donation', amount: Number(info.amount || 0), createdAt: now() });
    })
  });

  window.AppError = AppError;
  window.createStore = function () {
    return window.FIREBASE_CONFIG ? new FirebaseStore(window.FIREBASE_CONFIG) : new LocalStore();
  };
})();
