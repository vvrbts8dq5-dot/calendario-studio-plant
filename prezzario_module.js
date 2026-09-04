// ══════════════════════════════════════════════════════════════════════
// MODULO PREZZARIO — riutilizzabile per "Prezzario Veneto" e "Prezzario DEI".
//
// A differenza del Computo (un unico magazzino), ogni Prezzario è ora
// organizzato in EDIZIONI (es. "2025", "2026", "Bozza 2027"): si apre prima
// un elenco di edizioni (crea/elimina, come i Progetti), poi cliccandone
// una si entra nella STESSA vista ad albero/import di sempre, ma con le
// voci isolate in quella sola edizione — così puoi tenere annate diverse
// senza che una sovrascriva l'altra.
//
// STESSA struttura ad albero del modulo Computo (capitolo > sottocapitolo >
// voce, numerazione 1/1.1/1.1.1), con l'unica differenza che le voci hanno
// il PREZZO (niente misure/quantità, perché un prezzario è un catalogo, non
// il conteggio di un cantiere specifico). La colonna Quantità non esiste MAI.
//
// Ogni riga-voce è un documento con i campi:
//   numero, tipo ('titolo'|'voce')
//   — se tipo='titolo': solo numero + titolo (capitolo/sottocapitolo)
//   — se tipo='voce': numero, codice, descrizione, um, prezzo
//
// Struttura Firestore per-disciplina (collBase passato da app_init.js, es.
// 'prezzario_dei_elettrico'):
//   {collBase}_edizioni/{edizioneId}                → {nome, creatoIl, creatoDa}
//   {collBase}_edizioni/{edizioneId}/voci/{voceId}   → le righe di quell'edizione
//
// La vecchia collezione piatta {collBase} (da prima che esistessero le
// edizioni) NON viene toccata automaticamente: se contiene ancora dati,
// l'elenco edizioni mostra un pulsante "Migra dati esistenti" che li copia
// in una nuova edizione (cancellando l'originale solo dopo aver verificato
// che la copia è completa — nessun rischio di perdita).
// ══════════════════════════════════════════════════════════════════════

const PREZZARIO_STATE = {}; // key -> stato (vedi initPrezzario)

function initPrezzario(key, pageId, collBase, title) {
  PREZZARIO_STATE[key] = {
    pageId,
    collBase,
    edizioniCollName: `${collBase}_edizioni`,
    title,
    edizioni: [],
    unsubEdizioni: null,
    edizioneAttiva: null,   // { id, nome }
    collName: null,          // path della sottocollezione voci, solo quando un'edizione è aperta
    voci: [],
    ricerca: '',
    espansi: new Set(),
    modificaAttiva: false,
    selezioneAttiva: false,
    selezionate: new Set(),
  };

  const state = PREZZARIO_STATE[key];
  state.unsubEdizioni = db.collection(state.edizioniCollName).onSnapshot(snap => {
    state.edizioni = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    state.edizioni.sort((a, b) => (b.creatoIl || 0) - (a.creatoIl || 0));
    if (!state.edizioneAttiva) renderElencoEdizioni(key);
    // Bug segnalato da Giovanni (Diciottesima tornata): il form "+ Nuova
    // annata" di Analisi Prezzi elenca le edizioni DEI/Veneto da cui
    // "aggiornare i prezzi" leggendo PREZZARIO_STATE['dei'/'veneto'].edizioni
    // al MOMENTO in cui la pagina Analisi Prezzi viene disegnata — ma quella
    // pagina si disegna già durante avviaModuli(), PRIMA che questo
    // onSnapshot abbia consegnato la prima risposta reale (arriva sempre un
    // istante dopo, via rete). Risultato: i due menu a tendina "Prezzario
    // DEI"/"Prezzario Veneto" nel form restavano vuoti (solo "— Non
    // aggiornare —") per sempre, perché nessuno ridisegnava più quel form
    // quando le edizioni arrivavano davvero — la pagina Analisi Prezzi si
    // ridisegna solo quando cambiano le SUE proprie annate, mai quando
    // cambiano quelle dei Prezzari. Corretto: ogni volta che le edizioni di
    // un Prezzario cambiano, se la pagina Analisi Prezzi sta mostrando
    // l'elenco annate (non l'editor di una voce), la ridisegniamo anche noi.
    if (typeof ANALISI_PREZZI_STATE !== 'undefined' && ANALISI_PREZZI_STATE.edizioniCollName
        && !ANALISI_PREZZI_STATE.edizioneAttiva && typeof renderElencoEdizioniAnalisi === 'function') {
      renderElencoEdizioniAnalisi();
    }
  }, err => {
    console.error(`Errore caricamento ${state.edizioniCollName}:`, err.message);
  });

  renderElencoEdizioni(key);
}

function resetPrezzarioModulo(key) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;
  if (state.unsubEdizioni) state.unsubEdizioni();
  delete PREZZARIO_STATE[key];
}

// ─── Elenco edizioni (annate) ───
function renderElencoEdizioni(key) {
  const state = PREZZARIO_STATE[key];
  const page = document.getElementById(state.pageId);
  if (!page) return;

  page.innerHTML = `
    <div class="page-header">
      <div class="page-title">${escapeHtml(state.title)}</div>
    </div>

    <div class="card" style="margin-bottom:18px">
      <div class="form-row" style="margin-bottom:0">
        <input id="${key}-nuova-edizione-nome" placeholder="Nome edizione (es. 2026, Bozza 2027...)" style="flex:1;min-width:220px">
        <button class="btn btn-blu" onclick="creaEdizionePrezzario('${key}')">+ Nuova edizione</button>
      </div>
    </div>

    <div id="${key}-migrazione-wrap"></div>

    <div id="${key}-edizioni-lista">
      ${state.edizioni.length ? '' : '<div class="empty-state">Non hai ancora nessuna edizione. Creane una qui sopra (es. l\'anno), poi aprila e importa il file Excel al suo interno.</div>'}
      ${state.edizioni.map(e => `
        <div class="progetto-riga">
          <div class="progetto-riga-nome" onclick="apriEdizionePrezzario('${key}','${e.id}')">${escapeHtml(e.nome)}</div>
          <div class="progetto-riga-azioni">
            <button class="btn btn-sm" onclick="apriEdizionePrezzario('${key}','${e.id}')">Apri →</button>
            <button class="btn btn-sm btn-rosso" onclick="eliminaEdizionePrezzario('${key}','${e.id}','${escapeHtml(e.nome).replace(/'/g, "\\'")}')">Elimina</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  const inp = document.getElementById(`${key}-nuova-edizione-nome`);
  inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') creaEdizionePrezzario(key); });

  _controllaMigrazionePrezzario(key);
}

