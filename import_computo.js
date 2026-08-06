// ══════════════════════════════════════════════════════════════════════
// IMPORT COMPUTO DA EXCEL (formato TEKNO) — nel magazzino "computo"
// (per-disciplina). Nessuna quantità: qui è un catalogo, non il conteggio
// di un cantiere specifico (la quantità si imposta solo dentro un
// progetto, quando la voce viene copiata nella sua area di lavoro).
//
// Riconosce l'export reale di TEKNO "Computo Metrico":
//   COD. C.M | COD. E.P. | DESIGNAZIONE DEI LAVORI | MISURE | U.M. | QUANTITA'
// Le righe con solo COD.C.M (senza COD.E.P.) sono capitoli/sottocapitolo.
// Le righe con COD.C.M + COD.E.P. aprono una voce, le righe successive senza
// COD.C.M ne completano i dati (descrizione estesa, misure, U.M.) finché non
// arriva la prossima riga numerata.
//
// Nota: la colonna COD. E.P. viene usata SOLO per distinguere in fase di
// lettura una voce da un capitolo (una riga con COD.E.P. è sempre una
// voce), ma il suo valore non viene più salvato: da quando esiste la
// numerazione gerarchica automatica (1/1.1/1.1.1, rinumerata ad ogni
// aggiunta o eliminazione), quel vecchio codice non serve più a
// identificare la riga — lo fa il numero, mostrato in grassetto.
// ══════════════════════════════════════════════════════════════════════

const _DIACRITICI_REGEX = new RegExp('[' + String.fromCharCode(768) + '-' + String.fromCharCode(879) + ']', 'g');
function _normalizzaTestoComputo(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(_DIACRITICI_REGEX, '')
    .replace(/\s+/g, ' ').trim();
}

function _trovaRigaIntestazioneComputo(righeArray) {
  for (let i = 0; i < Math.min(righeArray.length, 30); i++) {
    const norm = (righeArray[i] || []).map(_normalizzaTestoComputo);
    const haCod = norm.some(c => c.includes('cod'));
    const haDesignazione = norm.some(c => c.includes('designazione'));
    const haQuantita = norm.some(c => c.includes('quantit'));
    if (haCod && haDesignazione && haQuantita) return i;
  }
  return -1;
}

function _estraiVociComputoTekno(righeArray) {
  const iIntestazione = _trovaRigaIntestazioneComputo(righeArray);
  const inizio = iIntestazione >= 0 ? iIntestazione + 1 : 0;

  const risultato = [];
  let voceCorrente = null;
  let voceCompletata = false;

  for (let i = inizio; i < righeArray.length; i++) {
    const riga = righeArray[i] || [];
    const c0 = String(riga[0] ?? '').trim();
    const c1 = String(riga[1] ?? '').trim();
    const c2 = String(riga[2] ?? '').trim();
    const c3 = String(riga[3] ?? '').trim();
    const c4 = String(riga[4] ?? '').trim();

    if (c0) {
      if (voceCorrente) {
        risultato.push(voceCorrente);
        voceCorrente = null;
      }
      if (c1) {
        // c1 (COD. E.P.) serve solo a riconoscere che questa riga è una
        // voce e non un capitolo — non viene più salvato come campo.
        voceCorrente = { numero: c0, tipo: 'voce', titolo: c2, descrizione: '', misure: '', um: '' };
        voceCompletata = false;
      } else {
        risultato.push({ numero: c0, tipo: 'titolo', titolo: c2 });
      }
      continue;
    }

    if (!voceCorrente || voceCompletata) continue;

    const soloDescrizione = c2 && !c3 && !c4;
    if (soloDescrizione) {
      voceCorrente.descrizione = voceCorrente.descrizione ? voceCorrente.descrizione + ' ' + c2 : c2;
    } else if (c3) {
      voceCorrente.misure = voceCorrente.misure ? voceCorrente.misure + '; ' + c3 : c3;
    } else if (c4) {
      voceCorrente.um = c4;
      voceCompletata = true;
    }
  }

  if (voceCorrente) risultato.push(voceCorrente);

  return risultato;
}

function _sceglieFoglioComputo(workbook) {
  if (workbook.SheetNames.length === 1) return workbook.SheetNames[0];
  let migliore = workbook.SheetNames[0];
  let maxRighe = -1;
  workbook.SheetNames.forEach(nome => {
    const righe = XLSX.utils.sheet_to_json(workbook.Sheets[nome], { header: 1 }).length;
    if (righe > maxRighe) { maxRighe = righe; migliore = nome; }
  });
  return migliore;
}

async function importaComputoDaExcel(file) {
  let voci;
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const nomeFoglio = _sceglieFoglioComputo(workbook);
    const righeArray = XLSX.utils.sheet_to_json(workbook.Sheets[nomeFoglio], { header: 1, defval: '' });
    voci = _estraiVociComputoTekno(righeArray);
  } catch (e) {
    alert('Impossibile leggere il file: ' + e.message);
    return;
  }

  if (!voci.length) {
    alert('Non ho riconosciuto righe valide in questo file. Se il formato del tuo export TEKNO è diverso, fammelo sapere così sistemo la lettura.');
    return;
  }

  const numVociVere = voci.filter(v => v.tipo === 'voce').length;

  const scelta = await chiediScelta({
    titolo: 'Importa Computo da Excel',
    corpo: `Trovate ${voci.length} righe (${numVociVere} voci + capitoli/sottocapitoli) nel file "${file.name}".\n\n` +
      `Il Computo ha già ${MAGAZZINO_COMPUTO.voci.length} righe. Cosa vuoi fare?`,
    bottoni: [
      { valore: 'annulla', testo: 'Annulla' },
      { valore: 'aggiungi', testo: 'Aggiungi soltanto', classe: 'btn-blu' },
      { valore: 'sostituisci', testo: 'Sostituisci tutto', classe: 'btn-rosso' }
    ]
  });
  if (scelta === 'annulla' || !scelta) return;
  const sostituisci = scelta === 'sostituisci';

  const banner = document.getElementById('computo-import-banner');
  if (banner) { banner.style.display = 'flex'; banner.innerHTML = '<span>Importazione in corso, non chiudere la pagina...</span>'; }

  try {
    const collRef = db.collection(MAGAZZINO_COMPUTO.collName);
    if (sostituisci && MAGAZZINO_COMPUTO.voci.length) {
      await _cancellaTutteLeVoci(collRef, MAGAZZINO_COMPUTO.voci);
    }
    await _scriviVociABatch(collRef, voci, banner);

    const freshSnap = await collRef.get();
    MAGAZZINO_COMPUTO.voci = freshSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    MAGAZZINO_COMPUTO.voci.sort((a, b) => confrontaNumero(a.numero, b.numero));
    _scriviCacheLocale(MAGAZZINO_COMPUTO.collName, MAGAZZINO_COMPUTO.voci);
    if (typeof _aggiornaIndicatoreCacheComputo === 'function') _aggiornaIndicatoreCacheComputo();
    renderComputoMagazzino();

    alert(`✓ Importazione completata.\n\n${voci.length} righe importate (${numVociVere} voci).`);
    if (banner) banner.style.display = 'none';
  } catch (e) {
    alert('Errore durante l\'importazione: ' + _messaggioErroreFirestore(e));
  }
}
