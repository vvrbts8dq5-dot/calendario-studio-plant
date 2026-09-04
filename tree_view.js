// ══════════════════════════════════════════════════════════════════════
// VISTA AD ALBERO — condivisa da Computo e dai due Prezzari (Veneto/DEI).
//
// Di default si vede solo il livello principale (capitoli): cliccando su
// un capitolo/sottocapitolo si espande e mostra i livelli sotto, fino alle
// singole voci foglia. La colonna Quantità non esiste MAI in questa vista
// (né per i prezzari né per il computo); la colonna Prezzo esiste solo
// per i prezzari (variante 'prezzario').
//
// Questo file va caricato PRIMA di computo_module.js e prezzario_module.js.
// ══════════════════════════════════════════════════════════════════════

// ─── Confronto numerico gerarchico: "1.2" prima di "1.10" ───
function confrontaNumero(a, b) {
  const pa = String(a || '').split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b || '').split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
function livelloDiNumero(numero) {
  return String(numero || '').split('.').length - 1; // 0 = capitolo
}

// ─── Confronto per l'ordinamento delle VOCI del Prezzario ───
// I capitoli/sottocapitoli e le vecchie voci (senza capitoloGenitore,
// ancora agganciate dal prefisso del proprio numero gerarchico) si
// confrontano come sempre per numero. Le voci "nuove" (con capitoloGenitore
// esplicito: il campo "numero" non è più una posizione gerarchica ma il
// codice proprietario, es. "N04007b") si confrontano invece in ordine
// alfanumerico naturale sul codice (N04007a prima di N04007b, N9 prima di
// N10 ecc.) — così come richiesto per il Prezzario. Il Computo non usa mai
// capitoloGenitore, quindi per lui questa funzione si comporta in tutto e
// per tutto come confrontaNumero.
function confrontaVoci(a, b) {
  // Il confronto alfanumerico sul codice ha senso solo fra due VOCI (mai
  // fra una voce e un titolo capitolo/sottocapitolo, che non ha un
  // "codice" proprio confrontabile): può capitare che una voce e un titolo
  // siano fratelli diretti (es. voci/capitoli aggiunti a mano al Prezzario,
  // che usano capitoloGenitore) — in quel caso si confrontano sempre per
  // "numero" (sempre presente e coerente per ogni tipo di nodo). Il
  // Prezzario Regione Veneto importato da PDF non usa capitoloGenitore (il
  // codice reale è già gerarchico a punti, vedi import_prezzario.js —
  // _parseRigheVenetoPdf): per lui questa funzione si comporta come
  // confrontaNumero puro, esattamente come per il Prezzario DEI.
  const aAlfa = a && a.tipo === 'voce' && a.capitoloGenitore && b && b.tipo === 'voce';
  const bAlfa = b && b.tipo === 'voce' && b.capitoloGenitore && a && a.tipo === 'voce';
  if (aAlfa || bAlfa) {
    const va = String((a && (a.codice || a.numero)) || '');
    const vb = String((b && (b.codice || b.numero)) || '');
    return va.localeCompare(vb, undefined, { numeric: true, sensitivity: 'base' });
  }
  return confrontaNumero(a && a.numero, b && b.numero);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ─── Rinumerazione automatica di capitoli/sottocapitoli/voci ───
// Usata da Computo e dai due Prezzari quando si elimina o si aggiunge un
// capitolo/sottocapitolo/voce, per tenere sempre la numerazione "compatta"
// (senza buchi né numeri duplicati) — vedi eliminaVoceComputo/Prezzario e
// salvaCapitolo.../salvaVoce... nei rispettivi moduli.

// Scompone un numero gerarchico (es. "9.4.2") nel prefisso del genitore
// ("9.4"), nell'indice proprio (2) e nel numero di livelli.
function _scomponiNumero(numero) {
  const parti = String(numero || '').split('.');
  const indice = parseInt(parti[parti.length - 1], 10) || 0;
  const prefisso = parti.slice(0, -1).join('.');
  return { prefisso, indice, livello: parti.length - 1 };
}

// Calcola quali righe (su TUTTO il magazzino/edizione, non solo quelle
// visibili) vanno rinumerate per chiudere il vuoto lasciato da
// un'eliminazione, oppure per aprire spazio prima di un inserimento, allo
// stesso livello della gerarchia:
//   - prefissoGenitore: il "ramo" dentro cui ci si sposta (es. "9" per i
//     sottocapitoli 9.1, 9.2..., oppure "" per i capitoli di primo livello)
//   - sogliaIndice: sposta solo i fratelli con indice >= sogliaIndice
//   - delta: -1 per chiudere il vuoto dopo un'eliminazione,
//            +1 per aprire spazio prima di un inserimento
// Ogni fratello spostato trascina con sé TUTTI i suoi discendenti (i numeri
// che iniziano con "vecchioNumero."), riscritti con il nuovo prefisso.
// Ritorna un array di {id, numero} — le coppie id/nuovo-numero da scrivere.
function calcolaRinumerazione(vociComplete, prefissoGenitore, sogliaIndice, delta) {
  const direttiSpostati = [];
  vociComplete.forEach(nodo => {
    const { prefisso, indice } = _scomponiNumero(nodo.numero);
    if (prefisso !== prefissoGenitore || indice < sogliaIndice) return;
    direttiSpostati.push({
      id: nodo.id,
      vecchioNumero: nodo.numero,
      nuovoNumero: (prefissoGenitore ? prefissoGenitore + '.' : '') + (indice + delta),
    });
  });
  if (!direttiSpostati.length) return [];

  const idDiretti = new Set(direttiSpostati.map(d => d.id));
  const aggiornamenti = direttiSpostati.map(d => ({ id: d.id, numero: d.nuovoNumero }));

  direttiSpostati.forEach(({ id, vecchioNumero, nuovoNumero }) => {
    vociComplete.forEach(nodo => {
      if (idDiretti.has(nodo.id) || nodo.id === id) return;
      const numeroNodo = String(nodo.numero || '');
      if (numeroNodo.startsWith(vecchioNumero + '.')) {
        aggiornamenti.push({ id: nodo.id, numero: nuovoNumero + numeroNodo.slice(vecchioNumero.length) });
      }
    });
  });
  return aggiornamenti;
}

// Applica in-place all'array locale gli aggiornamenti calcolati da
// calcolaRinumerazione (solo il campo "numero" di ogni voce toccata) — la
// scrittura vera e propria su Firestore la fa chi chiama questa funzione,
// nello STESSO batch dell'operazione che ha reso necessaria la
// rinumerazione (aggiunta/eliminazione di una riga — vedi
// _eseguiBatchComputo in computo_module.js, e _salvaBlocchiPrezzario in
// import_prezzario.js per il Prezzario). Tenerle nello stesso batch evita
// che, per la breve finestra fra due scritture separate, il database possa
// restare in uno stato intermedio incoerente (visibile a un altro
// dispositivo che in quel momento leggesse i dati).
function applicaRinumerazioneLocale(vociLocali, aggiornamenti) {
  if (!aggiornamenti || !aggiornamenti.length) return;
  const mappa = new Map(aggiornamenti.map(a => [a.id, a.numero]));
  vociLocali.forEach(v => { if (mappa.has(v.id)) v.numero = mappa.get(v.id); });
}

// Costruisce l'albero (capitolo > sottocapitolo > voce) da un array piatto
// di voci. Il legame padre/figlio è dedotto dal "numero" (es. "1.2.3" è
// figlio di "1.2", che è figlio di "1"). I figli vengono sempre riordinati.
function costruisciAlbero(vociFlat) {
  const mappa = new Map();
  vociFlat.forEach(v => mappa.set(v.numero, { ...v, figli: [] }));
  const radici = [];
  mappa.forEach(nodo => {
    // Le voci "nuove" del Prezzario (numero = codice proprietario, non più
    // una posizione gerarchica) indicano il proprio capitolo/sottocapitolo
    // padre esplicitamente in capitoloGenitore. Le voci "vecchie" e tutti i
    // capitoli/sottocapitoli continuano ad agganciarsi dal prefisso del
    // proprio numero, come sempre.
    const numeroPadre = nodo.capitoloGenitore
      ? nodo.capitoloGenitore
      : String(nodo.numero || '').split('.').slice(0, -1).join('.');
    const padre = numeroPadre ? mappa.get(numeroPadre) : null;
    if (padre) padre.figli.push(nodo);
    else radici.push(nodo);
  });
  const ordina = nodo => {
    nodo.figli.sort((a, b) => confrontaVoci(a, b));
    nodo.figli.forEach(ordina);
  };
  radici.sort((a, b) => confrontaVoci(a, b));
  radici.forEach(ordina);
  return radici;
}

// Ricostruisce la catena di antenati (titoli/sottotitoli/capitoli, MAI il
// nodo stesso) di una voce, usando la stessa regola di aggancio padre/figlio
// di costruisciAlbero (capitoloGenitore se presente, altrimenti il prefisso
// del numero). Ritorna un array ordinato dal capitolo più esterno (radice)
// fino al padre diretto — usato da Progetti e Analisi Prezzi quando una voce
// viene copiata nella loro area di lavoro, per agganciare "in automatico"
// tutta la gerarchia sopra di essa (vedi aggiungiVoceAlProgetto in
// progetti_module.js e aggiungiVoceAAnalisi in analisi_prezzi_module.js): chi
// chiama scorre l'array e aggiunge solo gli antenati non già presenti per
// quella famiglia.
function catenaAntenatiNodo(vociFlat, nodo) {
  const mappa = new Map();
  vociFlat.forEach(v => mappa.set(v.numero, v));
  const catena = [];
  let corrente = nodo;
  const visti = new Set();
  while (corrente) {
    const numeroPadre = corrente.capitoloGenitore
      ? corrente.capitoloGenitore
      : String(corrente.numero || '').split('.').slice(0, -1).join('.');
    if (!numeroPadre || visti.has(numeroPadre)) break;
    visti.add(numeroPadre);
    const padre = mappa.get(numeroPadre);
    if (!padre) break;
    catena.unshift(padre);
    corrente = padre;
  }
  return catena;
}

// Filtro piatto (usato quando c'è una ricerca attiva): ignora la struttura
// ad albero e mostra solo le voci foglia (mai i capitoli) che corrispondono.
function filtraVociPiatte(vociFlat, testo, campi) {
  const t = String(testo || '').toLowerCase();
  return vociFlat.filter(v => v.tipo === 'voce' && campi.some(c => String(v[c] || '').toLowerCase().includes(t)));
}

// Disegna ricorsivamente le righe dell'albero (o di un elenco piatto già
// filtrato, nel qual caso passare un Set vuoto come "espansi").
//
// opts.variante: 'computo' | 'prezzario' — determina le colonne delle voci.
// opts.costruisciToggle(numero): ritorna la stringa onclick per espandere
//   un capitolo (es. "toggleRamoComputo('1.2')").
// opts.onElimina(nodo): ritorna l'HTML del pulsante/i azione per la riga.
// opts.modificaAttiva: se true, i campi modificabili (titolo dei capitoli,
//   e per le voci tutto tranne il numero) diventano input/textarea invece
//   di testo statico — stessa idea della modalità "✎ Modifica" già presente
//   nell'area di lavoro dei Progetti, ora disponibile anche qui.
// opts.costruisciOnChange(nodo, campo): ritorna la stringa da mettere in
//   onchange="..." per salvare quel campo (es.
//   "aggiornaCampoComputo('id123','titolo',this.value)"). Obbligatorio se
//   modificaAttiva è true.
// opts.selezioneAttiva: se true, la colonna azioni di OGNI riga (titoli e
//   voci) mostra una casella di spunta al posto del pulsante Elimina —
//   modalità "selezione multipla" identica per Computo e i due Prezzari
//   (vedi opts.onToggleSelezione/opts.vociSelezionate).
// opts.vociSelezionate: Set degli id attualmente selezionati.
// opts.onToggleSelezione(nodo): ritorna la stringa onchange="..." per
//   aggiungere/togliere questo nodo dalla selezione. Obbligatorio se
//   selezioneAttiva è true.
function renderRigheAlbero(nodi, espansi, opts) {
  const { variante, costruisciToggle, onElimina, livello = 0, modificaAttiva = false, costruisciOnChange, selezioneAttiva = false, vociSelezionate, onToggleSelezione } = opts;
  const editabile = modificaAttiva && typeof costruisciOnChange === 'function';

  // Colonna azioni di una riga: in modalità selezione multipla è sempre una
  // casella di spunta (indipendentemente da onElimina), altrimenti resta il
  // pulsante/i Elimina di sempre. Stessa funzione per titoli e voci, per
  // Computo e per i due Prezzari — comportamento identico ovunque, come
  // richiesto.
  function azioniORiga(nodo) {
    if (selezioneAttiva) {
      const selezionato = vociSelezionate && vociSelezionate.has(nodo.id);
      return `<input type="checkbox" class="selezione-checkbox" onclick="event.stopPropagation()" ${selezionato ? 'checked' : ''} onchange="${onToggleSelezione ? onToggleSelezione(nodo) : ''}">`;
    }
    return onElimina ? onElimina(nodo) : '';
  }

  return nodi.map(nodo => {
    const indent = 18 * livello;

    if (nodo.tipo === 'titolo') {
      const haFigli = nodo.figli && nodo.figli.length > 0;
      const aperto = espansi.has(nodo.numero);
      const freccia = haFigli ? (aperto ? '▾' : '▸') : '·';
      const clickAttr = haFigli && costruisciToggle ? `onclick="${costruisciToggle(nodo.numero)}"` : '';
      const titoloHtml = editabile
        ? `<input type="text" class="edit-input" value="${escapeHtml(nodo.titolo || '')}" onclick="event.stopPropagation()" onchange="${costruisciOnChange(nodo, 'titolo')}">`
        : escapeHtml(nodo.titolo || '');
      // Prezzario DEI/Veneto: se disponibile, mostra il codice reale
      // ricavato dalle voci figlie (codiceVisibile, vedi import_prezzario.js
      // — _calcolaCodiciVisibiliDEI) al posto del progressivo interno
      // (numero), che resta comunque la chiave strutturale dell'albero,
      // solo non più mostrata. Il Computo non ha mai questo campo: per lui
      // il comportamento resta identico a prima.
      const numeroVisibileTitolo = (variante === 'prezzario' && nodo.codiceVisibile) ? nodo.codiceVisibile : (nodo.numero || '');
      // Prezzario Veneto: il paragrafo normativo/descrittivo generale della
      // famiglia (vedi import_prezzario.js — _parseRigheVenetoPdf) vive sul
      // nodo TITOLO stesso, non più ripetuto su ogni voce sotto — va quindi
      // mostrato qui, sotto il titolo del capitolo/sottocapitolo. Solo per
      // la variante prezzario: Computo/Progetti non hanno mai questo campo
      // valorizzato sui titoli. Richiesta esplicita: il paragrafo (spesso
      // lungo) ingombra la lista se sempre visibile — si mostra quindi SOLO
      // quando la tendina di questo titolo è aperta (stesso "aperto" che
      // controlla la visibilità delle voci figlie sotto), non di
      // continuo. In modalità "✎ Modifica" resta comunque legato allo
      // stesso stato "aperto", per coerenza con la vista normale.
      const mostraDescrizioneCapitolo = variante === 'prezzario' && aperto && (editabile || nodo.descrizione);
      const descrizioneCapitoloHtml = mostraDescrizioneCapitolo
        ? (editabile
            ? `<textarea class="edit-textarea albero-descrizione-capitolo" onclick="event.stopPropagation()" onchange="${costruisciOnChange(nodo, 'descrizione')}">${escapeHtml(nodo.descrizione || '')}</textarea>`
            : `<div class="albero-descrizione-capitolo">${escapeHtml(nodo.descrizione || '')}</div>`)
        : '';
      let html = `
        <div class="albero-riga albero-riga-${variante} albero-capitolo" ${clickAttr}>
          <span class="albero-numero" style="padding-left:${indent}px"><span class="albero-freccia">${freccia}</span>${escapeHtml(numeroVisibileTitolo)}</span>
          <span class="albero-titolo-capitolo" ${editabile ? 'onclick="event.stopPropagation()"' : ''}>
            <div class="albero-titolo-capitolo-testo">${titoloHtml}</div>
            ${descrizioneCapitoloHtml}
          </span>
          <span class="albero-azioni" onclick="event.stopPropagation()">${azioniORiga(nodo)}</span>
        </div>`;
      if (haFigli && aperto) {
        html += renderRigheAlbero(nodo.figli, espansi, { ...opts, livello: livello + 1 });
      }
      return html;
    }

    // riga voce (foglia) — MAI colonna Quantità. Il "numero" (numerazione
    // gerarchica del computo/prezzario) resta sempre di sola lettura anche
    // in modalità modifica: cambiarlo a mano romperebbe l'albero, per
    // spostare una voce si elimina e si riaggiunge con il numero giusto
    // (la rinumerazione automatica sistema il resto).
    if (variante === 'computo') {
      const titoloHtml = editabile
        ? `<input type="text" class="edit-input" value="${escapeHtml(nodo.titolo || '')}" onchange="${costruisciOnChange(nodo, 'titolo')}">`
        : escapeHtml(nodo.titolo || '');
      // A schermo la descrizione della voce NON si mostra più sotto il
      // titolo (richiesta esplicita: snellire la visualizzazione, la
      // descrizione lunga duplicava il contesto già dato dal capitolo
      // padre). Resta comunque modificabile in modalità "✎ Modifica" (serve
      // pur sempre poterla correggere), e resta SEMPRE presente nell'export
      // Excel/PDF (vedi esportaComputoExcel/esportaComputoPDF in
      // computo_module.js, che leggono nodo.descrizione direttamente dai
      // dati, non da questo HTML) — qui si nasconde solo la resa a schermo.
      const descrizioneHtml = editabile
        ? `<textarea class="edit-textarea" onchange="${costruisciOnChange(nodo, 'descrizione')}">${escapeHtml(nodo.descrizione || '')}</textarea>`
        : '';
      const misureHtml = editabile
        ? `<input type="text" class="edit-input" value="${escapeHtml(nodo.misure || '')}" onchange="${costruisciOnChange(nodo, 'misure')}">`
        : escapeHtml(nodo.misure || '');
      const umHtml = editabile
        ? `<input type="text" class="edit-input" value="${escapeHtml(nodo.um || '')}" onchange="${costruisciOnChange(nodo, 'um')}">`
        : escapeHtml(nodo.um || '');
      return `
        <div class="albero-riga albero-riga-computo albero-voce">
          <span class="albero-numero" style="padding-left:${indent}px">${escapeHtml(nodo.numero || '')}</span>
          <span>
            <div class="albero-voce-titolo">${titoloHtml}</div>
            ${descrizioneHtml}
          </span>
          <span>${misureHtml}</span>
          <span>${umHtml}</span>
          <span class="albero-azioni">${azioniORiga(nodo)}</span>
        </div>`;
    }
    // variante 'prezzario' — la numerazione manuale gerarchica non esiste
    // più per le voci: quella mostrata/modificabile è il codice proprietario
    // (es. "N04007b"), salvato nel campo "codice" e, per le voci nuove,
    // rispecchiato anche in "numero" (vedi aggiornaCampoPrezzario). Per le
    // voci vecchie non ancora "migrate" (senza capitoloGenitore) si mostra
    // comunque codice||numero, così restano leggibili in ogni caso.
    const numeroVisibile = nodo.codice || nodo.numero || '';
    const numeroHtml = editabile
      ? `<input type="text" class="edit-input" value="${escapeHtml(nodo.codice || '')}" placeholder="${escapeHtml(nodo.numero || '')}" style="padding-left:${indent}px" onchange="${costruisciOnChange(nodo, 'codice')}">`
      : `<span style="padding-left:${indent}px">${escapeHtml(numeroVisibile)}</span>`;
    const descrizioneHtmlPz = editabile
      ? `<textarea class="edit-textarea" onchange="${costruisciOnChange(nodo, 'descrizione')}">${escapeHtml(nodo.descrizione || '')}</textarea>`
      : escapeHtml(nodo.descrizione || '');
    const umHtmlPz = editabile
      ? `<input type="text" class="edit-input" value="${escapeHtml(nodo.um || '')}" onchange="${costruisciOnChange(nodo, 'um')}">`
      : escapeHtml(nodo.um || '');
    const prezzoHtml = editabile
      ? `<input type="number" step="0.01" class="edit-input" value="${nodo.prezzo != null ? Number(nodo.prezzo) : ''}" onchange="${costruisciOnChange(nodo, 'prezzo')}">`
      : (nodo.prezzo != null ? Number(nodo.prezzo).toFixed(2) + ' €' : '');
    const manodoperaHtml = editabile
      ? `<input type="number" step="0.01" class="edit-input" value="${nodo.manodopera != null ? Number(nodo.manodopera) : ''}" onchange="${costruisciOnChange(nodo, 'manodopera')}">`
      : (nodo.manodopera != null ? Number(nodo.manodopera).toFixed(1) + '%' : '');
    return `
      <div class="albero-riga albero-riga-prezzario albero-voce">
        <span class="albero-numero">${numeroHtml}</span>
        <span>${descrizioneHtmlPz}</span>
        <span>${umHtmlPz}</span>
        <span class="td-r">${prezzoHtml}</span>
        <span class="td-r">${manodoperaHtml}</span>
        <span class="albero-azioni">${azioniORiga(nodo)}</span>
      </div>`;
  }).join('');
}
