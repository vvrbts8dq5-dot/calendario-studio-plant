// ══════════════════════════════════════════════════════════════════════
// MODULO ANALISI PREZZI — quarto "magazzino", sotto Prezzario DEI nel menu.
//
// A differenza di Computo e dei due Prezzari (cataloghi/alberi di voci
// pronte), qui ogni "voce" è un'ANALISI DI UN NUOVO PREZZO: si costruisce
// componendo righe prese da Computo/Prezzario DEI/Prezzario Veneto (o
// inserite a mano), e il programma calcola in automatico spese generali e
// utile impresa per arrivare a un prezzo unitario finale — esattamente come
// un "Nuovo Prezzo" nei prezzari DEI/Regione Veneto veri.
//
// STRUTTURA — organizzata per ANNATE (edizioni), esattamente come i due
// Prezzari (vedi prezzario_module.js): un elenco di edizioni (es. "2026",
// "2027"), ciascuna con le proprie voci isolate. A differenza dei Prezzari,
// qui le voci restano un documento Firestore per voce (non "a blocchi": i
// volumi sono molto più piccoli, poche decine di voci, non migliaia).
//   {collBase}_edizioni/{edizioneId}                → {nome, creatoIl, creatoDa}
//   {collBase}_edizioni/{edizioneId}/voci/{voceId}   → le voci di quell'annata
// Creando una nuova annata si può scegliere di IMPORTARE quella precedente
// così com'è (stesse voci, stesse righe), aggiornando in automatico — solo
// in quel momento, una tantum — il prezzo delle righe prese da Prezzario
// DEI/Veneto in base all'edizione di quei prezzari che si indica: si
// abbina per "codice" (l'articolo/codice del prezzario, stabile edizione
// dopo edizione). Le righe il cui codice non si trova più nella nuova
// edizione mantengono il vecchio prezzo ma vengono segnalate (campo
// "prezzoNonAggiornato") per un controllo manuale — vedi
// _importaEdizioneAnalisiPrezzi più sotto. Righe da Computo/manuali/esterne
// non hanno un'edizione a cui fare riferimento: restano copiate invariate.
//
// La vecchia collezione piatta 'analisi_prezzi_{disciplina}' (da prima che
// esistessero le annate) NON viene toccata automaticamente: se contiene
// ancora dati, l'elenco edizioni mostra "Migra dati esistenti", stessa
// logica sicura già usata per i Prezzari (vedi _controllaMigrazionePrezzario
// in prezzario_module.js).
//
// Ogni documento-voce contiene:
//   numero                    — progressivo semplice (1, 2, 3...), automatico
//   descrizione                — titolo dell'analisi (es. "Quadro elettrico piazza")
//   unitaMisura                 — U.M. del prezzo finale (a corpo, cad, m...)
//   percentualeSpeseGenerali   — % (default 17, personalizzabile per voce)
//   percentualeUtileImpresa    — % (default 10, personalizzabile per voce)
//   righe: [{id, fonte, codice, descrizione, um, quantita, prezzoElementare}]
//   totaleParziale/speseGenerali/totaleConSpese/utileImpresa/totaleFinale
//                               — totali calcolati, salvati per essere letti
//                                 subito da liste ed export senza ricalcolare
//   creatoIl, creatoDa, modificatoIl
//
// Una volta salvata, la voce diventa disponibile in Progetti come quarta
// fonte "Analisi Prezzi" (vedi progetti_module.js — _statoFonte/FONTI_LABEL),
// con lo stesso prezzo finale calcolato qui usato come "prezzo" della voce.
//
// NOTA IMPLEMENTATIVA su un punto lasciato aperto da Giovanni: nella lista
// (vedi renderListaAnalisiPrezzi) non c'è un pulsante separato "Modifica
// voce" — cliccare la riga (o "Apri →") apre direttamente l'editor, dove
// tutto è modificabile. Se invece serve un pulsante a sé stante, va aggiunto
// qui.
// ══════════════════════════════════════════════════════════════════════

const ANALISI_PREZZI_STATE = {
  pageId: null,
  collBase: null,            // es. 'analisi_prezzi_elettrico' — anche nome della vecchia collezione piatta pre-annate
  edizioniCollName: null,
  disciplina: null,
  edizioni: [],               // elenco annate
  unsubEdizioni: null,
  edizioneAttiva: null,       // { id, nome }

  collName: null,             // path della sottocollezione voci, solo quando un'annata è aperta
  voci: [],                  // lista piatta (solo metadati + totali, per la pagina lista) dell'annata aperta
  unsubVoci: null,
  ricerca: '',
  selezioneAttiva: false,
  selezionate: new Set(),

  // ─── voce attualmente aperta nell'editor (schermo diviso) ───
  apertura: null,           // { id, numero, descrizione, unitaMisura, percentualeSpeseGenerali, percentualeUtileImpresa, righe:[...] }
  ricercaSinistra: '',
  modificaAttiva: false,    // "✎ Modifica" per codice/descrizione/U.M. delle righe già aggiunte
  fonteDestra: 'dei',       // 'dei' | 'veneto' | 'esterna'
  ricercaDestra: '',
  espansiDestra: new Set(),
  edizioneDestraSelezionata: { dei: null, veneto: null },
  vociEdizioneDestra: [],
};

const _PERC_SPESE_GENERALI_DEFAULT = 17;
const _PERC_UTILE_IMPRESA_DEFAULT = 10;
let _resizeListenerAnalisiAttivo = false;

function initAnalisiPrezzi(pageId, disciplina) {
  const state = ANALISI_PREZZI_STATE;
  state.pageId = pageId;
  state.collBase = 'analisi_prezzi_' + disciplina;
  state.edizioniCollName = state.collBase + '_edizioni';
  state.disciplina = disciplina;
  state.edizioni = [];
  state.edizioneAttiva = null;
  state.collName = null;
  state.voci = [];
  state.ricerca = '';
  state.selezioneAttiva = false;
  state.selezionate = new Set();
  state.apertura = null;

  state.unsubEdizioni = db.collection(state.edizioniCollName).onSnapshot(snap => {
    state.edizioni = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    state.edizioni.sort((a, b) => (b.creatoIl || 0) - (a.creatoIl || 0));
    if (!state.edizioneAttiva) renderElencoEdizioniAnalisi();
  }, err => {
    console.error(`Errore caricamento ${state.edizioniCollName}:`, err.message);
  });

  renderElencoEdizioniAnalisi();
}

function resetAnalisiPrezziModulo() {
  if (ANALISI_PREZZI_STATE.unsubVoci) { ANALISI_PREZZI_STATE.unsubVoci(); ANALISI_PREZZI_STATE.unsubVoci = null; }
  if (ANALISI_PREZZI_STATE.unsubEdizioni) { ANALISI_PREZZI_STATE.unsubEdizioni(); ANALISI_PREZZI_STATE.unsubEdizioni = null; }
  ANALISI_PREZZI_STATE.pageId = null;
  ANALISI_PREZZI_STATE.collBase = null;
  ANALISI_PREZZI_STATE.edizioniCollName = null;
  ANALISI_PREZZI_STATE.disciplina = null;
  ANALISI_PREZZI_STATE.edizioni = [];
  ANALISI_PREZZI_STATE.edizioneAttiva = null;
  ANALISI_PREZZI_STATE.collName = null;
  ANALISI_PREZZI_STATE.voci = [];
  ANALISI_PREZZI_STATE.apertura = null;
  ANALISI_PREZZI_STATE.edizioneDestraSelezionata = { dei: null, veneto: null };
  ANALISI_PREZZI_STATE.vociEdizioneDestra = [];
}

// ─── Calcolo totali (usata sia per salvare sia per la vista live) ───
function _ricalcolaTotaliAnalisi(righe, percSpeseGenerali, percUtileImpresa) {
  const totaleParziale = (righe || []).reduce((s, r) => s + (Number(r.quantita) || 0) * (Number(r.prezzoElementare) || 0), 0);
  const speseGenerali = totaleParziale * ((Number(percSpeseGenerali) || 0) / 100);
  const totaleConSpese = totaleParziale + speseGenerali;
  const utileImpresa = totaleConSpese * ((Number(percUtileImpresa) || 0) / 100);
  const totaleFinale = totaleConSpese + utileImpresa;
  return { totaleParziale, speseGenerali, totaleConSpese, utileImpresa, totaleFinale };
}

