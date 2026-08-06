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

// Applica gli aggiornamenti calcolati da calcolaRinumerazione: scrive su
// Firestore a lotti (max 450 per commit, come le altre scritture massive
// dell'app) e aggiorna in-place l'array locale così la UI resta coerente
// senza dover rileggere tutto dal server.
async function applicaRinumerazione(collRef, vociLocali, aggiornamenti) {
  if (!aggiornamenti || !aggiornamenti.length) return;
  const CHUNK = 450;
  for (let i = 0; i < aggiornamenti.length; i += CHUNK) {
    const chunk = aggiornamenti.slice(i, i + CHUNK);
    const batch = db.batch();
    chunk.forEach(({ id, numero }) => batch.update(collRef.doc(id), { numero }));
    await batch.commit();
  }
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
    const parti = String(nodo.numero || '').split('.');
    const numeroPadre = parti.slice(0, -1).join('.');
    const padre = numeroPadre ? mappa.get(numeroPadre) : null;
    if (padre) padre.figli.push(nodo);
    else radici.push(nodo);
  });
  const ordina = nodo => {
    nodo.figli.sort((a, b) => confrontaNumero(a.numero, b.numero));
    nodo.figli.forEach(ordina);
  };
  radici.sort((a, b) => confrontaNumero(a.numero, b.numero));
  radici.forEach(ordina);
  return radici;
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
function renderRigheAlbero(nodi, espansi, opts) {
  const { variante, costruisciToggle, onElimina, livello = 0, modificaAttiva = false, costruisciOnChange } = opts;
  const editabile = modificaAttiva && typeof costruisciOnChange === 'function';

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
      let html = `
        <div class="albero-riga albero-riga-${variante} albero-capitolo" ${clickAttr}>
          <span class="albero-numero" style="padding-left:${indent}px"><span class="albero-freccia">${freccia}</span>${escapeHtml(nodo.numero || '')}</span>
          <span class="albero-titolo-capitolo" ${editabile ? 'onclick="event.stopPropagation()"' : ''}>${titoloHtml}</span>
          <span class="albero-azioni" onclick="event.stopPropagation()">${onElimina ? onElimina(nodo) : ''}</span>
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
      const descrizioneHtml = editabile
        ? `<textarea class="edit-textarea" onchange="${costruisciOnChange(nodo, 'descrizione')}">${escapeHtml(nodo.descrizione || '')}</textarea>`
        : (nodo.descrizione ? `<div class="albero-desc-sub">${escapeHtml(nodo.descrizione)}</div>` : '');
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
          <span class="albero-azioni">${onElimina ? onElimina(nodo) : ''}</span>
        </div>`;
    }
    // variante 'prezzario'
    const codiceHtml = editabile
      ? `<input type="text" class="edit-input" value="${escapeHtml(nodo.codice || '')}" onchange="${costruisciOnChange(nodo, 'codice')}">`
      : escapeHtml(nodo.codice || '');
    const descrizioneHtmlPz = editabile
      ? `<textarea class="edit-textarea" onchange="${costruisciOnChange(nodo, 'descrizione')}">${escapeHtml(nodo.descrizione || '')}</textarea>`
      : escapeHtml(nodo.descrizione || '');
    const umHtmlPz = editabile
      ? `<input type="text" class="edit-input" value="${escapeHtml(nodo.um || '')}" onchange="${costruisciOnChange(nodo, 'um')}">`
      : escapeHtml(nodo.um || '');
    const prezzoHtml = editabile
      ? `<input type="number" step="0.01" class="edit-input" value="${nodo.prezzo != null ? Number(nodo.prezzo) : ''}" onchange="${costruisciOnChange(nodo, 'prezzo')}">`
      : (nodo.prezzo != null ? Number(nodo.prezzo).toFixed(2) + ' €' : '');
    return `
      <div class="albero-riga albero-riga-prezzario albero-voce">
        <span class="albero-numero" style="padding-left:${indent}px">${escapeHtml(nodo.numero || '')}</span>
        <span>${codiceHtml}</span>
        <span>${descrizioneHtmlPz}</span>
        <span>${umHtmlPz}</span>
        <span class="td-r">${prezzoHtml}</span>
        <span class="albero-azioni">${onElimina ? onElimina(nodo) : ''}</span>
      </div>`;
  }).join('');
}
