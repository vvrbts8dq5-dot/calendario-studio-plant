// ══════════════════════════════════════════════════════════════════════
// PROGETTI — l'unica sezione operativa dell'app.
//
// - Lista progetti: crea (solo nome) ed elimina singolarmente ciascun
//   progetto.
// - Apri un progetto → schermata divisa in due, con scorrimento
//   INDIPENDENTE tra i due pannelli (vedi _fissaAltezzaSplitScreen):
//     SINISTRA = area di lavoro del progetto: l'elenco (piatto) delle voci
//                che hai deciso di usare, con quantità modificabile e,
//                se la voce viene da un prezzario, prezzo/totale. Il tasto
//                "✎ Modifica" permette di correggere codice/descrizione/UM
//                delle voci SOLO in questa copia locale del progetto: non
//                tocca mai la voce originale nel magazzino di provenienza.
//     DESTRA   = selettore di provenienza (Computo / Prezzario DEI /
//                Prezzario Regione Veneto): sfogli l'albero del magazzino
//                scelto e premi "+ Aggiungi" su una voce (o su un intero
//                capitolo/sottocapitolo, "voce madre") per copiarla
//                nell'area di lavoro a sinistra.
//
// Collezione per-disciplina: 'progetti_elettrico' / 'progetti_meccanico',
// ciascun documento-progetto con sottocollezione 'voci' (le voci proprie
// del progetto, NON quelle del magazzino di provenienza).
// ══════════════════════════════════════════════════════════════════════

const PROGETTI_STATE = {
  disciplina: null,
  collName: null,
  lista: [],
  unsubLista: null,
  progettoAttivo: null,   // { id, nome }
  voci: [],               // voci del progetto aperto (area di lavoro)
  unsubVoci: null,
  ricercaSinistra: '',
  modificaAttiva: false,  // modalità modifica inline dell'area di lavoro (solo locale al progetto)
  fonteDestra: 'computo',  // 'computo' | 'dei' | 'veneto'
  ricercaDestra: '',
  espansiDestra: new Set(),
  // I prezzari (dei/veneto) sono organizzati in edizioni (vedi
  // prezzario_module.js): qui teniamo traccia di quale edizione stiamo
  // sfogliando per ciascuna delle due fonti, indipendentemente da quale
  // edizione sia eventualmente aperta nella pagina Prezzario stessa.
  edizioneDestraSelezionata: { dei: null, veneto: null, analisi: null }, // { id, nome } o null
  vociEdizioneDestra: [],
  // Diciottesima tornata: cronologia per l'Annulla (Ctrl+Z) dell'area di
  // lavoro — pila di azioni { etichetta, inversi: [...] }, una per ogni
  // operazione dell'utente (anche quando genera più scritture, come "+
  // Aggiungi" che aggancia anche gli antenati: un solo Ctrl+Z le annulla
  // tutte insieme). Vedi _registraAzioneUndo/annullaUltimaModificaProgetto.
  cronologiaUndo: [],
};
let _pageIdProgetti = 'page-progetti';
let _resizeListenerSplitScreenAttivo = false;
let _undoKeyListenerAttivo = false;
const _UNDO_MAX_AZIONI = 20;

function initProgetti(pageId, disciplina) {
  _pageIdProgetti = pageId;
  PROGETTI_STATE.disciplina = disciplina;
  PROGETTI_STATE.collName = 'progetti_' + disciplina;
  PROGETTI_STATE.lista = [];
  PROGETTI_STATE.progettoAttivo = null;
  PROGETTI_STATE.voci = [];
  PROGETTI_STATE.ricercaSinistra = '';
  PROGETTI_STATE.modificaAttiva = false;
  PROGETTI_STATE.fonteDestra = 'computo';
  PROGETTI_STATE.ricercaDestra = '';
  PROGETTI_STATE.espansiDestra = new Set();
  PROGETTI_STATE.edizioneDestraSelezionata = { dei: null, veneto: null, analisi: null };
  PROGETTI_STATE.vociEdizioneDestra = [];
  PROGETTI_STATE.cronologiaUndo = [];

  // Scorciatoia da tastiera Ctrl+Z (Cmd+Z su Mac) per annullaUltimaModificaProgetto
  // — registrata una sola volta. Non interviene mentre il focus è su un
  // input/textarea: lì resta l'undo nativo del browser sul testo digitato,
  // che non deve essere rubato.
  if (!_undoKeyListenerAttivo) {
    document.addEventListener('keydown', e => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
      if (e.key !== 'z' && e.key !== 'Z') return;
      if (!PROGETTI_STATE.progettoAttivo) return;
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      annullaUltimaModificaProgetto();
    });
    _undoKeyListenerAttivo = true;
  }

  PROGETTI_STATE.unsubLista = db.collection(PROGETTI_STATE.collName).onSnapshot(snap => {
    PROGETTI_STATE.lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    PROGETTI_STATE.lista.sort((a, b) => (b.creatoIl || 0) - (a.creatoIl || 0));
    renderProgetti();
  }, err => {
    console.error('Errore caricamento progetti:', err.message);
    const page = document.getElementById(_pageIdProgetti);
    if (page) page.innerHTML = `<div class="empty-state">Errore: ${escapeHtml(err.message)}</div>`;
  });

  renderProgetti();
}

function resetProgettiModulo() {
  if (PROGETTI_STATE.unsubLista) { PROGETTI_STATE.unsubLista(); PROGETTI_STATE.unsubLista = null; }
  if (PROGETTI_STATE.unsubVoci) { PROGETTI_STATE.unsubVoci(); PROGETTI_STATE.unsubVoci = null; }
  PROGETTI_STATE.edizioneDestraSelezionata = { dei: null, veneto: null, analisi: null };
  PROGETTI_STATE.vociEdizioneDestra = [];
  PROGETTI_STATE.disciplina = null;
  PROGETTI_STATE.collName = null;
  PROGETTI_STATE.lista = [];
  PROGETTI_STATE.progettoAttivo = null;
  PROGETTI_STATE.voci = [];
}

// ─── Vista principale: instrada tra lista progetti e split-screen ───
function renderProgetti() {
  if (PROGETTI_STATE.progettoAttivo) renderProgettoAperto();
  else renderListaProgetti();
}

// ─── Lista progetti ───
function renderListaProgetti() {
  const page = document.getElementById(_pageIdProgetti);
  if (!page) return;

  page.innerHTML = `
    <div class="page-header">
      <div class="page-title">Progetti</div>
    </div>

    <div class="card" style="margin-bottom:18px">
      <div class="form-row" style="margin-bottom:0">
        <input id="nuovo-progetto-nome" placeholder="Nome del nuovo progetto (es. Cantiere Via Roma 12)" style="flex:1;min-width:240px">
        <button class="btn btn-blu" onclick="creaProgetto()">+ Crea progetto</button>
        <input type="file" id="progetti-xpwe-input" accept=".xpwe,.xml" style="display:none">
        <button class="btn btn-sm" onclick="document.getElementById('progetti-xpwe-input').click()">⬆ Importa XPWE</button>
      </div>
    </div>

    <div id="progetti-lista-wrap">
      ${PROGETTI_STATE.lista.length ? '' : '<div class="empty-state">Non hai ancora nessun progetto. Creane uno qui sopra.</div>'}
      ${PROGETTI_STATE.lista.map(p => `
        <div class="progetto-riga">
          <div class="progetto-riga-nome" onclick="apriProgetto('${p.id}')">${escapeHtml(p.nome)} ${_etichettaTipoProgetto(p.tipo)} ${p.modello ? '<span class="tipo-badge tipo-badge-modello">★ Modello</span>' : ''}</div>
          <div class="progetto-riga-azioni">
            <button class="btn btn-sm" onclick="apriProgetto('${p.id}')">Apri →</button>
            <button class="btn btn-sm" onclick="toggleModelloProgetto('${p.id}', ${!!p.modello})">${p.modello ? '☆ Togli da modelli' : '★ Rendi modello'}</button>
            <button class="btn btn-sm btn-rosso" onclick="eliminaProgetto('${p.id}', '${escapeHtml(p.nome).replace(/'/g, "\\'")}')">Elimina</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  const inp = document.getElementById('nuovo-progetto-nome');
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') creaProgetto(); });

  document.getElementById('progetti-xpwe-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) importaProgettoXPWE(file);
    e.target.value = '';
  });
}

async function creaProgetto() {
  const inp = document.getElementById('nuovo-progetto-nome');
  const nome = inp.value.trim();
  if (!nome) { alert('Inserisci un nome per il progetto.'); return; }

  // Diciottesima tornata: progetti modello — qualsiasi progetto può essere
  // reso "modello" (vedi toggleModelloProgetto qui sotto) e riproposto qui
  // come punto di partenza per uno nuovo, invece di partire da zero. Se si
  // parte da un modello, pubblico/privato NON si chiede più: si eredita
  // automaticamente da quello (le voci che verranno copiate appartengono
  // già a fonti coerenti solo con quel tipo, vedi _fontiConsentiteProgetto —
  // chiederlo di nuovo potrebbe creare un progetto con voci "vietate" per il
  // proprio tipo).
  const modelliDisponibili = PROGETTI_STATE.lista.filter(p => p.modello);
  let modelloScelto = null;
  if (modelliDisponibili.length) {
    const sceltaModello = await chiediScelta({
      titolo: 'Partire da zero o da un modello?',
      corpo: 'Puoi partire da un progetto vuoto oppure copiare tutte le voci di uno dei modelli salvati.',
      bottoni: [
        { valore: 'annulla', testo: 'Annulla' },
        { valore: 'zero', testo: 'Parti da zero', classe: 'btn-blu' },
        ...modelliDisponibili.map(m => ({ valore: m.id, testo: '★ ' + m.nome })),
      ]
    });
    if (!sceltaModello || sceltaModello === 'annulla') return;
    if (sceltaModello !== 'zero') modelloScelto = modelliDisponibili.find(m => m.id === sceltaModello) || null;
  }

  // Diciottesima tornata: prima cosa da scegliere alla creazione (se non si
  // parte da un modello — vedi sopra), se non si sceglie non si crea nulla —
  // scelta PERMANENTE, non più modificabile in seguito (vedi
  // _fontiConsentiteProgetto/renderProgettoAperto, che filtrano le schede
  // "Prendi voci da..." in base a questa).
  let tipo;
  if (modelloScelto) {
    tipo = modelloScelto.tipo || null;
  } else {
    tipo = await chiediScelta({
      titolo: 'Progetto pubblico o privato?',
      corpo: 'Scelta permanente: non si potrà più cambiare dopo la creazione.\n\n' +
        '• Privato → nell\'area di lavoro si potranno usare solo le voci del Computo.\n' +
        '• Pubblico → si potranno usare solo le voci dei Prezzari (DEI/Veneto) e di Analisi Prezzi.',
      bottoni: [
        { valore: 'annulla', testo: 'Annulla' },
        { valore: 'privato', testo: 'Privato', classe: 'btn-blu' },
        { valore: 'pubblico', testo: 'Pubblico', classe: 'btn-blu' },
      ]
    });
    if (tipo !== 'privato' && tipo !== 'pubblico') return;
  }

  try {
    const nuovoRef = await db.collection(PROGETTI_STATE.collName).add({
      nome,
      tipo,
      modello: false,
      creatoDa: (CURRENT_USER && CURRENT_USER.email) || '',
      creatoIl: Date.now(),
    });
    if (modelloScelto) await _copiaVociDaModelloProgetto(modelloScelto.id, nuovoRef.id);
    inp.value = '';
  } catch (e) {
    alert('Errore nella creazione del progetto: ' + e.message);
  }
}

// Copia (non collegata: una vera copia indipendente, non un riferimento
// vivo) tutte le voci di un progetto modello nel nuovo progetto appena
// creato — stesso limite di 450 scritture per batch già usato altrove nel
// modulo (vedi eliminaProgetto) per restare nella quota giornaliera del
// piano gratuito Firebase anche con progetti modello molto grandi.
async function _copiaVociDaModelloProgetto(modelloId, nuovoProgettoId) {
  const snap = await db.collection(PROGETTI_STATE.collName).doc(modelloId).collection('voci').get();
  if (snap.empty) return;
  const CHUNK = 450;
  const docs = snap.docs;
  const collRifNuovo = db.collection(PROGETTI_STATE.collName).doc(nuovoProgettoId).collection('voci');
  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = db.batch();
    docs.slice(i, i + CHUNK).forEach(d => batch.set(collRifNuovo.doc(), d.data()));
    await batch.commit();
  }
}

// "Qualsiasi progetto può diventare modello": non crea nulla di nuovo, si
// limita a marcare/smarcare il progetto stesso (che resta un progetto vero e
// proprio, utilizzabile come sempre) come disponibile nella scelta "Parti da
// un modello" qui sopra.
async function toggleModelloProgetto(id, statoAttuale) {
  try {
    await db.collection(PROGETTI_STATE.collName).doc(id).update({ modello: !statoAttuale });
  } catch (e) {
    alert('Errore nell\'aggiornamento: ' + e.message);
  }
}

