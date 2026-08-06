// ══════════════════════════════════════════════════════════════════════
// MAGAZZINO COMPUTO — indipendente, stessa identica funzione dei due
// Prezzari (Veneto/DEI): un catalogo consultabile e cercabile in vista ad
// albero (capitolo > sottocapitolo > voce), popolabile importando un file
// Excel oppure aggiungendo capitoli/voci a mano. NON è legato a nessun
// progetto e NON ha quantità (né prezzo): è solo un elenco di voci a
// disposizione, da cui i Progetti pescano con "+ Aggiungi".
//
// Ogni riga è un documento con i campi:
//   numero, tipo ('titolo'|'voce')
//   — se tipo='titolo': solo numero + titolo (capitolo/sottocapitolo)
//   — se tipo='voce': numero, titolo, descrizione, misure, um
//
// NOTA: il vecchio "Cod. E.P." (codice dell'elenco prezzi di provenienza,
// es. "E.15.001.01") non viene più mostrato né richiesto: da quando la
// numerazione gerarchica (COD.C.M, es. "9.1.1") fa da identificativo
// principale di ogni voce, tenere anche il vecchio codice come colonna a
// sé non aveva più senso — era un doppione superato. Le voci importate in
// passato che lo hanno ancora salvato in Firestore non vengono toccate
// (il campo resta lì, semplicemente non è più letto/mostrato): nessun dato
// viene perso.
//
// La collezione è specifica per disciplina: 'computo_elettrico' /
// 'computo_meccanico', passata da app_init.js.
// ══════════════════════════════════════════════════════════════════════

const MAGAZZINO_COMPUTO = { collName: null, voci: [], ricerca: '', espansi: new Set(), modificaAttiva: false };
let _pageIdComputo = 'page-computo';

function initComputo(pageId, disciplina) {
  _pageIdComputo = pageId;
  MAGAZZINO_COMPUTO.collName = 'computo_' + disciplina;
  MAGAZZINO_COMPUTO.voci = [];
  MAGAZZINO_COMPUTO.ricerca = '';
  MAGAZZINO_COMPUTO.espansi = new Set();
  MAGAZZINO_COMPUTO.modificaAttiva = false;

  const page = document.getElementById(pageId);
  page.innerHTML = `
    <div class="page-header">
      <div class="page-title">Computo</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <span id="computo-cache-info"></span>
        <input type="file" id="computo-file-input" accept=".xlsx,.xls,.csv" style="display:none">
        <button class="btn btn-blu btn-sm" onclick="document.getElementById('computo-file-input').click()">Importa da Excel</button>
        <button class="btn btn-sm" onclick="mostraFormCapitoloComputo()">+ Capitolo/Sottocapitolo</button>
        <button class="btn btn-sm" onclick="mostraFormVoceComputo()">+ Voce</button>
        <button id="computo-btn-modifica" class="btn btn-sm" onclick="toggleModificaComputo()">✎ Modifica</button>
        <button class="btn btn-sm" onclick="esportaComputoExcel()">⬇ Excel</button>
        <button class="btn btn-sm" onclick="esportaComputoPDF()">⬇ PDF</button>
        <button class="btn btn-rosso btn-sm" onclick="cancellaTuttoComputo()">Cancella tutto</button>
      </div>
    </div>

    <div id="computo-import-banner" class="import-banner" style="display:none"></div>

    <div id="computo-form-capitolo" class="card" style="display:none;margin-bottom:14px">
      <div class="form-row" style="margin-bottom:0">
        <input id="computo-cap-numero" placeholder="Numero (es. 1.2)" style="max-width:120px">
        <input id="computo-cap-titolo" placeholder="Titolo capitolo/sottocapitolo" style="flex:1;min-width:200px">
        <button class="btn btn-blu" onclick="salvaCapitoloComputo()">Salva</button>
        <button class="btn" onclick="nascondiFormComputo('computo-form-capitolo')">Annulla</button>
      </div>
      <div style="font-size:11px;color:var(--ink4);margin-top:6px">Se il numero esiste già (o precede voci già presenti), le righe successive si spostano automaticamente per fare spazio.</div>
    </div>

    <div id="computo-form-voce" class="card" style="display:none;margin-bottom:14px">
      <div class="form-row">
        <input id="computo-voce-numero" placeholder="Numero (es. 1.2.3)" style="max-width:120px">
        <input id="computo-voce-titolo" placeholder="Titolo voce" style="flex:1;min-width:200px">
      </div>
      <div class="form-row">
        <input id="computo-voce-descrizione" placeholder="Descrizione estesa (facoltativa)" style="flex:1;min-width:220px">
        <input id="computo-voce-misure" placeholder="Misure" style="max-width:160px">
        <input id="computo-voce-um" placeholder="U.M." style="max-width:80px">
        <button class="btn btn-blu" onclick="salvaVoceComputo()">Salva</button>
        <button class="btn" onclick="nascondiFormComputo('computo-form-voce')">Annulla</button>
      </div>
      <div style="font-size:11px;color:var(--ink4);margin-top:6px">Se il numero esiste già (o precede voci già presenti), le righe successive si spostano automaticamente per fare spazio.</div>
    </div>

    <div class="toolbar">
      <input type="search" id="computo-ricerca" placeholder="Cerca per numero o descrizione...">
    </div>

    <div class="albero-wrap">
      <div class="albero-header albero-riga-computo">
        <span>Numero</span><span>Titolo / Descrizione</span><span>Misure</span><span>U.M.</span><span></span>
      </div>
      <div id="computo-albero-body"><div class="empty-state">Caricamento...</div></div>
    </div>
  `;

  document.getElementById('computo-ricerca').addEventListener('input', e => {
    MAGAZZINO_COMPUTO.ricerca = e.target.value.trim().toLowerCase();
    renderComputoMagazzino();
  });

  document.getElementById('computo-file-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) importaComputoDaExcel(file);
    e.target.value = '';
  });

  _caricaComputoConCache();
}

