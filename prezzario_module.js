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
  };

  const state = PREZZARIO_STATE[key];
  state.unsubEdizioni = db.collection(state.edizioniCollName).onSnapshot(snap => {
    state.edizioni = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    state.edizioni.sort((a, b) => (b.creatoIl || 0) - (a.creatoIl || 0));
    if (!state.edizioneAttiva) renderElencoEdizioni(key);
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
async function _controllaMigrazionePrezzario(key) {
  const state = PREZZARIO_STATE[key];
  const wrap = document.getElementById(`${key}-migrazione-wrap`);
  if (!state || !wrap) return;
  try {
    const snap = await db.collection(state.collBase).limit(1).get();
    if (snap.empty) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = `
      <div class="import-banner" style="display:flex;margin-bottom:18px">
        <span>Ho trovato dati nella vecchia collezione unica, da prima delle edizioni. Vuoi spostarli in una nuova edizione?</span>
        <button class="btn btn-blu btn-sm" onclick="migraDatiPrezzario('${key}')">Migra dati esistenti</button>
      </div>`;
  } catch (e) {
    // Non nascondiamo l'errore in silenzio: se il controllo stesso fallisce
    // (es. quota esaurita) l'utente deve saperlo, non vedere il banner
    // sparire come se fosse tutto a posto.
    wrap.innerHTML = `<div class="import-banner" style="display:flex"><span>Non riesco a controllare se ci sono dati da migrare: ${escapeHtml(_messaggioErroreFirestore(e))}</span></div>`;
  }
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
    const voci = snap.docs.map(d => d.data());
    if (!voci.length) {
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

    if (edizioneId) {
      const contaSnap = await db.collection(`${state.edizioniCollName}/${edizioneId}/voci`).get();
      if (contaSnap.size >= voci.length) {
        // La copia risulta già completa: saltiamo dritti allo svuotamento
        // della vecchia collezione, senza ricopiare nulla.
      } else if (contaSnap.size > 0) {
        // Conteggio parziale e diverso: rischio di duplicati se ricopiamo
        // alla cieca. Meglio fermarsi e far decidere all'utente.
        throw new Error(
          `L'edizione "${nome}" esiste già con ${contaSnap.size} righe, diverse dalle ${voci.length} della vecchia collezione. ` +
          `Per sicurezza non copio automaticamente (rischio doppioni): elimina l'edizione "${nome}" se è un tentativo incompleto da rifare, oppure scegli un nome diverso.`
        );
      } else {
        const nuovaColl = db.collection(`${state.edizioniCollName}/${edizioneId}/voci`);
        await _scriviVociABatch(nuovaColl, voci, null);
      }
    } else {
      const edRef = await db.collection(state.edizioniCollName).add({
        nome, creatoIl: Date.now(), creatoDa: (CURRENT_USER && CURRENT_USER.email) || '',
      });
      edizioneId = edRef.id;
      const nuovaColl = db.collection(`${state.edizioniCollName}/${edizioneId}/voci`);
      await _scriviVociABatch(nuovaColl, voci, null);
    }

    // Verifichiamo che la copia sia COMPLETA prima di toccare l'originale:
    // se qualcosa fosse andato storto, i dati vecchi restano intatti.
    const freshSnap = await db.collection(`${state.edizioniCollName}/${edizioneId}/voci`).get();
    if (freshSnap.size < voci.length) {
      throw new Error(
        `Copia incompleta (${freshSnap.size}/${voci.length} righe): i dati originali non sono stati toccati. ` +
        `Clicca di nuovo su "Migra dati esistenti" e riscrivi lo stesso nome "${nome}": riprenderà da dove si era fermata, senza duplicare le righe già copiate.`
      );
    }

    await _cancellaTutteLeVoci(vecchiaColl, snap.docs.map(d => ({ id: d.id })));

    // Svuotiamo un'eventuale cache locale vecchia per questa edizione: se
    // l'abbiamo riusata (nome già esistente), il conteggio reale è appena
    // cambiato e non deve restare in memoria una versione superata.
    _svuotaCacheLocale(`${state.edizioniCollName}/${edizioneId}/voci`);

    if (wrap) wrap.innerHTML = '';
    alert(`✓ Migrazione completata: ${voci.length} righe nell'edizione "${nome}".`);
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
    const vociSnap = await db.collection(`${state.edizioniCollName}/${id}/voci`).get();
    if (!vociSnap.empty) {
      const CHUNK = 450;
      const docs = vociSnap.docs;
      for (let i = 0; i < docs.length; i += CHUNK) {
        const batch = db.batch();
        docs.slice(i, i + CHUNK).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
  } catch (e) {
    alert(`Errore nella cancellazione delle righe dell'edizione "${nome}": ${_messaggioErroreFirestore(e)}\n\nL'edizione NON è stata eliminata. Riprova: le righe già cancellate non verranno ricancellate.`);
    return;
  }

  try {
    await db.collection(state.edizioniCollName).doc(id).delete();
    _svuotaCacheLocale(`${state.edizioniCollName}/${id}/voci`);
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

  page.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <button class="btn btn-sm" onclick="chiudiEdizionePrezzario('${key}')">← Edizioni</button>
        &nbsp; ${escapeHtml(state.title)} — ${escapeHtml(state.edizioneAttiva.nome)}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <span id="${key}-cache-info"></span>
        <input type="file" id="${key}-file-input" accept=".xlsx,.xls,.csv" style="display:none">
        <button class="btn btn-blu btn-sm" onclick="document.getElementById('${key}-file-input').click()">Importa da Excel</button>
        <button class="btn btn-sm" onclick="mostraFormCapitoloPrezzario('${key}')">+ Capitolo/Sottocapitolo</button>
        <button class="btn btn-sm" onclick="mostraFormVocePrezzario('${key}')">+ Voce</button>
        <button id="${key}-btn-modifica" class="btn btn-sm" onclick="toggleModificaPrezzario('${key}')">✎ Modifica</button>
        <button class="btn btn-sm" onclick="esportaPrezzarioExcel('${key}')">⬇ Excel</button>
        <button class="btn btn-sm" onclick="esportaPrezzarioPDF('${key}')">⬇ PDF</button>
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
        <input id="${key}-voce-numero" placeholder="Numero (es. 1.2.3)" style="max-width:120px">
        <input id="${key}-voce-codice" placeholder="Codice" style="max-width:150px">
        <input id="${key}-voce-descrizione" placeholder="Descrizione" style="flex:1;min-width:220px">
      </div>
      <div class="form-row">
        <input id="${key}-voce-um" placeholder="U.M." style="max-width:80px">
        <input id="${key}-voce-prezzo" placeholder="Prezzo (€)" type="number" step="0.01" style="max-width:120px">
        <button class="btn btn-blu" onclick="salvaVocePrezzario('${key}')">Salva</button>
        <button class="btn" onclick="nascondiFormPrezzario('${key}-form-voce')">Annulla</button>
      </div>
      <div style="font-size:11px;color:var(--ink4);margin-top:6px">Se il numero esiste già (o precede voci già presenti), le righe successive si spostano automaticamente per fare spazio.</div>
    </div>

    <div class="toolbar">
      <input type="search" id="${key}-ricerca" placeholder="Cerca per numero, codice o descrizione...">
    </div>

    <div class="albero-wrap">
      <div class="albero-header albero-riga-prezzario">
        <span>Numero</span><span>Codice</span><span>Titolo / Descrizione</span><span>U.M.</span><span>Prezzo</span><span></span>
      </div>
      <div id="${key}-albero-body"><div class="empty-state">Caricamento...</div></div>
    </div>
  `;

  document.getElementById(`${key}-ricerca`).addEventListener('input', e => {
    state.ricerca = e.target.value.trim().toLowerCase();
    renderPrezzario(key);
  });

  document.getElementById(`${key}-file-input`).addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) importaPrezzarioDaExcel(key, file);
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
    state.voci.sort((a, b) => confrontaNumero(a.numero, b.numero));
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
    const snap = await db.collection(state.collName).get();
    state.voci = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    state.voci.sort((a, b) => confrontaNumero(a.numero, b.numero));
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
  renderPrezzario(key);
  const btn = document.getElementById(`${key}-btn-modifica`);
  if (btn) {
    btn.textContent = state.modificaAttiva ? '✓ Fine modifica' : '✎ Modifica';
    btn.classList.toggle('btn-ink', state.modificaAttiva);
  }
}

function _costruisciOnChangePrezzario(key, nodo, campo) {
  return `aggiornaCampoPrezzario('${key}','${nodo.id}','${campo}',this.value)`;
}

async function aggiornaCampoPrezzario(key, id, campo, valore) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;
  try {
    const valoreFinale = campo === 'prezzo' ? (Number(valore) || 0) : valore;
    await db.collection(state.collName).doc(id).update({ [campo]: valoreFinale });
    const nodo = state.voci.find(v => v.id === id);
    if (nodo) nodo[campo] = valoreFinale;
    _scriviCacheLocale(state.collName, state.voci);
  } catch (e) {
    alert('Errore nel salvataggio della modifica: ' + _messaggioErroreFirestore(e));
  }
}

function azioniVocePrezzario(key, nodo) {
  return `<button class="btn btn-sm btn-rosso" onclick="eliminaVocePrezzario('${key}','${nodo.id}')">Elimina</button>`;
}

function renderPrezzario(key) {
  const state = PREZZARIO_STATE[key];
  const body = document.getElementById(`${key}-albero-body`);
  if (!state || !body) return;

  const banner = document.getElementById(`${key}-import-banner`);
  if (banner && banner.dataset.forzato !== '1') {
    banner.style.display = state.voci.length ? 'none' : 'flex';
    banner.innerHTML = state.voci.length ? '' :
      `<span>Questa edizione è ancora vuota. Importa un file Excel per popolarla.</span>`;
  }

  const opzioniComuni = {
    variante: 'prezzario',
    onElimina: nodo => azioniVocePrezzario(key, nodo),
    modificaAttiva: state.modificaAttiva,
    costruisciOnChange: (nodo, campo) => _costruisciOnChangePrezzario(key, nodo, campo),
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

async function salvaCapitoloPrezzario(key) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;
  const numero = document.getElementById(`${key}-cap-numero`).value.trim();
  const titolo = document.getElementById(`${key}-cap-titolo`).value.trim();
  if (!numero || !titolo) { alert('Inserisci numero e titolo.'); return; }
  try {
    const collRef = db.collection(state.collName);

    const { prefisso, indice } = _scomponiNumero(numero);
    const aggiornamenti = calcolaRinumerazione(state.voci, prefisso, indice, +1);
    await applicaRinumerazione(collRef, state.voci, aggiornamenti);

    const ref = await collRef.add({ numero, tipo: 'titolo', titolo });
    state.voci.push({ id: ref.id, numero, tipo: 'titolo', titolo });
    state.voci.sort((a, b) => confrontaNumero(a.numero, b.numero));
    _scriviCacheLocale(state.collName, state.voci);
    renderPrezzario(key);
    document.getElementById(`${key}-cap-numero`).value = '';
    document.getElementById(`${key}-cap-titolo`).value = '';
    nascondiFormPrezzario(`${key}-form-capitolo`);
  } catch (e) {
    alert('Errore nel salvataggio: ' + _messaggioErroreFirestore(e));
  }
}

async function salvaVocePrezzario(key) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;
  const numero = document.getElementById(`${key}-voce-numero`).value.trim();
  const descrizione = document.getElementById(`${key}-voce-descrizione`).value.trim();
  if (!numero || !descrizione) { alert('Inserisci almeno numero e descrizione.'); return; }
  const dato = {
    numero,
    tipo: 'voce',
    codice: document.getElementById(`${key}-voce-codice`).value.trim(),
    descrizione,
    um: document.getElementById(`${key}-voce-um`).value.trim(),
    prezzo: Number(document.getElementById(`${key}-voce-prezzo`).value) || 0,
  };
  try {
    const collRef = db.collection(state.collName);

    const { prefisso, indice } = _scomponiNumero(numero);
    const aggiornamenti = calcolaRinumerazione(state.voci, prefisso, indice, +1);
    await applicaRinumerazione(collRef, state.voci, aggiornamenti);

    const ref = await collRef.add(dato);
    state.voci.push({ id: ref.id, ...dato });
    state.voci.sort((a, b) => confrontaNumero(a.numero, b.numero));
    _scriviCacheLocale(state.collName, state.voci);
    renderPrezzario(key);
    ['numero', 'codice', 'descrizione', 'um', 'prezzo'].forEach(campo => {
      document.getElementById(`${key}-voce-${campo}`).value = '';
    });
    nascondiFormPrezzario(`${key}-form-voce`);
  } catch (e) {
    alert('Errore nel salvataggio della voce: ' + _messaggioErroreFirestore(e));
  }
}

async function eliminaVocePrezzario(key, id) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;
  const nodo = state.voci.find(v => v.id === id);
  if (!nodo) return;

  // Se è un capitolo/sottocapitolo, eliminarlo trascina con sé tutte le
  // righe sotto di esso (altrimenti resterebbero "orfane", senza un
  // genitore nell'albero) — l'utente viene avvisato del numero di righe
  // coinvolte prima di confermare.
  const discendenti = nodo.tipo === 'titolo'
    ? state.voci.filter(v => v.id !== id && String(v.numero || '').startsWith(nodo.numero + '.'))
    : [];
  const messaggio = discendenti.length
    ? `Eliminare "${nodo.numero} — ${nodo.titolo}" insieme alle sue ${discendenti.length} righe sottostanti? Le voci successive verranno rinumerate automaticamente. Non è annullabile.`
    : 'Eliminare questa riga dal prezzario? Le voci successive verranno rinumerate automaticamente.';
  if (!confirm(messaggio)) return;

  try {
    const collRef = db.collection(state.collName);
    const idsDaEliminare = [id, ...discendenti.map(d => d.id)];
    await _cancellaTutteLeVoci(collRef, idsDaEliminare.map(idEl => ({ id: idEl })));
    const idsSet = new Set(idsDaEliminare);
    state.voci = state.voci.filter(v => !idsSet.has(v.id));

    // Chiude il vuoto lasciato al livello del nodo eliminato.
    const { prefisso, indice } = _scomponiNumero(nodo.numero);
    const aggiornamenti = calcolaRinumerazione(state.voci, prefisso, indice + 1, -1);
    await applicaRinumerazione(collRef, state.voci, aggiornamenti);

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
    await _cancellaTutteLeVoci(db.collection(state.collName), state.voci);
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
    'Numero': v.numero || '',
    'Codice': v.codice || '',
    'Titolo': v.tipo === 'titolo' ? (v.titolo || '') : '',
    'Descrizione': v.descrizione || '',
    'U.M.': v.um || '',
    'Prezzo': v.tipo === 'voce' ? (v.prezzo ?? '') : '',
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
    head: [['Numero', 'Codice', 'Titolo/Descrizione', 'U.M.', 'Prezzo']],
    body: state.voci.map(v => [
      v.numero || '', v.codice || '',
      v.tipo === 'titolo' ? (v.titolo || '') : (v.descrizione || ''),
      v.um || '', v.tipo === 'voce' ? (v.prezzo ?? '') : '',
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [34, 34, 34] },
  });
  doc.save(`${state.collBase}_${state.edizioneAttiva.nome}.pdf`);
}