async function eliminaProgetto(id, nome) {
  const scelta = await chiediScelta({
    titolo: 'Eliminare il progetto?',
    corpo: `Stai per eliminare definitivamente il progetto "${nome}" e tutte le voci della sua area di lavoro. Non è annullabile.`,
    bottoni: [
      { valore: 'annulla', testo: 'Annulla' },
      { valore: 'conferma', testo: 'Elimina progetto', classe: 'btn-rosso' }
    ]
  });
  if (scelta !== 'conferma') return;

  try {
    const vociSnap = await db.collection(PROGETTI_STATE.collName).doc(id).collection('voci').get();
    if (!vociSnap.empty) {
      const CHUNK = 450;
      const docs = vociSnap.docs;
      for (let i = 0; i < docs.length; i += CHUNK) {
        const batch = db.batch();
        docs.slice(i, i + CHUNK).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
    await db.collection(PROGETTI_STATE.collName).doc(id).delete();
  } catch (e) {
    alert('Errore nell\'eliminazione del progetto: ' + e.message);
  }
}

// ─── Apertura progetto: split-screen ───
function apriProgetto(id) {
  const progetto = PROGETTI_STATE.lista.find(p => p.id === id);
  if (!progetto) return;
  PROGETTI_STATE.progettoAttivo = { id: progetto.id, nome: progetto.nome, tipo: progetto.tipo || null };
  PROGETTI_STATE.cronologiaUndo = [];
  PROGETTI_STATE.voci = [];
  PROGETTI_STATE.ricercaSinistra = '';
  PROGETTI_STATE.modificaAttiva = false;
  // Privato → si parte (e si resta) sul Computo; pubblico → si parte dal
  // DEI (il Computo non è tra le schede consentite, vedi
  // _fontiConsentiteProgetto); i progetti "vecchi" senza tipo restano senza
  // restrizioni e partono dal Computo come già succedeva prima di questa
  // funzionalità.
  PROGETTI_STATE.fonteDestra = PROGETTI_STATE.progettoAttivo.tipo === 'pubblico' ? 'dei' : 'computo';
  PROGETTI_STATE.ricercaDestra = '';
  PROGETTI_STATE.espansiDestra = new Set();

  if (PROGETTI_STATE.unsubVoci) { PROGETTI_STATE.unsubVoci(); PROGETTI_STATE.unsubVoci = null; }
  PROGETTI_STATE.unsubVoci = db.collection(PROGETTI_STATE.collName).doc(id).collection('voci')
    .onSnapshot(snap => {
      PROGETTI_STATE.voci = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      PROGETTI_STATE.voci.sort((a, b) => (a.ordine || 0) - (b.ordine || 0));
      renderAreaLavoro();
    }, err => {
      console.error('Errore caricamento voci progetto:', err.message);
    });

  renderProgettoAperto();
  // Più spazio orizzontale per lo schermo diviso: la sidebar sparisce
  // finché non premi la freccia in alto a sinistra per farla ricomparire.
  if (typeof nascondiSidebarApp === 'function') nascondiSidebarApp();
}

function chiudiProgetto() {
  if (PROGETTI_STATE.unsubVoci) { PROGETTI_STATE.unsubVoci(); PROGETTI_STATE.unsubVoci = null; }
  PROGETTI_STATE.progettoAttivo = null;
  PROGETTI_STATE.voci = [];
  PROGETTI_STATE.cronologiaUndo = [];
  renderListaProgetti();
  if (typeof mostraSidebar === 'function') mostraSidebar();
}

// ─── Annulla ultima modifica (Ctrl+Z / freccia "↶ Annulla") ───
//
// Copre gli "errori umani" più comuni nell'area di lavoro: aggiunta di una
// voce sbagliata (dal pannello destro o manuale), aggiunta di un capitolo,
// eliminazione di una voce, modifica di un campo o della quantità — ognuna
// di queste operazioni registra qui la propria azione inversa PRIMA (per le
// eliminazioni/modifiche, leggendo il valore precedente da PROGETTI_STATE.voci
// — già in memoria grazie all'onSnapshot, nessuna lettura extra da
// Firestore) o DOPO (per le aggiunte, una volta noto l'id assegnato) di
// scrivere su Firestore. NON copre "Cancella tutto" né l'eliminazione
// dell'intero progetto: quelle restano deliberatamente irreversibili,
// gated da una conferma esplicita che lo dichiara ("Non è annullabile").
//
// Ogni azione può contenere più scritture inverse (es. "+ Aggiungi" che
// aggancia anche gli antenati): un solo Ctrl+Z le annulla tutte insieme, in
// un unico batch atomico.
function _registraAzioneUndo(etichetta, inversi) {
  if (!inversi || !inversi.length) return;
  PROGETTI_STATE.cronologiaUndo.push({ etichetta, inversi });
  if (PROGETTI_STATE.cronologiaUndo.length > _UNDO_MAX_AZIONI) PROGETTI_STATE.cronologiaUndo.shift();
  _aggiornaStatoBottoneUndo();
}

function _aggiornaStatoBottoneUndo() {
  const btn = document.getElementById('btn-annulla-progetto');
  if (!btn) return;
  const azione = PROGETTI_STATE.cronologiaUndo[PROGETTI_STATE.cronologiaUndo.length - 1];
  btn.disabled = !azione;
  btn.title = azione ? `Annulla: ${azione.etichetta} (Ctrl+Z)` : 'Niente da annullare';
}

async function annullaUltimaModificaProgetto() {
  if (!PROGETTI_STATE.progettoAttivo || !PROGETTI_STATE.cronologiaUndo.length) return;
  const azione = PROGETTI_STATE.cronologiaUndo.pop();
  _aggiornaStatoBottoneUndo();
  try {
    const collRif = db.collection(PROGETTI_STATE.collName).doc(PROGETTI_STATE.progettoAttivo.id).collection('voci');
    const batch = db.batch();
    azione.inversi.forEach(inv => {
      if (inv.tipo === 'elimina') batch.delete(collRif.doc(inv.id));
      else if (inv.tipo === 'ripristina') batch.set(collRif.doc(inv.id), inv.dato);
      else if (inv.tipo === 'campo') batch.update(collRif.doc(inv.id), { [inv.campo]: inv.valorePrecedente });
    });
    await batch.commit();
  } catch (e) {
    alert('Errore durante l\'annullamento: ' + e.message);
    // Il tentativo non è andato a buon fine: l'azione non è stata annullata
    // davvero, quindi torna in cima alla pila per poterla riprovare.
    PROGETTI_STATE.cronologiaUndo.push(azione);
    _aggiornaStatoBottoneUndo();
  }
}

const FONTI_LABEL = { computo: 'Computo', dei: 'Prezzario DEI', veneto: 'Prezzario Veneto', analisi: 'Analisi Prezzi', manuale: 'Manuale' };

// Diciottesima tornata: un progetto è "privato" (solo voci di Computo) o
// "pubblico" (solo voci di tutti i prezzari e di Analisi Prezzi) — scelta
// fatta UNA VOLTA alla creazione (vedi creaProgetto) e mai più modificabile.
// I progetti creati PRIMA di questa funzionalità non hanno il campo "tipo"
// salvato: restano senza restrizioni (tutte le schede visibili), per non
// rompere nulla di quanto già esistente.
const TAB_FONTI_PROGETTO = [
  { fonte: 'computo', label: 'Computo' },
  { fonte: 'dei', label: 'Prezzario DEI' },
  { fonte: 'veneto', label: 'Prezzario Veneto' },
  { fonte: 'analisi', label: 'Analisi Prezzi' },
];
function _fontiConsentiteProgetto(tipo) {
  if (tipo === 'privato') return ['computo'];
  if (tipo === 'pubblico') return ['dei', 'veneto', 'analisi'];
  return TAB_FONTI_PROGETTO.map(t => t.fonte); // legacy senza tipo: nessuna restrizione
}
function _etichettaTipoProgetto(tipo) {
  if (tipo === 'privato') return '<span class="tipo-badge tipo-badge-privato">Privato</span>';
  if (tipo === 'pubblico') return '<span class="tipo-badge tipo-badge-pubblico">Pubblico</span>';
  return '';
}

// Fissa l'altezza di .split-screen in base allo spazio verticale
// realmente disponibile nella finestra, così i due pannelli (sinistra e
// destra) scorrono ciascuno per conto proprio invece di trascinarsi a
// vicenda con lo scroll della pagina. Sotto i 980px il CSS passa a
// colonna singola e disattiva questa logica (scroll normale di pagina).
function _fissaAltezzaSplitScreen() {
  const el = document.querySelector('.split-screen');
  if (!el) return;
  if (window.innerWidth <= 980) { el.style.height = ''; return; }
  const rect = el.getBoundingClientRect();
  const disponibile = window.innerHeight - rect.top - 24; // 24px = padding inferiore di .content
  el.style.height = Math.max(280, Math.round(disponibile)) + 'px';
}

function renderProgettoAperto() {
  const page = document.getElementById(_pageIdProgetti);
  if (!page) return;

  page.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <button class="btn btn-sm" onclick="chiudiProgetto()">← Progetti</button>
        &nbsp; ${escapeHtml(PROGETTI_STATE.progettoAttivo.nome)} ${_etichettaTipoProgetto(PROGETTI_STATE.progettoAttivo.tipo)}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-sm" onclick="mostraFormVoceManualeProgetto()">+ Voce manuale</button>
        <button class="btn btn-sm" onclick="mostraFormCapitoloProgetto()">+ Nuovo capitolo</button>
        <button class="btn btn-sm" onclick="esportaProgettoExcel()">⬇ Excel</button>
        <button class="btn btn-sm" onclick="esportaProgettoPDF()">⬇ PDF</button>
        <button class="btn btn-sm" onclick="esportaProgettoXPWE()">⬇ XPWE</button>
        <button class="btn btn-rosso btn-sm" onclick="cancellaTutteVociProgetto()">Cancella tutto</button>
      </div>
    </div>

    <div id="form-voce-manuale-progetto" class="card" style="display:none;margin-bottom:14px;flex-shrink:0">
      <div class="form-row">
        <input id="pv-codice" placeholder="Codice (facoltativo)" style="max-width:140px">
        <input id="pv-descrizione" placeholder="Descrizione" style="flex:1;min-width:220px">
        <input id="pv-um" placeholder="U.M." style="max-width:70px">
        <input id="pv-quantita" type="number" step="any" placeholder="Quantità" style="max-width:100px">
        <input id="pv-prezzo" type="number" step="any" placeholder="Prezzo (facoltativo)" style="max-width:120px">
      </div>
      <div class="form-row">
        <input id="pv-capitolo" placeholder="Capitolo (facoltativo, es. Cavi e dorsali)" style="flex:1;min-width:220px">
        <input id="pv-commento" placeholder="Commento (facoltativo)" style="flex:1;min-width:220px">
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--ink3);white-space:nowrap">
          <input id="pv-sicurezza" type="checkbox"> Oneri sicurezza
        </label>
        <button class="btn btn-blu" onclick="salvaVoceManualeProgetto()">Salva</button>
        <button class="btn" onclick="document.getElementById('form-voce-manuale-progetto').style.display='none'">Annulla</button>
      </div>
    </div>

    <div id="form-capitolo-progetto" class="card" style="display:none;margin-bottom:14px;flex-shrink:0">
      <div class="form-row">
        <input id="pc-titolo" placeholder="Titolo del capitolo/gruppo (es. Impianto elettrico, Impianto idraulico...)" style="flex:1;min-width:260px">
        <button class="btn btn-blu" onclick="salvaCapitoloProgetto()">Salva</button>
        <button class="btn" onclick="document.getElementById('form-capitolo-progetto').style.display='none'">Annulla</button>
      </div>
    </div>

    <div class="split-screen">
      <div class="split-pane split-sinistra">
        <div class="split-pane-titolo">Area di lavoro</div>
        <div class="fonte-tabs">
          <button id="btn-modifica-area-lavoro" class="fonte-tab ${PROGETTI_STATE.modificaAttiva ? 'active' : ''}" onclick="toggleModificaAreaLavoro()">${PROGETTI_STATE.modificaAttiva ? '✓ Fine modifica' : '✎ Modifica'}</button>
          <button id="btn-annulla-progetto" class="fonte-tab" onclick="annullaUltimaModificaProgetto()" title="Niente da annullare" disabled>↶ Annulla</button>
        </div>
        <div class="toolbar">
          <input type="search" id="progetto-ricerca-sx" placeholder="Cerca nell'area di lavoro..." value="${escapeHtml(PROGETTI_STATE.ricercaSinistra)}">
        </div>
        <div class="split-pane-scroll" id="area-lavoro-body"></div>
      </div>

      <div class="split-pane split-destra">
        <div class="split-pane-titolo">Prendi voci da...</div>
        <div class="fonte-tabs">
          ${TAB_FONTI_PROGETTO.filter(t => _fontiConsentiteProgetto(PROGETTI_STATE.progettoAttivo.tipo).includes(t.fonte)).map(t => `
            <button class="fonte-tab ${PROGETTI_STATE.fonteDestra === t.fonte ? 'active' : ''}" data-fonte="${t.fonte}" onclick="cambiaFonteDestra('${t.fonte}')">${t.label}</button>
          `).join('')}
        </div>
        <div id="fonte-destra-edizione-wrap"></div>
        <div class="toolbar">
          <input type="search" id="progetto-ricerca-dx" placeholder="Cerca nel magazzino selezionato..." value="${escapeHtml(PROGETTI_STATE.ricercaDestra)}">
        </div>
        <div class="split-pane-scroll" id="fonte-destra-body"></div>
      </div>
    </div>
  `;

  document.getElementById('progetto-ricerca-sx').addEventListener('input', e => {
    PROGETTI_STATE.ricercaSinistra = e.target.value.trim().toLowerCase();
    renderAreaLavoro();
  });
  document.getElementById('progetto-ricerca-dx').addEventListener('input', e => {
    PROGETTI_STATE.ricercaDestra = e.target.value.trim().toLowerCase();
    renderFonteDestra(PROGETTI_STATE.fonteDestra);
  });

  renderAreaLavoro();
  renderFonteDestra(PROGETTI_STATE.fonteDestra);
  _aggiornaStatoBottoneUndo();

  _fissaAltezzaSplitScreen();
  requestAnimationFrame(_fissaAltezzaSplitScreen);
  if (!_resizeListenerSplitScreenAttivo) {
    window.addEventListener('resize', _fissaAltezzaSplitScreen);
    _resizeListenerSplitScreenAttivo = true;
  }
}

function cambiaFonteDestra(fonte) {
  PROGETTI_STATE.fonteDestra = fonte;
  PROGETTI_STATE.ricercaDestra = '';
  PROGETTI_STATE.espansiDestra = new Set();
  // Attivo per attributo data-fonte, non per posizione: con le schede
  // filtrate in base a pubblico/privato (vedi renderProgettoAperto) l'indice
  // fisso non è più affidabile.
  document.querySelectorAll('.split-destra .fonte-tab').forEach(b => b.classList.toggle('active', b.dataset.fonte === fonte));
  const ricercaInput = document.getElementById('progetto-ricerca-dx');
  if (ricercaInput) ricercaInput.value = '';
  renderFonteDestra(fonte);
}

// ─── Pannello sinistro: area di lavoro (elenco piatto) ───

// Modalità modifica inline: consente di correggere codice/descrizione/U.M.
// delle voci GIÀ presenti nell'area di lavoro del progetto. È una modifica
// solo locale alla copia del progetto: non tocca in nessun modo la voce
// originale nel magazzino (Computo/Prezzario DEI/Prezzario Veneto) né in
// altri progetti.
function toggleModificaAreaLavoro() {
  PROGETTI_STATE.modificaAttiva = !PROGETTI_STATE.modificaAttiva;
  renderAreaLavoro();
  const btn = document.getElementById('btn-modifica-area-lavoro');
  if (btn) {
    btn.textContent = PROGETTI_STATE.modificaAttiva ? '✓ Fine modifica' : '✎ Modifica';
    btn.classList.toggle('active', PROGETTI_STATE.modificaAttiva);
  }
}

async function aggiornaCampoVoceProgetto(voceId, campo, valore) {
  // Il valore precedente è già in PROGETTI_STATE.voci (mantenuto sincrono
  // dall'onSnapshot): nessuna lettura extra da Firestore serve per poter
  // tornare indietro con l'Annulla.
  const vocePrecedente = PROGETTI_STATE.voci.find(v => v.id === voceId);
  const valorePrecedente = vocePrecedente ? vocePrecedente[campo] : undefined;
  try {
    await db.collection(PROGETTI_STATE.collName).doc(PROGETTI_STATE.progettoAttivo.id)
      .collection('voci').doc(voceId).update({ [campo]: valore });
    if (vocePrecedente) _registraAzioneUndo('Modifica campo', [{ tipo: 'campo', id: voceId, campo, valorePrecedente: valorePrecedente ?? null }]);
  } catch (e) {
    alert('Errore nel salvataggio della modifica: ' + e.message);
  }
}

function renderAreaLavoro() {
  const body = document.getElementById('area-lavoro-body');
  if (!body) return;

  let voci = PROGETTI_STATE.voci;
  if (PROGETTI_STATE.ricercaSinistra) {
    const q = PROGETTI_STATE.ricercaSinistra;
    voci = voci.filter(v =>
      (v.codice || '').toLowerCase().includes(q) ||
      (v.descrizione || '').toLowerCase().includes(q));
  }

  if (!voci.length) {
    body.innerHTML = `<div class="empty-state">${PROGETTI_STATE.voci.length ? 'Nessuna voce trovata.' : 'Ancora nessuna voce. Prendile dal pannello a destra oppure aggiungine una manuale.'}</div>`;
    return;
  }

  const inModifica = PROGETTI_STATE.modificaAttiva;
  let totale = 0;
  const righe = voci.map(v => {
    // Capitolo: come codice/descrizione/UM, modificabile solo in "✎ Modifica"
    // — è un dato strutturale della voce (a quale capitolo del computo
    // appartiene), non un'annotazione libera. Testo libero: la numerazione
    // "1.1, 1.2, ..." con cui il capitolo compare nell'export è calcolata
    // automaticamente in base all'ordine di prima comparsa fra le voci (vedi
    // _raggruppaPerCapitolo), non va scritta qui dall'utente.
    const cellaCapitolo = inModifica
      ? `<input type="text" class="edit-input" placeholder="—" value="${escapeHtml(v.capitolo || '')}" onchange="aggiornaCampoVoceProgetto('${v.id}', 'capitolo', this.value)">`
      : (escapeHtml(v.capitolo || '') || '—');
    const etichettaFonte = (FONTI_LABEL[v.fonte] || 'Manuale') + (v.fonteEdizioneNome ? ` (${v.fonteEdizioneNome})` : '');
    // Il commento è un appunto libero sulla singola riga dell'area di
    // lavoro (es. "da verificare con l'elettricista"): sempre modificabile,
    // indipendentemente dalla modalità "✎ Modifica" (come la Quantità),
    // perché è un'annotazione di lavoro, non un dato tecnico della voce.
    const cellaCommento = `<input type="text" class="edit-input" placeholder="—" value="${escapeHtml(v.commento || '')}" onchange="aggiornaCampoVoceProgetto('${v.id}', 'commento', this.value)">`;

    // Diciottesima tornata: le righe "titolo" sono agganciate in automatico
    // come capitolo/sottocapitolo padre di una voce presa dal pannello
    // destro (vedi aggiungiVoceAlProgetto) — non sono voci vere, quindi
    // niente Codice/Quantità/Prezzo/%Mdo./Oneri sicurezza (prezzo e quantita
    // restano sempre null, così il calcolo del Totale qui sotto le esclude
    // già da solo) e la Descrizione resta di sola lettura anche in modalità
    // "✎ Modifica": è il titolo del capitolo così come si chiama nella
    // fonte originale, si corregge da lì.
    if (v.tipo === 'titolo') {
      return `
        <div class="albero-riga albero-riga-progetto albero-riga-progetto-titolo">
          <span><span class="fonte-badge fonte-badge-${v.fonte || 'manuale'}" title="${escapeHtml(etichettaFonte)}">${escapeHtml(etichettaFonte)}</span></span>
          <span>${cellaCapitolo}</span>
          <span></span>
          <span class="progetto-titolo-riga">${escapeHtml(v.descrizione || '')}</span>
          <span></span><span>—</span><span>—</span><span>—</span><span>—</span><span></span>
          <span>${cellaCommento}</span>
          <span><button class="btn btn-sm btn-rosso" onclick="eliminaVoceProgetto('${v.id}')">✕</button></span>
        </div>`;
    }

    const importo = (v.prezzo != null && v.quantita != null) ? (Number(v.prezzo) * Number(v.quantita)) : null;
    if (importo != null) totale += importo;
    const cellaCodice = inModifica
      ? `<input type="text" class="edit-input" value="${escapeHtml(v.codice || '')}" onchange="aggiornaCampoVoceProgetto('${v.id}', 'codice', this.value)">`
      : escapeHtml(v.codice || '');
    const cellaDescrizione = inModifica
      ? `<textarea class="edit-textarea" onchange="aggiornaCampoVoceProgetto('${v.id}', 'descrizione', this.value)">${escapeHtml(v.descrizione || '')}</textarea>`
      : escapeHtml(v.descrizione || '');
    const cellaUm = inModifica
      ? `<input type="text" class="edit-input" value="${escapeHtml(v.um || '')}" onchange="aggiornaCampoVoceProgetto('${v.id}', 'um', this.value)">`
      : escapeHtml(v.um || '');
    return `
      <div class="albero-riga albero-riga-progetto">
        <span><span class="fonte-badge fonte-badge-${v.fonte || 'manuale'}" title="${escapeHtml(etichettaFonte)}">${escapeHtml(etichettaFonte)}</span></span>
        <span>${cellaCapitolo}</span>
        <span>${cellaCodice}</span>
        <span>${cellaDescrizione}</span>
        <span>${cellaUm}</span>
        <span><input type="number" step="any" class="qty-input" value="${v.quantita ?? 0}" onchange="aggiornaQuantitaProgetto('${v.id}', this.value)"></span>
        <span>${v.prezzo != null ? Number(v.prezzo).toFixed(2) + ' €' : '—'}</span>
        <span>${v.manodopera != null ? Number(v.manodopera).toFixed(1) + '%' : '—'}</span>
        <span>${importo != null ? importo.toFixed(2) + ' €' : '—'}</span>
        <span style="text-align:center" title="Oneri per la sicurezza"><input type="checkbox" ${v.oneriSicurezza ? 'checked' : ''} onchange="aggiornaCampoVoceProgetto('${v.id}', 'oneriSicurezza', this.checked)"></span>
        <span>${cellaCommento}</span>
        <span><button class="btn btn-sm btn-rosso" onclick="eliminaVoceProgetto('${v.id}')">✕</button></span>
      </div>`;
  }).join('');

  body.innerHTML = `
    <div class="albero-wrap">
      <div class="albero-header albero-riga-progetto">
        <span>Fonte</span><span>Capitolo</span><span>Codice</span><span>Descrizione</span><span>U.M.</span><span>Quantità</span><span>Prezzo</span><span>% Mdo.</span><span>Totale</span><span title="Oneri per la sicurezza">Sicur.</span><span>Commento</span><span></span>
      </div>
      ${righe}
    </div>
    <div class="totale-progetto">Totale complessivo: <strong>${totale.toFixed(2)} €</strong></div>
  `;
}

async function aggiornaQuantitaProgetto(voceId, valore) {
  const q = Number(valore);
  const vocePrecedente = PROGETTI_STATE.voci.find(v => v.id === voceId);
  const quantitaPrecedente = vocePrecedente ? vocePrecedente.quantita : undefined;
  try {
    await db.collection(PROGETTI_STATE.collName).doc(PROGETTI_STATE.progettoAttivo.id)
      .collection('voci').doc(voceId).update({ quantita: isNaN(q) ? 0 : q });
    if (vocePrecedente) _registraAzioneUndo('Modifica quantità', [{ tipo: 'campo', id: voceId, campo: 'quantita', valorePrecedente: quantitaPrecedente ?? null }]);
  } catch (e) {
    alert('Errore aggiornamento quantità: ' + e.message);
  }
}

async function eliminaVoceProgetto(voceId) {
  // Cattura il contenuto completo della voce PRIMA di eliminarla (già in
  // memoria, nessuna lettura extra) — così l'Annulla può ricrearla identica,
  // stesso id compreso, con un batch.set invece di un nuovo add.
  const vocePrecedente = PROGETTI_STATE.voci.find(v => v.id === voceId);
  try {
    await db.collection(PROGETTI_STATE.collName).doc(PROGETTI_STATE.progettoAttivo.id)
      .collection('voci').doc(voceId).delete();
    if (vocePrecedente) {
      const { id, ...dato } = vocePrecedente;
      _registraAzioneUndo('Eliminazione voce', [{ tipo: 'ripristina', id, dato }]);
    }
  } catch (e) {
    alert('Errore nell\'eliminazione: ' + e.message);
  }
}

function mostraFormVoceManualeProgetto() {
  document.getElementById('form-voce-manuale-progetto').style.display = 'block';
}

async function salvaVoceManualeProgetto() {
  const descrizione = document.getElementById('pv-descrizione').value.trim();
  if (!descrizione) { alert('Inserisci almeno una descrizione.'); return; }
  const prezzoRaw = document.getElementById('pv-prezzo').value;
  const dato = {
    tipo: 'voce',
    fonte: 'manuale',
    fonteNumero: null,
    codice: document.getElementById('pv-codice').value.trim(),
    descrizione,
    um: document.getElementById('pv-um').value.trim(),
    quantita: Number(document.getElementById('pv-quantita').value) || 0,
    prezzo: prezzoRaw === '' ? null : Number(prezzoRaw),
    capitolo: document.getElementById('pv-capitolo').value.trim(),
    oneriSicurezza: !!document.getElementById('pv-sicurezza').checked,
    commento: document.getElementById('pv-commento').value.trim(),
    ordine: Date.now(),
  };
  try {
    const ref = await db.collection(PROGETTI_STATE.collName).doc(PROGETTI_STATE.progettoAttivo.id).collection('voci').add(dato);
    _registraAzioneUndo('Aggiunta voce manuale', [{ tipo: 'elimina', id: ref.id }]);
    ['pv-codice', 'pv-descrizione', 'pv-um', 'pv-quantita', 'pv-prezzo', 'pv-capitolo', 'pv-commento'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('pv-sicurezza').checked = false;
    document.getElementById('form-voce-manuale-progetto').style.display = 'none';
  } catch (e) {
    alert('Errore nel salvataggio: ' + e.message);
  }
}

// ─── Gruppi e capitoli veri (diciottesima tornata) ───
// Un capitolo/gruppo creato a mano è una riga "titolo" a tutti gli effetti
// (stessa forma e stesso rendering non modificabile/non conteggiato delle
// righe titolo agganciate in automatico da aggiungiVoceAlProgetto — vedi
// renderAreaLavoro), solo con fonte 'manuale' e nessun fonteNumero: serve
// solo per dividere visivamente l'area di lavoro in sezioni (es. per
// disciplina/impianto), nell'ordine in cui vengono create — le voci
// aggiunte dopo (da qui o dal pannello destro) comparranno sotto di essa.
// Indipendente dal campo di testo libero "Capitolo" già esistente per
// l'export (Excel/PDF/XPWE), che resta invariato.
function mostraFormCapitoloProgetto() {
  document.getElementById('form-capitolo-progetto').style.display = 'block';
}

async function salvaCapitoloProgetto() {
  const inp = document.getElementById('pc-titolo');
  const titolo = inp.value.trim();
  if (!titolo) { alert('Inserisci un titolo per il capitolo/gruppo.'); return; }
  const dato = {
    tipo: 'titolo',
    fonte: 'manuale',
    fonteNumero: null,
    fonteEdizioneId: null,
    fonteEdizioneNome: null,
    codice: '',
    descrizione: titolo,
    um: '',
    prezzo: null,
    manodopera: null,
    quantita: null,
    capitolo: '',
    oneriSicurezza: false,
    commento: '',
    ordine: Date.now(),
  };
  try {
    const ref = await db.collection(PROGETTI_STATE.collName).doc(PROGETTI_STATE.progettoAttivo.id).collection('voci').add(dato);
    _registraAzioneUndo('Aggiunta capitolo', [{ tipo: 'elimina', id: ref.id }]);
    inp.value = '';
    document.getElementById('form-capitolo-progetto').style.display = 'none';
  } catch (e) {
    alert('Errore nel salvataggio: ' + e.message);
  }
}

async function cancellaTutteVociProgetto() {
  if (!PROGETTI_STATE.voci.length) { alert('L\'area di lavoro è già vuota.'); return; }
  const scelta = await chiediScelta({
    titolo: 'Svuotare l\'area di lavoro?',
    corpo: `Stai per eliminare tutte le ${PROGETTI_STATE.voci.length} voci di questo progetto. Non è annullabile.`,
    bottoni: [
      { valore: 'annulla', testo: 'Annulla' },
      { valore: 'conferma', testo: 'Cancella tutto', classe: 'btn-rosso' }
    ]
  });
  if (scelta !== 'conferma') return;
  try {
    await _cancellaTutteLeVoci(
      db.collection(PROGETTI_STATE.collName).doc(PROGETTI_STATE.progettoAttivo.id).collection('voci'),
      PROGETTI_STATE.voci
    );
  } catch (e) {
    alert('Errore durante la cancellazione: ' + e.message);
  }
}

// ─── Pannello destro: selettore di provenienza (Computo / Prezzari) ───
// Computo resta un unico magazzino piatto (sempre pronto). I due Prezzari
// sono invece organizzati in edizioni (vedi prezzario_module.js): le loro
// voci vivono in PROGETTI_STATE.vociEdizioneDestra, popolate SOLO dopo che
// l'utente ha scelto un'edizione dal menu (cambiaEdizioneDestraProgetti) —
// indipendentemente da quale edizione sia eventualmente aperta nella pagina
// Prezzario stessa, per non avere i due contesti che si "rubano" a vicenda
// lo stesso listener.
function _statoFonte(fonte) {
  if (fonte === 'computo') return { voci: (typeof MAGAZZINO_COMPUTO !== 'undefined' ? MAGAZZINO_COMPUTO.voci : []), variante: 'computo' };
  // Analisi Prezzi: come i due Prezzari, organizzata in annate/edizioni
  // (vedi analisi_prezzi_module.js) — l'annata scelta qui è già in
  // PROGETTI_STATE.vociEdizioneDestra (popolata da cambiaEdizioneDestraProgetti
  // esattamente come per dei/veneto), ma con i campi "grezzi" della voce
  // (numero/descrizione/unitaMisura/totaleFinale/righe/...): li trasformiamo
  // qui in un nodo "voce" foglia con numero/descrizione/um/prezzo, esattamente
  // come una riga di prezzario, per riusare renderRigheAlbero/costruisciAlbero
  // senza modificarli.
  if (fonte === 'analisi') {
    const voci = PROGETTI_STATE.vociEdizioneDestra.map(v => ({
      id: v.id,
      numero: String(v.numero ?? v.id),
      tipo: 'voce',
      descrizione: v.descrizione || '',
      um: v.unitaMisura || '',
      prezzo: v.totaleFinale != null ? Number(v.totaleFinale) : 0,
    }));
    return { voci, variante: 'prezzario' };
  }
  return { voci: PROGETTI_STATE.vociEdizioneDestra, variante: 'prezzario' };
}

// Fornisce {edizioni, edizioniCollName} sia per i due Prezzari (dei/veneto,
// vedi PREZZARIO_STATE in prezzario_module.js) sia per Analisi Prezzi (le sue
// annate, vedi ANALISI_PREZZI_STATE in analisi_prezzi_module.js) — stessa
// forma per entrambi, così le tre funzioni qui sotto (selettore edizione,
// lettura da server, pannello "Prendi voci da...") restano un'unica
// implementazione condivisa invece di doverla duplicare per Analisi Prezzi.
function _infoEdizioniFonte(fonte) {
  if (fonte === 'analisi') {
    const stato = (typeof ANALISI_PREZZI_STATE !== 'undefined') ? ANALISI_PREZZI_STATE : null;
    return stato ? { edizioni: stato.edizioni, edizioniCollName: stato.edizioniCollName } : { edizioni: [], edizioniCollName: null };
  }
  const stato = (typeof PREZZARIO_STATE !== 'undefined') ? PREZZARIO_STATE[fonte] : null;
  return stato ? { edizioni: stato.edizioni, edizioniCollName: stato.edizioniCollName } : { edizioni: [], edizioniCollName: null };
}

// Come in prezzario_module.js: le voci di un'edizione cambiano solo
// quando le importi/modifichi (da questa pagina o dalla pagina Prezzario
// stessa, che scrive nella STESSA collezione/chiave di cache), quindi qui
// carichiamo prima dalla cache locale del dispositivo (gratis) e solo se
// manca facciamo una vera lettura da Firestore.
function cambiaEdizioneDestraProgetti(fonte, edizioneId) {
  PROGETTI_STATE.espansiDestra = new Set();

  if (!edizioneId) {
    PROGETTI_STATE.edizioneDestraSelezionata[fonte] = null;
    PROGETTI_STATE.vociEdizioneDestra = [];
    renderFonteDestra(fonte);
    return;
  }

  const { edizioni, edizioniCollName } = _infoEdizioniFonte(fonte);
  const edizione = edizioni.find(e => e.id === edizioneId);
  if (!edizioniCollName || !edizione) return;

  PROGETTI_STATE.edizioneDestraSelezionata[fonte] = { id: edizione.id, nome: edizione.nome };

  const collName = `${edizioniCollName}/${edizioneId}/voci`;
  const cache = _leggiCacheLocale(collName);
  if (cache) {
    PROGETTI_STATE.vociEdizioneDestra = cache.voci.slice();
    PROGETTI_STATE.vociEdizioneDestra.sort((a, b) => confrontaNumero(a.numero, b.numero));
    renderFonteDestra(fonte);
    return;
  }

  PROGETTI_STATE.vociEdizioneDestra = [];
  renderFonteDestra(fonte);
  aggiornaEdizioneDestraProgettiDaServer(fonte, edizioneId);
}

// Lettura esplicita e reale da Firestore (consuma quota): solo al primo
// accesso su un dispositivo per questa edizione, oppure quando l'utente
// preme "⟳ Aggiorna".
async function aggiornaEdizioneDestraProgettiDaServer(fonte, edizioneId) {
  const { edizioniCollName } = _infoEdizioniFonte(fonte);
  if (!edizioniCollName) return;
  // "collName" qui resta solo una chiave di cache locale (localStorage): le
  // voci vive sono lette da _leggiVociPrezzarioDaServer (dei/veneto, formato
  // "a blocchi") o da _leggiVociAnalisiDaServer (analisi, un documento per
  // voce — vedi il commento su quella funzione in analisi_prezzi_module.js
  // sul perché non riusa la lettura "a blocchi" dei Prezzari).
  const collName = _chiaveCachePrezzarioEdizione(edizioniCollName, edizioneId);
  try {
    const voci = fonte === 'analisi'
      ? await _leggiVociAnalisiDaServer(edizioniCollName, edizioneId)
      : await _leggiVociPrezzarioDaServer(edizioniCollName, edizioneId);
    voci.sort((a, b) => confrontaNumero(a.numero, b.numero));
    // Se nel frattempo l'utente ha cambiato fonte/edizione (es. è passato
    // da DEI a Veneto mentre questa lettura era ancora in corso), questa
    // risposta è ormai "vecchia": va scartata del tutto, SENZA scrivere
    // nulla nella cache locale. Prima questo controllo proteggeva solo la
    // vista a schermo (PROGETTI_STATE.vociEdizioneDestra/renderFonteDestra)
    // ma non la scrittura della cache — che è condivisa con la pagina
    // Prezzario vera e propria (stessa chiave collName) — quindi una
    // risposta tardiva poteva comunque sovrascrivere la cache della fonte
    // sbagliata (o di un'edizione non più quella aperta), facendola
    // sembrare vuota/diversa a un F5 successivo pur restando intatta su
    // Firestore.
    const selezionata = PROGETTI_STATE.edizioneDestraSelezionata[fonte];
    if (!selezionata || selezionata.id !== edizioneId) return;
    _scriviCacheLocale(collName, voci);
    PROGETTI_STATE.vociEdizioneDestra = voci;
    renderFonteDestra(fonte);
  } catch (e) {
    console.error('Errore caricamento edizione:', e.message);
    const body = document.getElementById('fonte-destra-body');
    if (body && PROGETTI_STATE.fonteDestra === fonte) {
      body.innerHTML = `<div class="empty-state">Errore: ${escapeHtml(_messaggioErroreFirestore(e))}</div>`;
    }
  }
}

function renderFonteDestra(fonteRichiesta) {
  // Se il pannello progetti non è aperto sulla fonte richiesta (es. un
  // modulo magazzino segnala un aggiornamento mentre l'utente guarda
  // un'altra fonte), non tocchiamo il DOM.
  if (!PROGETTI_STATE.progettoAttivo || PROGETTI_STATE.fonteDestra !== fonteRichiesta) return;

  const body = document.getElementById('fonte-destra-body');
  const wrapEdizione = document.getElementById('fonte-destra-edizione-wrap');
  if (!body) return;

  const fonteSenzaEdizioni = fonteRichiesta === 'computo';
  const edizioneSelezionata = !fonteSenzaEdizioni ? PROGETTI_STATE.edizioneDestraSelezionata[fonteRichiesta] : null;

  if (wrapEdizione) {
    if (fonteSenzaEdizioni) {
      wrapEdizione.innerHTML = '';
    } else {
      const { edizioni, edizioniCollName } = _infoEdizioniFonte(fonteRichiesta);
      const collNameSelezionata = (edizioniCollName && edizioneSelezionata)
        ? `${edizioniCollName}/${edizioneSelezionata.id}/voci` : null;
      wrapEdizione.innerHTML = `
        <div class="form-row" style="margin-bottom:10px;align-items:center">
          <select id="fonte-destra-edizione-select" style="flex:1;min-width:160px" onchange="cambiaEdizioneDestraProgetti('${fonteRichiesta}', this.value || null)">
            <option value="">— Scegli un'edizione —</option>
            ${edizioni.map(e => `<option value="${e.id}" ${edizioneSelezionata && edizioneSelezionata.id === e.id ? 'selected' : ''}>${escapeHtml(e.nome)}</option>`).join('')}
          </select>
          ${collNameSelezionata ? _htmlIndicatoreCache(collNameSelezionata, `aggiornaEdizioneDestraProgettiDaServer('${fonteRichiesta}', '${edizioneSelezionata.id}')`) : ''}
        </div>`;
    }
  }

  if (!fonteSenzaEdizioni && !edizioneSelezionata) {
    body.innerHTML = `<div class="empty-state">Scegli un'edizione dal menu qui sopra per sfogliarla.</div>`;
    return;
  }

  const { voci, variante } = _statoFonte(fonteRichiesta);
  const onAggiungi = nodo => {
    // Diciottesima tornata: il pulsante "+ Aggiungi" compare SOLO sulle voci
    // foglia — non più sulle righe titolo/capitolo/sottocapitolo. Quando si
    // aggiunge una voce, l'intera catena di antenati (titoli/sottotitoli)
    // viene agganciata in automatico da aggiungiVoceAlProgetto qui sotto, se
    // non già presente per quella stessa famiglia.
    if (nodo.tipo !== 'voce') return '';
    const payload = {
      id: nodo.id || null,
      numero: nodo.numero || '',
      codice: nodo.codice || nodo.codiceEP || '',
      descrizione: nodo.descrizione || nodo.titolo || '',
      um: nodo.um || '',
      prezzo: nodo.prezzo != null ? Number(nodo.prezzo) : null,
      manodopera: nodo.manodopera != null ? Number(nodo.manodopera) : null,
      fonteEdizioneId: edizioneSelezionata ? edizioneSelezionata.id : null,
      fonteEdizioneNome: edizioneSelezionata ? edizioneSelezionata.nome : null,
    };
    const payloadAttr = escapeHtml(JSON.stringify(payload));
    return `<button class="btn btn-sm btn-blu" onclick='aggiungiVoceAlProgetto(${JSON.stringify(fonteRichiesta)}, JSON.parse(this.dataset.voce))' data-voce="${payloadAttr}">+ Aggiungi</button>`;
  };

  if (PROGETTI_STATE.ricercaDestra) {
    const campi = variante === 'computo' ? ['numero', 'codiceEP', 'titolo', 'descrizione'] : ['numero', 'codice', 'descrizione'];
    const risultati = filtraVociPiatte(voci, PROGETTI_STATE.ricercaDestra, campi);
    body.innerHTML = risultati.length
      ? renderRigheAlbero(risultati, new Set(), { variante, onElimina: onAggiungi })
      : `<div class="empty-state">Nessuna voce trovata.</div>`;
    return;
  }

  const albero = costruisciAlbero(voci);
  body.innerHTML = albero.length
    ? renderRigheAlbero(albero, PROGETTI_STATE.espansiDestra, { variante, costruisciToggle: numero => `toggleRamoDestraProgetto('${numero}')`, onElimina: onAggiungi })
    : `<div class="empty-state">${fonteSenzaEdizioni ? 'Questo magazzino è ancora vuoto.' : 'Questa edizione è ancora vuota.'}</div>`;
}