// Traduce un errore Firestore in un messaggio comprensibile. La causa più
// frequente durante operazioni massicce (migrazione, import, cancellazioni)
// è il limite giornaliero di operazioni del piano gratuito (Spark): quando
// scatta, Firestore rifiuta scritture/cancellazioni con code
// 'resource-exhausted' e l'operazione si ferma a metà — è la causa più
// probabile se qualcosa "non fa nulla" o si ferma senza un motivo chiaro.
function _messaggioErroreFirestore(e) {
  if (e && (e.code === 'resource-exhausted' || /quota/i.test(e.message || ''))) {
    return 'Hai superato il limite giornaliero di operazioni Firestore del piano gratuito (Spark). ' +
      'Controlla su Firebase Console → Firestore Database → Usage: se scritture o cancellazioni di oggi sono vicine/sopra 20.000, è questo. ' +
      'Si risblocca da solo col reset giornaliero (verso mezzanotte, fuso orario USA/Pacifico) oppure passando al piano Blaze.';
  }
  return (e && e.message) || String(e);
}

// Se la vecchia collezione "piatta" (da prima delle edizioni) ha ancora
// dati non migrati, mostra un pulsante per copiarli in una nuova edizione.
// Sola lettura finché l'utente non clicca — nessuna scrittura automatica.
//
// Diciannovesima tornata: Giovanni segnalava che il messaggio non si capiva
// bene ("cosa vuol dire questo messaggio?") e che non c'era modo di
// chiuderlo senza migrare ("non c'è un pulsante 'No'"). Il messaggio
// significa: prima che esistessero le "edizioni" (annate), le voci di
// questo prezzario stavano in un'unica collezione piatta — se quella
// collezione ha ancora dati (mai spostati in un'edizione), questo banner lo
// segnala e offre di copiarli in una nuova edizione. Corretto: testo più
// esplicito + un secondo pulsante "No, ignora" che chiude il banner senza
// migrare né cancellare nulla — la scelta viene ricordata sul dispositivo
// (localStorage) così il banner non ricompare ad ogni apertura della
// pagina; i vecchi dati restano intatti nella collezione piatta finché non
// si preme "Migra dati esistenti", in qualsiasi momento in futuro (basta
// svuotare i dati del sito o cancellare quella voce di localStorage per
// farlo ricomparire).
function _chiaveIgnoraMigrazione(collBase) {
  return `migrazione_ignorata_${collBase}`;
}
async function _controllaMigrazionePrezzario(key) {
  const state = PREZZARIO_STATE[key];
  const wrap = document.getElementById(`${key}-migrazione-wrap`);
  if (!state || !wrap) return;
  try {
    if (localStorage.getItem(_chiaveIgnoraMigrazione(state.collBase)) === '1') { wrap.innerHTML = ''; return; }
  } catch (e) { /* localStorage non disponibile: si ricade sul comportamento normale */ }
  try {
    const snap = await db.collection(state.collBase).limit(1).get();
    if (snap.empty) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = `
      <div class="import-banner" style="display:flex;margin-bottom:18px">
        <span>Questo prezzario aveva un formato più vecchio, senza edizioni/annate: ho trovato righe rimaste in quel vecchio formato (non ancora spostate in un'edizione come "2026"). Vuoi spostarle ora in una nuova edizione? (I dati restano al sicuro comunque vada: "No, ignora" si limita a nascondere questo avviso, senza toccare nulla.)</span>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button class="btn btn-blu btn-sm" onclick="migraDatiPrezzario('${key}')">Migra dati esistenti</button>
          <button class="btn btn-sm" onclick="ignoraMigrazionePrezzario('${key}')">No, ignora</button>
        </div>
      </div>`;
  } catch (e) {
    // Non nascondiamo l'errore in silenzio: se il controllo stesso fallisce
    // (es. quota esaurita) l'utente deve saperlo, non vedere il banner
    // sparire come se fosse tutto a posto.
    wrap.innerHTML = `<div class="import-banner" style="display:flex"><span>Non riesco a controllare se ci sono dati da migrare: ${escapeHtml(_messaggioErroreFirestore(e))}</span></div>`;
  }
}

function ignoraMigrazionePrezzario(key) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;
  try { localStorage.setItem(_chiaveIgnoraMigrazione(state.collBase), '1'); } catch (e) { /* ignorato: al peggio il banner ricompare */ }
  const wrap = document.getElementById(`${key}-migrazione-wrap`);
  if (wrap) wrap.innerHTML = '';
}

async function migraDatiPrezzario(key) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;
  const nome = prompt(
    'Che nome vuoi dare a questa edizione migrata? (es. "2026" o "Corrente")\n\n' +
    'Se esiste già un\'edizione con questo identico nome, i dati verranno aggiunti lì invece di crearne una copia.',
    'Corrente'
  );
  if (!nome) return;
  const wrap = document.getElementById(`${key}-migrazione-wrap`);
  if (wrap) wrap.innerHTML = '<div class="import-banner" style="display:flex"><span>Migrazione in corso, non chiudere la pagina...</span></div>';

  try {
    const vecchiaColl = db.collection(state.collBase);
    const snap = await vecchiaColl.get();
    const vociVecchie = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!vociVecchie.length) {
      // Niente da copiare: probabilmente un tentativo precedente ha già
      // svuotato la vecchia collezione (magari dopo aver fallito solo
      // sull'ultimo passaggio). Non c'è altro da fare.
      if (wrap) wrap.innerHTML = '';
      return;
    }

    // Riusa un'edizione ESISTENTE con lo stesso nome invece di crearne una
    // nuova ad ogni tentativo: se un primo click aveva già copiato i dati ma
    // poi lo svuotamento della vecchia collezione era fallito a metà, un
    // secondo click non deve raddoppiare le righe né creare doppioni.
    const edizioneEsistente = state.edizioni.find(e => e.nome === nome);
    let edizioneId = edizioneEsistente ? edizioneEsistente.id : null;
    if (!edizioneId) {
      const edRef = await db.collection(state.edizioniCollName).add({
        nome, creatoIl: Date.now(), creatoDa: (CURRENT_USER && CURRENT_USER.email) || '',
      });
      edizioneId = edRef.id;
    }

    const vociAttuali = await _leggiVociPrezzarioDaServer(state.edizioniCollName, edizioneId);
    if (vociAttuali.length && vociAttuali.length !== vociVecchie.length) {
      // Conteggio diverso da zero e diverso dall'atteso: rischio di
      // duplicati se ricopiamo alla cieca. Meglio fermarsi e far decidere
      // all'utente.
      throw new Error(
        `L'edizione "${nome}" esiste già con ${vociAttuali.length} righe, diverse dalle ${vociVecchie.length} della vecchia collezione. ` +
        `Per sicurezza non copio automaticamente (rischio doppioni): elimina l'edizione "${nome}" se è un tentativo incompleto da rifare, oppure scegli un nome diverso.`
      );
    }
    if (!vociAttuali.length) {
      await _salvaBlocchiPrezzario(state.edizioniCollName, edizioneId, vociVecchie);
    }
    // Se vociAttuali.length === vociVecchie.length, la copia risulta già
    // completa da un tentativo precedente: saltiamo dritti allo
    // svuotamento della vecchia collezione, senza ricopiare nulla.

    await _cancellaTutteLeVoci(vecchiaColl, snap.docs.map(d => ({ id: d.id })));

    // Svuotiamo un'eventuale cache locale vecchia per questa edizione: se
    // l'abbiamo riusata (nome già esistente), il conteggio reale è appena
    // cambiato e non deve restare in memoria una versione superata.
    _svuotaCacheLocale(_chiaveCachePrezzarioEdizione(state.edizioniCollName, edizioneId));

    if (wrap) wrap.innerHTML = '';
    alert(`✓ Migrazione completata: ${vociVecchie.length} righe nell'edizione "${nome}".`);
  } catch (e) {
    alert('Errore durante la migrazione: ' + _messaggioErroreFirestore(e));
    _controllaMigrazionePrezzario(key);
  }
}