// Carica il Computo: prima dalla cache locale del dispositivo (istantaneo,
// ZERO letture Firestore), altrimenti da Firestore (solo se non c'è ancora
// nessuna cache qui — es. primo utilizzo di questa disciplina su questo
// dispositivo). Il Computo cambia solo quando lo importi/modifichi tu,
// quindi non serve un ascolto in tempo reale che rilegga tutto ogni volta
// (compreso ogni semplice login/cambio disciplina, come avveniva prima).
async function _caricaComputoConCache() {
  const cache = _leggiCacheLocale(MAGAZZINO_COMPUTO.collName);
  if (cache) {
    MAGAZZINO_COMPUTO.voci = cache.voci.slice();
    MAGAZZINO_COMPUTO.voci.sort((a, b) => confrontaNumero(a.numero, b.numero));
    renderComputoMagazzino();
    _aggiornaIndicatoreCacheComputo();
    return;
  }
  await aggiornaComputoDaServer();
}

// Lettura esplicita e reale da Firestore (consuma quota): solo al primo
// accesso su un dispositivo, oppure quando l'utente preme "⟳ Aggiorna".
async function aggiornaComputoDaServer() {
  const body = document.getElementById('computo-albero-body');
  if (body && !MAGAZZINO_COMPUTO.voci.length) body.innerHTML = '<div class="empty-state">Caricamento dal server...</div>';
  try {
    const snap = await db.collection(MAGAZZINO_COMPUTO.collName).get();
    MAGAZZINO_COMPUTO.voci = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    MAGAZZINO_COMPUTO.voci.sort((a, b) => confrontaNumero(a.numero, b.numero));
    _scriviCacheLocale(MAGAZZINO_COMPUTO.collName, MAGAZZINO_COMPUTO.voci);
    renderComputoMagazzino();
    _aggiornaIndicatoreCacheComputo();
  } catch (e) {
    console.error('Errore caricamento computo:', e.message);
    if (body) body.innerHTML = `<div class="empty-state">Errore: ${escapeHtml(_messaggioErroreFirestore(e))}</div>`;
  }
}

function _aggiornaIndicatoreCacheComputo() {
  const el = document.getElementById('computo-cache-info');
  if (!el || !MAGAZZINO_COMPUTO.collName) return;
  el.innerHTML = _htmlIndicatoreCache(MAGAZZINO_COMPUTO.collName, `aggiornaComputoDaServer()`);
}