function toggleRamoDestraProgetto(numero) {
  if (PROGETTI_STATE.espansiDestra.has(numero)) PROGETTI_STATE.espansiDestra.delete(numero);
  else PROGETTI_STATE.espansiDestra.add(numero);
  renderFonteDestra(PROGETTI_STATE.fonteDestra);
}

// Le voci prese da Analisi Prezzi entrano nel progetto con una codifica
// tutta loro — "NP.<E|M>.<progressivo a due cifre>" (E/M secondo la
// disciplina del progetto) — assegnata UNA VOLTA al momento
// dell'inserimento e mai più ricalcolata: non ha niente a che fare con il
// numero che la voce ha nella lista di Analisi Prezzi (quello resta solo
// internamente, in fonteNumero, per sapere da quale voce proviene — vedi
// il controllo "giaPresente" qui sotto) né con nessun'altra numerazione o
// codifica del Computo/Prezzari. Il progressivo è per singolo progetto
// (ogni progetto riparte da 01) e NON si richiude se una voce NP viene
// eliminata: il codice di quelle rimaste non cambia mai, possono restare
// dei "buchi" nella sequenza (scelta esplicita, per non rischiare
// rinumerazioni impreviste come già successo in passato nel Computo).
function _prossimoCodiceNuovoPrezzo() {
  const lettera = PROGETTI_STATE.disciplina === 'meccanico' ? 'M' : 'E';
  const re = new RegExp(`^NP\\.${lettera}\\.(\\d+)$`);
  let massimo = 0;
  PROGETTI_STATE.voci.forEach(v => {
    const m = re.exec(v.codice || '');
    if (m) massimo = Math.max(massimo, parseInt(m[1], 10));
  });
  return `NP.${lettera}.${String(massimo + 1).padStart(2, '0')}`;
}