async function creaEdizionePrezzario(key) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;
  const inp = document.getElementById(`${key}-nuova-edizione-nome`);
  const nome = inp.value.trim();
  if (!nome) { alert("Inserisci un nome per l'edizione (es. l'anno)."); return; }
  try {
    await db.collection(state.edizioniCollName).add({
      nome, creatoIl: Date.now(), creatoDa: (CURRENT_USER && CURRENT_USER.email) || '',
    });
    inp.value = '';
  } catch (e) {
    alert("Errore nella creazione dell'edizione: " + _messaggioErroreFirestore(e));
  }
}

async function eliminaEdizionePrezzario(key, id, nome) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;
  const scelta = await chiediScelta({
    titolo: 'Eliminare questa edizione?',
    corpo: `Stai per eliminare definitivamente l'edizione "${nome}" e TUTTE le sue righe. Non è annullabile.`,
    bottoni: [
      { valore: 'annulla', testo: 'Annulla' },
      { valore: 'conferma', testo: 'Elimina edizione', classe: 'btn-rosso' }
    ]
  });
  if (scelta !== 'conferma') return;

  // Le due cancellazioni (righe, poi documento edizione) sono in try separati
  // così, se qualcosa si ferma a metà, il messaggio dice ESATTAMENTE cosa è
  // successo invece di un generico "errore" che sembra "non fa niente".
  try {
    // Blocchi (formato corrente): tipicamente poche decine/centinaia di
    // documenti anche per un'edizione enorme, non una riga a documento.
    const blocchiSnap = await _collBlocchi(state.edizioniCollName, id).get();
    if (!blocchiSnap.empty) {
      const CHUNK = 450;
      const docs = blocchiSnap.docs;
      for (let i = 0; i < docs.length; i += CHUNK) {
        const batch = db.batch();
        docs.slice(i, i + CHUNK).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
    // Eventuali righe rimaste nel vecchio formato (un documento per voce),
    // se questa edizione non è mai stata aperta da quando esistono i
    // blocchi e quindi non è ancora stata migrata automaticamente.
    const vociSnap = await db.collection(`${state.edizioniCollName}/${id}/voci`).get();
    if (!vociSnap.empty) {
      await _cancellaTutteLeVoci(db.collection(`${state.edizioniCollName}/${id}/voci`), vociSnap.docs.map(d => ({ id: d.id })));
    }
  } catch (e) {
    alert(`Errore nella cancellazione delle righe dell'edizione "${nome}": ${_messaggioErroreFirestore(e)}\n\nL'edizione NON è stata eliminata. Riprova: le righe già cancellate non verranno ricancellate.`);
    return;
  }

  try {
    await db.collection(state.edizioniCollName).doc(id).delete();
    _svuotaCacheLocale(_chiaveCachePrezzarioEdizione(state.edizioniCollName, id));
  } catch (e) {
    alert(`Le righe di "${nome}" sono state cancellate, ma non sono riuscito a eliminare l'edizione stessa: ${_messaggioErroreFirestore(e)}\n\nRiprova: questa volta non ci sono più righe da cancellare, dovrebbe essere veloce.`);
  }
}

// ─── Apertura di un'edizione: la stessa vista ad albero/import di sempre ───
function apriEdizionePrezzario(key, id) {
  const state = PREZZARIO_STATE[key];
  const edizione = state.edizioni.find(e => e.id === id);
  if (!edizione) return;
  state.edizioneAttiva = { id: edizione.id, nome: edizione.nome };
  state.collName = `${state.edizioniCollName}/${id}/voci`;
  state.voci = [];
  state.ricerca = '';
  state.espansi = new Set();
  state.modificaAttiva = false;
  state.selezioneAttiva = false;
  state.selezionate = new Set();
  renderPrezzarioDettaglio(key);
}

function chiudiEdizionePrezzario(key) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;
  state.edizioneAttiva = null;
  state.collName = null;
  state.voci = [];
  renderElencoEdizioni(key);
}

