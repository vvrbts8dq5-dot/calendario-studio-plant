// ══════════════════════════════════════════════════════════════════════
// not spannometrica — inizializzazione: login, scelta disciplina, avvio/arresto moduli.
// ══════════════════════════════════════════════════════════════════════

const FC = {
  apiKey: "AIzaSyAV-jcGWWTTcD3h0lVDl0e8mI_9iy1zN1I",
  authDomain: "computo-app-220af.firebaseapp.com",
  projectId: "computo-app-220af",
  storageBucket: "computo-app-220af.firebasestorage.app",
  messagingSenderId: "572996089308",
  appId: "1:572996089308:web:2fc210167b28f463c04b19"
};
firebase.initializeApp(FC);
const auth = firebase.auth();
const db = firebase.firestore();
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(e => console.log('Persistenza auth:', e.message));

// ─── Emulatore locale (Auth + Firestore) ───────────────────────────────
// Quando l'app gira su localhost/127.0.0.1 (es. `python3 -m http.server`,
// vedi README §3), la colleghiamo automaticamente all'Emulator Suite di
// Firebase invece che al progetto vero — così importare/testare i
// prezzari in locale non consuma MAI la quota giornaliera reale (20.000
// scritture/giorno sul piano gratuito Spark, il limite che si sfora
// facilmente importando un prezzario DEI/Veneto da decine di migliaia di
// righe). In produzione (Firebase Hosting) questo blocco non scatta mai:
// l'app continua a parlare con Firestore vero esattamente come prima.
//
// Serve avviare l'emulatore una volta con `firebase emulators:start`
// (richiede firebase-tools, vedi README §3bis) — se non è in esecuzione,
// il collegamento fallisce silenziosamente e le chiamate a Firestore
// restituiranno solo errori di rete, NON scriveranno mai per sbaglio sul
// progetto reale: i due ambienti (locale ed emulatore) sono completamente
// separati, non c'è nessun modo che l'uno scriva per errore sull'altro.
const USA_EMULATORE = ['localhost', '127.0.0.1'].includes(location.hostname);
if (USA_EMULATORE) {
  auth.useEmulator('http://127.0.0.1:9099', { disableWarnings: true });
  db.useEmulator('127.0.0.1', 8080);
  console.log('[emulatore] Collegato a Firestore+Auth locali — nessuna scrittura tocca il progetto reale. Avvia con: firebase emulators:start');

  // Banner ben visibile: sull'emulatore Auth NON esistono gli utenti veri
  // del progetto (vanno ricreati lì, vedi README) e i dati NON sono quelli
  // di produzione — meglio che sia ovvio a colpo d'occhio, per non
  // confondersi mentre si testano import/cancellazioni massicce.
  const banner = document.createElement('div');
  banner.textContent = '🧪 EMULATORE LOCALE — dati e utenti separati dal progetto reale';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#F59E0B;color:#141414;font:600 12px/1 monospace;text-align:center;padding:6px;letter-spacing:.03em';
  document.addEventListener('DOMContentLoaded', () => document.body.prepend(banner));
  if (document.readyState !== 'loading') document.body.prepend(banner);
}

let CURRENT_USER = null;
let APP_STARTED = false;
let DISCIPLINA_ATTIVA = null;