async function aggiungiVoceAlProgetto(fonte, nodo) {
  if (!PROGETTI_STATE.progettoAttivo) return;
  const fonteNumero = nodo.numero || null;
  const fonteEdizioneId = nodo.fonteEdizioneId || null; // solo per dei/veneto: quale edizione

  // Il confronto include l'edizione: la stessa voce numerata può comparire
  // in edizioni diverse del prezzario (es. 2025 e 2026, con prezzo diverso).
  const giaPresente = PROGETTI_STATE.voci.some(v =>
    v.fonte === fonte && v.fonteNumero === fonteNumero && (v.fonteEdizioneId || null) === fonteEdizioneId);
  if (giaPresente) { alert('Questa voce è già presente nell\'area di lavoro del progetto.'); return; }

  // Diciottesima tornata: prima di aggiungere la voce vera e propria,
  // agganciamo in automatico l'intera catena di antenati (titolo/sottotitolo/
  // capitolo padre a cui appartiene nella fonte originale), SE non già
  // presente nell'area di lavoro per quella stessa fonte+edizione — così il
  // pulsante "+ Aggiungi", ora presente solo sulle voci foglia (vedi
  // onAggiungi in renderFonteDestra), non fa perdere il contesto della
  // gerarchia. Non si applica alla fonte 'analisi': le sue voci, qui, non
  // hanno mai una gerarchia di capitoli (vedi _statoFonte).
  const { voci: vociFonte } = _statoFonte(fonte);
  const nodoSorgente = vociFonte.find(v => v.numero === fonteNumero);
  const catenaAntenati = nodoSorgente ? catenaAntenatiNodo(vociFonte, nodoSorgente) : [];
  const collRifVoci = db.collection(PROGETTI_STATE.collName).doc(PROGETTI_STATE.progettoAttivo.id).collection('voci');
  let prossimoOrdine = Date.now();
  const idsAggiunti = []; // per l'Annulla: un solo Ctrl+Z toglie l'intero gruppo (antenati + voce)
  for (const antenato of catenaAntenati) {
    const giaPresenteAntenato = PROGETTI_STATE.voci.some(v =>
      v.tipo === 'titolo' && v.fonte === fonte && v.fonteNumero === antenato.numero && (v.fonteEdizioneId || null) === fonteEdizioneId);
    if (giaPresenteAntenato) continue;
    const datoAntenato = {
      tipo: 'titolo',
      fonte,
      fonteNumero: antenato.numero,
      fonteEdizioneId,
      fonteEdizioneNome: nodo.fonteEdizioneNome || null,
      codice: '',
      descrizione: antenato.titolo || '',
      um: '',
      prezzo: null,
      manodopera: null,
      quantita: null,
      capitolo: '',
      oneriSicurezza: false,
      commento: '',
      ordine: prossimoOrdine++,
    };
    try {
      const ref = await collRifVoci.add(datoAntenato);
      // Aggiornamento ottimistico locale: evita che, se la stessa famiglia
      // avesse più di un antenato mancante, la riga onSnapshot (asincrona)
      // non sia ancora arrivata e questo stesso ciclo lo riconti.
      PROGETTI_STATE.voci.push({ id: ref.id, ...datoAntenato });
      idsAggiunti.push(ref.id);
    } catch (e) {
      alert('Errore nell\'aggiunta della struttura (titolo/capitolo) al progetto: ' + e.message);
      return;
    }
  }

  const dato = {
    tipo: 'voce',
    fonte,
    fonteNumero,
    fonteEdizioneId,
    fonteEdizioneNome: nodo.fonteEdizioneNome || null,
    // Solo per fonte 'analisi': l'id Firestore della voce originale in
    // Analisi Prezzi (annata + doc), da cui riprendere al momento
    // dell'esportazione il dettaglio completo (materiali/manodopera/spese
    // generali — vedi _dettaglioAnalisiPerExport in fondo al file). NON è
    // il "codice" NP.E.xx assegnato qui sotto (quello è solo un'etichetta
    // locale al progetto), ma il puntatore alla voce sorgente vera e
    // propria: se la voce di Analisi Prezzi viene poi modificata o
    // cancellata, questo id può non risolversi più — l'export gestisce
    // quel caso saltando semplicemente il dettaglio per quella riga.
    fonteAnalisiVoceId: fonte === 'analisi' ? (nodo.id || null) : null,
    codice: fonte === 'analisi' ? _prossimoCodiceNuovoPrezzo() : (nodo.codice || nodo.codiceEP || ''),
    descrizione: nodo.descrizione || nodo.titolo || '',
    um: nodo.um || '',
    prezzo: (nodo.prezzo != null) ? Number(nodo.prezzo) : null,
    manodopera: (nodo.manodopera != null) ? Number(nodo.manodopera) : null,
    quantita: 0,
    capitolo: '',
    oneriSicurezza: false,
    commento: '',
    ordine: prossimoOrdine,
  };

  try {
    const refLeaf = await db.collection(PROGETTI_STATE.collName).doc(PROGETTI_STATE.progettoAttivo.id).collection('voci').add(dato);
    idsAggiunti.push(refLeaf.id);
    _registraAzioneUndo('Aggiunta voce', idsAggiunti.map(id => ({ tipo: 'elimina', id })));
  } catch (e) {
    alert('Errore nell\'aggiunta al progetto: ' + e.message);
  }
}