function renderPrezzarioDettaglio(key) {
  const state = PREZZARIO_STATE[key];
  const page = document.getElementById(state.pageId);
  if (!page) return;

  // Pagina "a finestra fissa": vedi il commento gemello in computo_module.js
  // (initComputo) — stessa tecnica, non più position:sticky.
  page.classList.add('pagina-fissa');
  page.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <button class="btn btn-sm" onclick="chiudiEdizionePrezzario('${key}')">← Edizioni</button>
        &nbsp; ${escapeHtml(state.title)} — ${escapeHtml(state.edizioneAttiva.nome)}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <span id="${key}-cache-info"></span>
        <input type="file" id="${key}-file-input" accept=".xlsx,.xls,.csv,.pdf" style="display:none">
        <button class="btn btn-blu btn-sm" onclick="document.getElementById('${key}-file-input').click()">Importa da Excel/PDF</button>
        <button class="btn btn-sm" onclick="mostraFormCapitoloPrezzario('${key}')">+ Capitolo/Sottocapitolo</button>
        <button class="btn btn-sm" onclick="mostraFormVocePrezzario('${key}')">+ Voce</button>
        <button id="${key}-btn-modifica" class="btn btn-sm" onclick="toggleModificaPrezzario('${key}')">✎ Modifica</button>
        <button class="btn btn-sm" onclick="esportaPrezzarioExcel('${key}')">⬇ Excel</button>
        <button class="btn btn-sm" onclick="esportaPrezzarioPDF('${key}')">⬇ PDF</button>
        <button id="${key}-btn-elimina-voce" class="btn btn-rosso btn-sm" onclick="toggleModalitaSelezionePrezzario('${key}')">Elimina voce</button>
        <button id="${key}-btn-conferma-elimina" class="btn btn-rosso btn-sm" style="display:none" onclick="eliminaSelezionatePrezzario('${key}')">Conferma eliminazione</button>
        <button class="btn btn-rosso btn-sm" onclick="cancellaTuttoPrezzario('${key}')">Cancella tutto</button>
      </div>
    </div>

    <div id="${key}-import-banner" class="import-banner" style="display:none"></div>

    <div id="${key}-form-capitolo" class="card" style="display:none;margin-bottom:14px">
      <div class="form-row" style="margin-bottom:0">
        <input id="${key}-cap-numero" placeholder="Numero (es. 1.2)" style="max-width:120px">
        <input id="${key}-cap-titolo" placeholder="Titolo capitolo/sottocapitolo" style="flex:1;min-width:200px">
        <button class="btn btn-blu" onclick="salvaCapitoloPrezzario('${key}')">Salva</button>
        <button class="btn" onclick="nascondiFormPrezzario('${key}-form-capitolo')">Annulla</button>
      </div>
      <div style="font-size:11px;color:var(--ink4);margin-top:6px">Se il numero esiste già (o precede voci già presenti), le righe successive si spostano automaticamente per fare spazio.</div>
    </div>

    <div id="${key}-form-voce" class="card" style="display:none;margin-bottom:14px">
      <div class="form-row">
        <input id="${key}-voce-capitolo" placeholder="Capitolo/sottocapitolo padre (es. 8.1)" style="max-width:190px">
        <input id="${key}-voce-codice" placeholder="Codice (es. N04007b)" style="max-width:150px">
        <input id="${key}-voce-descrizione" placeholder="Descrizione" style="flex:1;min-width:220px">
      </div>
      <div class="form-row">
        <input id="${key}-voce-um" placeholder="U.M." style="max-width:80px">
        <input id="${key}-voce-prezzo" placeholder="Prezzo (€)" type="number" step="0.01" style="max-width:120px">
        <input id="${key}-voce-manodopera" placeholder="% Manodopera" type="number" step="0.01" style="max-width:130px">
        <button class="btn btn-blu" onclick="salvaVocePrezzario('${key}')">Salva</button>
        <button class="btn" onclick="nascondiFormPrezzario('${key}-form-voce')">Annulla</button>
      </div>
      <div style="font-size:11px;color:var(--ink4);margin-top:6px">Il capitolo/sottocapitolo padre deve esistere già (è lui a comparire nell'albero); la voce viene identificata dal proprio codice, che deve essere unico.</div>
    </div>

    <div class="toolbar">
      <input type="search" id="${key}-ricerca" placeholder="Cerca per numero, codice o descrizione...">
    </div>

    <div class="pagina-corpo-scroll">
      <div class="albero-wrap">
        <div class="albero-header albero-riga-prezzario">
          <span>Numero</span><span>Titolo / Descrizione</span><span>U.M.</span><span>Prezzo</span><span>% Manod.</span><span></span>
        </div>
        <div id="${key}-albero-body"><div class="empty-state">Caricamento...</div></div>
      </div>
    </div>
  `;

  document.getElementById(`${key}-ricerca`).addEventListener('input', e => {
    state.ricerca = e.target.value.trim().toLowerCase();
    renderPrezzario(key);
  });

  document.getElementById(`${key}-file-input`).addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
      if (/\.pdf$/i.test(file.name)) importaPrezzarioDaPDF(key, file);
      else importaPrezzarioDaExcel(key, file);
    }
    e.target.value = '';
  });

  _caricaPrezzarioConCache(key);
}

// Carica le voci dell'edizione aperta: prima dalla cache locale del
// dispositivo (istantaneo, ZERO letture Firestore), altrimenti da Firestore
// (solo se non c'è ancora nessuna cache per questa edizione qui). Un
// prezzario cambia solo quando lo importi/modifichi tu, quindi non serve
// un ascolto in tempo reale che rilegga tutto ad ogni apertura.
async function _caricaPrezzarioConCache(key) {
  const state = PREZZARIO_STATE[key];
  if (!state || !state.collName) return;
  const cache = _leggiCacheLocale(state.collName);
  if (cache) {
    state.voci = cache.voci.slice();
    state.voci.sort((a, b) => confrontaVoci(a, b));
    renderPrezzario(key);
    _aggiornaIndicatoreCachePrezzario(key);
    return;
  }
  await aggiornaPrezzarioDaServer(key);
}

// Lettura esplicita e reale da Firestore (consuma quota): solo al primo
// accesso su un dispositivo per questa edizione, oppure quando l'utente
// preme "⟳ Aggiorna" per essere sicuro di vedere l'ultima versione.
async function aggiornaPrezzarioDaServer(key) {
  const state = PREZZARIO_STATE[key];
  if (!state || !state.collName) return;
  const body = document.getElementById(`${key}-albero-body`);
  if (body && !state.voci.length) body.innerHTML = '<div class="empty-state">Caricamento dal server...</div>';
  try {
    state.voci = await _leggiVociPrezzarioDaServer(state.edizioniCollName, state.edizioneAttiva.id);
    state.voci.sort((a, b) => confrontaVoci(a, b));
    _scriviCacheLocale(state.collName, state.voci);
    renderPrezzario(key);
    _aggiornaIndicatoreCachePrezzario(key);
  } catch (e) {
    console.error(`Errore caricamento ${state.collName}:`, e.message);
    if (body) body.innerHTML = `<div class="empty-state">Errore: ${escapeHtml(_messaggioErroreFirestore(e))}</div>`;
  }
}

function _aggiornaIndicatoreCachePrezzario(key) {
  const state = PREZZARIO_STATE[key];
  const el = document.getElementById(`${key}-cache-info`);
  if (!state || !el) return;
  el.innerHTML = _htmlIndicatoreCache(state.collName, `aggiornaPrezzarioDaServer('${key}')`);
}

function toggleRamoPrezzario(key, numero) {
  const stato = PREZZARIO_STATE[key];
  if (stato.espansi.has(numero)) stato.espansi.delete(numero);
  else stato.espansi.add(numero);
  renderPrezzario(key);
}

// ─── Modalità modifica inline (capitoli, sottocapitoli e voci) ───
// Stessa idea della modalità "✎ Modifica" già presente nell'area di lavoro
// dei Progetti: qui si applica direttamente all'edizione del prezzario
// aperta (non a una copia locale di un progetto), quindi la modifica è
// definitiva e vale per chiunque la consulti o la peschi da un progetto.
function toggleModificaPrezzario(key) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;
  state.modificaAttiva = !state.modificaAttiva;
  // Modifica inline e selezione multipla non hanno senso insieme (righe che
  // diventano insieme campi di testo e caselle da spuntare): attivandone
  // una si spegne automaticamente l'altra.
  if (state.modificaAttiva && state.selezioneAttiva) {
    state.selezioneAttiva = false;
    state.selezionate = new Set();
    _aggiornaBottoniSelezionePrezzario(key);
  }
  renderPrezzario(key);
  const btn = document.getElementById(`${key}-btn-modifica`);
  if (btn) {
    btn.textContent = state.modificaAttiva ? '✓ Fine modifica' : '✎ Modifica';
    btn.classList.toggle('btn-ink', state.modificaAttiva);
  }
}

// ─── Selezione multipla per eliminazione in blocco ───
// Stessa identica logica/interfaccia della gemella in computo_module.js
// (vedi i commenti lì): un solo pulsante "Elimina voce" attiva una modalità
// in cui ogni riga mostra una casella al posto del vecchio "Elimina"
// per-riga, per selezionarne quante si vuole e cancellarle tutte insieme.
function toggleModalitaSelezionePrezzario(key) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;
  state.selezioneAttiva = !state.selezioneAttiva;
  state.selezionate = new Set();
  if (state.selezioneAttiva && state.modificaAttiva) {
    state.modificaAttiva = false;
    const btnModifica = document.getElementById(`${key}-btn-modifica`);
    if (btnModifica) { btnModifica.textContent = '✎ Modifica'; btnModifica.classList.remove('btn-ink'); }
  }
  renderPrezzario(key);
  _aggiornaBottoniSelezionePrezzario(key);
}

function toggleSelezioneVocePrezzario(key, id) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;
  if (state.selezionate.has(id)) state.selezionate.delete(id);
  else state.selezionate.add(id);
  _aggiornaBottoniSelezionePrezzario(key);
}

function _aggiornaBottoniSelezionePrezzario(key) {
  const state = PREZZARIO_STATE[key];
  const btnElimina = document.getElementById(`${key}-btn-elimina-voce`);
  const btnConferma = document.getElementById(`${key}-btn-conferma-elimina`);
  if (!state || !btnElimina || !btnConferma) return;
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

// Elimina in blocco tutte le voci selezionate. Stesso algoritmo "radici +
// rilettura del numero corrente per id ad ogni passo" della gemella in
// computo_module.js (eliminaSelezionateComputo — vedi i commenti lì per il
// ragionamento completo), adattato al modello "a blocchi" del Prezzario: qui
// non serve un batch Firestore multi-operazione, perché ogni salvataggio
// riscrive già in un colpo solo tutti i blocchi (_salvaBlocchiPrezzario) —
// quindi si accumulano tutte le eliminazioni/rinumerazioni in un unico
// array locale e si salva una volta sola a fine ciclo.
async function eliminaSelezionatePrezzario(key) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;
  const idsSelezionati = [...state.selezionate];
  if (!idsSelezionati.length) { alert('Nessuna voce selezionata.'); return; }

  const selezionateComplete = idsSelezionati.map(id => state.voci.find(v => v.id === id)).filter(Boolean);
  const eDiscendenteDi = (nodo, altro) => altro.id !== nodo.id && altro.tipo === 'titolo' &&
    (String(nodo.numero || '').startsWith(altro.numero + '.') || nodo.capitoloGenitore === altro.numero);
  const radici = selezionateComplete.filter(nodo => !selezionateComplete.some(altro => eDiscendenteDi(nodo, altro)));
  if (!radici.length) { alert('Nessuna voce selezionata.'); return; }

  let totaleRighe = 0;
  radici.forEach(nodo => {
    totaleRighe += 1;
    if (nodo.tipo === 'titolo') {
      const discVecchio = state.voci.filter(v => v.id !== nodo.id && String(v.numero || '').startsWith(nodo.numero + '.'));
      const discNuovo = state.voci.filter(v => v.tipo === 'voce' && v.capitoloGenitore === nodo.numero);
      totaleRighe += new Set([...discVecchio, ...discNuovo].map(v => v.id)).size;
    }
  });
  const messaggio = totaleRighe > radici.length
    ? `Eliminare ${radici.length} righe selezionate (che trascinano con sé altre righe sottostanti, per un totale di ${totaleRighe} righe)? Le voci rimanenti verranno rinumerate automaticamente. Non è annullabile.`
    : `Eliminare le ${radici.length} righe selezionate? Non è annullabile.`;
  if (!confirm(messaggio)) return;

  try {
    let nuoveVoci = state.voci.map(v => ({ ...v }));

    for (const radice of radici) {
      const attuale = nuoveVoci.find(v => v.id === radice.id);
      if (!attuale) continue;

      if (attuale.tipo === 'voce') {
        // Voce foglia (vecchio o nuovo stile): non trascina nulla e non
        // serve rinumerazione — stessa logica del ramo "voce" in
        // eliminaVocePrezzario.
        nuoveVoci = nuoveVoci.filter(v => v.id !== attuale.id);
        continue;
      }

      const discVecchio = nuoveVoci.filter(v => v.id !== attuale.id && String(v.numero || '').startsWith(attuale.numero + '.'));
      const discNuovo = nuoveVoci.filter(v => v.tipo === 'voce' && v.capitoloGenitore === attuale.numero);
      const idsSet = new Set([attuale.id, ...discVecchio.map(d => d.id), ...discNuovo.map(d => d.id)]);
      const dopoRimozione = nuoveVoci.filter(v => !idsSet.has(v.id));

      const { prefisso, indice } = _scomponiNumero(attuale.numero);
      const vociPrima = dopoRimozione.map(v => ({ id: v.id, numero: v.numero, tipo: v.tipo }));
      const aggiornamenti = calcolaRinumerazione(dopoRimozione, prefisso, indice + 1, -1);
      const vecchioANuovo = _aggiornaCapitoloGenitoreDopoRinumerazione(vociPrima, aggiornamenti);
      applicaRinumerazioneLocale(dopoRimozione, aggiornamenti);
      _applicaAggiornamentoCapitoloGenitoreLocale(dopoRimozione, vecchioANuovo);

      nuoveVoci = dopoRimozione;
    }

    nuoveVoci.sort((a, b) => confrontaVoci(a, b));
    await _salvaBlocchiPrezzario(state.edizioniCollName, state.edizioneAttiva.id, nuoveVoci);
    state.voci = nuoveVoci;
    _scriviCacheLocale(state.collName, state.voci);
    state.selezioneAttiva = false;
    state.selezionate = new Set();
    renderPrezzario(key);
    _aggiornaBottoniSelezionePrezzario(key);
  } catch (e) {
    alert("Errore nell'eliminazione multipla: " + _messaggioErroreFirestore(e));
  }
}

function _costruisciOnChangePrezzario(key, nodo, campo) {
  return `aggiornaCampoPrezzario('${key}','${nodo.id}','${campo}',this.value)`;
}

async function aggiornaCampoPrezzario(key, id, campo, valore) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;
  const nodo = state.voci.find(v => v.id === id);
  if (!nodo) return;
  try {
    const valoreFinale = campo === 'prezzo' ? (Number(valore) || 0)
      : campo === 'manodopera' ? (valore === '' ? null : (Number(valore) || 0))
      : valore;
    const aggiornamento = { [campo]: valoreFinale };
    // Per le voci "nuove" (capitoloGenitore esplicito) il codice fa anche da
    // "numero"/identificativo strutturale: tenerli sincronizzati evita che
    // la voce sparisca dall'albero (costruisciAlbero usa "numero" come
    // chiave). Per le voci vecchie (senza capitoloGenitore) "numero" resta
    // la posizione gerarchica originale e non va toccato.
    if (campo === 'codice' && nodo.capitoloGenitore) {
      aggiornamento.numero = valoreFinale;
    }
    Object.assign(nodo, aggiornamento);
    // Una modifica a un solo campo non cambia quante voci ci sono né la
    // loro suddivisione in blocchi (vedi import_prezzario.js): basta
    // riscrivere il SOLO blocco che contiene questa voce, 1 sola
    // scrittura Firestore — come prima di questo cambiamento.
    const vociStessoBlocco = state.voci.filter(v => v._blocco === nodo._blocco);
    await _salvaUnBloccoPrezzario(state.edizioniCollName, state.edizioneAttiva.id, nodo._blocco, vociStessoBlocco);
    _scriviCacheLocale(state.collName, state.voci);
  } catch (e) {
    alert('Errore nel salvataggio della modifica: ' + _messaggioErroreFirestore(e));
  }
}

function renderPrezzario(key) {
  const state = PREZZARIO_STATE[key];
  const body = document.getElementById(`${key}-albero-body`);
  if (!state || !body) return;

  const banner = document.getElementById(`${key}-import-banner`);
  if (banner && banner.dataset.forzato !== '1') {
    banner.style.display = state.voci.length ? 'none' : 'flex';
    banner.innerHTML = state.voci.length ? '' :
      `<span>Questa edizione è ancora vuota. Importa un file Excel o PDF per popolarla.</span>`;
  }

  // Richiesta esplicita di Giovanni: UN SOLO tasto "Elimina voce" in
  // toolbar, non più un pulsante Elimina per ogni riga — quindi qui non si
  // passa più onElimina: fuori dalla modalità selezione la colonna azioni
  // resta vuota (vedi azioniORiga in tree_view.js), l'unico modo per
  // cancellare (anche una sola voce) è "Elimina voce" → selezionarla →
  // "Conferma eliminazione". Identico a computo_module.js.
  const opzioniComuni = {
    variante: 'prezzario',
    modificaAttiva: state.modificaAttiva,
    costruisciOnChange: (nodo, campo) => _costruisciOnChangePrezzario(key, nodo, campo),
    selezioneAttiva: state.selezioneAttiva,
    vociSelezionate: state.selezionate,
    onToggleSelezione: nodo => `toggleSelezioneVocePrezzario('${key}','${nodo.id}')`,
  };

  if (state.ricerca) {
    const risultati = filtraVociPiatte(state.voci, state.ricerca, ['numero', 'codice', 'descrizione']);
    body.innerHTML = risultati.length
      ? renderRigheAlbero(risultati, new Set(), opzioniComuni)
      : `<div class="empty-state">Nessuna voce trovata.</div>`;
    return;
  }

  const albero = costruisciAlbero(state.voci);
  body.innerHTML = albero.length
    ? renderRigheAlbero(albero, state.espansi, {
        ...opzioniComuni,
        costruisciToggle: numero => `toggleRamoPrezzario('${key}','${numero}')`,
      })
    : `<div class="empty-state">Nessuna voce ancora.</div>`;
}

function mostraFormCapitoloPrezzario(key) {
  nascondiFormPrezzario(`${key}-form-voce`);
  document.getElementById(`${key}-form-capitolo`).style.display = 'block';
}
function mostraFormVocePrezzario(key) {
  nascondiFormPrezzario(`${key}-form-capitolo`);
  document.getElementById(`${key}-form-voce`).style.display = 'block';
}
function nascondiFormPrezzario(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// ─── Sincronizzazione capitoloGenitore quando i capitoli si rinumerano ───
// calcolaRinumerazione/applicaRinumerazione agiscono solo sul campo
// "numero" (confrontando i prefissi): le voci "nuove" del Prezzario (quelle
// con capitoloGenitore esplicito, il cui "numero" ormai è il codice
// proprietario e non una posizione gerarchica) non vengono quindi mai
// toccate da quelle due funzioni. Se però un capitolo/sottocapitolo viene
// rinumerato (es. l'inserimento di un nuovo capitolo "8" fa slittare il
// vecchio "8" a "9"), le voci che lo indicavano come genitore resterebbero
// altrimenti "orfane", agganciate a un numero che non esiste più. Queste
// due funzioni chiudono il cerchio: la prima ricava, dagli stessi
// "aggiornamenti" già calcolati per applicaRinumerazione, quali
// capitoli/sottocapitoli hanno cambiato numero; la seconda riscrive
// capitoloGenitore ovunque serva, su Firestore e in locale.
function _aggiornaCapitoloGenitoreDopoRinumerazione(vociPrimaDellaMutazione, aggiornamenti) {
  const vecchioANuovo = new Map();
  if (!aggiornamenti || !aggiornamenti.length) return vecchioANuovo;
  const mappaVecchie = new Map(vociPrimaDellaMutazione.map(v => [v.id, v]));
  aggiornamenti.forEach(({ id, numero: nuovoNumero }) => {
    const originale = mappaVecchie.get(id);
    if (originale && originale.tipo === 'titolo' && originale.numero !== nuovoNumero) {
      vecchioANuovo.set(originale.numero, nuovoNumero);
    }
  });
  return vecchioANuovo;
}

// Versione "solo in memoria" (vedi il commento gemello su
// applicaRinumerazioneLocale in tree_view.js): aggiorna solo l'array
// locale, chi chiama salva tutto insieme una volta sola a fine operazione.
function _applicaAggiornamentoCapitoloGenitoreLocale(vociLocali, vecchioANuovo) {
  if (!vecchioANuovo || !vecchioANuovo.size) return;
  vociLocali.forEach(v => {
    if (v.capitoloGenitore && vecchioANuovo.has(v.capitoloGenitore)) {
      v.capitoloGenitore = vecchioANuovo.get(v.capitoloGenitore);
    }
  });
}

async function salvaCapitoloPrezzario(key) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;
  const numero = document.getElementById(`${key}-cap-numero`).value.trim();
  const titolo = document.getElementById(`${key}-cap-titolo`).value.trim();
  if (!numero || !titolo) { alert('Inserisci numero e titolo.'); return; }
  try {
    // Si lavora su una copia finché il salvataggio non va a buon fine: se
    // qualcosa fallisce, lo stato locale visibile resta quello di prima,
    // coerente con quanto realmente salvato su Firestore.
    const nuoveVoci = state.voci.map(v => ({ ...v }));

    const { prefisso, indice } = _scomponiNumero(numero);
    const vociPrima = nuoveVoci.map(v => ({ id: v.id, numero: v.numero, tipo: v.tipo }));
    const aggiornamenti = calcolaRinumerazione(nuoveVoci, prefisso, indice, +1);
    const vecchioANuovo = _aggiornaCapitoloGenitoreDopoRinumerazione(vociPrima, aggiornamenti);
    applicaRinumerazioneLocale(nuoveVoci, aggiornamenti);
    _applicaAggiornamentoCapitoloGenitoreLocale(nuoveVoci, vecchioANuovo);

    nuoveVoci.push({ id: _nuovoIdVoce(), numero, tipo: 'titolo', titolo });
    nuoveVoci.sort((a, b) => confrontaVoci(a, b));

    await _salvaBlocchiPrezzario(state.edizioniCollName, state.edizioneAttiva.id, nuoveVoci);
    state.voci = nuoveVoci;
    _scriviCacheLocale(state.collName, state.voci);
    renderPrezzario(key);
    document.getElementById(`${key}-cap-numero`).value = '';
    document.getElementById(`${key}-cap-titolo`).value = '';
    nascondiFormPrezzario(`${key}-form-capitolo`);
  } catch (e) {
    alert('Errore nel salvataggio: ' + _messaggioErroreFirestore(e));
  }
}

// Le voci vengono ormai identificate dal proprio codice proprietario (es.
// "N04007b"), che funge anche da "numero" strutturale — non c'è più una
// numerazione gerarchica da far scorrere: basta indicare esplicitamente il
// capitolo/sottocapitolo padre (che deve già esistere) e nessuna rinumerazione
// di altre righe è necessaria per inserirne una nuova.
async function salvaVocePrezzario(key) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;
  const capitoloGenitore = document.getElementById(`${key}-voce-capitolo`).value.trim();
  const codice = document.getElementById(`${key}-voce-codice`).value.trim();
  const descrizione = document.getElementById(`${key}-voce-descrizione`).value.trim();
  if (!capitoloGenitore || !codice || !descrizione) {
    alert('Inserisci almeno il capitolo/sottocapitolo padre, il codice e la descrizione.');
    return;
  }
  const capitoloEsiste = state.voci.some(v => v.tipo === 'titolo' && v.numero === capitoloGenitore);
  if (!capitoloEsiste) {
    alert(`Non trovo nessun capitolo/sottocapitolo con numero "${capitoloGenitore}": deve esistere già (crealo prima con "+ Capitolo/Sottocapitolo" se manca).`);
    return;
  }
  if (state.voci.some(v => v.tipo === 'voce' && (v.codice || v.numero) === codice)) {
    alert(`Esiste già una voce con codice "${codice}": il codice deve essere unico, perché è lui a identificare la voce.`);
    return;
  }
  const manodoperaRaw = document.getElementById(`${key}-voce-manodopera`).value;
  const dato = {
    numero: codice,
    tipo: 'voce',
    capitoloGenitore,
    codice,
    descrizione,
    um: document.getElementById(`${key}-voce-um`).value.trim(),
    prezzo: Number(document.getElementById(`${key}-voce-prezzo`).value) || 0,
    manodopera: manodoperaRaw === '' ? null : (Number(manodoperaRaw) || 0),
  };
  try {
    const nuoveVoci = [...state.voci, { id: _nuovoIdVoce(), ...dato }];
    nuoveVoci.sort((a, b) => confrontaVoci(a, b));
    await _salvaBlocchiPrezzario(state.edizioniCollName, state.edizioneAttiva.id, nuoveVoci);
    state.voci = nuoveVoci;
    _scriviCacheLocale(state.collName, state.voci);
    renderPrezzario(key);
    ['capitolo', 'codice', 'descrizione', 'um', 'prezzo', 'manodopera'].forEach(campo => {
      document.getElementById(`${key}-voce-${campo}`).value = '';
    });
    nascondiFormPrezzario(`${key}-form-voce`);
  } catch (e) {
    alert('Errore nel salvataggio della voce: ' + _messaggioErroreFirestore(e));
  }
}

// Non più collegata a nessun pulsante nell'interfaccia (il pulsante
// "Elimina" per-riga è stato tolto, vedi opzioniComuni sopra): resta qui
// come logica di eliminazione di una singola riga, riusabile in futuro se
// dovesse mai tornare utile un'eliminazione rapida di una sola voce.
async function eliminaVocePrezzario(key, id) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;
  const nodo = state.voci.find(v => v.id === id);
  if (!nodo) return;

  if (nodo.tipo === 'voce') {
    // Voce foglia (vecchio o nuovo stile): è una riga a sé, non trascina
    // nessun'altra riga e non serve nessuna rinumerazione.
    if (!confirm('Eliminare questa voce dal prezzario? Non è annullabile.')) return;
    try {
      const nuoveVoci = state.voci.filter(v => v.id !== id);
      await _salvaBlocchiPrezzario(state.edizioniCollName, state.edizioneAttiva.id, nuoveVoci);
      state.voci = nuoveVoci;
      _scriviCacheLocale(state.collName, state.voci);
      renderPrezzario(key);
    } catch (e) {
      alert("Errore nell'eliminazione: " + _messaggioErroreFirestore(e));
    }
    return;
  }

  // Capitolo/sottocapitolo: eliminarlo trascina con sé tutte le righe sotto
  // di esso — sia quelle ancora agganciate al vecchio modo (numero che
  // inizia col prefisso del capitolo) sia le voci nuove che lo indicano
  // esplicitamente come capitoloGenitore — altrimenti resterebbero "orfane".
  const discendentiVecchioStile = state.voci.filter(v => v.id !== id && String(v.numero || '').startsWith(nodo.numero + '.'));
  const discendentiNuovoStile = state.voci.filter(v => v.tipo === 'voce' && v.capitoloGenitore === nodo.numero);
  const discendenti = [...discendentiVecchioStile, ...discendentiNuovoStile];
  const messaggio = discendenti.length
    ? `Eliminare "${nodo.numero} — ${nodo.titolo}" insieme alle sue ${discendenti.length} righe sottostanti? Le voci successive verranno rinumerate automaticamente. Non è annullabile.`
    : 'Eliminare questo capitolo dal prezzario? Le voci successive verranno rinumerate automaticamente.';
  if (!confirm(messaggio)) return;

  try {
    const idsSet = new Set([id, ...discendenti.map(d => d.id)]);
    const nuoveVoci = state.voci.filter(v => !idsSet.has(v.id));

    // Chiude il vuoto lasciato al livello del capitolo eliminato, e
    // riaggancia le eventuali voci nuove i cui capitoli genitori sono stati
    // spostati da questa rinumerazione (vedi commento sulle due funzioni
    // _aggiornaCapitoloGenitoreDopoRinumerazione/_applicaAggiornamentoCapitoloGenitoreLocale).
    const { prefisso, indice } = _scomponiNumero(nodo.numero);
    const vociPrima = nuoveVoci.map(v => ({ id: v.id, numero: v.numero, tipo: v.tipo }));
    const aggiornamenti = calcolaRinumerazione(nuoveVoci, prefisso, indice + 1, -1);
    const vecchioANuovo = _aggiornaCapitoloGenitoreDopoRinumerazione(vociPrima, aggiornamenti);
    applicaRinumerazioneLocale(nuoveVoci, aggiornamenti);
    _applicaAggiornamentoCapitoloGenitoreLocale(nuoveVoci, vecchioANuovo);

    await _salvaBlocchiPrezzario(state.edizioniCollName, state.edizioneAttiva.id, nuoveVoci);
    state.voci = nuoveVoci;
    _scriviCacheLocale(state.collName, state.voci);
    renderPrezzario(key);
  } catch (e) {
    alert("Errore nell'eliminazione: " + _messaggioErroreFirestore(e));
  }
}

async function cancellaTuttoPrezzario(key) {
  const state = PREZZARIO_STATE[key];
  if (!state || !state.voci.length) { alert("Questa edizione è già vuota."); return; }
  const scelta = await chiediScelta({
    titolo: 'Cancellare tutte le voci?',
    corpo: `Stai per eliminare definitivamente tutte le ${state.voci.length} righe dell'edizione "${state.edizioneAttiva.nome}". Non è annullabile.`,
    bottoni: [
      { valore: 'annulla', testo: 'Annulla' },
      { valore: 'conferma', testo: 'Cancella tutto', classe: 'btn-rosso' }
    ]
  });
  if (scelta !== 'conferma') return;

  const banner = document.getElementById(`${key}-import-banner`);
  if (banner) {
    banner.dataset.forzato = '1';
    banner.style.display = 'flex';
    banner.innerHTML = '<span>Cancellazione in corso, non chiudere la pagina...</span>';
  }
  try {
    await _salvaBlocchiPrezzario(state.edizioniCollName, state.edizioneAttiva.id, []);
    state.voci = [];
    _scriviCacheLocale(state.collName, state.voci);
    renderPrezzario(key);
    alert('✓ Tutte le righe sono state cancellate.');
    if (banner) { banner.style.display = 'none'; banner.dataset.forzato = '0'; }
  } catch (e) {
    if (banner) banner.dataset.forzato = '0';
    alert('Errore durante la cancellazione: ' + _messaggioErroreFirestore(e));
  }
}