// ─── Modale di scelta (sostituisce i doppi confirm() ambigui) ───
// Ritorna una Promise che risolve con il valore (data-scelta) del bottone
// cliccato, o null se l'utente chiude cliccando fuori dal box.
function chiediScelta({ titolo, corpo, bottoni }) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-titolo">${escapeHtml(titolo || '')}</div>
        <div class="modal-corpo">${escapeHtml(corpo || '')}</div>
        <div class="modal-azioni">
          ${bottoni.map(b => `<button class="btn ${b.classe || ''}" data-scelta="${escapeHtml(b.valore)}">${escapeHtml(b.testo)}</button>`).join('')}
        </div>
      </div>`;
    document.body.appendChild(overlay);

    function chiudi(valore) {
      overlay.remove();
      resolve(valore);
    }
    overlay.addEventListener('click', e => {
      if (e.target === overlay) chiudi(null);
    });
    overlay.querySelectorAll('[data-scelta]').forEach(btn => {
      btn.addEventListener('click', () => chiudi(btn.dataset.scelta));
    });
  });
}

// ─── Login ───
document.getElementById('btn-login').addEventListener('click', fai_login);
document.getElementById('inp-pass').addEventListener('keydown', e => { if (e.key === 'Enter') fai_login(); });

function fai_login() {
  const email = document.getElementById('inp-user').value.trim().toLowerCase();
  const pass = document.getElementById('inp-pass').value;
  const errBox = document.getElementById('login-error');
  errBox.style.display = 'none';
  if (!email || !pass) return;
  auth.signInWithEmailAndPassword(email, pass).catch(err => {
    const codiciCredenzialiErrate = ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'];
    errBox.textContent = codiciCredenzialiErrate.includes(err.code)
      ? 'Email o password errati.'
      : 'Errore di accesso (' + err.code + '): ' + err.message;
    errBox.style.display = 'block';
  });
}

document.getElementById('btn-logout').addEventListener('click', () => {
  fermaModuli();
  auth.signOut();
});

auth.onAuthStateChanged(user => {
  if (user) {
    CURRENT_USER = user;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('user-email').textContent = user.email || '';
    mostraSchermataDisciplina();
  } else {
    CURRENT_USER = null;
    APP_STARTED = false;
    DISCIPLINA_ATTIVA = null;
    document.getElementById('app').classList.remove('visible');
    document.getElementById('disciplina-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
  }
});

// ─── Schermata scelta disciplina ───
function mostraSchermataDisciplina() {
  document.getElementById('app').classList.remove('visible');
  document.getElementById('app').classList.remove('sidebar-nascosta');
  document.getElementById('disciplina-screen').style.display = 'flex';
}

document.querySelectorAll('.disciplina-btn').forEach(btn => {
  btn.addEventListener('click', () => scegliDisciplina(btn.dataset.disciplina));
});

function scegliDisciplina(disciplina) {
  DISCIPLINA_ATTIVA = disciplina;
  document.body.dataset.disciplina = disciplina;
  document.getElementById('disciplina-screen').style.display = 'none';
  document.getElementById('app').classList.add('visible');
  aggiornaBadgeDisciplina(disciplina);
  aggiornaEtichettaComputoMenu(disciplina);
  _aggiornaIconaToggleSidebar();
  avviaModuli(disciplina);
}

function aggiornaBadgeDisciplina(disciplina) {
  const badge = document.getElementById('disciplina-badge');
  badge.textContent = disciplina === 'elettrico' ? 'ELETTRICO' : 'MECCANICO';
  badge.className = 'disciplina-badge';
}

// ─── Diciannovesima tornata: etichetta del menù "Computo" per disciplina ───
// Richiesta esplicita di Giovanni: SOLO l'etichetta mostrata cambia (voce di
// menù, titolo della topbar, titolo della pagina stessa) — la collezione
// Firestore sottostante resta 'computo_elettrico'/'computo_meccanico' come
// sempre (vedi computo_module.js), così nessun dato esistente va toccato o
// migrato.
function _etichettaComputoMenu(disciplina) {
  const d = disciplina || DISCIPLINA_ATTIVA;
  return d === 'meccanico' ? 'VOCI IMPIANTI MEC' : 'VOCI PLANT ELE';
}
function aggiornaEtichettaComputoMenu(disciplina) {
  const voce = document.querySelector('.nav-item[data-page="computo"]');
  if (voce) voce.textContent = _etichettaComputoMenu(disciplina);
}

function avviaModuli(disciplina) {
  // Computo e i due Prezzari sono magazzini indipendenti (consultazione /
  // import / aggiunta manuale): si avviano tutti allo stesso modo.
  initComputo('page-computo', disciplina);
  initPrezzario('dei', 'page-dei', 'prezzario_dei_' + disciplina, 'Prezzario DEI');
  initPrezzario('veneto', 'page-veneto', 'prezzario_veneto_' + disciplina, 'Prezzario Regione Veneto');
  // Analisi Prezzi: quarto magazzino, ma senza edizioni (lista piatta di
  // "voci" già pronte, ciascuna costruita componendo righe prese dagli
  // altri tre magazzini o inserite a mano — vedi analisi_prezzi_module.js).
  initAnalisiPrezzi('page-analisi-prezzi', disciplina);
  // Progetti è l'unica sezione operativa: schermo diviso con area di
  // lavoro a sinistra e i quattro magazzini selezionabili a destra.
  initProgetti('page-progetti', disciplina);
  vaiAllaPagina('progetti');
}

function fermaModuli() {
  if (typeof resetComputoModulo === 'function') resetComputoModulo();
  if (typeof resetPrezzarioModulo === 'function') {
    resetPrezzarioModulo('dei');
    resetPrezzarioModulo('veneto');
  }
  if (typeof resetAnalisiPrezziModulo === 'function') resetAnalisiPrezziModulo();
  if (typeof resetProgettiModulo === 'function') resetProgettiModulo();
  DISCIPLINA_ATTIVA = null;
  document.body.removeAttribute('data-disciplina');
}

document.getElementById('btn-cambia-disciplina').addEventListener('click', () => {
  fermaModuli();
  mostraSchermataDisciplina();
});

// ─── Navigazione tra pagine ───
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => vaiAllaPagina(btn.dataset.page));
});

const TITOLI_PAGINA = {
  computo: 'Computo',
  progetti: 'Progetti',
  veneto: 'Prezzario Regione Veneto',
  dei: 'Prezzario DEI',
  'analisi-prezzi': 'Analisi Prezzi'
};

function vaiAllaPagina(pagina) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === pagina));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + pagina));
  document.getElementById('topbar-title').textContent = pagina === 'computo' ? _etichettaComputoMenu() : (TITOLI_PAGINA[pagina] || '');
}

// ─── Sidebar comprimibile — nascosta automaticamente all'apertura di un
// progetto (vedi progetti_module.js: apriProgetto/chiudiProgetto) per dare
// più spazio orizzontale allo schermo diviso; il pulsante nella topbar la
// fa ricomparire in qualsiasi momento senza uscire dal progetto. Se in
// quel momento è aperto lo schermo diviso, ricalcoliamo anche l'altezza
// (il layout può spostarsi leggermente quando la sidebar appare/scompare).
//
// Diciannovesima tornata: prima il pulsante era "fixed" in overlay sopra al
// contenuto e compariva SOLO quando la sidebar era già nascosta (segnalato
// da Giovanni: si sovrapponeva al titolo "Progetti" e, appena la sidebar
// veniva riaperta, il pulsante spariva del tutto — "non rimane il
// pulsante"). Ora il pulsante vive stabilmente dentro la topbar (mai in
// overlay) e resta SEMPRE presente: cambia solo icona/titolo a seconda
// dello stato — vedi _aggiornaIconaToggleSidebar, chiamata da entrambe le
// funzioni sotto e da toggleSidebarApp.
function nascondiSidebarApp() {
  document.getElementById('app').classList.add('sidebar-nascosta');
  _aggiornaIconaToggleSidebar();
  if (typeof _fissaAltezzaSplitScreen === 'function') requestAnimationFrame(_fissaAltezzaSplitScreen);
}
function mostraSidebar() {
  document.getElementById('app').classList.remove('sidebar-nascosta');
  _aggiornaIconaToggleSidebar();
  if (typeof _fissaAltezzaSplitScreen === 'function') requestAnimationFrame(_fissaAltezzaSplitScreen);
}
function toggleSidebarApp() {
  const nascosta = document.getElementById('app').classList.contains('sidebar-nascosta');
  if (nascosta) mostraSidebar(); else nascondiSidebarApp();
}
function _aggiornaIconaToggleSidebar() {
  const btn = document.getElementById('btn-toggle-sidebar');
  if (!btn) return;
  const nascosta = document.getElementById('app').classList.contains('sidebar-nascosta');
  btn.textContent = nascosta ? '→' : '✕';
  btn.title = nascosta ? 'Mostra il menu' : 'Nascondi il menu';
}