// ══════════════════════════════════════════════════════════════════════
// ELENCO ANNATE (edizioni) — stessa idea dei due Prezzari (vedi
// prezzario_module.js — renderElencoEdizioni/_controllaMigrazionePrezzario/
// migraDatiPrezzario/creaEdizionePrezzario/eliminaEdizionePrezzario), con
// l'aggiunta, qui, dell'importazione con aggiornamento prezzi automatico
// (vedi _importaEdizioneAnalisi più sotto).
// ══════════════════════════════════════════════════════════════════════
function renderElencoEdizioniAnalisi() {
  const state = ANALISI_PREZZI_STATE;
  const page = document.getElementById(state.pageId);
  if (!page) return;

  const statoDei = (typeof PREZZARIO_STATE !== 'undefined') ? PREZZARIO_STATE['dei'] : null;
  const statoVeneto = (typeof PREZZARIO_STATE !== 'undefined') ? PREZZARIO_STATE['veneto'] : null;

  page.innerHTML = `
    <div class="page-header">
      <div class="page-title">Analisi Prezzi</div>
    </div>

    <div class="card" style="margin-bottom:18px">
      <div class="form-row">
        <input id="analisi-nuova-edizione-nome" placeholder="Nome annata (es. 2026, Bozza 2027...)" style="flex:1;min-width:220px">
      </div>
      <div class="form-row" style="align-items:center">
        <label style="font-size:13px;color:var(--ink3);white-space:nowrap">Importa da</label>
        <select id="analisi-nuova-edizione-origine" style="flex:1;min-width:200px" onchange="_aggiornaFormNuovaEdizioneAnalisi()">
          <option value="">— Vuota (nessun import) —</option>
          ${state.edizioni.map(e => `<option value="${e.id}">${escapeHtml(e.nome)}</option>`).join('')}
        </select>
      </div>
      <div id="analisi-nuova-edizione-refresh-wrap" style="display:none">
        <div style="font-size:12px;color:var(--ink4);margin:6px 0 10px">
          Importando questa annata, le righe prese da Prezzario DEI/Veneto possono essere aggiornate in automatico ai prezzi di un'edizione a scelta di quei prezzari (abbinamento per codice). Lasciando "Non aggiornare" quelle righe restano con il prezzo che avevano nell'annata di partenza.
        </div>
        <div class="form-row" style="align-items:center">
          <label style="font-size:13px;color:var(--ink3);min-width:120px">Prezzario DEI</label>
          <select id="analisi-nuova-edizione-dei" style="flex:1;min-width:180px">
            <option value="">— Non aggiornare —</option>
            ${statoDei ? statoDei.edizioni.map(e => `<option value="${e.id}">${escapeHtml(e.nome)}</option>`).join('') : ''}
          </select>
        </div>
        <div class="form-row" style="align-items:center">
          <label style="font-size:13px;color:var(--ink3);min-width:120px">Prezzario Veneto</label>
          <select id="analisi-nuova-edizione-veneto" style="flex:1;min-width:180px">
            <option value="">— Non aggiornare —</option>
            ${statoVeneto ? statoVeneto.edizioni.map(e => `<option value="${e.id}">${escapeHtml(e.nome)}</option>`).join('') : ''}
          </select>
        </div>
      </div>
      <div class="form-row" style="margin-bottom:0;margin-top:6px">
        <button class="btn btn-blu" onclick="creaEdizioneAnalisi()">+ Nuova annata</button>
      </div>
    </div>

    <div id="analisi-migrazione-wrap"></div>

    <div id="analisi-edizioni-lista">
      ${state.edizioni.length ? '' : '<div class="empty-state">Non hai ancora nessuna annata. Creane una qui sopra (es. l\'anno).</div>'}
      ${state.edizioni.map(e => `
        <div class="progetto-riga">
          <div class="progetto-riga-nome" onclick="apriEdizioneAnalisi('${e.id}')">${escapeHtml(e.nome)}</div>
          <div class="progetto-riga-azioni">
            <button class="btn btn-sm" onclick="apriEdizioneAnalisi('${e.id}')">Apri →</button>
            <button class="btn btn-sm btn-rosso" onclick="eliminaEdizioneAnalisi('${e.id}','${escapeHtml(e.nome).replace(/'/g, "\\'")}')">Elimina</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  _controllaMigrazioneAnalisi();
}

function _aggiornaFormNuovaEdizioneAnalisi() {
  const origine = document.getElementById('analisi-nuova-edizione-origine');
  const wrap = document.getElementById('analisi-nuova-edizione-refresh-wrap');
  if (origine && wrap) wrap.style.display = origine.value ? 'block' : 'none';
}

// Se la vecchia collezione "piatta" (da prima delle annate) ha ancora dati
// non migrati, mostra un pulsante per copiarli in una nuova annata — stessa
// identica logica sicura di _controllaMigrazionePrezzario in
// prezzario_module.js (sola lettura finché l'utente non clicca).
async function _controllaMigrazioneAnalisi() {
  const state = ANALISI_PREZZI_STATE;
  const wrap = document.getElementById('analisi-migrazione-wrap');
  if (!state || !wrap) return;
  try {
    const snap = await db.collection(state.collBase).limit(1).get();
    if (snap.empty) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = `
      <div class="import-banner" style="display:flex;margin-bottom:18px">
        <span>Ho trovato dati nella vecchia lista unica, da prima delle annate. Vuoi spostarli in una nuova annata?</span>
        <button class="btn btn-blu btn-sm" onclick="migraDatiAnalisi()">Migra dati esistenti</button>
      </div>`;
  } catch (e) {
    wrap.innerHTML = `<div class="import-banner" style="display:flex"><span>Non riesco a controllare se ci sono dati da migrare: ${escapeHtml(_messaggioErroreFirestore(e))}</span></div>`;
  }
}

async function migraDatiAnalisi() {
  const state = ANALISI_PREZZI_STATE;
  const nome = prompt(
    'Che nome vuoi dare a questa annata migrata? (es. "2026" o "Corrente")\n\n' +
    'Se esiste già un\'annata con questo identico nome, i dati verranno aggiunti lì invece di crearne una copia.',
    'Corrente'
  );
  if (!nome) return;
  const wrap = document.getElementById('analisi-migrazione-wrap');
  if (wrap) wrap.innerHTML = '<div class="import-banner" style="display:flex"><span>Migrazione in corso, non chiudere la pagina...</span></div>';

  try {
    const vecchiaColl = db.collection(state.collBase);
    const snap = await vecchiaColl.get();
    const vociVecchie = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!vociVecchie.length) {
      if (wrap) wrap.innerHTML = '';
      return;
    }

    const edizioneEsistente = state.edizioni.find(e => e.nome === nome);
    let edizioneId = edizioneEsistente ? edizioneEsistente.id : null;
    if (!edizioneId) {
      const edRef = await db.collection(state.edizioniCollName).add({
        nome, creatoIl: Date.now(), creatoDa: (CURRENT_USER && CURRENT_USER.email) || '',
      });
      edizioneId = edRef.id;
    }

    const vociAttuali = await _leggiVociAnalisiDaServer(state.edizioniCollName, edizioneId);
    if (vociAttuali.length && vociAttuali.length !== vociVecchie.length) {
      throw new Error(
        `L'annata "${nome}" esiste già con ${vociAttuali.length} voci, diverse dalle ${vociVecchie.length} della vecchia lista. ` +
        `Per sicurezza non copio automaticamente (rischio doppioni): elimina l'annata "${nome}" se è un tentativo incompleto da rifare, oppure scegli un nome diverso.`
      );
    }
    if (!vociAttuali.length) {
      const collDest = db.collection(`${state.edizioniCollName}/${edizioneId}/voci`);
      const datiDaScrivere = vociVecchie.map(v => { const { id, ...dato } = v; return dato; });
      const CHUNK = 450;
      for (let i = 0; i < datiDaScrivere.length; i += CHUNK) {
        const batch = db.batch();
        datiDaScrivere.slice(i, i + CHUNK).forEach(dato => batch.set(collDest.doc(), dato));
        await batch.commit();
      }
    }

    await _cancellaTutteLeVoci(vecchiaColl, snap.docs.map(d => ({ id: d.id })));

    if (wrap) wrap.innerHTML = '';
    alert(`✓ Migrazione completata: ${vociVecchie.length} voci nell'annata "${nome}".`);
  } catch (e) {
    alert('Errore durante la migrazione: ' + _messaggioErroreFirestore(e));
    _controllaMigrazioneAnalisi();
  }
}

async function creaEdizioneAnalisi() {
  const state = ANALISI_PREZZI_STATE;
  const inpNome = document.getElementById('analisi-nuova-edizione-nome');
  const nome = inpNome.value.trim();
  if (!nome) { alert("Inserisci un nome per l'annata (es. l'anno)."); return; }

  const origineId = document.getElementById('analisi-nuova-edizione-origine').value || null;
  const deiEdizioneId = document.getElementById('analisi-nuova-edizione-dei').value || null;
  const venetoEdizioneId = document.getElementById('analisi-nuova-edizione-veneto').value || null;

  try {
    const edRef = await db.collection(state.edizioniCollName).add({
      nome, creatoIl: Date.now(), creatoDa: (CURRENT_USER && CURRENT_USER.email) || '',
    });

    if (origineId) {
      await _importaEdizioneAnalisi(edRef.id, origineId, deiEdizioneId, venetoEdizioneId);
    }

    inpNome.value = '';
    const selOrigine = document.getElementById('analisi-nuova-edizione-origine');
    if (selOrigine) selOrigine.value = '';
    _aggiornaFormNuovaEdizioneAnalisi();
  } catch (e) {
    alert("Errore nella creazione dell'annata: " + _messaggioErroreFirestore(e));
  }
}