function resetComputoModulo() {
  MAGAZZINO_COMPUTO.collName = null;
  MAGAZZINO_COMPUTO.voci = [];
  MAGAZZINO_COMPUTO.ricerca = '';
  MAGAZZINO_COMPUTO.espansi = new Set();
  MAGAZZINO_COMPUTO.modificaAttiva = false;
}

function toggleRamoComputo(numero) {
  if (MAGAZZINO_COMPUTO.espansi.has(numero)) MAGAZZINO_COMPUTO.espansi.delete(numero);
  else MAGAZZINO_COMPUTO.espansi.add(numero);
  renderComputoMagazzino();
}

// ─── Modalità modifica inline (capitoli, sottocapitoli e voci) ───
// Stessa idea della modalità "✎ Modifica" già presente nell'area di lavoro
// dei Progetti: qui si applica direttamente al magazzino Computo (non a una
// copia locale di un progetto), quindi la modifica è definitiva e vale per
// chiunque la consulti o la peschi da un progetto in futuro.
function toggleModificaComputo() {
  MAGAZZINO_COMPUTO.modificaAttiva = !MAGAZZINO_COMPUTO.modificaAttiva;
  renderComputoMagazzino();
  const btn = document.getElementById('computo-btn-modifica');
  if (btn) {
    btn.textContent = MAGAZZINO_COMPUTO.modificaAttiva ? '✓ Fine modifica' : '✎ Modifica';
    btn.classList.toggle('btn-ink', MAGAZZINO_COMPUTO.modificaAttiva);
  }
}

function _costruisciOnChangeComputo(nodo, campo) {
  return `aggiornaCampoComputo('${nodo.id}','${campo}',this.value)`;
}

async function aggiornaCampoComputo(id, campo, valore) {
  try {
    await db.collection(MAGAZZINO_COMPUTO.collName).doc(id).update({ [campo]: valore });
    const nodo = MAGAZZINO_COMPUTO.voci.find(v => v.id === id);
    if (nodo) nodo[campo] = valore;
    _scriviCacheLocale(MAGAZZINO_COMPUTO.collName, MAGAZZINO_COMPUTO.voci);
  } catch (e) {
    alert('Errore nel salvataggio della modifica: ' + _messaggioErroreFirestore(e));
  }
}

function azioniVoceComputo(nodo) {
  return `<button class="btn btn-sm btn-rosso" onclick="eliminaVoceComputo('${nodo.id}')">Elimina</button>`;
}

function renderComputoMagazzino() {
  const body = document.getElementById('computo-albero-body');
  if (!body) return;

  const banner = document.getElementById('computo-import-banner');
  if (banner && banner.dataset.forzato !== '1') {
    banner.style.display = MAGAZZINO_COMPUTO.voci.length ? 'none' : 'flex';
    banner.innerHTML = MAGAZZINO_COMPUTO.voci.length ? '' :
      `<span>Il Computo è ancora vuoto. Importa un file Excel per popolarlo.</span>`;
  }

  const opzioniComuni = {
    variante: 'computo',
    onElimina: azioniVoceComputo,
    modificaAttiva: MAGAZZINO_COMPUTO.modificaAttiva,
    costruisciOnChange: _costruisciOnChangeComputo,
  };

  if (MAGAZZINO_COMPUTO.ricerca) {
    const risultati = filtraVociPiatte(MAGAZZINO_COMPUTO.voci, MAGAZZINO_COMPUTO.ricerca, ['numero', 'titolo', 'descrizione']);
    body.innerHTML = risultati.length
      ? renderRigheAlbero(risultati, new Set(), opzioniComuni)
      : `<div class="empty-state">Nessuna voce trovata.</div>`;
    return;
  }

  const albero = costruisciAlbero(MAGAZZINO_COMPUTO.voci);
  body.innerHTML = albero.length
    ? renderRigheAlbero(albero, MAGAZZINO_COMPUTO.espansi, {
        ...opzioniComuni,
        costruisciToggle: numero => `toggleRamoComputo('${numero}')`,
      })
    : `<div class="empty-state">Nessuna voce ancora.</div>`;
}