// ─── Export area di lavoro ───
//
// Quindicesima tornata: l'esportazione (Excel e PDF) è stata riscritta per
// riprodurre la struttura di un vero computo metrico TEKNO — analizzato su
// un file reale fornito da Giovanni — invece della precedente tabella
// piatta unica:
//   - le voci sono raggruppate per CAPITOLO (1.1, 1.2, ... numerati
//     automaticamente in base all'ordine di prima comparsa — vedi
//     _raggruppaPerCapitolo), ciascuno con la propria riga TOTALE;
//   - segue una sezione RIEPILOGO con un rigo per capitolo;
//   - le voci marcate "Oneri sicurezza" escono dai capitoli numerati e
//     formano un'unica sezione finale "ONERI PER LA SICUREZZA" a parte, con
//     una RIEPILOGO TOTALE finale che somma opere + oneri;
//   - le voci prese da Analisi Prezzi portano, quando la voce sorgente è
//     ancora recuperabile, un foglio Excel di dettaglio a parte (componenti
//     manodopera/materiali + spese generali + utile impresa), collegato con
//     vere formule al foglio principale — esattamente come nel file di
//     riferimento (un foglio per ogni voce "NP.E.xx", con la cella del
//     prezzo del computo che rimanda a quel foglio). Il PDF, che non può
//     avere formule, riporta lo stesso dettaglio come tabella in appendice.
// Semplificazione consapevole rispetto all'originale: qui ogni voce resta
// una riga indipendente (niente "voce madre" con più "voci figlie" sotto
// una descrizione condivisa) — ogni riga porta la propria descrizione per
// intero. Si può aggiungere in seguito se serve davvero identico anche su
// quel punto.

// Etichetta "Fonte" identica a quella mostrata nell'area di lavoro
// (renderAreaLavoro): nome del magazzino + eventuale edizione tra parentesi.
function _etichettaFonteVoceProgetto(v) {
  return (FONTI_LABEL[v.fonte] || 'Manuale') + (v.fonteEdizioneNome ? ` (${v.fonteEdizioneNome})` : '');
}