async function eliminaEdizioneAnalisi(id, nome) {
  const state = ANALISI_PREZZI_STATE;
  const scelta = await chiediScelta({
    titolo: "Eliminare questa annata?",
    corpo: `Stai per eliminare definitivamente l'annata "${nome}" e TUTTE le sue voci. Non è annullabile.`,
    bottoni: [
      { valore: 'annulla', testo: 'Annulla' },
      { valore: 'conferma', testo: 'Elimina annata', classe: 'btn-rosso' }
    ]
  });
  if (scelta !== 'conferma') return;

  try {
    const vociSnap = await db.collection(`${state.edizioniCollName}/${id}/voci`).get();
    if (!vociSnap.empty) {
      await _cancellaTutteLeVoci(db.collection(`${state.edizioniCollName}/${id}/voci`), vociSnap.docs.map(d => ({ id: d.id })));
    }
  } catch (e) {
    alert(`Errore nella cancellazione delle voci dell'annata "${nome}": ${_messaggioErroreFirestore(e)}\n\nL'annata NON è stata eliminata. Riprova: le voci già cancellate non verranno ricancellate.`);
    return;
  }

  try {
    await db.collection(state.edizioniCollName).doc(id).delete();
  } catch (e) {
    alert(`Le voci di "${nome}" sono state cancellate, ma non sono riuscito a eliminare l'annata stessa: ${_messaggioErroreFirestore(e)}\n\nRiprova: questa volta non ci sono più voci da cancellare, dovrebbe essere veloce.`);
  }
}