function mostraFormCapitoloComputo() {
  nascondiFormComputo('computo-form-voce');
  document.getElementById('computo-form-capitolo').style.display = 'block';
}
function mostraFormVoceComputo() {
  nascondiFormComputo('computo-form-capitolo');
  document.getElementById('computo-form-voce').style.display = 'block';
}
function nascondiFormComputo(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

async function salvaCapitoloComputo() {
  const numero = document.getElementById('computo-cap-numero').value.trim();
  const titolo = document.getElementById('computo-cap-titolo').value.trim();
  if (!numero || !titolo) { alert('Inserisci numero e titolo.'); return; }
  try {
    const collRef = db.collection(MAGAZZINO_COMPUTO.collName);

    // Se il numero scelto è già occupato (o precede voci già esistenti allo
    // stesso livello), sposta prima quelle voci di un posto per fare
    // spazio, così non si creano numeri duplicati.
    const { prefisso, indice } = _scomponiNumero(numero);
    const aggiornamenti = calcolaRinumerazione(MAGAZZINO_COMPUTO.voci, prefisso, indice, +1);
    await applicaRinumerazione(collRef, MAGAZZINO_COMPUTO.voci, aggiornamenti);

    const ref = await collRef.add({ numero, tipo: 'titolo', titolo });
    MAGAZZINO_COMPUTO.voci.push({ id: ref.id, numero, tipo: 'titolo', titolo });
    MAGAZZINO_COMPUTO.voci.sort((a, b) => confrontaNumero(a.numero, b.numero));
    _scriviCacheLocale(MAGAZZINO_COMPUTO.collName, MAGAZZINO_COMPUTO.voci);
    renderComputoMagazzino();
    document.getElementById('computo-cap-numero').value = '';
    document.getElementById('computo-cap-titolo').value = '';
    nascondiFormComputo('computo-form-capitolo');
  } catch (e) {
    alert('Errore nel salvataggio: ' + _messaggioErroreFirestore(e));
  }
}

async function salvaVoceComputo() {
  const numero = document.getElementById('computo-voce-numero').value.trim();
  const titolo = document.getElementById('computo-voce-titolo').value.trim();
  if (!numero || !titolo) { alert('Inserisci almeno numero e titolo.'); return; }
  const dato = {
    numero,
    tipo: 'voce',
    titolo,
    descrizione: document.getElementById('computo-voce-descrizione').value.trim(),
    misure: document.getElementById('computo-voce-misure').value.trim(),
    um: document.getElementById('computo-voce-um').value.trim(),
  };
  try {
    const collRef = db.collection(MAGAZZINO_COMPUTO.collName);

    const { prefisso, indice } = _scomponiNumero(numero);
    const aggiornamenti = calcolaRinumerazione(MAGAZZINO_COMPUTO.voci, prefisso, indice, +1);
    await applicaRinumerazione(collRef, MAGAZZINO_COMPUTO.voci, aggiornamenti);

    const ref = await collRef.add(dato);
    MAGAZZINO_COMPUTO.voci.push({ id: ref.id, ...dato });
    MAGAZZINO_COMPUTO.voci.sort((a, b) => confrontaNumero(a.numero, b.numero));
    _scriviCacheLocale(MAGAZZINO_COMPUTO.collName, MAGAZZINO_COMPUTO.voci);
    renderComputoMagazzino();
    ['numero', 'titolo', 'descrizione', 'misure', 'um'].forEach(campo => {
      document.getElementById(`computo-voce-${campo}`).value = '';
    });
    nascondiFormComputo('computo-form-voce');
  } catch (e) {
    alert('Errore nel salvataggio della voce: ' + _messaggioErroreFirestore(e));
  }
}

async function eliminaVoceComputo(id) {
  const nodo = MAGAZZINO_COMPUTO.voci.find(v => v.id === id);
  if (!nodo) return;

  // Se è un capitolo/sottocapitolo, eliminarlo trascina con sé tutte le
  // righe sotto di esso (altrimenti resterebbero "orfane", senza un
  // genitore nell'albero) — l'utente viene avvisato del numero di righe
  // coinvolte prima di confermare.
  const discendenti = nodo.tipo === 'titolo'
    ? MAGAZZINO_COMPUTO.voci.filter(v => v.id !== id && String(v.numero || '').startsWith(nodo.numero + '.'))
    : [];
  const messaggio = discendenti.length
    ? `Eliminare "${nodo.numero} — ${nodo.titolo}" insieme alle sue ${discendenti.length} righe sottostanti? Le voci successive verranno rinumerate automaticamente. Non è annullabile.`
    : 'Eliminare questa riga dal Computo? Le voci successive verranno rinumerate automaticamente.';
  if (!confirm(messaggio)) return;

  try {
    const collRef = db.collection(MAGAZZINO_COMPUTO.collName);
    const idsDaEliminare = [id, ...discendenti.map(d => d.id)];
    await _cancellaTutteLeVoci(collRef, idsDaEliminare.map(idEl => ({ id: idEl })));
    const idsSet = new Set(idsDaEliminare);
    MAGAZZINO_COMPUTO.voci = MAGAZZINO_COMPUTO.voci.filter(v => !idsSet.has(v.id));

    // Chiude il vuoto lasciato al livello del nodo eliminato.
    const { prefisso, indice } = _scomponiNumero(nodo.numero);
    const aggiornamenti = calcolaRinumerazione(MAGAZZINO_COMPUTO.voci, prefisso, indice + 1, -1);
    await applicaRinumerazione(collRef, MAGAZZINO_COMPUTO.voci, aggiornamenti);

    _scriviCacheLocale(MAGAZZINO_COMPUTO.collName, MAGAZZINO_COMPUTO.voci);
    renderComputoMagazzino();
  } catch (e) {
    alert('Errore nell\'eliminazione: ' + _messaggioErroreFirestore(e));
  }
}

async function cancellaTuttoComputo() {
  if (!MAGAZZINO_COMPUTO.voci.length) { alert('Il Computo è già vuoto.'); return; }
  const scelta = await chiediScelta({
    titolo: 'Cancellare tutte le voci?',
    corpo: `Stai per eliminare definitivamente tutte le ${MAGAZZINO_COMPUTO.voci.length} righe del Computo. Non è annullabile.`,
    bottoni: [
      { valore: 'annulla', testo: 'Annulla' },
      { valore: 'conferma', testo: 'Cancella tutto', classe: 'btn-rosso' }
    ]
  });
  if (scelta !== 'conferma') return;

  const banner = document.getElementById('computo-import-banner');
  if (banner) {
    banner.dataset.forzato = '1';
    banner.style.display = 'flex';
    banner.innerHTML = '<span>Cancellazione in corso, non chiudere la pagina...</span>';
  }
  try {
    await _cancellaTutteLeVoci(db.collection(MAGAZZINO_COMPUTO.collName), MAGAZZINO_COMPUTO.voci);
    MAGAZZINO_COMPUTO.voci = [];
    _scriviCacheLocale(MAGAZZINO_COMPUTO.collName, MAGAZZINO_COMPUTO.voci);
    renderComputoMagazzino();
    alert('✓ Tutte le righe sono state cancellate.');
    if (banner) { banner.style.display = 'none'; banner.dataset.forzato = '0'; }
  } catch (e) {
    if (banner) banner.dataset.forzato = '0';
    alert('Errore durante la cancellazione: ' + _messaggioErroreFirestore(e));
  }
}

function esportaComputoExcel() {
  if (!MAGAZZINO_COMPUTO.voci.length) { alert('Nessuna riga da esportare.'); return; }
  const rows = MAGAZZINO_COMPUTO.voci.map(v => ({
    'Numero': v.numero || '',
    'Titolo': v.titolo || '',
    'Descrizione': v.descrizione || '',
    'Misure': v.misure || '',
    'U.M.': v.um || '',
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Computo');
  XLSX.writeFile(wb, `${MAGAZZINO_COMPUTO.collName}.xlsx`);
}

function esportaComputoPDF() {
  if (!MAGAZZINO_COMPUTO.voci.length) { alert('Nessuna riga da esportare.'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(14);
  doc.text('Computo', 14, 15);
  doc.autoTable({
    startY: 22,
    head: [['Numero', 'Titolo/Descrizione', 'Misure', 'U.M.']],
    body: MAGAZZINO_COMPUTO.voci.map(v => [
      v.numero || '',
      (v.titolo || '') + (v.descrizione ? ' — ' + v.descrizione : ''),
      v.misure || '', v.um || '',
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [34, 34, 34] },
  });
  doc.save(`${MAGAZZINO_COMPUTO.collName}.pdf`);
}