function _dataOraEsportazione() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return { data: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`, ora: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

// ─── Raggruppamento per capitolo (solo per l'esportazione) ───
// Il capitolo è un campo libero per voce (vedi renderAreaLavoro, colonna
// "Capitolo"): qui raggruppiamo le voci non-oneri-sicurezza per quel testo,
// nell'ordine in cui il capitolo compare la prima volta fra le voci (già
// ordinate per v.ordine) — la numerazione "1.1, 1.2, ..." con cui compare
// nell'export è calcolata qui automaticamente, l'utente non la scrive mai a
// mano. Le voci senza capitolo assegnato finiscono in un ultimo capitolo
// "(senza capitolo)", così nessuna voce sparisce dall'esportazione anche
// per i progetti creati prima di questa modifica. Le voci con
// oneriSicurezza:true escono da questo raggruppamento: nel file di
// riferimento gli oneri per la sicurezza sono sempre un'unica sezione
// piatta a parte, mai suddivisa in capitoli.
function _raggruppaPerCapitolo(voci) {
  const normali = voci.filter(v => !v.oneriSicurezza);
  const oneriSicurezza = voci.filter(v => v.oneriSicurezza);

  const ordineTitoli = [];
  const perTitolo = new Map();
  normali.forEach(v => {
    const titolo = (v.capitolo || '').trim() || '(senza capitolo)';
    if (!perTitolo.has(titolo)) { perTitolo.set(titolo, []); ordineTitoli.push(titolo); }
    perTitolo.get(titolo).push(v);
  });

  const capitoli = ordineTitoli.map((titolo, i) => ({ numero: `1.${i + 1}`, titolo, voci: perTitolo.get(titolo) }));
  return { capitoli, oneriSicurezza };
}

// ─── Dettaglio Analisi Prezzi per l'esportazione ───
// Per una voce presa da Analisi Prezzi (fonte:'analisi'), recupera la voce
// sorgente completa (righe/percentuali) da cui ricostruire — nell'export —
// lo stesso schema del file di riferimento: un foglio a parte con
// manodopera + materiali + spese generali + utile impresa, collegato con
// formule al prezzo/incidenza manodopera nel foglio principale. Se la voce
// sorgente non esiste più (cancellata dopo l'inserimento nel progetto)
// restituisce null: la riga nel foglio principale resta comunque esportata
// con i valori "congelati" al momento dell'inserimento, semplicemente senza
// foglio di dettaglio collegato.
async function _dettaglioAnalisiPerVoce(v) {
  if (v.fonte !== 'analisi' || !v.fonteAnalisiVoceId || !v.fonteEdizioneId) return null;
  const { edizioniCollName } = _infoEdizioniFonte('analisi');
  if (!edizioniCollName) return null;
  try {
    const doc = await db.collection(edizioniCollName).doc(v.fonteEdizioneId).collection('voci').doc(v.fonteAnalisiVoceId).get();
    if (!doc.exists) return null;
    const ap = doc.data();
    const righe = ap.righe || [];
    const percentualeSpeseGenerali = Number(ap.percentualeSpeseGenerali) || 0;
    const percentualeUtileImpresa = Number(ap.percentualeUtileImpresa) || 0;
    const totali = _ricalcolaTotaliAnalisi(righe, percentualeSpeseGenerali, percentualeUtileImpresa);
    // Incidenza manodopera: quota delle righe elementari riconoscibili come
    // manodopera sul totale parziale — calcolata qui una sola volta così sia
    // l'export Excel (formula nel foglio di dettaglio) sia il PDF (valore
    // statico) leggono lo stesso numero da _incidenzaManodopera.
    const righeMdo = righe.filter(x => /manodopera|operaio/i.test(x.descrizione || '') || (FONTI_LABEL[x.fonte] || '').toLowerCase().includes('manodopera'));
    const importoMdo = righeMdo.reduce((s, x) => s + (Number(x.quantita) || 0) * (Number(x.prezzoElementare) || 0), 0);
    const incidenzaManodopera = totali.totaleParziale ? importoMdo / totali.totaleParziale : 0;
    return {
      codice: v.codice, descrizione: v.descrizione, righe, percentualeSpeseGenerali, percentualeUtileImpresa, totali,
      _righeMdo: righeMdo, _incidenzaManodopera: incidenzaManodopera,
    };
  } catch (e) {
    console.error('Errore lettura dettaglio Analisi Prezzi per export:', e.message);
    return null;
  }
}

// Raccoglie i dettagli per tutte le voci passate (in parallelo), come
// Map(voceId → dettaglio) — solo le voci fonte:'analisi' risolvibili
// producono una entry.
async function _raccogliDettagliAnalisi(voci) {
  const mappa = new Map();
  await Promise.all(voci.map(async v => {
    const det = await _dettaglioAnalisiPerVoce(v);
    if (det) mappa.set(v.id, det);
  }));
  return mappa;
}

// Nome-foglio Excel valido e univoco a partire dal codice della voce
// (i fogli Excel non possono superare 31 caratteri né contenere : \ / ? * [ ]).
function _nomeFoglioDettaglio(codice, usati) {
  const base = (String(codice || 'Dettaglio').replace(/[:\\/?*[\]]/g, '-').trim() || 'Dettaglio').slice(0, 28);
  let nome = base, n = 2;
  while (usati.has(nome)) { nome = `${base.slice(0, 28 - String(n).length - 1)}~${n}`; n++; }
  usati.add(nome);
  return nome;
}

// ── Colonne della tabella principale (comuni a Excel e PDF) ──
// Le prime 10 (n → incidenza manodopera) riproducono esattamente le colonne
// del file di riferimento; "Commento" all'undicesima è un'aggiunta
// dell'app (appunti di lavoro sulla singola riga, non presente nel file
// originale).
const _INTESTAZIONI_COMPUTO = ['n', 'Prezzario', 'Codice', 'Descrizione', 'U.M.', 'Prezzo', 'Q.tà', 'Importo lavori', 'Costo manodopera', 'Incidenza manodopera', 'Commento'];

// Foglio(-i) Excel organizzato come il computo metrico di riferimento:
// capitoli numerati con totale, RIEPILOGO, eventuale sezione ONERI PER LA
// SICUREZZA con RIEPILOGO TOTALE finale, e un foglio di dettaglio per ogni
// voce di Analisi Prezzi risolvibile — con vere formule di calcolo, come
// nell'originale (i totali si aggiornano da soli se modifichi un numero).
//
// NOTA sui limiti reali della libreria (xlsx-js-style, versione gratuita
// usata qui): può scrivere colori, bordi, larghezze colonna, margini e
// formule, ma NON può impostare nel file l'orientamento orizzontale né
// "adatta a 1 pagina" — quella è una funzione riservata alla versione a
// pagamento di SheetJS. Il file si apre quindi in verticale al 100% come
// qualsiasi foglio Excel: per stamparlo su uno o più A4 basta un click in
// più in Excel (Layout di pagina → Orientamento → Orizzontale, e Larghezza
// → 1 pagina) — impostazione che resta salvata se poi lo risalvi. In
// alternativa il bottone "⬇ PDF" qui sotto è già pronto in orizzontale A4.
async function esportaProgettoExcel() {
  if (!PROGETTI_STATE.voci.length) { alert('Nessuna voce da esportare.'); return; }

  const voci = PROGETTI_STATE.voci;
  const nomeProgetto = PROGETTI_STATE.progettoAttivo.nome;
  const { data, ora } = _dataOraEsportazione();
  const { capitoli, oneriSicurezza } = _raggruppaPerCapitolo(voci);
  const dettagli = await _raccogliDettagliAnalisi(voci);

  const nomiFoglioUsati = new Set(['Computo']);
  dettagli.forEach((det, voceId) => { det.nomeFoglio = _nomeFoglioDettaglio(det.codice, nomiFoglioUsati); });

  // ── Stili (Arial Narrow, come il file di riferimento) ──
  //
  // IMPORTANTE sull'ordine di costruzione: i fogli di dettaglio Analisi
  // Prezzi vengono costruiti PRIMA del foglio principale "Computo" (vedi più
  // sotto), perché le formule del foglio principale devono puntare a righe
  // precise di quei fogli (det._rTotale, det._rIncidenza) — righe note solo
  // a costruzione del foglio di dettaglio avvenuta. Costruirli dopo, come
  // nella prima stesura, lascerebbe quei riferimenti indefiniti.
  const bordino = { style: 'thin', color: { rgb: 'D9D9D9' } };
  const bordoCella = { top: bordino, bottom: bordino, left: bordino, right: bordino };
  const fontBase = { name: 'Arial Narrow', sz: 10 };
  const FMT_VALUTA = '#,##0.00" €"';
  const FMT_NUM = '#,##0.00';
  const FMT_PCT = '0.00%';

  const stileTitolo = { font: { ...fontBase, sz: 16, bold: true, color: { rgb: '1F2937' } }, alignment: { vertical: 'center' } };
  const stileSottotitolo = { font: { ...fontBase, sz: 9, italic: true, color: { rgb: '6B7280' } }, alignment: { vertical: 'center' } };
  const stileSezione = { font: { ...fontBase, sz: 14, bold: true }, fill: { patternType: 'solid', fgColor: { rgb: 'D9E2F3' } }, alignment: { vertical: 'center' }, border: { top: bordino, bottom: bordino } };
  const stileCapNumero = { font: { ...fontBase, sz: 12, bold: true }, fill: { patternType: 'solid', fgColor: { rgb: 'D9E2F3' } }, alignment: { vertical: 'center' } };
  const stileCapTitolo = { font: { ...fontBase, sz: 14, bold: true }, fill: { patternType: 'solid', fgColor: { rgb: 'D9E2F3' } }, alignment: { vertical: 'center' } };
  const stileIntestazione = {
    font: { ...fontBase, bold: true }, fill: { patternType: 'solid', fgColor: { rgb: 'D9D9D9' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: bordoCella,
  };
  const stileCella = (allineamento, extra) => ({ font: fontBase, alignment: { horizontal: allineamento, vertical: 'top', wrapText: allineamento === 'left' }, border: bordoCella, ...extra });
  const bordoTotaleTop = { style: 'medium', color: { rgb: '374151' } };
  const stileTotale = (allineamento, extra) => ({
    font: { ...fontBase, bold: true }, alignment: { horizontal: allineamento, vertical: 'center' },
    fill: { patternType: 'solid', fgColor: { rgb: 'E5E7EB' } }, border: { top: bordoTotaleTop, bottom: bordino, left: bordino, right: bordino }, ...extra,
  });

  // ── Fogli di dettaglio Analisi Prezzi (uno per voce risolvibile) ──
  // Costruiti PRIMA del foglio principale: ogni foglio calcola qui la riga
  // del proprio TOTALE (det._rTotale) e della propria incidenza manodopera
  // (det._rIncidenza), che il foglio principale userà subito dopo per le
  // formule di collegamento 'NomeFoglio'!F<riga>. det._incidenzaManodopera è
  // già disponibile da _dettaglioAnalisiPerVoce (usata anche dal PDF).
  const fogliDettaglio = [];
  dettagli.forEach(det => {
    const wsDet = {};
    const setCellD = (rr, cc, vv, style, tipo) => { const addr = XLSX.utils.encode_cell({ r: rr, c: cc }); wsDet[addr] = { t: tipo || (typeof vv === 'number' ? 'n' : 's'), v: vv == null ? '' : vv, ...(style ? { s: style } : {}) }; };
    const setFormulaD = (rr, cc, formula, cachedValue, style) => { const addr = XLSX.utils.encode_cell({ r: rr, c: cc }); wsDet[addr] = { t: 'n', v: (cachedValue == null || isNaN(cachedValue)) ? 0 : cachedValue, f: formula, s: style }; };

    let rr = 0;
    setCellD(rr, 0, 'Codice C.M.:', { font: { ...fontBase, bold: true } }); setCellD(rr, 1, det.codice, {}); rr++;
    setCellD(rr, 0, det.descrizione, { font: { ...fontBase, bold: true, sz: 11 } }); rr += 2;
    ['Codice', 'Descrizione', 'U.M.', 'Quantità', 'Prezzo elem.', 'Importo'].forEach((h, c) => setCellD(rr, c, h, stileIntestazione));
    rr++;
    const rPrimaRiga = rr;
    det.righe.forEach(x => {
      const rigaExcel = rr + 1;
      setCellD(rr, 0, x.codice || '', stileCella('left'));
      setCellD(rr, 1, x.descrizione || '', stileCella('left'));
      setCellD(rr, 2, x.um || '', stileCella('center'));
      setCellD(rr, 3, Number(x.quantita) || 0, stileCella('right', { numFmt: FMT_NUM }));
      setCellD(rr, 4, Number(x.prezzoElementare) || 0, stileCella('right', { numFmt: FMT_VALUTA }));
      setFormulaD(rr, 5, `D${rigaExcel}*E${rigaExcel}`, (Number(x.quantita) || 0) * (Number(x.prezzoElementare) || 0), stileCella('right', { numFmt: FMT_VALUTA }));
      rr++;
    });
    const rUltimaRiga = rr - 1;
    setCellD(rr, 1, 'Totale parziale', { font: { ...fontBase, bold: true } });
    setFormulaD(rr, 5, `SUM(F${rPrimaRiga + 1}:F${rUltimaRiga + 1})`, det.totali.totaleParziale, stileTotale('right', { numFmt: FMT_VALUTA }));
    const rTotaleParziale = rr; rr++;
    setCellD(rr, 1, `Spese generali ${det.percentualeSpeseGenerali}%`, {});
    setFormulaD(rr, 5, `F${rTotaleParziale + 1}*${det.percentualeSpeseGenerali}/100`, det.totali.speseGenerali, stileCella('right', { numFmt: FMT_VALUTA }));
    const rSpeseGenerali = rr; rr++;
    setCellD(rr, 1, `Utile impresa ${det.percentualeUtileImpresa}%`, {});
    setFormulaD(rr, 5, `(F${rTotaleParziale + 1}+F${rSpeseGenerali + 1})*${det.percentualeUtileImpresa}/100`, det.totali.utileImpresa, stileCella('right', { numFmt: FMT_VALUTA }));
    const rUtileImpresa = rr; rr++;
    setCellD(rr, 1, 'TOTALE', { font: { ...fontBase, bold: true } });
    setFormulaD(rr, 5, `SUM(F${rTotaleParziale + 1}:F${rUtileImpresa + 1})`, det.totali.totaleFinale, stileTotale('right', { numFmt: FMT_VALUTA }));
    det._rTotale = rr; rr += 2;
    setCellD(rr, 4, 'incidenza manodopera', { font: { ...fontBase, italic: true } });
    const righeMdo = det._righeMdo || [];
    if (righeMdo.length) {
      const rifs = righeMdo.map(x => `F${rPrimaRiga + 1 + det.righe.indexOf(x)}`).join('+');
      setFormulaD(rr, 5, `(${rifs})/F${rTotaleParziale + 1}`, det._incidenzaManodopera, { numFmt: FMT_PCT });
    } else {
      setCellD(rr, 5, det._incidenzaManodopera, { numFmt: FMT_PCT });
    }
    det._rIncidenza = rr;

    wsDet['!cols'] = [{ wch: 18 }, { wch: 45 }, { wch: 7 }, { wch: 10 }, { wch: 12 }, { wch: 13 }];
    wsDet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rr, c: 5 } });
    fogliDettaglio.push({ nome: det.nomeFoglio, ws: wsDet });
  });

  const ws = {};
  const setCell = (r, c, v, style, tipo) => {
    const addr = XLSX.utils.encode_cell({ r, c });
    ws[addr] = { t: tipo || (typeof v === 'number' ? 'n' : 's'), v: v == null ? '' : v, ...(style ? { s: style } : {}) };
  };
  const setFormula = (r, c, formula, cachedValue, style) => {
    const addr = XLSX.utils.encode_cell({ r, c });
    ws[addr] = { t: 'n', v: (cachedValue == null || isNaN(cachedValue)) ? 0 : cachedValue, f: formula, s: style };
  };
  const merges = [];
  const meurgeRiga = (r, c1, c2) => { if (c2 > c1) merges.push({ s: { r, c: c1 }, e: { r, c: c2 } }); };

  const N_COL = _INTESTAZIONI_COMPUTO.length; // 0..10 → A..K
  const C_N = 0, C_FONTE = 1, C_CODICE = 2, C_DESCR = 3, C_UM = 4, C_PREZZO = 5, C_QTA = 6, C_IMPORTO = 7, C_MDO = 8, C_INCID = 9, C_COMMENTO = 10;

  let r = 0;
  setCell(r, 0, nomeProgetto, stileTitolo); meurgeRiga(r, 0, N_COL - 1); r++;
  setCell(r, 0, `Generato il ${data} alle ${ora} — ${voci.length} voc${voci.length === 1 ? 'e' : 'i'}`, stileSottotitolo); meurgeRiga(r, 0, N_COL - 1); r += 2;

  // Scrive l'intestazione colonne del computo (comune a capitoli e oneri sicurezza).
  const scriviIntestazioneComputo = () => { _INTESTAZIONI_COMPUTO.forEach((h, c) => setCell(r, c, h, stileIntestazione)); r++; };

  // Scrive una riga-voce e ritorna {importo, costoMdo} calcolati (per la
  // somma del capitolo) — collega prezzo/incidenza al foglio di dettaglio
  // Analisi Prezzi quando disponibile, con vere formule Excel.
  const scriviRigaVoce = (n, v) => {
    const rigaExcel = r + 1;
    setCell(r, C_N, n, stileCella('center'));
    setCell(r, C_FONTE, _etichettaFonteVoceProgetto(v), stileCella('left'));
    setCell(r, C_CODICE, v.codice || '', stileCella('left'));
    setCell(r, C_DESCR, v.descrizione || '', stileCella('left'));
    setCell(r, C_UM, v.um || '', stileCella('center'));

    const det = dettagli.get(v.id);
    const prezzo = det ? det.totali.totaleFinale : (v.prezzo != null ? Number(v.prezzo) : 0);
    if (det) {
      const foglio = det.nomeFoglio;
      setFormula(r, C_PREZZO, `'${foglio}'!F${det._rTotale + 1}`, det.totali.totaleFinale, stileCella('right', { numFmt: FMT_VALUTA }));
      setFormula(r, C_INCID, `'${foglio}'!F${det._rIncidenza + 1}`, det._incidenzaManodopera, stileCella('right', { numFmt: FMT_PCT }));
    } else {
      setCell(r, C_PREZZO, v.prezzo != null ? Number(v.prezzo) : '', stileCella('right', { numFmt: FMT_VALUTA }));
      setCell(r, C_INCID, v.manodopera != null ? Number(v.manodopera) / 100 : '', stileCella('right', { numFmt: FMT_PCT }));
    }
    setCell(r, C_QTA, Number(v.quantita || 0), stileCella('right', { numFmt: FMT_NUM }));
    const importoCalcolato = prezzo * Number(v.quantita || 0);
    setFormula(r, C_IMPORTO, `G${rigaExcel}*F${rigaExcel}`, importoCalcolato, stileCella('right', { numFmt: FMT_VALUTA }));
    const jVal = det ? det._incidenzaManodopera : (v.manodopera != null ? Number(v.manodopera) / 100 : 0);
    const costoMdoCalcolato = importoCalcolato * jVal;
    setFormula(r, C_MDO, `H${rigaExcel}*J${rigaExcel}`, costoMdoCalcolato, stileCella('right', { numFmt: FMT_VALUTA }));
    setCell(r, C_COMMENTO, v.commento || '', stileCella('left'));
    r++;
    return { importo: importoCalcolato, costoMdo: costoMdoCalcolato };
  };

  // Riga TOTALE di una sezione (capitolo od oneri sicurezza): somma
  // importo/costo manodopera con vere formule SUM, incidenza = rapporto.
  const scriviRigaTotale = (rPrimaVoce, rUltimaVoce, sommaImporto, sommaMdo) => {
    const rangeH = `H${rPrimaVoce + 1}:H${rUltimaVoce + 1}`;
    const rangeI = `I${rPrimaVoce + 1}:I${rUltimaVoce + 1}`;
    for (let c = 0; c < N_COL; c++) setCell(r, c, '', stileTotale(c >= C_QTA ? 'right' : 'left'));
    setCell(r, C_DESCR, 'TOTALE', stileTotale('left'));
    setFormula(r, C_IMPORTO, `SUM(${rangeH})`, sommaImporto, stileTotale('right', { numFmt: FMT_VALUTA }));
    setFormula(r, C_MDO, `SUM(${rangeI})`, sommaMdo, stileTotale('right', { numFmt: FMT_VALUTA }));
    setFormula(r, C_INCID, `I${r + 1}/H${r + 1}`, sommaImporto ? sommaMdo / sommaImporto : 0, stileTotale('right', { numFmt: FMT_PCT }));
    const rigaTotale = r;
    r++;
    return rigaTotale;
  };

  // ── Capitoli numerati ──
  capitoli.forEach(cap => {
    setCell(r, 0, cap.numero, stileCapNumero); meurgeRiga(r, 0, N_COL - 1); r++;
    setCell(r, 0, cap.titolo.toUpperCase(), stileCapTitolo); meurgeRiga(r, 0, N_COL - 1); r++;
    r++;
    scriviIntestazioneComputo();
    const rPrimaVoce = r;
    let sommaImporto = 0, sommaMdo = 0;
    cap.voci.forEach((v, i) => { const { importo, costoMdo } = scriviRigaVoce(i + 1, v); sommaImporto += importo; sommaMdo += costoMdo; });
    cap._rigaTotale = scriviRigaTotale(rPrimaVoce, r - 1, sommaImporto, sommaMdo);
    cap._totaleImporto = sommaImporto; cap._totaleMdo = sommaMdo;
    r++;
  });

  // ── RIEPILOGO (un rigo per capitolo) ──
  setCell(r, 0, 'RIEPILOGO', stileSezione); meurgeRiga(r, 0, N_COL - 1); r += 2;
  setCell(r, C_N, 'n', stileIntestazione); setCell(r, C_DESCR, 'Descrizione', stileIntestazione); setCell(r, C_IMPORTO, 'Importo', stileIntestazione); setCell(r, C_INCID, 'Incidenza manodopera', stileIntestazione);
  [C_FONTE, C_CODICE, C_UM, C_PREZZO, C_QTA, C_MDO, C_COMMENTO].forEach(c => setCell(r, c, '', stileIntestazione));
  r++;
  const rPrimaRiepilogo = r;
  capitoli.forEach(cap => {
    setCell(r, C_N, cap.numero, stileCella('center'));
    setCell(r, C_DESCR, cap.titolo, stileCella('left'));
    setFormula(r, C_IMPORTO, `H${cap._rigaTotale + 1}`, cap._totaleImporto, stileCella('right', { numFmt: FMT_VALUTA }));
    setFormula(r, C_INCID, `J${cap._rigaTotale + 1}`, cap._totaleImporto ? cap._totaleMdo / cap._totaleImporto : 0, stileCella('right', { numFmt: FMT_PCT }));
    r++;
  });
  const rUltimaRiepilogo = r - 1;
  const totaleOpere = capitoli.reduce((s, c) => s + c._totaleImporto, 0);
  const mdoOpere = capitoli.reduce((s, c) => s + c._totaleMdo, 0);
  for (let c = 0; c < N_COL; c++) setCell(r, c, '', stileTotale(c >= C_QTA ? 'right' : 'left'));
  setCell(r, C_DESCR, 'TOTALE', stileTotale('left'));
  setFormula(r, C_IMPORTO, `SUM(H${rPrimaRiepilogo + 1}:H${rUltimaRiepilogo + 1})`, totaleOpere, stileTotale('right', { numFmt: FMT_VALUTA }));
  // Incidenza pesata sull'importo di ciascun capitolo (NON una media semplice
  // delle percentuali: un capitolo da poche centinaia di euro e uno da
  // decine di migliaia non devono pesare uguale). SUMPRODUCT(H,J) ricostruisce
  // il costo manodopera di ogni capitolo (importo × incidenza) e lo somma,
  // poi lo divide per l'importo totale già calcolato nella stessa riga.
  setFormula(r, C_INCID, `SUMPRODUCT(H${rPrimaRiepilogo + 1}:H${rUltimaRiepilogo + 1},J${rPrimaRiepilogo + 1}:J${rUltimaRiepilogo + 1})/H${r + 1}`, totaleOpere ? mdoOpere / totaleOpere : 0, stileTotale('right', { numFmt: FMT_PCT }));
  const rigaRiepilogoTotale = r;
  r += 2;

  // ── ONERI PER LA SICUREZZA + RIEPILOGO TOTALE (solo se presenti) ──
  if (oneriSicurezza.length) {
    setCell(r, 0, 'ONERI PER LA SICUREZZA', stileCapTitolo); meurgeRiga(r, 0, N_COL - 1); r++;
    r++;
    scriviIntestazioneComputo();
    const rPrimaVoce = r;
    let sommaImporto = 0, sommaMdo = 0;
    oneriSicurezza.forEach((v, i) => { const { importo, costoMdo } = scriviRigaVoce(i + 1, v); sommaImporto += importo; sommaMdo += costoMdo; });
    const rigaTotaleOneri = scriviRigaTotale(rPrimaVoce, r - 1, sommaImporto, sommaMdo);
    r += 2;

    setCell(r, 0, 'RIEPILOGO TOTALE', stileSezione); meurgeRiga(r, 0, N_COL - 1); r += 2;
    setCell(r, C_DESCR, 'Descrizione', stileIntestazione); setCell(r, C_IMPORTO, 'Importo', stileIntestazione); setCell(r, C_INCID, 'Incidenza manodopera', stileIntestazione);
    [C_N, C_FONTE, C_CODICE, C_UM, C_PREZZO, C_QTA, C_MDO, C_COMMENTO].forEach(c => setCell(r, c, '', stileIntestazione));
    r++;
    const rigaOpereRT = r;
    setCell(r, C_DESCR, 'Opere (RIEPILOGO)', stileCella('left'));
    setFormula(r, C_IMPORTO, `H${rigaRiepilogoTotale + 1}`, totaleOpere, stileCella('right', { numFmt: FMT_VALUTA }));
    setFormula(r, C_INCID, `J${rigaRiepilogoTotale + 1}`, totaleOpere ? mdoOpere / totaleOpere : 0, stileCella('right', { numFmt: FMT_PCT }));
    r++;
    const rigaOneriRT = r;
    setCell(r, C_DESCR, 'Oneri per la sicurezza', stileCella('left'));
    setFormula(r, C_IMPORTO, `H${rigaTotaleOneri + 1}`, sommaImporto, stileCella('right', { numFmt: FMT_VALUTA }));
    setFormula(r, C_INCID, `J${rigaTotaleOneri + 1}`, sommaImporto ? sommaMdo / sommaImporto : 0, stileCella('right', { numFmt: FMT_PCT }));
    r++;
    for (let c = 0; c < N_COL; c++) setCell(r, c, '', stileTotale(c >= C_QTA ? 'right' : 'left'));
    setCell(r, C_DESCR, 'TOTALE COMPLESSIVO', stileTotale('left'));
    setFormula(r, C_IMPORTO, `SUM(H${rigaOpereRT + 1}:H${rigaOneriRT + 1})`, totaleOpere + sommaImporto, stileTotale('right', { numFmt: FMT_VALUTA }));
    // Stessa logica pesata della riga TOTALE del RIEPILOGO: incidenza = costo
    // manodopera complessivo (opere + oneri) diviso importo complessivo, non
    // la media delle due percentuali.
    const totaleComplessivo = totaleOpere + sommaImporto;
    setFormula(r, C_INCID, `SUMPRODUCT(H${rigaOpereRT + 1}:H${rigaOneriRT + 1},J${rigaOpereRT + 1}:J${rigaOneriRT + 1})/H${r + 1}`, totaleComplessivo ? (mdoOpere + sommaMdo) / totaleComplessivo : 0, stileTotale('right', { numFmt: FMT_PCT }));
    r++;
  }

  ws['!merges'] = merges;
  ws['!cols'] = [
    { wch: 5 }, { wch: 22 }, { wch: 16 }, { wch: 60 }, { wch: 7 },
    { wch: 12 }, { wch: 8 }, { wch: 13 }, { wch: 14 }, { wch: 12 }, { wch: 26 },
  ];
  ws['!margins'] = { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r, c: N_COL - 1 } });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Computo');
  // I fogli di dettaglio sono già pronti (costruiti sopra, prima del foglio
  // principale): qui li si aggiunge solo al workbook, nell'ordine in cui
  // compaiono le rispettive voci.
  fogliDettaglio.forEach(f => XLSX.utils.book_append_sheet(wb, f.ws, f.nome));

  XLSX.writeFile(wb, `${nomeProgetto.replace(/[^\w\- ]/g, '')}.xlsx`);
}

// PDF: stessa struttura a capitoli dell'export Excel (senza formule, solo
// valori) — orizzontale A4, con una piccola tabella di dettaglio in
// appendice per ogni voce di Analisi Prezzi risolvibile.
async function esportaProgettoPDF() {
  if (!PROGETTI_STATE.voci.length) { alert('Nessuna voce da esportare.'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const { data, ora } = _dataOraEsportazione();
  const voci = PROGETTI_STATE.voci;
  const { capitoli, oneriSicurezza } = _raggruppaPerCapitolo(voci);
  const dettagli = await _raccogliDettagliAnalisi(voci);

  const PAGE_H = doc.internal.pageSize.getHeight();
  let y = 15;
  const assicuraSpazio = minimo => { if (y + minimo > PAGE_H - 12) { doc.addPage(); y = 15; } };

  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.text(PROGETTI_STATE.progettoAttivo.nome, 14, y); y += 6;
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generato il ${data} alle ${ora} — ${voci.length} voc${voci.length === 1 ? 'e' : 'i'}`, 14, y); y += 6;

  const rigaVoce = v => {
    const det = dettagli.get(v.id);
    const prezzo = det ? det.totali.totaleFinale : (v.prezzo != null ? Number(v.prezzo) : 0);
    const incidenza = det ? det._incidenzaManodopera : (v.manodopera != null ? Number(v.manodopera) / 100 : 0);
    const importo = prezzo * Number(v.quantita || 0);
    return {
      cells: [
        _etichettaFonteVoceProgetto(v), v.codice || '', v.descrizione || '', v.um || '',
        prezzo.toFixed(2) + ' €', Number(v.quantita || 0).toFixed(2),
        importo.toFixed(2) + ' €', (importo * incidenza).toFixed(2) + ' €', (incidenza * 100).toFixed(2) + '%',
      ],
      importo, costoMdo: importo * incidenza,
    };
  };

  const HEAD = [['Prezzario', 'Codice', 'Descrizione', 'U.M.', 'Prezzo', 'Q.tà', 'Importo lavori', 'Costo mdo.', 'Incid. mdo.']];
  const disegnaTabella = (titolo, righeVoci, etichettaTotale) => {
    assicuraSpazio(20);
    doc.setFontSize(11); doc.setTextColor(31, 41, 55); doc.setFont(undefined, 'bold');
    doc.text(titolo, 14, y); doc.setFont(undefined, 'normal'); y += 4;
    let sommaImporto = 0, sommaMdo = 0;
    const body = righeVoci.map((v, i) => {
      const { cells, importo, costoMdo } = rigaVoce(v);
      sommaImporto += importo; sommaMdo += costoMdo;
      return [String(i + 1), ...cells];
    });
    doc.autoTable({
      startY: y,
      head: [['n', ...HEAD[0]]],
      body,
      foot: [['', '', '', '', '', '', etichettaTotale, sommaImporto.toFixed(2) + ' €', sommaMdo.toFixed(2) + ' €', sommaImporto ? (sommaMdo / sommaImporto * 100).toFixed(2) + '%' : '0%']],
      styles: { fontSize: 7, cellPadding: 1.5, valign: 'middle' },
      headStyles: { fillColor: [217, 217, 217], textColor: [31, 41, 55], halign: 'center' },
      footStyles: { fillColor: [229, 231, 235], textColor: [31, 41, 55], fontStyle: 'bold', halign: 'right' },
      columnStyles: { 0: { cellWidth: 8 }, 3: { cellWidth: 'auto' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' } },
      margin: { left: 14, right: 14 },
      showFoot: 'lastPage',
    });
    y = doc.lastAutoTable.finalY + 8;
    return { sommaImporto, sommaMdo };
  };

  const totaliCapitoli = capitoli.map(cap => ({ cap, ...disegnaTabella(`${cap.numero}  ${cap.titolo.toUpperCase()}`, cap.voci, 'TOTALE') }));

  // RIEPILOGO
  assicuraSpazio(20);
  doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.text('RIEPILOGO', 14, y); doc.setFont(undefined, 'normal'); y += 4;
  const totaleOpere = totaliCapitoli.reduce((s, t) => s + t.sommaImporto, 0);
  const mdoOpere = totaliCapitoli.reduce((s, t) => s + t.sommaMdo, 0);
  doc.autoTable({
    startY: y,
    head: [['n', 'Descrizione', 'Importo', 'Incidenza manodopera']],
    body: totaliCapitoli.map(t => [t.cap.numero, t.cap.titolo, t.sommaImporto.toFixed(2) + ' €', t.sommaImporto ? (t.sommaMdo / t.sommaImporto * 100).toFixed(2) + '%' : '0%']),
    foot: [['', 'TOTALE', totaleOpere.toFixed(2) + ' €', totaleOpere ? (mdoOpere / totaleOpere * 100).toFixed(2) + '%' : '0%']],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [217, 217, 217], textColor: [31, 41, 55] },
    footStyles: { fillColor: [229, 231, 235], textColor: [31, 41, 55], fontStyle: 'bold' },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 8;

  if (oneriSicurezza.length) {
    const totaliOneri = disegnaTabella('ONERI PER LA SICUREZZA', oneriSicurezza, 'TOTALE');
    assicuraSpazio(20);
    doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.text('RIEPILOGO TOTALE', 14, y); doc.setFont(undefined, 'normal'); y += 4;
    doc.autoTable({
      startY: y,
      head: [['Descrizione', 'Importo', 'Incidenza manodopera']],
      body: [
        ['Opere (RIEPILOGO)', totaleOpere.toFixed(2) + ' €', totaleOpere ? (mdoOpere / totaleOpere * 100).toFixed(2) + '%' : '0%'],
        ['Oneri per la sicurezza', totaliOneri.sommaImporto.toFixed(2) + ' €', totaliOneri.sommaImporto ? (totaliOneri.sommaMdo / totaliOneri.sommaImporto * 100).toFixed(2) + '%' : '0%'],
      ],
      foot: [['TOTALE COMPLESSIVO', (totaleOpere + totaliOneri.sommaImporto).toFixed(2) + ' €', '']],
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [217, 217, 217], textColor: [31, 41, 55] },
      footStyles: { fillColor: [229, 231, 235], textColor: [31, 41, 55], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Appendice: dettaglio Analisi Prezzi per voce risolvibile.
  if (dettagli.size) {
    assicuraSpazio(15);
    doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.text('DETTAGLIO ANALISI PREZZI', 14, y); doc.setFont(undefined, 'normal'); y += 6;
    dettagli.forEach(det => {
      assicuraSpazio(18);
      doc.setFontSize(9); doc.setFont(undefined, 'bold');
      doc.text(`${det.codice} — ${det.descrizione}`, 14, y); doc.setFont(undefined, 'normal'); y += 3;
      doc.autoTable({
        startY: y,
        head: [['Codice', 'Descrizione', 'U.M.', 'Quantità', 'Prezzo elem.', 'Importo']],
        body: det.righe.map(x => [x.codice || '', x.descrizione || '', x.um || '', (Number(x.quantita) || 0).toFixed(2), (Number(x.prezzoElementare) || 0).toFixed(2) + ' €', ((Number(x.quantita) || 0) * (Number(x.prezzoElementare) || 0)).toFixed(2) + ' €']),
        foot: [
          ['', '', '', '', 'Totale parziale', det.totali.totaleParziale.toFixed(2) + ' €'],
          ['', '', '', '', `Spese generali ${det.percentualeSpeseGenerali}%`, det.totali.speseGenerali.toFixed(2) + ' €'],
          ['', '', '', '', `Utile impresa ${det.percentualeUtileImpresa}%`, det.totali.utileImpresa.toFixed(2) + ' €'],
          ['', '', '', '', 'TOTALE', det.totali.totaleFinale.toFixed(2) + ' €'],
        ],
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [217, 217, 217], textColor: [31, 41, 55] },
        footStyles: { fillColor: [245, 245, 245], textColor: [31, 41, 55], fontStyle: 'bold' },
        columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
        margin: { left: 14, right: 14 },
        showFoot: 'lastPage',
      });
      y = doc.lastAutoTable.finalY + 6;
    });
  }

  doc.save(`${PROGETTI_STATE.progettoAttivo.nome.replace(/[^\w\- ]/g, '')}.pdf`);
}

// ─── Export XPWE (interscambio computo metrico ACCA — PriMus/Euclide/LeenO/Blumatica) ───
//
// Schema ricostruito analizzando un file .xpwe reale esportato da PriMus
// (non esiste una documentazione XSD pubblica completa). Struttura confermata:
//   PweDocumento
//     PweDatiGenerali > PweDGProgetto/PweDGDatiGenerali (dati testata)
//                     > PweDGCapitoliCategorie > PweDGSuperCategorie + PweDGCategorie
//                       (tabelle ID→nome; NON servono puntatori padre/figlio: ogni
//                       voce di computo dichiara da sola il proprio IDSpCat/IDCat)
//     PweMisurazioni > PweElencoPrezzi (un EPItem = un articolo di listino)
//                     > PweVociComputo (un VCItem = una riga del computo, con
//                       IDEP che punta al proprio EPItem, quantità totale, e
//                       una sotto-misura PweVCMisure/RGItem coerente)
// Verificato nel file campione: EPItem/VCItem/RGItem hanno ciascuno un proprio
// spazio di ID indipendente (le collisioni tra namespace diversi sono normali),
// mentre SuperCategoria e Categoria condividono UN SOLO spazio di ID fra loro
// (nessun ID è mai riusato fra le due tabelle) — per questo qui alloco due ID
// distinti per ogni gruppo "Fonte".
function _escapeXmlXpwe(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function _numeroXpwe(n, decimali) {
  return (Number(n) || 0).toFixed(decimali);
}

function esportaProgettoXPWE() {
  if (!PROGETTI_STATE.voci.length) { alert('Nessuna voce da esportare.'); return; }

  const voci = PROGETTI_STATE.voci;
  const nomeProgetto = PROGETTI_STATE.progettoAttivo.nome;
  const { data: oggi } = _dataOraEsportazione();

  // Un solo livello di raggruppamento reale: la "Fonte" già mostrata nell'area
  // di lavoro (es. "Prezzario DEI (ed. 2025)"). Viene scritta sia come
  // SuperCategoria che come Categoria (stesso schema visto nel file campione
  // quando un capitolo non ha sotto-livelli), così il computo importato in
  // PriMus/Euclide risulta organizzato per provenienza invece che come lista
  // piatta indistinta.
  let prossimoIdGruppo = 1;
  const gruppoPerEtichetta = new Map();
  const gruppiOrdinati = [];
  function gruppoDi(etichetta) {
    if (gruppoPerEtichetta.has(etichetta)) return gruppoPerEtichetta.get(etichetta);
    const g = { idSuperCat: prossimoIdGruppo++, idCat: prossimoIdGruppo++, etichetta };
    gruppoPerEtichetta.set(etichetta, g);
    gruppiOrdinati.push(g);
    return g;
  }

  let epId = 1, vcId = 1, rgId = 1;
  const epXml = [];
  const vcXml = [];

  voci.forEach(v => {
    const g = gruppoDi(_etichettaFonteVoceProgetto(v));
    const codice = v.codice || '';
    const descrizione = v.descrizione || '';
    const um = v.um || '';
    const prezzo = v.prezzo != null ? Number(v.prezzo) : 0;
    const quantita = Number(v.quantita || 0);
    const desBreve = codice ? `${codice} — ${descrizione}` : descrizione;

    const thisEp = epId++;
    epXml.push(
      `<EPItem ID="${thisEp}">` +
      `<TipoEP>0</TipoEP>` +
      `<Tariffa>${_escapeXmlXpwe(codice)}</Tariffa>` +
      `<Articolo>${_escapeXmlXpwe(codice)}</Articolo>` +
      `<DesRidotta>${_escapeXmlXpwe(descrizione)}</DesRidotta>` +
      `<DesEstesa>${_escapeXmlXpwe(descrizione)}</DesEstesa>` +
      `<DesBreve>${_escapeXmlXpwe(desBreve)}</DesBreve>` +
      `<UnMisura>${_escapeXmlXpwe(um)}</UnMisura>` +
      `<Prezzo1>${_numeroXpwe(prezzo, 2)}</Prezzo1>` +
      `<Prezzo2>${_numeroXpwe(prezzo, 2)}</Prezzo2>` +
      `<Prezzo3>0.00</Prezzo3><Prezzo4>0.00</Prezzo4><Prezzo5>0</Prezzo5>` +
      `<IDSpCap>0</IDSpCap><IDCap>0</IDCap><IDSbCap>0</IDSbCap>` +
      `<Flags>0</Flags>` +
      `<Data>${oggi}</Data>` +
      `<AdrInternet/>` +
      `<IncSIC>0.00000</IncSIC><IncMDO>0.00000</IncMDO><IncMAT>0.00</IncMAT><IncATTR>0.00</IncATTR>` +
      `<TagBIM/>` +
      `<PweEPAnalisi/>` +
      `</EPItem>`
    );

    const thisVc = vcId++;
    const thisRg = rgId++;
    const qStr = _numeroXpwe(quantita, 3);
    vcXml.push(
      `<VCItem ID="${thisVc}">` +
      `<IDEP>${thisEp}</IDEP>` +
      `<Quantita>${qStr}</Quantita>` +
      `<DataMis>${oggi}</DataMis>` +
      `<Flags/>` +
      `<IDSpCat>${g.idSuperCat}</IDSpCat><IDCat>${g.idCat}</IDCat><IDSbCat>0</IDSbCat>` +
      `<PweVCMisure>` +
      `<RGItem ID="${thisRg}">` +
      `<IDVV>-2</IDVV>` +
      `<Descrizione/>` +
      `<PartiUguali>${qStr}</PartiUguali>` +
      `<Lunghezza/><Larghezza/><HPeso/>` +
      `<Quantita>${qStr}</Quantita>` +
      `<Flags/>` +
      `</RGItem>` +
      `</PweVCMisure>` +
      `</VCItem>`
    );
  });

  const superCategorieXml = gruppiOrdinati.map(g =>
    `<DGSuperCategorieItem ID="${g.idSuperCat}">` +
    `<DesSintetica>${_escapeXmlXpwe(g.etichetta)}</DesSintetica>` +
    `<DesEstesa/><DataInit/><Durata>0</Durata><CodFase/><Percentuale>0</Percentuale><Codice/>` +
    `</DGSuperCategorieItem>`
  ).join('');
  const categorieXml = gruppiOrdinati.map(g =>
    `<DGCategorieItem ID="${g.idCat}">` +
    `<DesSintetica>${_escapeXmlXpwe(g.etichetta)}</DesSintetica>` +
    `<DesEstesa/><DataInit/><Durata>0</Durata><CodFase/><Percentuale>0</Percentuale><Codice/>` +
    `</DGCategorieItem>`
  ).join('');

  const xml =
    `<?xml version='1.0' encoding='UTF-8' ?>` +
    `<PweDocumento>` +
    `<CopyRight>Copyright ACCA software S.p.A.</CopyRight>` +
    `<TipoDocumento>1</TipoDocumento>` +
    `<TipoFormato>XMLPwe</TipoFormato>` +
    `<Versione>5.01</Versione>` +
    `<SourceVersione>1.0</SourceVersione>` +
    `<SourceNome>notspannometrica</SourceNome>` +
    `<FileNameDocumento>${_escapeXmlXpwe(nomeProgetto)}.xpwe</FileNameDocumento>` +
    `<PweDatiGenerali>` +
    `<PweDGProgetto>` +
    `<PweDGDatiGenerali>` +
    `<PercPrezzi>0</PercPrezzi>` +
    `<Comune/>` +
    `<Oggetto>${_escapeXmlXpwe(nomeProgetto)}</Oggetto>` +
    `<Committente/>` +
    `<Impresa/>` +
    `</PweDGDatiGenerali>` +
    `</PweDGProgetto>` +
    `<PweDGCapitoliCategorie>` +
    `<PweDGSuperCapitoli/>` +
    `<PweDGSuperCategorie>${superCategorieXml}</PweDGSuperCategorie>` +
    `<PweDGCategorie>${categorieXml}</PweDGCategorie>` +
    `</PweDGCapitoliCategorie>` +
    `<PweDGModuli>` +
    `<PweDGAnalisi>` +
    `<SpeseUtili>-1</SpeseUtili><SpeseGenerali>0.00</SpeseGenerali><UtiliImpresa>0.00</UtiliImpresa>` +
    `<OneriAccessoriSc>0</OneriAccessoriSc><ConfQuantita>11.3|1</ConfQuantita>` +
    `</PweDGAnalisi>` +
    `</PweDGModuli>` +
    `<PweDGConfigurazione>` +
    `<PweDGConfigNumeri>` +
    `<Divisa>euro</Divisa><ConversioniIN>lire</ConversioniIN><FattoreConversione>1936.27</FattoreConversione>` +
    `<Cambio>1</Cambio><PartiUguali>9.3|0</PartiUguali><Lunghezza>9.3|0</Lunghezza><Larghezza>9.3|0</Larghezza>` +
    `<HPeso>9.3|0</HPeso><Quantita>10.3|1</Quantita><Prezzi>10.5|1</Prezzi><PrezziTotale>14.2|1</PrezziTotale>` +
    `<ConvPrezzi>11.0|1</ConvPrezzi><ConvPrezziTotale>15.0|1</ConvPrezziTotale>` +
    `<IncidenzaPercentuale>7.3|0</IncidenzaPercentuale><Aliquote>7.3|0</Aliquote>` +
    `</PweDGConfigNumeri>` +
    `</PweDGConfigurazione>` +
    `</PweDatiGenerali>` +
    `<PweMisurazioni>` +
    `<PweElencoPrezzi>${epXml.join('')}</PweElencoPrezzi>` +
    `<PweVociComputo>${vcXml.join('')}</PweVociComputo>` +
    `</PweMisurazioni>` +
    `</PweDocumento>`;

  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nomeProgetto.replace(/[^\w\- ]/g, '')}.xpwe`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════════════════
// IMPORT XPWE → nuovo progetto in Progetti (diciottesima tornata).
//
// Percorso inverso di esportaProgettoXPWE qui sopra: NON aggiorna/sostituisce
// un progetto esistente, crea sempre un progetto NUOVO a partire dal file —
// non tocca in nessun modo i progetti già presenti.
//
// Struttura del file (uguale a quella scritta in esportaProgettoXPWE, e
// compatibile con l'export reale di PriMus/Euclide/LeenO/Blumatica):
//   - <PweElencoPrezzi><EPItem ID="n">...</EPItem>...</PweElencoPrezzi>
//     è l'elenco prezzi: un EPItem per ogni voce di prezzario referenziata
//     (codice/descrizione/U.M./prezzo).
//   - <PweVociComputo><VCItem ID="m"><IDEP>n</IDEP><Quantita>q</Quantita>
//     <IDCat>c</IDCat>...</VCItem>...</PweVociComputo> è il computo vero e
//     proprio: UNA riga per ogni VCItem (anche se più VCItem puntano allo
//     stesso EPItem — è del tutto legittimo, es. stessa voce usata in punti
//     diversi del cantiere con quantità diverse), che referenzia il proprio
//     EPItem tramite IDEP e il proprio capitolo (categoria) tramite IDCat.
//   - <PweDGCategorie><DGCategorieItem ID="c"><DesSintetica>Nome</...>
//     dà l'etichetta del capitolo — usata sia per il campo libero
//     "Capitolo" (per restare compatibile con l'export Excel/PDF già
//     esistente, che raggruppa su quel campo) sia per creare una vera riga
//     titolo (stesso meccanismo di aggiungiVoceAlProgetto/
//     salvaCapitoloProgetto — vedi la diciottesima tornata) prima della
//     prima voce di ogni capitolo, così il progetto importato risulta già
//     organizzato a schermo esattamente come lo era nel programma di
//     provenienza.
// Tutte le voci importate hanno fonte 'manuale': non provengono da nessuno
// dei magazzini interni (Computo/DEI/Veneto/Analisi Prezzi), quindi non
// possono agganciarsi a nessuna voce già presente lì.
function _txtXpwe(el, tag) {
  if (!el) return '';
  const n = el.getElementsByTagName(tag)[0];
  return n ? (n.textContent || '').trim() : '';
}
function _numXpwe(el, tag) {
  const t = _txtXpwe(el, tag).replace(',', '.');
  const n = parseFloat(t);
  return isNaN(n) ? 0 : n;
}

async function importaProgettoXPWE(file) {
  let xmlText;
  try {
    xmlText = await file.text();
  } catch (e) {
    alert('Impossibile leggere il file: ' + e.message);
    return;
  }

  let xmlDoc;
  try {
    xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (xmlDoc.getElementsByTagName('parsererror').length) throw new Error('il file non è un XML valido');
  } catch (e) {
    alert('Impossibile leggere questo file come XPWE: ' + e.message);
    return;
  }

  const epById = new Map();
  Array.from(xmlDoc.getElementsByTagName('EPItem')).forEach(ep => {
    epById.set(ep.getAttribute('ID'), {
      codice: _txtXpwe(ep, 'Tariffa') || _txtXpwe(ep, 'Articolo'),
      descrizione: _txtXpwe(ep, 'DesEstesa') || _txtXpwe(ep, 'DesRidotta') || _txtXpwe(ep, 'DesBreve'),
      um: _txtXpwe(ep, 'UnMisura'),
      prezzo: _numXpwe(ep, 'Prezzo1'),
    });
  });

  const categorieById = new Map();
  Array.from(xmlDoc.getElementsByTagName('DGCategorieItem')).forEach(c => {
    categorieById.set(c.getAttribute('ID'), _txtXpwe(c, 'DesSintetica') || _txtXpwe(c, 'DesEstesa'));
  });
  const superCategorieById = new Map();
  Array.from(xmlDoc.getElementsByTagName('DGSuperCategorieItem')).forEach(c => {
    superCategorieById.set(c.getAttribute('ID'), _txtXpwe(c, 'DesSintetica') || _txtXpwe(c, 'DesEstesa'));
  });

  const vcItems = Array.from(xmlDoc.getElementsByTagName('VCItem'));
  if (!vcItems.length) {
    alert('Non ho trovato nessuna voce di computo (VCItem) in questo file. Se il formato del tuo XPWE è diverso da quello previsto, fammelo sapere così sistemo la lettura.');
    return;
  }

  const righe = vcItems.map(vc => {
    const ep = epById.get(_txtXpwe(vc, 'IDEP')) || { codice: '', descrizione: '', um: '', prezzo: 0 };
    const idCat = _txtXpwe(vc, 'IDCat');
    const idSpCat = _txtXpwe(vc, 'IDSpCat');
    const capitolo = (idCat && categorieById.get(idCat)) || (idSpCat && superCategorieById.get(idSpCat)) || '';
    return {
      codice: ep.codice,
      descrizione: ep.descrizione,
      um: ep.um,
      prezzo: ep.prezzo,
      quantita: _numXpwe(vc, 'Quantita'),
      capitolo,
    };
  });

  const generali = xmlDoc.getElementsByTagName('PweDGDatiGenerali')[0];
  const oggetto = generali ? _txtXpwe(generali, 'Oggetto') : '';
  const fileNameDoc = xmlDoc.documentElement ? _txtXpwe(xmlDoc.documentElement, 'FileNameDocumento').replace(/\.xpwe$/i, '') : '';
  const nomeProgetto = oggetto || fileNameDoc || file.name.replace(/\.[^.]+$/, '');

  const numVoci = righe.length;
  const capitoliDistinti = [...new Set(righe.map(r => r.capitolo).filter(Boolean))];

  const conferma = await chiediScelta({
    titolo: 'Importa XPWE',
    corpo: `Trovate ${numVoci} voci di computo` + (capitoliDistinti.length ? ` in ${capitoliDistinti.length} capitoli` : '') +
      ` nel file "${file.name}".\n\nVerrà creato un progetto NUOVO chiamato "${nomeProgetto}" con queste voci — non tocca nessuno dei progetti già esistenti.`,
    bottoni: [
      { valore: 'annulla', testo: 'Annulla' },
      { valore: 'importa', testo: 'Crea nuovo progetto', classe: 'btn-blu' },
    ]
  });
  if (conferma !== 'importa') return;

  // Stessa scelta permanente di un progetto creato a mano (vedi
  // creaProgetto): le voci importate sono comunque sempre fonte 'manuale'
  // (non provengono da nessuno dei magazzini interni), quindi qui decide
  // solo quali schede resteranno disponibili in "Prendi voci da..." per
  // aggiungerne altre in seguito.
  const tipo = await chiediScelta({
    titolo: 'Progetto pubblico o privato?',
    corpo: 'Scelta permanente: non si potrà più cambiare dopo la creazione.\n\n' +
      '• Privato → nell\'area di lavoro si potranno usare solo le voci del Computo.\n' +
      '• Pubblico → si potranno usare solo le voci dei Prezzari (DEI/Veneto) e di Analisi Prezzi.',
    bottoni: [
      { valore: 'annulla', testo: 'Annulla' },
      { valore: 'privato', testo: 'Privato', classe: 'btn-blu' },
      { valore: 'pubblico', testo: 'Pubblico', classe: 'btn-blu' },
    ]
  });
  if (tipo !== 'privato' && tipo !== 'pubblico') return;

  try {
    const nuovoRef = await db.collection(PROGETTI_STATE.collName).add({
      nome: nomeProgetto,
      tipo,
      modello: false,
      creatoDa: (CURRENT_USER && CURRENT_USER.email) || '',
      creatoIl: Date.now(),
    });

    const collRifNuovo = db.collection(PROGETTI_STATE.collName).doc(nuovoRef.id).collection('voci');
    const capitoliGiaCreati = new Set();
    const datiDaScrivere = [];
    let ordine = 0;
    righe.forEach(r => {
      if (r.capitolo && !capitoliGiaCreati.has(r.capitolo)) {
        capitoliGiaCreati.add(r.capitolo);
        datiDaScrivere.push({
          tipo: 'titolo', fonte: 'manuale', fonteNumero: null, fonteEdizioneId: null, fonteEdizioneNome: null,
          codice: '', descrizione: r.capitolo, um: '', prezzo: null, manodopera: null, quantita: null,
          capitolo: '', oneriSicurezza: false, commento: '', ordine: ordine++,
        });
      }
      datiDaScrivere.push({
        tipo: 'voce', fonte: 'manuale', fonteNumero: null, fonteEdizioneId: null, fonteEdizioneNome: null,
        codice: r.codice, descrizione: r.descrizione, um: r.um, prezzo: r.prezzo, manodopera: null,
        quantita: r.quantita, capitolo: r.capitolo, oneriSicurezza: false, commento: '', ordine: ordine++,
      });
    });

    const CHUNK = 450;
    for (let i = 0; i < datiDaScrivere.length; i += CHUNK) {
      const batch = db.batch();
      datiDaScrivere.slice(i, i + CHUNK).forEach(d => batch.set(collRifNuovo.doc(), d));
      await batch.commit();
    }

    alert(`✓ Importazione completata: creato il progetto "${nomeProgetto}" con ${numVoci} voci.`);
  } catch (e) {
    alert('Errore durante l\'importazione: ' + e.message);
  }
}