// Lettura semplice: un documento Firestore per voce (NESSUN formato "a
// blocchi" — qui i volumi sono piccoli, poche decine di voci per annata, non
// migliaia come nei Prezzari). Non riusa apposta _leggiVociPrezzarioDaServer
// (import_prezzario.js): quella, non trovando blocchi, MIGREREBBE in
// automatico questi dati nel formato a blocchi, corrompendo lo schema "un
// documento per voce" di Analisi Prezzi.
async function _leggiVociAnalisiDaServer(edizioniCollName, edizioneId) {
  const snap = await db.collection(`${edizioniCollName}/${edizioneId}/voci`).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Legge le voci (tipo 'voce') di un'edizione di Prezzario DEI/Veneto e le
// restituisce come Map codice -> prezzo, per un abbinamento rapido durante
// l'importazione (UNA lettura per l'intera edizione, non una per riga).
async function _mappaPrezziEdizionePrezzario(fonte, edizioneId) {
  const mappa = new Map();
  const statoPrezzario = (typeof PREZZARIO_STATE !== 'undefined') ? PREZZARIO_STATE[fonte] : null;
  if (!statoPrezzario) return mappa;
  const voci = await _leggiVociPrezzarioDaServer(statoPrezzario.edizioniCollName, edizioneId);
  voci.forEach(v => {
    const codice = v.codice || v.numero;
    if (v.tipo === 'voce' && codice && v.prezzo != null) mappa.set(codice, Number(v.prezzo));
  });
  return mappa;
}

// Importa (clona) tutte le voci dell'annata "origineEdizioneId" nella nuova
// annata "nuovaEdizioneId", appena creata e ancora vuota — stesse voci,
// stesse righe, esattamente come richiesto da Giovanni. In più, per ogni
// riga presa da Prezzario DEI/Veneto (r.fonte === 'dei'|'veneto'), se per
// quella fonte è stata indicata un'edizione da cui aggiornare, cerca lo
// stesso "codice" in quell'edizione:
//   - lo trova   → aggiorna r.prezzoElementare al nuovo prezzo
//   - non lo trova → lascia il vecchio prezzo ma marca la riga con
//                     prezzoNonAggiornato:true, da controllare a mano (vedi
//                     il badge "⚠" in renderAreaLavoroAnalisi)
// Se per una fonte non è stata scelta nessuna edizione di aggiornamento, le
// sue righe restano copiate invariate (nessun tentativo, nessuna
// segnalazione). Le righe da Computo/manuale/esterna (fonte senza un
// prezzario a cui fare riferimento) restano SEMPRE copiate invariate.
// Operazione "una tantum": eseguita solo qui, al momento della creazione
// dell'annata — nessun bottone per ripeterla più avanti (richiesta esplicita
// di Giovanni).
// Funzione pura (nessun accesso a Firestore/stato globale): dato l'oggetto
// { dei: Map(codice->prezzo)?, veneto: Map(codice->prezzo)? } — con una
// chiave presente SOLO per le fonti per cui è stata scelta un'edizione di
// aggiornamento — decide come clonare una singola riga durante l'importazione
// di un'annata. Isolata così com'è (senza toccare Firestore) per poterla
// testare da sola: vedi /tmp/test_import_analisi.js.
function _clonaRigaConAggiornamentoPrezzo(r, mappaPrezziPerFonte) {
  const mappa = mappaPrezziPerFonte[r.fonte];
  if (!mappa) return { ...r }; // nessuna edizione scelta per questa fonte: riga copiata invariata
  const codice = r.codice || '';
  if (codice && mappa.has(codice)) {
    const { prezzoNonAggiornato, ...pulito } = r;
    return { ...pulito, prezzoElementare: mappa.get(codice) };
  }
  return { ...r, prezzoNonAggiornato: true };
}

async function _importaEdizioneAnalisi(nuovaEdizioneId, origineEdizioneId, deiEdizioneId, venetoEdizioneId) {
  const state = ANALISI_PREZZI_STATE;

  const vociOrigine = await _leggiVociAnalisiDaServer(state.edizioniCollName, origineEdizioneId);
  if (!vociOrigine.length) return;

  const mappaPrezziPerFonte = {};
  if (deiEdizioneId) mappaPrezziPerFonte.dei = await _mappaPrezziEdizionePrezzario('dei', deiEdizioneId);
  if (venetoEdizioneId) mappaPrezziPerFonte.veneto = await _mappaPrezziEdizionePrezzario('veneto', venetoEdizioneId);

  const collDest = db.collection(`${state.edizioniCollName}/${nuovaEdizioneId}/voci`);
  const CHUNK = 450;
  for (let i = 0; i < vociOrigine.length; i += CHUNK) {
    const batch = db.batch();
    vociOrigine.slice(i, i + CHUNK).forEach(voceVecchia => {
      const { id, ...datoVecchio } = voceVecchia;
      const righeNuove = (datoVecchio.righe || []).map(r => _clonaRigaConAggiornamentoPrezzo(r, mappaPrezziPerFonte));
      const totali = _ricalcolaTotaliAnalisi(righeNuove, datoVecchio.percentualeSpeseGenerali, datoVecchio.percentualeUtileImpresa);
      const datoNuovo = {
        ...datoVecchio,
        righe: righeNuove,
        ...totali,
        creatoDa: (CURRENT_USER && CURRENT_USER.email) || '',
        creatoIl: Date.now(),
        modificatoIl: Date.now(),
      };
      batch.set(collDest.doc(), datoNuovo);
    });
    await batch.commit();
  }
}

// ─── Apertura di un'annata: la stessa vista lista/editor di sempre ───
function apriEdizioneAnalisi(id) {
  const state = ANALISI_PREZZI_STATE;
  const edizione = state.edizioni.find(e => e.id === id);
  if (!edizione) return;
  state.edizioneAttiva = { id: edizione.id, nome: edizione.nome };
  state.collName = `${state.edizioniCollName}/${id}/voci`;
  state.voci = [];
  state.ricerca = '';
  state.selezioneAttiva = false;
  state.selezionate = new Set();
  state.apertura = null;

  if (state.unsubVoci) { state.unsubVoci(); state.unsubVoci = null; }
  state.unsubVoci = db.collection(state.collName).onSnapshot(snap => {
    state.voci = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    state.voci.sort((a, b) => (a.numero || 0) - (b.numero || 0));
    if (!state.apertura) renderListaAnalisiPrezzi();
  }, err => {
    console.error(`Errore caricamento ${state.collName}:`, err.message);
    const page = document.getElementById(state.pageId);
    if (page) page.innerHTML = `<div class="empty-state">Errore: ${escapeHtml(err.message)}</div>`;
  });

  renderListaAnalisiPrezzi();
}

function chiudiEdizioneAnalisi() {
  const state = ANALISI_PREZZI_STATE;
  if (state.unsubVoci) { state.unsubVoci(); state.unsubVoci = null; }
  state.edizioneAttiva = null;
  state.collName = null;
  state.voci = [];
  renderElencoEdizioniAnalisi();
}

// ══════════════════════════════════════════════════════════════════════
// PAGINA LISTA (le voci dell'annata aperta)
// ══════════════════════════════════════════════════════════════════════
function renderListaAnalisiPrezzi() {
  const state = ANALISI_PREZZI_STATE;
  const page = document.getElementById(state.pageId);
  if (!page || !state.edizioneAttiva) return;

  let voci = state.voci;
  if (state.ricerca) {
    const q = state.ricerca;
    voci = voci.filter(v => String(v.numero || '').includes(q) || (v.descrizione || '').toLowerCase().includes(q));
  }

  page.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <button class="btn btn-sm" onclick="chiudiEdizioneAnalisi()">← Annate</button>
        &nbsp; Analisi Prezzi — ${escapeHtml(state.edizioneAttiva.nome)}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <button class="btn btn-blu btn-sm" onclick="creaVoceAnalisiPrezzi()">+ Nuova voce</button>
        <button class="btn btn-sm" onclick="esportaListaAnalisiExcel()">⬇ Excel</button>
        <button class="btn btn-sm" onclick="esportaListaAnalisiPDF()">⬇ PDF</button>
        <button id="analisi-btn-elimina-voce" class="btn btn-rosso btn-sm" onclick="toggleModalitaSelezioneAnalisi()">Elimina voce</button>
        <button id="analisi-btn-conferma-elimina" class="btn btn-rosso btn-sm" style="display:none" onclick="eliminaSelezionateAnalisi()">Conferma eliminazione</button>
      </div>
    </div>

    <div class="toolbar">
      <input type="search" id="analisi-ricerca" placeholder="Cerca per numero o descrizione..." value="${escapeHtml(state.ricerca)}">
    </div>

    <div id="analisi-lista-wrap">
      ${state.voci.length ? '' : '<div class="empty-state">Non hai ancora nessuna voce in questa annata. Creane una con "+ Nuova voce": potrai comporla prendendo righe da Prezzario DEI/Prezzario Veneto oppure inserendole a mano.</div>'}
      ${voci.length === 0 && state.voci.length ? '<div class="empty-state">Nessuna voce trovata.</div>' : ''}
      ${voci.map(v => {
        const totali = _ricalcolaTotaliAnalisi(v.righe, v.percentualeSpeseGenerali, v.percentualeUtileImpresa);
        const totaleFinale = v.totaleFinale != null ? Number(v.totaleFinale) : totali.totaleFinale;
        const selezionato = state.selezionate.has(v.id);
        const azioni = state.selezioneAttiva
          ? `<input type="checkbox" class="selezione-checkbox" ${selezionato ? 'checked' : ''} onchange="toggleSelezioneVoceAnalisi('${v.id}')">`
          : `<button class="btn btn-sm" onclick="apriVoceAnalisiPrezzi('${v.id}')">Apri →</button>`;
        return `
          <div class="progetto-riga">
            <div class="progetto-riga-nome" ${state.selezioneAttiva ? '' : `onclick="apriVoceAnalisiPrezzi('${v.id}')"`}>
              <span class="albero-numero" style="margin-right:10px">${escapeHtml(String(v.numero ?? ''))}</span>
              ${escapeHtml(v.descrizione || '(senza descrizione)')}
              <span style="color:var(--ink4);font-weight:400"> — ${totaleFinale.toFixed(2)} €${v.unitaMisura ? ' / ' + escapeHtml(v.unitaMisura) : ''}</span>
            </div>
            <div class="progetto-riga-azioni">${azioni}</div>
          </div>`;
      }).join('')}
    </div>
  `;

  document.getElementById('analisi-ricerca').addEventListener('input', e => {
    state.ricerca = e.target.value.trim().toLowerCase();
    renderListaAnalisiPrezzi();
  });
  _aggiornaBottoniSelezioneAnalisi();
}

async function creaVoceAnalisiPrezzi() {
  const state = ANALISI_PREZZI_STATE;
  const prossimoNumero = state.voci.reduce((max, v) => Math.max(max, Number(v.numero) || 0), 0) + 1;
  const dato = {
    numero: prossimoNumero,
    descrizione: '',
    unitaMisura: '',
    percentualeSpeseGenerali: _PERC_SPESE_GENERALI_DEFAULT,
    percentualeUtileImpresa: _PERC_UTILE_IMPRESA_DEFAULT,
    righe: [],
    totaleParziale: 0, speseGenerali: 0, totaleConSpese: 0, utileImpresa: 0, totaleFinale: 0,
    creatoDa: (CURRENT_USER && CURRENT_USER.email) || '',
    creatoIl: Date.now(),
    modificatoIl: Date.now(),
  };
  try {
    const ref = await db.collection(state.collName).add(dato);
    apriVoceAnalisiPrezzi(ref.id, { id: ref.id, ...dato });
  } catch (e) {
    alert('Errore nella creazione della voce: ' + _messaggioErroreFirestore(e));
  }
}

// ─── Selezione multipla (lista) per eliminazione in blocco ───
function toggleModalitaSelezioneAnalisi() {
  const state = ANALISI_PREZZI_STATE;
  state.selezioneAttiva = !state.selezioneAttiva;
  state.selezionate = new Set();
  renderListaAnalisiPrezzi();
}

function toggleSelezioneVoceAnalisi(id) {
  const state = ANALISI_PREZZI_STATE;
  if (state.selezionate.has(id)) state.selezionate.delete(id);
  else state.selezionate.add(id);
  _aggiornaBottoniSelezioneAnalisi();
}

function _aggiornaBottoniSelezioneAnalisi() {
  const state = ANALISI_PREZZI_STATE;
  const btnElimina = document.getElementById('analisi-btn-elimina-voce');
  const btnConferma = document.getElementById('analisi-btn-conferma-elimina');
  if (!btnElimina || !btnConferma) return;
  if (state.selezioneAttiva) {
    btnElimina.textContent = 'Annulla selezione';
    const n = state.selezionate.size;
    btnConferma.style.display = 'inline-block';
    btnConferma.textContent = `Conferma eliminazione (${n})`;
    btnConferma.disabled = n === 0;
  } else {
    btnElimina.textContent = 'Elimina voce';
    btnConferma.style.display = 'none';
  }
}

async function eliminaSelezionateAnalisi() {
  const state = ANALISI_PREZZI_STATE;
  const ids = [...state.selezionate];
  if (!ids.length) { alert('Nessuna voce selezionata.'); return; }
  if (!confirm(`Eliminare ${ids.length} voc${ids.length === 1 ? 'e' : 'i'} di analisi prezzi? Non è annullabile.`)) return;
  try {
    const CHUNK = 450;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const batch = db.batch();
      ids.slice(i, i + CHUNK).forEach(id => batch.delete(db.collection(state.collName).doc(id)));
      await batch.commit();
    }
    state.selezioneAttiva = false;
    state.selezionate = new Set();
    renderListaAnalisiPrezzi();
  } catch (e) {
    alert("Errore nell'eliminazione multipla: " + _messaggioErroreFirestore(e));
  }
}

// ─── Export della lista (tutte le voci, o solo quelle selezionate) ───
function _vociDaEsportareAnalisi() {
  const state = ANALISI_PREZZI_STATE;
  return (state.selezioneAttiva && state.selezionate.size) ? state.voci.filter(v => state.selezionate.has(v.id)) : state.voci;
}

function esportaListaAnalisiExcel() {
  const voci = _vociDaEsportareAnalisi();
  if (!voci.length) { alert('Nessuna voce da esportare.'); return; }
  const rows = voci.map(v => {
    const t = v.totaleFinale != null ? Number(v.totaleFinale) : _ricalcolaTotaliAnalisi(v.righe, v.percentualeSpeseGenerali, v.percentualeUtileImpresa).totaleFinale;
    return { 'Numero': v.numero ?? '', 'Descrizione': v.descrizione || '', 'U.M.': v.unitaMisura || '', 'Prezzo': Number(t.toFixed(2)) };
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Analisi Prezzi');
  XLSX.writeFile(wb, `${ANALISI_PREZZI_STATE.collName}.xlsx`);
}

function esportaListaAnalisiPDF() {
  const voci = _vociDaEsportareAnalisi();
  if (!voci.length) { alert('Nessuna voce da esportare.'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(14);
  doc.text('Analisi Prezzi', 14, 15);
  doc.autoTable({
    startY: 22,
    head: [['Numero', 'Descrizione', 'U.M.', 'Prezzo']],
    body: voci.map(v => {
      const t = v.totaleFinale != null ? Number(v.totaleFinale) : _ricalcolaTotaliAnalisi(v.righe, v.percentualeSpeseGenerali, v.percentualeUtileImpresa).totaleFinale;
      return [v.numero ?? '', v.descrizione || '', v.unitaMisura || '', t.toFixed(2) + ' €'];
    }),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [34, 34, 34] },
  });
  doc.save(`${ANALISI_PREZZI_STATE.collName}.pdf`);
}

// ══════════════════════════════════════════════════════════════════════
// EDITOR DI UNA SINGOLA VOCE — schermo diviso (Area di lavoro | Prendi voci da...)
// ══════════════════════════════════════════════════════════════════════

// Apre l'editor. Se "datoIniziale" è passato (appena creata da
// creaVoceAnalisiPrezzi) lo usa direttamente; altrimenti fa una lettura
// singola e fresca da Firestore (non un onSnapshot: un solo dispositivo alla
// volta lavora su una voce, non serve ascolto in tempo reale).
async function apriVoceAnalisiPrezzi(id, datoIniziale) {
  const state = ANALISI_PREZZI_STATE;
  let dato = datoIniziale;
  if (!dato) {
    try {
      const doc = await db.collection(state.collName).doc(id).get();
      if (!doc.exists) { alert('Questa voce non esiste più.'); renderListaAnalisiPrezzi(); return; }
      dato = { id: doc.id, ...doc.data() };
    } catch (e) {
      alert('Errore nel caricamento della voce: ' + _messaggioErroreFirestore(e));
      return;
    }
  }
  state.apertura = {
    id: dato.id,
    numero: dato.numero,
    descrizione: dato.descrizione || '',
    unitaMisura: dato.unitaMisura || '',
    percentualeSpeseGenerali: dato.percentualeSpeseGenerali != null ? dato.percentualeSpeseGenerali : _PERC_SPESE_GENERALI_DEFAULT,
    percentualeUtileImpresa: dato.percentualeUtileImpresa != null ? dato.percentualeUtileImpresa : _PERC_UTILE_IMPRESA_DEFAULT,
    righe: (dato.righe || []).map(r => ({ ...r })),
  };
  state.ricercaSinistra = '';
  state.modificaAttiva = false;
  state.fonteDestra = 'dei';
  state.ricercaDestra = '';
  state.espansiDestra = new Set();

  renderEditorAnalisiPrezzi();
  if (typeof nascondiSidebarApp === 'function') nascondiSidebarApp();
}

function chiudiVoceAnalisiPrezzi() {
  ANALISI_PREZZI_STATE.apertura = null;
  renderListaAnalisiPrezzi();
  if (typeof mostraSidebar === 'function') mostraSidebar();
}

// Salva l'intera voce aperta (ricalcolando i totali) su Firestore. Ogni
// voce è un solo documento con le righe incorporate: non serve lo schema "a
// blocchi" del Prezzario (qui si parla di poche righe per voce, non
// migliaia), un unico .set() per modifica è semplice e sufficiente.
async function _salvaVoceAnalisiCorrente() {
  const state = ANALISI_PREZZI_STATE;
  const ap = state.apertura;
  if (!ap) return;
  const totali = _ricalcolaTotaliAnalisi(ap.righe, ap.percentualeSpeseGenerali, ap.percentualeUtileImpresa);
  const dato = {
    numero: ap.numero,
    descrizione: ap.descrizione,
    unitaMisura: ap.unitaMisura,
    percentualeSpeseGenerali: ap.percentualeSpeseGenerali,
    percentualeUtileImpresa: ap.percentualeUtileImpresa,
    righe: ap.righe,
    ...totali,
    modificatoIl: Date.now(),
  };
  try {
    await db.collection(state.collName).doc(ap.id).set(dato, { merge: true });
  } catch (e) {
    alert('Errore nel salvataggio: ' + _messaggioErroreFirestore(e));
  }
}

function _fissaAltezzaSplitScreenAnalisi() {
  const page = document.getElementById(ANALISI_PREZZI_STATE.pageId);
  const el = page && page.querySelector('.split-screen');
  if (!el) return;
  if (window.innerWidth <= 980) { el.style.height = ''; return; }
  const rect = el.getBoundingClientRect();
  const disponibile = window.innerHeight - rect.top - 24;
  el.style.height = Math.max(280, Math.round(disponibile)) + 'px';
}

function renderEditorAnalisiPrezzi() {
  const state = ANALISI_PREZZI_STATE;
  const page = document.getElementById(state.pageId);
  const ap = state.apertura;
  if (!page || !ap) return;

  page.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <button class="btn btn-sm" onclick="chiudiVoceAnalisiPrezzi()">← Analisi Prezzi</button>
        &nbsp; Analisi Prezzi — Voce ${escapeHtml(String(ap.numero ?? ''))}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-sm" onclick="mostraFormVoceManualeAnalisi()">+ Voce manuale</button>
        <button class="btn btn-sm" onclick="esportaVoceAnalisiExcel()">⬇ Excel</button>
        <button class="btn btn-sm" onclick="esportaVoceAnalisiPDF()">⬇ PDF</button>
      </div>
    </div>

    <div class="analisi-meta-card card">
      <div class="f-campo" style="flex:2;min-width:240px">
        <label>Descrizione (titolo della voce)</label>
        <input id="analisi-meta-descrizione" value="${escapeHtml(ap.descrizione)}" placeholder="es. Quadro elettrico piazza" onchange="aggiornaMetaAnalisiPrezzi('descrizione', this.value)">
      </div>
      <div class="f-campo" style="min-width:120px">
        <label>Unità di misura</label>
        <input id="analisi-meta-um" value="${escapeHtml(ap.unitaMisura)}" placeholder="es. a corpo, cad, m" onchange="aggiornaMetaAnalisiPrezzi('unitaMisura', this.value)">
      </div>
      <div class="f-campo" style="max-width:170px">
        <label>% Spese generali</label>
        <input type="number" step="0.01" id="analisi-meta-spese" value="${ap.percentualeSpeseGenerali}" onchange="aggiornaMetaAnalisiPrezzi('percentualeSpeseGenerali', this.value)">
      </div>
      <div class="f-campo" style="max-width:170px">
        <label>% Utile impresa</label>
        <input type="number" step="0.01" id="analisi-meta-utile" value="${ap.percentualeUtileImpresa}" onchange="aggiornaMetaAnalisiPrezzi('percentualeUtileImpresa', this.value)">
      </div>
    </div>

    <div id="analisi-form-voce-manuale" class="card" style="display:none;margin-bottom:14px;flex-shrink:0">
      <div class="form-row">
        <input id="am-codice" placeholder="Codice (facoltativo)" style="max-width:140px">
        <input id="am-descrizione" placeholder="Descrizione" style="flex:1;min-width:220px">
        <input id="am-um" placeholder="U.M." style="max-width:70px">
        <input id="am-quantita" type="number" step="any" placeholder="Quantità" value="1" style="max-width:100px">
        <input id="am-prezzo" type="number" step="any" placeholder="Prezzo elementare" style="max-width:140px">
        <button class="btn btn-blu" onclick="salvaVoceManualeAnalisi()">Salva</button>
        <button class="btn" onclick="document.getElementById('analisi-form-voce-manuale').style.display='none'">Annulla</button>
      </div>
    </div>

    <div class="split-screen">
      <div class="split-pane split-sinistra">
        <div class="split-pane-titolo">Area di lavoro</div>
        <div class="fonte-tabs">
          <button id="btn-modifica-analisi" class="fonte-tab ${state.modificaAttiva ? 'active' : ''}" onclick="toggleModificaAreaLavoroAnalisi()">${state.modificaAttiva ? '✓ Fine modifica' : '✎ Modifica'}</button>
        </div>
        <div class="toolbar">
          <input type="search" id="analisi-ricerca-sx" placeholder="Cerca nell'area di lavoro..." value="${escapeHtml(state.ricercaSinistra)}">
        </div>
        <div class="split-pane-scroll" id="analisi-area-lavoro-body"></div>
      </div>

      <div class="split-pane split-destra">
        <div class="split-pane-titolo">Prendi voci da...</div>
        <div class="fonte-tabs">
          <button class="fonte-tab ${state.fonteDestra === 'dei' ? 'active' : ''}" onclick="cambiaFonteDestraAnalisi('dei')">Prezzario DEI</button>
          <button class="fonte-tab ${state.fonteDestra === 'veneto' ? 'active' : ''}" onclick="cambiaFonteDestraAnalisi('veneto')">Prezzario Veneto</button>
          <button class="fonte-tab ${state.fonteDestra === 'esterna' ? 'active' : ''}" onclick="cambiaFonteDestraAnalisi('esterna')">Voce esterna</button>
        </div>
        <div id="analisi-fonte-destra-edizione-wrap"></div>
        <div class="toolbar" id="analisi-ricerca-dx-wrap" style="${state.fonteDestra === 'esterna' ? 'display:none' : ''}">
          <input type="search" id="analisi-ricerca-dx" placeholder="Cerca nel magazzino selezionato..." value="${escapeHtml(state.ricercaDestra)}">
        </div>
        <div class="split-pane-scroll" id="analisi-fonte-destra-body"></div>
      </div>
    </div>
  `;

  document.getElementById('analisi-ricerca-sx').addEventListener('input', e => {
    state.ricercaSinistra = e.target.value.trim().toLowerCase();
    renderAreaLavoroAnalisi();
  });
  document.getElementById('analisi-ricerca-dx').addEventListener('input', e => {
    state.ricercaDestra = e.target.value.trim().toLowerCase();
    renderFonteDestraAnalisi(state.fonteDestra);
  });

  renderAreaLavoroAnalisi();
  renderFonteDestraAnalisi(state.fonteDestra);

  _fissaAltezzaSplitScreenAnalisi();
  requestAnimationFrame(_fissaAltezzaSplitScreenAnalisi);
  if (!_resizeListenerAnalisiAttivo) {
    window.addEventListener('resize', _fissaAltezzaSplitScreenAnalisi);
    _resizeListenerAnalisiAttivo = true;
  }
}

// ─── Metadati della voce (descrizione, U.M., percentuali) ───
function aggiornaMetaAnalisiPrezzi(campo, valore) {
  const ap = ANALISI_PREZZI_STATE.apertura;
  if (!ap) return;
  ap[campo] = (campo === 'percentualeSpeseGenerali' || campo === 'percentualeUtileImpresa') ? (Number(valore) || 0) : valore;
  _salvaVoceAnalisiCorrente();
  renderAreaLavoroAnalisi(); // i totali (righe rosse) dipendono dalle percentuali
}

// ─── Pannello sinistro: Area di lavoro ───
function toggleModificaAreaLavoroAnalisi() {
  const state = ANALISI_PREZZI_STATE;
  state.modificaAttiva = !state.modificaAttiva;
  renderAreaLavoroAnalisi();
  const btn = document.getElementById('btn-modifica-analisi');
  if (btn) {
    btn.textContent = state.modificaAttiva ? '✓ Fine modifica' : '✎ Modifica';
    btn.classList.toggle('active', state.modificaAttiva);
  }
}

function aggiornaRigaAnalisi(rigaId, campo, valore) {
  const ap = ANALISI_PREZZI_STATE.apertura;
  if (!ap) return;
  const riga = ap.righe.find(r => r.id === rigaId);
  if (!riga) return;
  riga[campo] = (campo === 'quantita' || campo === 'prezzoElementare') ? (Number(valore) || 0) : valore;
  // Correggere a mano il prezzo elementare è esattamente il "controllo
  // manuale" chiesto dal badge ⚠ (vedi _importaEdizioneAnalisi): una volta
  // corretto, il segnale non serve più.
  if (campo === 'prezzoElementare' && riga.prezzoNonAggiornato) delete riga.prezzoNonAggiornato;
  _salvaVoceAnalisiCorrente();
  renderAreaLavoroAnalisi();
}

function rimuoviRigaAnalisi(rigaId) {
  const ap = ANALISI_PREZZI_STATE.apertura;
  if (!ap) return;
  ap.righe = ap.righe.filter(r => r.id !== rigaId);
  _salvaVoceAnalisiCorrente();
  renderAreaLavoroAnalisi();
}

function mostraFormVoceManualeAnalisi() {
  document.getElementById('analisi-form-voce-manuale').style.display = 'block';
}

function salvaVoceManualeAnalisi() {
  const ap = ANALISI_PREZZI_STATE.apertura;
  if (!ap) return;
  const descrizione = document.getElementById('am-descrizione').value.trim();
  if (!descrizione) { alert('Inserisci almeno una descrizione.'); return; }
  ap.righe.push({
    id: _nuovoIdVoce(),
    fonte: 'manuale',
    codice: document.getElementById('am-codice').value.trim(),
    descrizione,
    um: document.getElementById('am-um').value.trim(),
    quantita: Number(document.getElementById('am-quantita').value) || 0,
    prezzoElementare: Number(document.getElementById('am-prezzo').value) || 0,
  });
  _salvaVoceAnalisiCorrente();
  ['am-codice', 'am-descrizione', 'am-um', 'am-prezzo'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('am-quantita').value = '1';
  document.getElementById('analisi-form-voce-manuale').style.display = 'none';
  renderAreaLavoroAnalisi();
}

const _FONTI_LABEL_ANALISI = { computo: 'Computo', dei: 'Prezzario DEI', veneto: 'Prezzario Veneto', manuale: 'Manuale', esterna: 'Voce esterna' };

function renderAreaLavoroAnalisi() {
  const state = ANALISI_PREZZI_STATE;
  const ap = state.apertura;
  const body = document.getElementById('analisi-area-lavoro-body');
  if (!body || !ap) return;

  let righe = ap.righe;
  if (state.ricercaSinistra) {
    const q = state.ricercaSinistra;
    righe = righe.filter(r => (r.codice || '').toLowerCase().includes(q) || (r.descrizione || '').toLowerCase().includes(q));
  }

  const inModifica = state.modificaAttiva;
  const righeHtml = righe.map(r => {
    const etichettaFonte = _FONTI_LABEL_ANALISI[r.fonte] || 'Manuale';

    // Diciottesima tornata: le righe "titolo" sono agganciate in automatico
    // come capitolo/sottocapitolo padre di una voce presa dal pannello
    // destro (vedi aggiungiVoceAAnalisi) — non sono voci vere, quindi niente
    // Codice/Quantità/Prezzo elementare/Importo (che restano sempre null e
    // sono già esclusi dai totali, vedi _ricalcolaTotaliAnalisi) e la
    // descrizione resta di sola lettura anche in modalità "✎ Modifica".
    if (r.tipo === 'titolo') {
      return `
        <div class="albero-riga albero-riga-analisi albero-riga-analisi-titolo">
          <span><span class="fonte-badge fonte-badge-${r.fonte || 'manuale'}" title="${escapeHtml(etichettaFonte)}">${escapeHtml(etichettaFonte)}</span></span>
          <span></span>
          <span class="progetto-titolo-riga">${escapeHtml(r.descrizione || '')}</span>
          <span></span><span>—</span><span>—</span><span>—</span>
          <span><button class="btn btn-sm btn-rosso" onclick="rimuoviRigaAnalisi('${r.id}')">✕</button></span>
        </div>`;
    }

    const importo = (Number(r.quantita) || 0) * (Number(r.prezzoElementare) || 0);
    const cellaCodice = inModifica
      ? `<input type="text" class="edit-input" value="${escapeHtml(r.codice || '')}" onchange="aggiornaRigaAnalisi('${r.id}','codice',this.value)">`
      : escapeHtml(r.codice || '');
    const cellaDescrizione = inModifica
      ? `<textarea class="edit-textarea" onchange="aggiornaRigaAnalisi('${r.id}','descrizione',this.value)">${escapeHtml(r.descrizione || '')}</textarea>`
      : escapeHtml(r.descrizione || '');
    const cellaUm = inModifica
      ? `<input type="text" class="edit-input" value="${escapeHtml(r.um || '')}" onchange="aggiornaRigaAnalisi('${r.id}','um',this.value)">`
      : escapeHtml(r.um || '');
    // Riga importata da un'annata precedente il cui codice non è stato
    // ritrovato nell'edizione del prezzario scelta per l'aggiornamento
    // automatico (vedi _importaEdizioneAnalisi): prezzo lasciato com'era,
    // segnalato qui per un controllo manuale.
    const avvisoNonAggiornato = r.prezzoNonAggiornato
      ? `<span title="Prezzo non aggiornato: questo codice non è stato trovato nell'edizione del prezzario scelta per l'aggiornamento. Prezzo rimasto quello dell'annata precedente — controllare a mano." style="color:#b45309;font-weight:700;margin-left:5px;cursor:help">⚠</span>`
      : '';
    return `
      <div class="albero-riga albero-riga-analisi">
        <span><span class="fonte-badge fonte-badge-${r.fonte || 'manuale'}" title="${escapeHtml(etichettaFonte)}">${escapeHtml(etichettaFonte)}</span></span>
        <span>${cellaCodice}${avvisoNonAggiornato}</span>
        <span>${cellaDescrizione}</span>
        <span>${cellaUm}</span>
        <span><input type="number" step="any" class="qty-input" value="${r.quantita ?? 0}" onchange="aggiornaRigaAnalisi('${r.id}','quantita',this.value)"></span>
        <span><input type="number" step="any" class="qty-input" value="${r.prezzoElementare ?? 0}" onchange="aggiornaRigaAnalisi('${r.id}','prezzoElementare',this.value)"></span>
        <span class="td-r">${importo.toFixed(2)} €</span>
        <span><button class="btn btn-sm btn-rosso" onclick="rimuoviRigaAnalisi('${r.id}')">✕</button></span>
      </div>`;
  }).join('');

  const totali = _ricalcolaTotaliAnalisi(ap.righe, ap.percentualeSpeseGenerali, ap.percentualeUtileImpresa);

  body.innerHTML = `
    ${righe.length ? `
      <div class="albero-wrap" style="border-radius:var(--r-md) var(--r-md) 0 0">
        <div class="albero-header albero-riga-analisi">
          <span>Fonte</span><span>Codice</span><span>Descrizione</span><span>U.M.</span><span>Quantità</span><span>Prezzo elem.</span><span>Importo</span><span></span>
        </div>
        ${righeHtml}
      </div>` : `<div class="empty-state">${ap.righe.length ? 'Nessuna riga trovata.' : 'Ancora nessuna riga. Prendile dal pannello a destra oppure aggiungine una manuale.'}</div>`}
    <div class="analisi-totali">
      <div class="analisi-totali-riga"><span>Totale parziale</span><span class="td-r">${totali.totaleParziale.toFixed(2)} €</span></div>
      <div class="analisi-totali-riga"><span>Spese generali ${Number(ap.percentualeSpeseGenerali).toFixed(2)}%</span><span class="td-r">${totali.speseGenerali.toFixed(2)} €</span></div>
      <div class="analisi-totali-riga"><span>Totale</span><span class="td-r">${totali.totaleConSpese.toFixed(2)} €</span></div>
      <div class="analisi-totali-riga"><span>Utile impresa ${Number(ap.percentualeUtileImpresa).toFixed(2)}%</span><span class="td-r">${totali.utileImpresa.toFixed(2)} €</span></div>
      <div class="analisi-totali-riga finale"><span>TOTALE${ap.unitaMisura ? ' ' + escapeHtml(ap.unitaMisura) : ''}</span><span class="td-r">${totali.totaleFinale.toFixed(2)} €</span></div>
    </div>
  `;
}

// ─── Pannello destro: Computo / Prezzario DEI / Prezzario Veneto ───
// Stessa identica logica del selettore "Prendi voci da..." di Progetti (vedi
// progetti_module.js — cambiaEdizioneDestraProgetti/renderFonteDestra):
// cache locale prima, lettura Firestore vera solo se manca o su "⟳ Aggiorna".
function _statoFonteAnalisi(fonte) {
  if (fonte === 'computo') return { voci: (typeof MAGAZZINO_COMPUTO !== 'undefined' ? MAGAZZINO_COMPUTO.voci : []), variante: 'computo' };
  return { voci: ANALISI_PREZZI_STATE.vociEdizioneDestra, variante: 'prezzario' };
}

function cambiaFonteDestraAnalisi(fonte) {
  const state = ANALISI_PREZZI_STATE;
  state.fonteDestra = fonte;
  state.ricercaDestra = '';
  state.espansiDestra = new Set();
  document.querySelectorAll('.split-destra .fonte-tab').forEach(b => b.classList.remove('active'));
  const idx = { dei: 0, veneto: 1, esterna: 2 }[fonte];
  const tabs = document.querySelectorAll('.split-destra .fonte-tab');
  if (tabs[idx]) tabs[idx].classList.add('active');
  const ricercaInput = document.getElementById('analisi-ricerca-dx');
  if (ricercaInput) ricercaInput.value = '';
  const ricercaWrap = document.getElementById('analisi-ricerca-dx-wrap');
  if (ricercaWrap) ricercaWrap.style.display = (fonte === 'esterna') ? 'none' : '';
  renderFonteDestraAnalisi(fonte);
}

function cambiaEdizioneDestraAnalisi(fonte, edizioneId) {
  const state = ANALISI_PREZZI_STATE;
  state.espansiDestra = new Set();

  if (!edizioneId) {
    state.edizioneDestraSelezionata[fonte] = null;
    state.vociEdizioneDestra = [];
    renderFonteDestraAnalisi(fonte);
    return;
  }

  const statoPrezzario = (typeof PREZZARIO_STATE !== 'undefined') ? PREZZARIO_STATE[fonte] : null;
  const edizione = statoPrezzario ? statoPrezzario.edizioni.find(e => e.id === edizioneId) : null;
  if (!statoPrezzario || !edizione) return;

  state.edizioneDestraSelezionata[fonte] = { id: edizione.id, nome: edizione.nome };

  const collName = `${statoPrezzario.edizioniCollName}/${edizioneId}/voci`;
  const cache = _leggiCacheLocale(collName);
  if (cache) {
    state.vociEdizioneDestra = cache.voci.slice();
    state.vociEdizioneDestra.sort((a, b) => confrontaNumero(a.numero, b.numero));
    renderFonteDestraAnalisi(fonte);
    return;
  }

  state.vociEdizioneDestra = [];
  renderFonteDestraAnalisi(fonte);
  aggiornaEdizioneDestraAnalisiDaServer(fonte, edizioneId);
}

async function aggiornaEdizioneDestraAnalisiDaServer(fonte, edizioneId) {
  const state = ANALISI_PREZZI_STATE;
  const statoPrezzario = (typeof PREZZARIO_STATE !== 'undefined') ? PREZZARIO_STATE[fonte] : null;
  if (!statoPrezzario) return;
  const collName = _chiaveCachePrezzarioEdizione(statoPrezzario.edizioniCollName, edizioneId);
  try {
    const voci = await _leggiVociPrezzarioDaServer(statoPrezzario.edizioniCollName, edizioneId);
    voci.sort((a, b) => confrontaNumero(a.numero, b.numero));
    // Stessa protezione anti-risposta-tardiva vista in progetti_module.js:
    // se nel frattempo l'utente ha cambiato fonte/edizione, questa risposta
    // è scartata SENZA scrivere nella cache condivisa.
    const selezionata = state.edizioneDestraSelezionata[fonte];
    if (!selezionata || selezionata.id !== edizioneId) return;
    _scriviCacheLocale(collName, voci);
    state.vociEdizioneDestra = voci;
    renderFonteDestraAnalisi(fonte);
  } catch (e) {
    console.error('Errore caricamento edizione:', e.message);
    const body = document.getElementById('analisi-fonte-destra-body');
    if (body && state.fonteDestra === fonte) {
      body.innerHTML = `<div class="empty-state">Errore: ${escapeHtml(_messaggioErroreFirestore(e))}</div>`;
    }
  }
}

function renderFonteDestraAnalisi(fonteRichiesta) {
  const state = ANALISI_PREZZI_STATE;
  if (!state.apertura || state.fonteDestra !== fonteRichiesta) return;

  const body = document.getElementById('analisi-fonte-destra-body');
  const wrapEdizione = document.getElementById('analisi-fonte-destra-edizione-wrap');
  if (!body) return;

  if (fonteRichiesta === 'esterna') {
    if (wrapEdizione) wrapEdizione.innerHTML = '';
    body.innerHTML = `
      <div class="card" style="margin:0">
        <div class="form-row">
          <input id="ext-titolo" placeholder="Titolo" style="flex:1;min-width:160px">
        </div>
        <div class="form-row">
          <input id="ext-descrizione" placeholder="Descrizione" style="flex:1;min-width:220px">
        </div>
        <div class="form-row">
          <input id="ext-um" placeholder="U.M." style="max-width:100px">
          <input id="ext-prezzo" type="number" step="any" placeholder="Prezzo" style="max-width:160px">
        </div>
        <button class="btn btn-sm btn-blu" onclick="aggiungiVoceEsternaAnalisi()">+ Aggiungi all'area di lavoro</button>
      </div>`;
    return;
  }

  const edizioneSelezionata = fonteRichiesta !== 'computo' ? state.edizioneDestraSelezionata[fonteRichiesta] : null;

  if (wrapEdizione) {
    if (fonteRichiesta === 'computo') {
      wrapEdizione.innerHTML = '';
    } else {
      const statoPrezzario = (typeof PREZZARIO_STATE !== 'undefined') ? PREZZARIO_STATE[fonteRichiesta] : null;
      const edizioni = statoPrezzario ? statoPrezzario.edizioni : [];
      const collNameSelezionata = (statoPrezzario && edizioneSelezionata)
        ? `${statoPrezzario.edizioniCollName}/${edizioneSelezionata.id}/voci` : null;
      wrapEdizione.innerHTML = `
        <div class="form-row" style="margin-bottom:10px;align-items:center">
          <select id="analisi-fonte-destra-edizione-select" style="flex:1;min-width:160px" onchange="cambiaEdizioneDestraAnalisi('${fonteRichiesta}', this.value || null)">
            <option value="">— Scegli un'edizione —</option>
            ${edizioni.map(e => `<option value="${e.id}" ${edizioneSelezionata && edizioneSelezionata.id === e.id ? 'selected' : ''}>${escapeHtml(e.nome)}</option>`).join('')}
          </select>
          ${collNameSelezionata ? _htmlIndicatoreCache(collNameSelezionata, `aggiornaEdizioneDestraAnalisiDaServer('${fonteRichiesta}', '${edizioneSelezionata.id}')`) : ''}
        </div>`;
    }
  }

  if (fonteRichiesta !== 'computo' && !edizioneSelezionata) {
    body.innerHTML = `<div class="empty-state">Scegli un'edizione dal menu qui sopra per sfogliarla.</div>`;
    return;
  }

  const { voci, variante } = _statoFonteAnalisi(fonteRichiesta);
  const onAggiungi = nodo => {
    // Diciottesima tornata: il pulsante "+ Aggiungi" compare SOLO sulle voci
    // foglia — non più sulle righe titolo/capitolo/sottocapitolo. Aggiungendo
    // una voce, l'intera catena di antenati viene agganciata in automatico da
    // aggiungiVoceAAnalisi qui sotto, se non già presente per quella stessa
    // famiglia (stessa logica di Progetti — vedi progetti_module.js).
    if (nodo.tipo !== 'voce') return '';
    const payload = {
      fonte: fonteRichiesta,
      numero: nodo.numero || '',
      codice: nodo.codice || nodo.codiceEP || '',
      descrizione: nodo.descrizione || nodo.titolo || '',
      um: nodo.um || '',
      prezzo: nodo.prezzo != null ? Number(nodo.prezzo) : null,
    };
    const payloadAttr = escapeHtml(JSON.stringify(payload));
    return `<button class="btn btn-sm btn-blu" onclick='aggiungiVoceAAnalisi(JSON.parse(this.dataset.voce))' data-voce="${payloadAttr}">+ Aggiungi</button>`;
  };

  if (state.ricercaDestra) {
    const campi = variante === 'computo' ? ['numero', 'codiceEP', 'titolo', 'descrizione'] : ['numero', 'codice', 'descrizione'];
    const risultati = filtraVociPiatte(voci, state.ricercaDestra, campi);
    body.innerHTML = risultati.length
      ? renderRigheAlbero(risultati, new Set(), { variante, onElimina: onAggiungi })
      : `<div class="empty-state">Nessuna voce trovata.</div>`;
    return;
  }

  const albero = costruisciAlbero(voci);
  body.innerHTML = albero.length
    ? renderRigheAlbero(albero, state.espansiDestra, { variante, costruisciToggle: numero => `toggleRamoDestraAnalisi('${numero}')`, onElimina: onAggiungi })
    : `<div class="empty-state">${fonteRichiesta === 'computo' ? 'Questo magazzino è ancora vuoto.' : 'Questa edizione è ancora vuota.'}</div>`;
}

function toggleRamoDestraAnalisi(numero) {
  const state = ANALISI_PREZZI_STATE;
  if (state.espansiDestra.has(numero)) state.espansiDestra.delete(numero);
  else state.espansiDestra.add(numero);
  renderFonteDestraAnalisi(state.fonteDestra);
}

function aggiungiVoceAAnalisi(nodo) {
  const ap = ANALISI_PREZZI_STATE.apertura;
  if (!ap) return;

  // Diciottesima tornata: prima della voce vera e propria, agganciamo in
  // automatico l'intera catena di antenati (titolo/sottotitolo/capitolo
  // padre a cui appartiene nella fonte originale), SE non già presente in
  // quest'analisi per la stessa fonte — stessa idea di Progetti (vedi
  // aggiungiVoceAlProgetto in progetti_module.js). Rappresentate come righe
  // "titolo" non modificabili e non conteggiate nei totali (quantita e
  // prezzoElementare restano null, vedi renderAreaLavoroAnalisi/
  // _ricalcolaTotaliAnalisi).
  const { voci: vociFonte } = _statoFonteAnalisi(nodo.fonte);
  const nodoSorgente = vociFonte.find(v => v.numero === nodo.numero);
  const catenaAntenati = nodoSorgente ? catenaAntenatiNodo(vociFonte, nodoSorgente) : [];
  catenaAntenati.forEach(antenato => {
    const giaPresente = ap.righe.some(r => r.tipo === 'titolo' && r.fonte === nodo.fonte && r.fonteNumero === antenato.numero);
    if (giaPresente) return;
    ap.righe.push({
      id: _nuovoIdVoce(),
      tipo: 'titolo',
      fonte: nodo.fonte,
      fonteNumero: antenato.numero,
      codice: '',
      descrizione: antenato.titolo || '',
      um: '',
      quantita: null,
      prezzoElementare: null,
    });
  });

  ap.righe.push({
    id: _nuovoIdVoce(),
    tipo: 'voce',
    fonte: nodo.fonte,
    codice: nodo.codice || '',
    descrizione: nodo.descrizione || '',
    um: nodo.um || '',
    quantita: 1,
    prezzoElementare: nodo.prezzo != null ? Number(nodo.prezzo) : 0,
  });
  _salvaVoceAnalisiCorrente();
  renderAreaLavoroAnalisi();
}

// Riga creata a mano dal tab "Voce esterna" di "Prendi voci da..." — non
// viene da nessun magazzino (Computo/DEI/Veneto): serve per un prezzo che
// Giovanni ha da un'altra fonte (es. preventivo di un fornitore) e vuole
// comunque far entrare nell'analisi. Stessa quantità di partenza (1) delle
// righe prese da un magazzino: si corregge poi in "Area di lavoro".
function aggiungiVoceEsternaAnalisi() {
  const ap = ANALISI_PREZZI_STATE.apertura;
  if (!ap) return;
  const titolo = document.getElementById('ext-titolo').value.trim();
  const descrizione = document.getElementById('ext-descrizione').value.trim();
  if (!titolo && !descrizione) { alert('Inserisci almeno un titolo o una descrizione.'); return; }
  ap.righe.push({
    id: _nuovoIdVoce(),
    fonte: 'esterna',
    codice: titolo,
    descrizione,
    um: document.getElementById('ext-um').value.trim(),
    quantita: 1,
    prezzoElementare: Number(document.getElementById('ext-prezzo').value) || 0,
  });
  _salvaVoceAnalisiCorrente();
  renderAreaLavoroAnalisi();
  ['ext-titolo', 'ext-descrizione', 'ext-um', 'ext-prezzo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('ext-titolo').focus();
}

// ─── Export della singola voce (formato "analisi di un nuovo prezzo") ───
function esportaVoceAnalisiExcel() {
  const ap = ANALISI_PREZZI_STATE.apertura;
  if (!ap) return;
  const totali = _ricalcolaTotaliAnalisi(ap.righe, ap.percentualeSpeseGenerali, ap.percentualeUtileImpresa);
  const aoa = [
    ['Voce n.', ap.numero ?? '', '', '', '', ''],
    ['Descrizione', ap.descrizione || '', '', '', '', ''],
    [],
    ['Codice', 'Descrizione', 'U.M.', 'Quantità', 'Prezzo elem.', 'Importo'],
    ...ap.righe.map(r => [r.codice || '', r.descrizione || '', r.um || '', Number(r.quantita) || 0, Number(r.prezzoElementare) || 0, (Number(r.quantita) || 0) * (Number(r.prezzoElementare) || 0)]),
    [],
    ['', '', '', '', 'Totale parziale', totali.totaleParziale],
    ['', '', '', '', `Spese generali ${ap.percentualeSpeseGenerali}%`, totali.speseGenerali],
    ['', '', '', '', 'Totale', totali.totaleConSpese],
    ['', '', '', '', `Utile impresa ${ap.percentualeUtileImpresa}%`, totali.utileImpresa],
    ['', '', '', '', `TOTALE ${ap.unitaMisura || ''}`.trim(), totali.totaleFinale],
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, ws, `Voce ${ap.numero || ''}`.slice(0, 30));
  XLSX.writeFile(wb, `analisi_prezzo_${ap.numero || ''}.xlsx`);
}

function esportaVoceAnalisiPDF() {
  const ap = ANALISI_PREZZI_STATE.apertura;
  if (!ap) return;
  const totali = _ricalcolaTotaliAnalisi(ap.righe, ap.percentualeSpeseGenerali, ap.percentualeUtileImpresa);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(14);
  doc.text(`Analisi Prezzi — Voce ${ap.numero ?? ''}: ${ap.descrizione || ''}`, 14, 15);
  doc.autoTable({
    startY: 22,
    head: [['Codice', 'Descrizione', 'U.M.', 'Quantità', 'Prezzo elem.', 'Importo']],
    body: ap.righe.map(r => [
      r.codice || '', r.descrizione || '', r.um || '',
      Number(r.quantita || 0).toFixed(2), Number(r.prezzoElementare || 0).toFixed(2) + ' €',
      ((Number(r.quantita) || 0) * (Number(r.prezzoElementare) || 0)).toFixed(2) + ' €',
    ]),
    foot: [
      ['', '', '', '', 'Totale parziale', totali.totaleParziale.toFixed(2) + ' €'],
      ['', '', '', '', `Spese generali ${ap.percentualeSpeseGenerali}%`, totali.speseGenerali.toFixed(2) + ' €'],
      ['', '', '', '', 'Totale', totali.totaleConSpese.toFixed(2) + ' €'],
      ['', '', '', '', `Utile impresa ${ap.percentualeUtileImpresa}%`, totali.utileImpresa.toFixed(2) + ' €'],
      ['', '', '', '', `TOTALE ${ap.unitaMisura || ''}`.trim(), totali.totaleFinale.toFixed(2) + ' €'],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [34, 34, 34] },
    footStyles: { fillColor: [229, 231, 235], textColor: [31, 41, 55], fontStyle: 'bold', halign: 'right' },
    showFoot: 'lastPage',
  });
  doc.save(`analisi_prezzo_${ap.numero || ''}.pdf`);
}