function esportaPrezzarioExcel(key) {
  const state = PREZZARIO_STATE[key];
  if (!state.voci.length) { alert('Nessuna riga da esportare.'); return; }
  const rows = state.voci.map(v => ({
    // Per le righe titolo (capitolo/sottocapitolo) mostra il codice reale
    // ricavato dalle voci figlie (codiceVisibile, vedi import_prezzario.js)
    // quando disponibile, altrimenti il numero progressivo interno.
    'Numero': (v.tipo === 'voce' ? (v.codice || v.numero) : (v.codiceVisibile || v.numero)) || '',
    'Titolo': v.tipo === 'titolo' ? (v.titolo || '') : '',
    'Descrizione': v.descrizione || '',
    'U.M.': v.um || '',
    'Prezzo': v.tipo === 'voce' ? (v.prezzo ?? '') : '',
    '% Manodopera': v.tipo === 'voce' && v.manodopera != null ? v.manodopera : '',
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, `${state.title} ${state.edizioneAttiva.nome}`.slice(0, 30));
  XLSX.writeFile(wb, `${state.collBase}_${state.edizioneAttiva.nome}.xlsx`);
}

function esportaPrezzarioPDF(key) {
  const state = PREZZARIO_STATE[key];
  if (!state.voci.length) { alert('Nessuna riga da esportare.'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(14);
  doc.text(`${state.title} — ${state.edizioneAttiva.nome}`, 14, 15);
  doc.autoTable({
    startY: 22,
    head: [['Numero', 'Titolo/Descrizione', 'U.M.', 'Prezzo', '% Manod.']],
    body: state.voci.map(v => [
      ((v.tipo === 'voce' ? (v.codice || v.numero) : (v.codiceVisibile || v.numero)) || ''),
      v.tipo === 'titolo' ? (v.titolo || '') + (v.descrizione ? `\n${v.descrizione}` : '') : (v.descrizione || ''),
      v.um || '', v.tipo === 'voce' ? (v.prezzo ?? '') : '',
      v.tipo === 'voce' && v.manodopera != null ? v.manodopera : '',
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [34, 34, 34] },
  });
  doc.save(`${state.collBase}_${state.edizioneAttiva.nome}.pdf`);
}
