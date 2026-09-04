// ══════════════════════════════════════════════════════════════════════
// IMPORT PREZZARIO — da Excel (DEI) o direttamente dal PDF ufficiale
// (Regione Veneto) — tutto nel browser, nessuno script da terminale.
//
// A differenza del Computo (che importa un export TEKNO già numerato con
// COD.C.M. gerarchico), i file dei prezzari NON hanno sempre una
// numerazione esplicita comoda da usare così com'è — quindi la costruiamo
// noi durante l'import, per ottenere la STESSA struttura ad albero
// (capitolo > sottocapitolo > voce) usata nel modulo Computo.
//
// Formati riconosciuti automaticamente per l'import da EXCEL:
//
// 1) FORMATO CON INTESTAZIONI NOMINATE — prima riga con nomi di colonna
//    tipo "codice", "descrizione", "um", "prezzo", "capitolo" (una singola
//    colonna capitolo, senza sotto-capitoli). Generiamo: capitolo (livello 1)
//    + voce (livello 2) per ciascun valore distinto di capitolo.
//
// 2) FORMATO GERARCHICO (stile DEI) — nessuna intestazione, colonne
//    posizionali: A=codice, B=descrizione, C=U.M., D=prezzo. Le righe SENZA
//    prezzo sono intestazioni: se il codice inizia con "CAP" è un capitolo
//    (livello 1), altrimenti è un sottocapitolo (livello 2). Generiamo la
//    stessa gerarchia a 2-3 livelli con numerazione automatica.
//
//    NOTA sui prezzari DEI reali: alcuni fogli ripetono lo STESSO codice di
//    capitolo su più righe consecutive (es. note/avvertenze aggiuntive
//    sotto lo stesso "CAP01AV"): non sono nuovi capitoli, sono continuazioni
//    della stessa intestazione — le saltiamo per non frammentare l'albero.
//
// Per il PREZZARIO REGIONE VENETO l'import avviene invece direttamente dal
// PDF ufficiale ("Stampa prezziario" scaricato da
// https://prezzario.regione.veneto.it/?anno=NNNN) — vedi la sezione
// dedicata più sotto (_estraiVociVenetoDaPDF e dintorni) per i dettagli:
// niente più formato Excel per il Veneto, un tentativo precedente basato su
// un file mai visto davvero è stato tolto perché la sua regola di gerarchia
// era inventata e non corrispondeva al formato reale del codice ufficiale.
//
// I dati sono già separati per disciplina a monte: initPrezzario() riceve
// il nome-collezione (es. "prezzario_dei_elettrico") e questo file scrive
// sempre e solo in quella collezione — nessun riferimento hardcoded a una
// collezione condivisa tra discipline.
// ══════════════════════════════════════════════════════════════════════

const MAPPE_COLONNE = {
  codice: ['codice', 'cod', 'cod.', 'codice articolo', 'codice voce'],
  descrizione: ['descrizione', 'descrizione articolo', 'descrizione voce', 'oggetto'],
  um: ['um', 'u.m.', 'unita di misura', 'unita di misura', "unita' di misura"],
  prezzo: ['prezzo', 'prezzo unitario', 'importo', 'importo unitario', 'prezzo (€)', 'prezzo euro', 'prezzo (eur)', 'prezzo eur'],
  capitolo: ['capitolo', 'categoria', 'sezione', 'capitolo/categoria'],
  // % manodopera: quota percentuale del prezzo attribuita a manodopera
  // (vs materiali) — presente in alcuni prezzari come colonna a sé.
  manodopera: ['% manodopera', 'manodopera', 'perc manodopera', 'percentuale manodopera', '% md', 'md%', 'incidenza manodopera', '% incidenza manodopera', 'incidenza md'],
};

// Stesso intervallo diacritici di import_computo.js (vedi commento lì).
const _DIACRITICI_REGEX_PZ = new RegExp('[' + String.fromCharCode(768) + '-' + String.fromCharCode(879) + ']', 'g');
function _normalizzaChiave(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(_DIACRITICI_REGEX_PZ, '')
    .replace(/\s+/g, ' ').trim();
}

function _trovaColonna(rigaGrezza, candidati) {
  const chiaviRiga = Object.keys(rigaGrezza);
  for (const chiave of chiaviRiga) {
    const norm = _normalizzaChiave(chiave);
    if (candidati.includes(norm)) return rigaGrezza[chiave];
  }
  return '';
}

// Legge il valore grezzo di una colonna "% manodopera" se presente: null
// (non 0) quando la colonna manca o la cella è vuota, per distinguere "dato
// assente" da "manodopera esplicitamente 0%" nella UI e negli export.
function _leggiManodoperaGrezza(rigaGrezza) {
  const raw = _trovaColonna(rigaGrezza, MAPPE_COLONNE.manodopera);
  if (raw === '' || raw === null || raw === undefined) return null;
  const n = Number(raw);
  return isNaN(n) ? null : n;
}

function _mappaRigaConIntestazione(rigaGrezza) {
  return {
    codice: String(_trovaColonna(rigaGrezza, MAPPE_COLONNE.codice) || '').trim(),
    descrizione: String(_trovaColonna(rigaGrezza, MAPPE_COLONNE.descrizione) || '').trim(),
    um: String(_trovaColonna(rigaGrezza, MAPPE_COLONNE.um) || '').trim(),
    prezzo: Number(_trovaColonna(rigaGrezza, MAPPE_COLONNE.prezzo)) || 0,
    manodopera: _leggiManodoperaGrezza(rigaGrezza),
    capitolo: String(_trovaColonna(rigaGrezza, MAPPE_COLONNE.capitolo) || 'Senza capitolo').trim(),
  };
}

// ─── Formato 1: intestazioni nominate + singola colonna "capitolo" ───
// Costruisce l'albero a 2 livelli: capitolo (1, 2, 3...) > voce (1.1, 1.2...)
function _costruisciAlberoDaFlat(vociFlat) {
  const ordineCapitoli = [];
  vociFlat.forEach(v => {
    if (!ordineCapitoli.includes(v.capitolo)) ordineCapitoli.push(v.capitolo);
  });

  const risultato = [];
  ordineCapitoli.forEach((nomeCapitolo, iCap) => {
    const numeroCap = iCap + 1;
    risultato.push({ numero: `${numeroCap}`, tipo: 'titolo', titolo: nomeCapitolo });
    const vociDelCapitolo = vociFlat.filter(v => v.capitolo === nomeCapitolo);
    vociDelCapitolo.forEach((v, iVoce) => {
      risultato.push({
        numero: `${numeroCap}.${iVoce + 1}`,
        tipo: 'voce',
        codice: v.codice,
        descrizione: v.descrizione,
        um: v.um,
        prezzo: v.prezzo,
        manodopera: v.manodopera,
      });
    });
  });
  return risultato;
}

// ─── Prezzario Regione Veneto: import diretto dal PDF ufficiale ───
//
// Il PDF ("Stampa prezziario", scaricato da
// https://prezzario.regione.veneto.it/?anno=NNNN) ha testo selezionabile
// (non è una scansione) organizzato con 3 livelli di titolo, tutti nello
// stesso formato "VEN{anno}-{codice numerico a punti} - TITOLO":
//   VEN26-10 - OPERE ELETTRICHE                        (capitolo,    0 punti)
//   VEN26-10.01 - Impianti di distribuzione in B.T.     (sottocap.,  1 punto)
//   VEN26-10.01.01 - ALLACCIAMENTO MOTORE               (famiglia,   2 punti)
// seguiti da una tabella Codice | Descrizione | UM | Prezzo | % Man., dove
// ogni voce ha codice "VEN26-10.01.01.01" (sempre 2 cifre per livello, 4
// livelli, 3 punti). Il codice reale è GIÀ perfettamente gerarchico a
// punti: non serve nessuna deduzione — a differenza di un tentativo
// precedente (mai basato su un file realmente visto, e quindi tolto)
// che inventava una regola "togli le ultime 2 cifre" per un formato che
// non corrispondeva a questo. Usiamo il codice così com'è (tolto solo il
// prefisso "VEN{anno}-", ridondante dentro una singola edizione già
// isolata per anno) come "numero": la gerarchia risulta automaticamente
// dal meccanismo "vecchio stile" già esistente in costruisciAlbero
// (prefisso a punti) — la stessa logica di sempre, identica a quella usata
// per il Prezzario DEI posizionale, senza bisogno di capitoloGenitore.
//
// Lettura nel browser tramite pdf.js (script caricato in index.html): per
// ogni pagina, gli "text item" di getTextContent() arrivano in ORDINE DI
// LETTURA reale — importante perché le coordinate Y di una riga di tabella
// NON sono affidabili per capire a quale riga appartiene un testo (la
// cella "Codice", sempre spezzata su due righe "VEN26-" poi le cifre, e le
// altre colonne sono centrate verticalmente sull'altezza della cella più
// alta della riga — quindi la stessa riga logica può avere testi a Y
// diverse). Il flusso però è sempre lo stesso, un pezzo alla volta: un
// titolo isolato, OPPURE [codice (1-2 righe) → descrizione (1+ righe) →
// UM → Prezzo → % Man.] — mai interlacciato con la riga successiva, e mai
// ripetuto (l'intestazione di colonna "Codice/Descrizione/.../% Man." non
// si ripete nemmeno quando una tabella continua su una nuova pagina).
//
// Zone di colonna (coordinata X del PDF, punti — verificate sul PDF reale):
//   colonna codice:  28-50      colonna UM:      430-465
//   colonna descriz: 100-430    colonna prezzo:  465-522
//                                colonna % manod: >=522
// Testo con X<100 che non è un titolo né una cella di codice è il paragrafo
// descrittivo generale della famiglia (norme, caratteristiche): nel PDF
// ufficiale compare una sola volta, subito sotto il titolo della famiglia e
// prima della tabella — finisce quindi nel campo "descrizione" del nodo
// TITOLO, non ripetuto su ogni voce sotto (ogni voce mostra solo la propria
// parte specifica, es. "Monofase fino a 1.5 kW/230V + T").

// Il marcatore fisso a inizio riga, in colonna codice, di solito è solo
// "VEN26-" — ma nel prezzario "Materiali" è "VEN26-PR-": un prefisso EXTRA
// a lettere (costante per tutto il file) prima del vero codice gerarchico
// ("A.01.01.00"...). Verificato sul PDF ufficiale reale: 8885 marcatori,
// SEMPRE e solo "VEN26-PR-", mai altro, in un file di 581 pagine — non è
// un'anomalia isolata, è il prefisso di questo prezzario. Il gruppo opzionale
// copre questo caso senza dover conoscere "PR" in anticipo.
const _VEN_PDF_RIGA_INIZIO_RE = /^VEN\d{2}-(?:[A-Za-z]+-)?$/;
// I codici del Veneto NON sono sempre puramente numerici, come si vedeva solo
// nel PDF "Opere Elettriche" usato finora per verificare questo parser:
// confrontando anche Manodopera, Opere Edili, Opere Stradali e Materiali
// (PDF ufficiali reali) si trovano categorie con prefisso a lettere
// ("VEN26-RU" per la Manodopera, "VEN26-PR-A" per i Materiali) e,
// soprattutto, voci finali che finiscono molto spesso con un suffisso a
// lettere invece che sempre 2 cifre ("VEN26-01.02.04.a", non ".00" — e
// anche il file Opere Elettriche già "verificato" ne contiene alcune:
// "VEN26-10.02.08a.01"). Ogni pezzo fra i punti è quindi alfanumerico, non
// solo cifre — la restrizione precedente scartava in silenzio ogni
// titolo/voce con una di queste forme (chiudiRigaCorrente scarta la riga se
// "cifre" non è mai stato valorizzato).
const _VEN_PDF_CONTINUAZIONE_RE = /^[0-9A-Za-z.]+$/;
// Il gruppo del codice ammette anche il trattino (oltre a cifre/lettere/punto)
// per coprire un codice di livello 1 come "PR-A" (Materiali) — l'ambiguità
// con il separatore " - " prima del titolo si risolve richiedendo che quel
// separatore abbia SEMPRE spazi veri intorno (\s+, non \s*: verificato,
// il codice stesso non contiene mai spazi in nessun PDF reale, quindi il
// primo spazio incontrato è sempre e solo l'inizio del separatore).
const _VEN_PDF_TITOLO_RE = /^VEN(\d{2})-([0-9A-Za-z.-]+)\s+-\s+(.+)$/;
const _VEN_PDF_HEADER_FOOTER_RE = /^\d{2}\/\d{2}\/\d{2},\s*\d{2}:\d{2}$|^Stampa prezziario$|^https?:\/\/prezzario\.regione\.veneto\.it|^\d+\/\d+$/;
// "%" NON è qui nonostante faccia parte dell'intestazione "% Man.": è anche
// un valore di UM del tutto legittimo per le voci "a percentuale" (es. un
// sovrapprezzo espresso come "% del prezzo") — vedi il controllo apposito,
// basato sulla posizione X (non sul testo, ambiguo), subito sotto.
const _VEN_PDF_ETICHETTE_TABELLA = new Set(['Codice', 'Descrizione', 'UM', 'Prezzo', 'Man.']);
// Un prezzo, nel formato italiano del PDF, ha SEMPRE la virgola decimale
// (mai un intero "nudo": verificato su tutti e 4 i PDF reali) — serve a
// distinguere con certezza la colonna "Prezzo" dalla colonna "UM" quando
// cadono a ridosso della stessa soglia in punti X (vedi sotto).
const _VEN_PDF_PREZZO_RE = /^-?[\d.]+,\d+$/;
// Un'UM "compatta": nessuno spazio (a parte un'eventuale unità composta con
// "/", es. "cad/giorno"), corta — mai un pezzo di descrizione vera, sempre
// più lunga e con più parole. Usata solo nella fascia di confine 415-430
// (vedi sopra).
const _VEN_PDF_UM_COMPATTA_RE = /^[0-9A-Za-zà-ù°²³%*.]+(\/[0-9A-Za-zà-ù°²³%*.]+)?$/;

// "2.891,90" / "180,39" → 2891.90 / 180.39 (formato italiano: punto delle
// migliaia, virgola decimale — diverso dalla % manodopera, che nel PDF usa
// invece il punto decimale "0.25"/"35.71" e si legge quindi con Number()).
function _numeroItalianoPrezzo(s) {
  const t = String(s || '').trim();
  if (!t) return 0;
  const n = Number(t.replace(/\./g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

// Legge, tramite pdf.js, tutti i "text item" di ogni pagina del PDF in
// ordine di lettura (pagina 1, poi 2, ...), come array piatto {str, x}. Non
// serve altro (y non serve per la logica di riga, vedi sopra) oltre a x per
// distinguere le colonne.
async function _leggiItemPdfVeneto(file) {
  if (!window.pdfjsLib) {
    throw new Error('La libreria di lettura PDF non risulta caricata: ricarica la pagina e riprova.');
  }
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const items = [];
  for (let numPagina = 1; numPagina <= doc.numPages; numPagina++) {
    const pagina = await doc.getPage(numPagina);
    const contenuto = await pagina.getTextContent();
    contenuto.items.forEach(it => {
      if (it.str && it.str.trim()) items.push({ str: it.str, x: it.transform[4] });
    });
  }
  return items;
}

// Cuore del parsing: dall'array piatto di {str, x} (tutte le pagine, in
// ordine) ricostruisce l'elenco di titoli/voci nello stesso formato usato
// ovunque nell'app ({numero, tipo, ...}). Pura (nessun I/O): testabile
// direttamente con dati finti che imitano l'output di pdf.js, senza un PDF
// vero — vedi /tmp/test_veneto_pdf.js.
function _parseRigheVenetoPdf(itemsPiatti) {
  const risultato = [];
  const titoliCreati = new Set();   // numero (senza "VEN26-") dei titoli già creati, evita duplicati se un'intestazione si ripetesse
  const numeriVoceUsati = new Set();
  let corrente = null;              // riga voce in costruzione: {prefissoAnno, cifre, descrizioneParti, umParti, prezzoParti, manodoperaParti}

  // Paragrafo normativo/descrittivo generale che nel PDF compare subito
  // sotto ogni intestazione di famiglia, PRIMA della tabella (es. sotto
  // "VEN26-10.01.01 - ALLACCIAMENTO MOTORE": "Allacciamento dal quadro di
  // comando ad ogni motore... Comprendente: ..."). Nel PDF ufficiale compare
  // UNA SOLA VOLTA, associato al titolo della famiglia — non va quindi
  // ripetuto sulla descrizione di ogni singola voce (come faceva la prima
  // versione di questo parser): finisce nel campo "descrizione" del nodo
  // TITOLO stesso, e ogni voce sotto mostra solo la propria parte specifica
  // (es. "Monofase fino a 1.5 kW/230V + T"). Si azzera a ogni nuova
  // intestazione (di qualsiasi livello) e si accumula finché non inizia la
  // prima voce della tabella corrispondente, momento in cui viene assegnato
  // al titolo più recente (ultimoTitoloNodo).
  let paragrafoCorrente = [];
  let ultimoTitoloNodo = null;

  // Prefisso extra oltre "VEN26-" nel marcatore di riga di QUESTO file (es.
  // "PR-" nel Prezzario Materiali — vedi _VEN_PDF_RIGA_INIZIO_RE), se
  // presente: verificato costante per tutto il file (un solo marcatore
  // ripetuto migliaia di volte). Serve a riallineare la numerazione interna
  // dei titoli con quella delle voci — vedi normalizzazione finale sotto.
  let prefissoExtraMarcatore = null; // null finché non ancora rilevato; '' se il file non ne usa uno

  // Titoli lunghi vanno spesso a capo su una seconda riga nel PDF ufficiale
  // (es. "VEN26-01.03.09 - FORNITURA E STESA DEL MATERIALE PER FONDAZIONE
  // STRADALE" + seconda riga "APPARTENETE AI GRUPPI A1, A2-3, A2-4, A3"),
  // che pdf.js consegna come un text item A SÉ, in colonna codice (x<50,
  // stessa zona di "VEN26-"/cifre) — verificato su tutti e 4 i PDF reali,
  // presente anche nel file "Opere Elettriche" già in produzione (~10
  // titoli troncati). Tiene traccia del titolo appena creato SOLO per il
  // singolo item immediatamente successivo: si azzera comunque non appena
  // arriva qualunque altro tipo di riga (titolo/codice/continuazione), così
  // non rischia di "agganciare" del testo estraneo più avanti nel file.
  let titoloInAttesaContinuazione = null;

  function chiudiRigaCorrente() {
    if (!corrente) return;
    const c = corrente;
    corrente = null;
    if (!c.cifre) return; // marcatore "VEN26-" trovato ma mai seguito dalle cifre: riga incompleta, si scarta senza creare una voce vuota

    let numero = c.cifre;
    if (numeriVoceUsati.has(numero)) {
      let suffisso = 2;
      while (numeriVoceUsati.has(`${numero}#${suffisso}`)) suffisso++;
      numero = `${numero}#${suffisso}`;
    }
    numeriVoceUsati.add(numero);

    const descrizione = c.descrizioneParti.join(' ').replace(/\s+/g, ' ').trim();

    const manodoperaTesto = c.manodoperaParti.join(' ').trim();
    risultato.push({
      numero,
      tipo: 'voce',
      codice: c.prefissoAnno + c.cifre,
      descrizione,
      um: c.umParti.join(' ').trim(),
      prezzo: _numeroItalianoPrezzo(c.prezzoParti.join(' ')),
      manodopera: (manodoperaTesto === '' || isNaN(Number(manodoperaTesto))) ? null : Number(manodoperaTesto),
    });
  }

  itemsPiatti.forEach(item => {
    const testo = String(item.str || '').trim();
    if (!testo || _VEN_PDF_HEADER_FOOTER_RE.test(testo) || _VEN_PDF_ETICHETTE_TABELLA.has(testo)) return;
    // Intestazione di colonna "%" (di "% Man.") — si ripete spesso, non solo
    // in cima alla tabella (verificato: anche una volta per ogni voce, nei
    // PDF reali). Cade sempre a ridosso della colonna "% manodopera"
    // (x>=522, come "Man."): un "%" più a sinistra, nella zona della
    // colonna UM (x<465), è invece un valore vero (vedi sopra), non va
    // scartato qui.
    if (testo === '%' && item.x >= 465) return;

    const matchTitolo = testo.match(_VEN_PDF_TITOLO_RE);
    if (matchTitolo) {
      chiudiRigaCorrente();
      paragrafoCorrente = []; // nuova sezione: il paragrafo della sezione precedente non si applica più
      const numero = matchTitolo[2];
      if (!titoliCreati.has(numero)) {
        titoliCreati.add(numero);
        const nodoTitolo = { numero, tipo: 'titolo', titolo: matchTitolo[3].trim(), codiceVisibile: `VEN${matchTitolo[1]}-${numero}` };
        risultato.push(nodoTitolo);
        ultimoTitoloNodo = nodoTitolo;
        titoloInAttesaContinuazione = nodoTitolo;
      } else {
        // Intestazione duplicata: non sappiamo con certezza a quale nodo
        // titolo (già esistente) andrebbe riassociato un eventuale paragrafo
        // successivo — meglio non assegnarlo a quello sbagliato.
        ultimoTitoloNodo = null;
        titoloInAttesaContinuazione = null;
      }
      return;
    }

    // Consumato subito, qualunque sia il ramo che gestisce effettivamente
    // questo item: da qui in avanti "eraInAttesaTitolo" è l'unica variabile
    // valida per il resto di QUESTA iterazione.
    const eraInAttesaTitolo = titoloInAttesaContinuazione;
    titoloInAttesaContinuazione = null;

    const inColonnaCodice = item.x >= 28 && item.x < 50;
    if (inColonnaCodice && _VEN_PDF_RIGA_INIZIO_RE.test(testo)) {
      chiudiRigaCorrente();
      if (ultimoTitoloNodo && !ultimoTitoloNodo.descrizione && paragrafoCorrente.length) {
        ultimoTitoloNodo.descrizione = paragrafoCorrente.join(' ').replace(/\s+/g, ' ').trim();
      }
      if (prefissoExtraMarcatore === null) {
        const m = testo.match(/^VEN\d{2}-([A-Za-z]+-)?$/);
        prefissoExtraMarcatore = (m && m[1]) || '';
      }
      corrente = { prefissoAnno: testo, cifre: '', descrizioneParti: [], umParti: [], prezzoParti: [], manodoperaParti: [] };
      return;
    }
    if (inColonnaCodice && corrente && !corrente.cifre && _VEN_PDF_CONTINUAZIONE_RE.test(testo)) {
      corrente.cifre = testo;
      return;
    }

    if (item.x < 50) {
      // Seconda riga di un titolo appena creato (vedi sopra): l'unico caso
      // riconosciuto con certezza. Qualunque altro testo fuori tabella a
      // sinistra della colonna codice (es. "20KA": etichetta troncata di
      // continuazione a inizio pagina) resta rumore, ignorato.
      if (eraInAttesaTitolo) {
        eraInAttesaTitolo.titolo = (eraInAttesaTitolo.titolo + ' ' + testo).replace(/\s+/g, ' ').trim();
      }
      return;
    }
    // Fra la colonna codice e quella descrizione: è il paragrafo generale
    // della famiglia in corso (vedi sopra), sempre — anche se in quel
    // momento nessuna riga è ancora "corrente" (il paragrafo precede
    // sempre la prima voce della tabella).
    if (item.x < 100) { paragrafoCorrente.push(testo); return; }

    if (!corrente || !corrente.cifre) return; // cella di tabella prima che una voce sia iniziata: non dovrebbe capitare, ignorata per sicurezza
    if (item.x < 430) {
      // Le UM "composte" (es. "cad/giorno", "paia/mese" — più larghe delle
      // semplici "cad"/"m²") possono iniziare anche qualche punto prima
      // della soglia 430 che separa Descrizione da UM (verificato: fino a
      // x=425 sul PDF ufficiale "Materiali", 581 pagine) — lì normalmente
      // cade solo la colonna UM: in nessuno dei PDF reali verificati un
      // pezzo di descrizione vera (sempre più lunga, con spazi multipli) si
      // trova in questa fascia. Un token corto senza spazi (a parte
      // un'eventuale unità composta con "/") in questa piccola fascia di
      // confine è quindi l'UM, non la descrizione.
      if (item.x >= 415 && _VEN_PDF_UM_COMPATTA_RE.test(testo)) { corrente.umParti.push(testo); return; }
      corrente.descrizioneParti.push(testo); return;
    }
    if (item.x < 522) {
      // UM e Prezzo sono due colonne strette e adiacenti: il confine in
      // punti X fra le due (465) è un'approssimazione che nei PDF reali
      // può fallire per i prezzi più larghi — es. "146.155,22" può
      // iniziare anche solo 0.2pt prima della soglia, finendo classificato
      // come UM invece che come Prezzo (verificato: causava prezzo=0 su
      // alcune voci del Prezzario Elettrico, quello già "verificato").
      // Il contenuto è però inequivocabile (vedi _VEN_PDF_PREZZO_RE): usa
      // quello, non la posizione, per decidere fra le due.
      if (_VEN_PDF_PREZZO_RE.test(testo)) { corrente.prezzoParti.push(testo); return; }
      corrente.umParti.push(testo);
      return;
    }
    corrente.manodoperaParti.push(testo);
  });
  chiudiRigaCorrente();

  // Riallinea la numerazione interna dei titoli a quella delle voci, quando
  // il marcatore di riga di questo file ha un prefisso extra oltre "VEN26-"
  // (es. "PR-" nel Prezzario Materiali). Il "numero" di un titolo viene
  // catturato per intero dalla riga del titolo stesso ("VEN26-PR-A.01 -
  // ..." → numero "PR-A.01", prefisso incluso), mentre quello di una voce
  // è SOLO la continuazione in colonna codice ("A.01.01.00", prefisso
  // escluso: il marcatore "VEN26-PR-" è un testo a parte nella tabella,
  // consumato come prefissoAnno). Senza questo allineamento un titolo
  // "PR-A.01" non risulta mai genitore della voce "A.01.01.00" — l'aggancio
  // in costruisciAlbero (tree_view.js) è per uguaglianza esatta di stringa
  // (numeroPadre = numero con l'ultimo pezzo a punti tolto), non per
  // prefisso — e le voci restavano tutte orfane in cima all'albero, aperte
  // fuori posto (bug reale segnalato da Giovanni sull'import "Materiali").
  if (prefissoExtraMarcatore) {
    risultato.forEach(nodo => {
      if (nodo.tipo === 'titolo' && nodo.numero.startsWith(prefissoExtraMarcatore)) {
        nodo.numero = nodo.numero.slice(prefissoExtraMarcatore.length);
      }
    });
  }

  return risultato;
}

// ─── Numerazione "a schermo" del Prezzario DEI: codice reale al posto del
// progressivo, per capitoli e sottocapitolo ───
//
// Il "numero" interno (capIndex.subIndex.voceIndex, calcolato sopra) resta
// invariato: è la chiave con cui costruisciAlbero collega genitore/figlio
// (vedi tree_view.js) e deve restare unica e stabile — cambiarla in un
// codice "vero" avrebbe rischiato collisioni (due sottocapitoli diversi che
// finiscono per condividere lo stesso codice, o nessun codice) che
// avrebbero fatto sparire righe dall'albero (mappa.set sovrascrive in
// silenzio in caso di chiave duplicata). Invece calcoliamo qui un campo
// SEPARATO, "codiceVisibile", che tree_view.js mostra al posto del numero
// SOLO per la variante prezzario (vedi renderRigheAlbero) — il numero
// interno resta comunque il vero riferimento strutturale, invisibile.
//
// Un sottocapitolo mostra il codice base comune alle sue voci figlie (es.
// "055003a"/"055003b" → "055003"); un capitolo che raggruppa più
// sottocapitoli mostra il prefisso comune ai LORO codici (risposta
// dell'utente: se non c'è un prefisso comune sensato, nessun numero, solo
// il titolo).

// Stacca l'eventuale suffisso a lettere finale di un codice voce (es.
// "055003a" → "055003"); i codici puramente numerici restano invariati.
function _baseCodiceDEI(codice) {
  const s = String(codice || '').trim();
  const m = s.match(/^(.*\d)[A-Za-z]+$/);
  return m ? m[1] : s;
}

// Prefisso comune a un elenco di codici, ma solo se "significativo": un
// prefisso di 1-2 caratteri (es. lo "0" iniziale condiviso da quasi tutti i
// codici DEI a 6 cifre con zeri iniziali) non indica una vera parentela,
// è rumore — in quel caso si preferisce non mostrare nessun numero
// piuttosto che uno fuorviante. Soglia: almeno 3 caratteri E almeno metà
// della lunghezza del codice più corto del gruppo.
function _prefissoComuneSignificativo(codici) {
  const lista = codici.filter(c => c);
  if (!lista.length) return '';
  let prefisso = lista[0];
  for (let i = 1; i < lista.length && prefisso; i++) {
    const altro = lista[i];
    let j = 0;
    while (j < prefisso.length && j < altro.length && prefisso[j] === altro[j]) j++;
    prefisso = prefisso.slice(0, j);
  }
  const lunghezzaMinima = Math.min(...lista.map(c => c.length));
  if (prefisso.length >= 3 && prefisso.length >= lunghezzaMinima / 2) return prefisso;
  return '';
}

// Calcola e annota "codiceVisibile" su ogni nodo titolo (capitolo e
// sottocapitolo) del risultato piatto di _estraiVociGerarchicheDEI,
// mutandolo in place. Va chiamata a struttura completa (dopo il ciclo
// principale), perché un sottocapitolo/capitolo ha bisogno di conoscere
// TUTTE le sue voci figlie, non solo quelle già viste al momento in cui la
// sua riga di intestazione compare nel file.
function _calcolaCodiciVisibiliDEI(risultato) {
  const sottocapitoli = risultato.filter(v => v.tipo === 'titolo' && v.numero.split('.').length === 2);
  const capitoli = risultato.filter(v => v.tipo === 'titolo' && v.numero.split('.').length === 1);

  sottocapitoli.forEach(sub => {
    const figlie = risultato.filter(v => v.tipo === 'voce' && v.numero.startsWith(sub.numero + '.'));
    const basi = figlie.map(v => _baseCodiceDEI(v.codice));
    sub.codiceVisibile = _prefissoComuneSignificativo(basi);
  });

  capitoli.forEach(cap => {
    const sottocapitoliDelCapitolo = sottocapitoli.filter(s => s.numero.startsWith(cap.numero + '.'));
    let codici;
    if (sottocapitoliDelCapitolo.length) {
      codici = sottocapitoliDelCapitolo.map(s => s.codiceVisibile).filter(c => c);
    } else {
      // Nessun sottocapitolo: il capitolo raggruppa voci dirette.
      const vociDirette = risultato.filter(v => v.tipo === 'voce' && v.numero.startsWith(cap.numero + '.') && v.numero.split('.').length === 2);
      codici = vociDirette.map(v => _baseCodiceDEI(v.codice));
    }
    cap.codiceVisibile = _prefissoComuneSignificativo(codici);
  });
}

// ─── Formato 2: gerarchico posizionale (stile DEI) ───
// Righe senza prezzo = intestazioni: "CAP..." = capitolo (livello 1),
// altrimenti sottocapitolo (livello 2). Numerazione auto-generata.
//
// IMPORTANTE: usiamo un UNICO contatore di livello 2 (level2Counter) sia per
// i sottocapitoli sia per le voci "dirette" (quelle che compaiono prima di
// qualsiasi sottocapitolo all'interno di un capitolo) — altrimenti due
// contatori indipendenti possono produrre lo stesso numero (es. una voce
// diretta "38.1" e un sottocapitolo successivo anch'esso "38.1").
function _estraiVociGerarchicheDEI(righeArray) {
  const risultato = [];
  let capIndex = 0;
  let level2Counter = 0;
  let subIndex = 0;
  let voceIndexInSub = 0;
  let dentroSottocapitolo = false;
  let ultimaChiaveTitolo = ''; // evita di duplicare intestazioni ripetute consecutive

  // Se il file inizia con un sottocapitolo o una voce PRIMA di qualunque
  // riga "CAP..." (capitolo esplicito), capIndex resterebbe 0 e i figli
  // finirebbero comunque numerati "1.x" (capIndex||1) SENZA che un vero
  // nodo titolo "1" sia mai stato creato — non un bug visibile di per sé
  // (quei nodi diventano semplicemente radici dell'albero), ma qui creiamo
  // comunque un capitolo implicito esplicito, per coerenza e perché serve
  // un nodo reale a cui appendere un eventuale codiceVisibile.
  function assicuraCapitoloImplicito() {
    if (capIndex === 0) {
      capIndex = 1;
      risultato.push({ numero: '1', tipo: 'titolo', titolo: '(senza intestazione di capitolo)' });
    }
  }

  for (const riga of righeArray) {
    const codice = String(riga[0] ?? '').trim();
    const descrizione = String(riga[1] ?? '').trim();
    const um = String(riga[2] ?? '').trim();
    const prezzoGrezzo = riga[3];
    // Colonna E (indice 4), quando presente: % manodopera. Formato
    // posizionale (nessuna intestazione con nomi), quindi non riconoscibile
    // per nome come negli altri due formati — la leggiamo comunque se c'è
    // un valore numerico, senza richiederla (molti file DEI non la hanno).
    const manodoperaGrezza = riga[4];
    const manodopera = (manodoperaGrezza === '' || manodoperaGrezza === null || manodoperaGrezza === undefined)
      ? null : (isNaN(Number(manodoperaGrezza)) ? null : Number(manodoperaGrezza));

    if (!codice && !descrizione) continue; // riga vuota

    const haPrezzo = prezzoGrezzo !== '' && prezzoGrezzo !== null && prezzoGrezzo !== undefined;
    if (!haPrezzo) {
      if (!codice) continue; // riga di premessa/titolo documento senza codice reale: ignorata

      // Righe di intestazione che ripetono ESATTAMENTE sia il codice SIA la
      // descrizione della precedente (note aggiuntive sotto lo stesso
      // capitolo, tipiche del formato DEI): non creano un nuovo capitolo/
      // sottocapitolo, si saltano. Richiedere ANCHE la descrizione (non solo
      // il codice) evita di scartare per errore intestazioni realmente
      // distinte che nel file sorgente condividono un codice-segnaposto non
      // univoco (es. tutte "-" o tutte vuote): con solo il codice a fare da
      // chiave, quelle intestazioni sparivano e le loro voci finivano
      // attaccate al sottocapitolo sbagliato (o senza figli affatto) — è la
      // causa più probabile dei casi segnalati di voci "senza padre" o
      // capitoli senza figli.
      const chiaveTitolo = codice + '|' + descrizione;
      if (chiaveTitolo === ultimaChiaveTitolo) continue;
      ultimaChiaveTitolo = chiaveTitolo;

      if (/^CAP/i.test(codice)) {
        capIndex++; level2Counter = 0; subIndex = 0; voceIndexInSub = 0; dentroSottocapitolo = false;
        risultato.push({ numero: `${capIndex}`, tipo: 'titolo', titolo: descrizione || codice });
      } else {
        assicuraCapitoloImplicito();
        level2Counter++; subIndex = level2Counter; voceIndexInSub = 0; dentroSottocapitolo = true;
        risultato.push({ numero: `${capIndex}.${subIndex}`, tipo: 'titolo', titolo: descrizione || codice });
      }
      continue;
    }

    const prezzoNum = Number(prezzoGrezzo);
    if (isNaN(prezzoNum)) continue;

    assicuraCapitoloImplicito();
    let numero;
    if (dentroSottocapitolo) {
      voceIndexInSub++;
      numero = `${capIndex}.${subIndex}.${voceIndexInSub}`;
    } else {
      level2Counter++;
      numero = `${capIndex}.${level2Counter}`;
    }
    risultato.push({ numero, tipo: 'voce', codice, descrizione, um, prezzo: prezzoNum, manodopera });
  }

  _calcolaCodiciVisibiliDEI(risultato);
  return risultato;
}

// ─── Formato 3: DEI "reale" a due fogli (Indice + Voci) ───
//
// Scoperto ispezionando il file vero caricato da Giovanni
// ("DEI_PrezzarioImpiantiElettrici_IIsem2025_xls 1.xlsx"): il formato
// posizionale semplice sopra (Formato 2) è troppo povero per rappresentare
// davvero questo file — la gerarchia reale ha FINO A 6 LIVELLI (capitolo >
// sezione "Materiali"/"Opere Compiute" > sottocapitolo > eventuale "voce
// madre" > "voce padre" > voce figlia), e il foglio delle voci da solo NON
// basta a distinguerli: uno stesso codice (es. "CAP01MT") si ripete
// IDENTICO su decine di righe con contenuto diverso — sia sulle vere
// intestazioni di sottocapitolo, sia su raggruppamenti più interni — quindi
// il codice da solo non dice a che livello sta una riga.
//
// L'unico modo per saperlo SENZA INVENTARE NULLA è usare il foglio
// "Indice_..." (sempre presente accanto al foglio voci in questi export
// DEI): elenca, capitolo per capitolo e sezione per sezione (Materiali poi
// Opere Compiute, nello stesso ordine), il titolo ESATTO di ogni
// sottocapitolo. Quando una riga del foglio voci ripete uno di questi
// codici "raggruppanti" (es. "CAP01MT") con un titolo che combacia col
// prossimo sottocapitolo atteso dall'indice, è un vero sottocapitolo,
// SEMPRE nello stesso ordine dell'indice; se il titolo non combacia, è un
// livello più interno ("voce madre": un raggruppamento come "Interruttore
// da 10÷16 A...:" che a sua volta contiene altre righe, in genere "voci
// padre" a codice numerico come "013011" con le varianti a lettera vere e
// proprie sotto, es. "013011c").
//
// Algoritmo (validato su tutte le 15.472 righe reali del file di Giovanni:
// 49/49 capitoli e 357/357 sottocapitoli dell'indice ritrovati nell'ordine
// giusto nel foglio voci, 0 errori, 0 numeri duplicati):
//
// 1. `_parseIndiceDEI` legge il foglio Indice riga per riga: una riga con
//    qualcosa in colonna A è un capitolo (codice+titolo); tra un capitolo e
//    il successivo, la PRIMA riga con testo in colonna B che vale
//    esattamente "Materiali" o "Opere Compiute" è l'etichetta di sezione
//    (alcuni capitoli speciali — Avvertenze, Mano d'opera, Noli — non ce
//    l'hanno, i loro sottocapitoli seguono il capitolo direttamente); tutte
//    le righe successive (fino al prossimo capitolo) sono, IN ORDINE, i
//    titoli dei sottocapitoli di quella sezione.
// 2. `_estraiVociGerarchicheDEIconIndice` scorre il foglio voci con una
//    pila (stack) dei livelli attualmente aperti, senza mai usare il
//    contenuto testuale del codice per dedurre la gerarchia (solo la sua
//    FORMA: "CAPxx" bare = capitolo, "CAPxxYY" = tag di sezione/
//    sottocapitolo/voce-madre, tutto il resto senza prezzo = voce padre,
//    con prezzo = voce figlia) più il confronto col prossimo titolo atteso
//    dall'indice per sapere quando si apre davvero un nuovo sottocapitolo:
//    - codice "CAPxx" (bare): stessa lettera del capitolo già aperto? apre
//      una nuova SEZIONE (secondo blocco = Opere Compiute) come figlia
//      dello stesso capitolo; codice diverso? chiude tutto e apre un nuovo
//      capitolo. Il blocco corrispondente dell'indice fornisce sezione (se
//      c'è) e l'elenco ordinato dei sottocapitolo attesi.
//    - codice "CAPxxYY": se il titolo combacia col prossimo sottocapitolo
//      atteso, chiude fino al livello sezione/capitolo e apre un
//      SOTTOCAPITOLO; altrimenti chiude fino all'ultimo sottocapitolo
//      aperto (o alla sezione/capitolo se non ne è ancora stato aperto
//      nessuno in questo blocco) e apre una VOCE MADRE, sempre come figlia
//      diretta di quel livello (mai annidata dentro un'altra voce madre:
//      nei dati reali sono sempre fratelli).
//    - codice "diverso da CAPxx/CAPxxYY", senza prezzo: VOCE PADRE, figlia
//      diretta dell'ultimo livello "CAP..." aperto (sottocapitolo o voce
//      madre).
//    - riga CON prezzo: se il codice è quello della voce padre aperta più
//      una singola lettera finale (es. "013011" aperta → "013011c"), è una
//      VOCE FIGLIA di quella voce padre; altrimenti (codice numerico senza
//      lettera, es. "013014" da solo — capita quando un raggruppamento ha
//      una sola variante e quindi non serve separarla in lettere) chiude
//      la voce padre eventualmente aperta e diventa essa stessa una voce,
//      fratella della voce padre precedente (mai sua figlia).
// 3. Se un capitolo del foglio voci non si trova nell'indice, o l'indice
//    finisce un blocco con sottocapitoli mai incontrati nel foglio voci,
//    NON si inventa nulla e non si blocca l'import: si prosegue con
//    struttura "best effort" (il capitolo/sottocapitolo mancante diventa
//    comunque un nodo, senza sezione/sottocapitoli sotto) e si annota un
//    avviso, mostrato a fine import — mai un dato silenzioso o fabbricato.
//
// codiceVisibile (mostrato a schermo al posto del numero progressivo, come
// per il Formato 2) viene assegnato SOLO dove esiste un vero codice
// univoco della riga stessa: il capitolo (es. "CAP01") e la voce padre
// (es. "013011"). Sezione/sottocapitolo/voce madre condividono lo stesso
// codice "raggruppante" non univoco con molti fratelli diversi: mostrarlo
// sarebbe fuorviante (sembrerebbe il LORO codice proprio), quindi per loro
// si mostra il numero progressivo interno (comunque leggibile, riflette la
// posizione reale nell'albero) — mai un codice inventato.

const _DEI_BARE_CAP_RE = /^CAP[A-Z0-9]{2}$/;
const _DEI_SECTION_TAG_RE = /^CAP[A-Z0-9]{2}[A-Z]{2}$/;
const _DEI_LEAF_LETTER_RE = /^(.+[0-9])([a-z])$/;

// Legge il foglio "Indice_..." e lo trasforma in un elenco ordinato di
// blocchi { capCodice, capTitolo, sezione, sottotopic: [...] }, uno per
// ogni capitolo/sezione (un capitolo con Materiali+Opere Compiute produce 2
// blocchi consecutivi con lo stesso capCodice).
function _parseIndiceDEI(righeIndice) {
  const blocchi = [];
  let corrente = null;
  righeIndice.forEach(riga => {
    const a = String(riga[0] ?? '').trim();
    const b = String(riga[1] ?? '').trim();
    if (a) {
      if (corrente) blocchi.push(corrente);
      corrente = { capCodice: a, capTitolo: b, sezione: null, sottotopic: [] };
      return;
    }
    if (!b || !corrente) return;
    if ((b === 'Materiali' || b === 'Opere Compiute') && !corrente.sottotopic.length && corrente.sezione === null) {
      corrente.sezione = b;
      return;
    }
    corrente.sottotopic.push(b);
  });
  if (corrente) blocchi.push(corrente);
  return blocchi;
}

// Cuore del Formato 3: costruisce l'elenco piatto {numero, tipo, ...} dal
// foglio voci, usando i blocchi dell'indice come guida per la gerarchia.
// Pura (nessun I/O): testabile con dati sintetici o con l'indice/voci veri
// letti a parte — vedi /tmp/test_dei_indice.js.
function _estraiVociGerarchicheDEIconIndice(righeIndice, righeVoci) {
  const blocchi = _parseIndiceDEI(righeIndice);
  const blocchiPerCapitolo = new Map(); // capCodice -> coda di blocchi (di solito 1 o 2: Materiali, Opere Compiute)
  blocchi.forEach(b => {
    if (!blocchiPerCapitolo.has(b.capCodice)) blocchiPerCapitolo.set(b.capCodice, []);
    blocchiPerCapitolo.get(b.capCodice).push(b);
  });

  const risultato = [];
  const avvisi = [];
  const stack = []; // { numero, figli }
  let radiceContatore = 0;

  function tronca(lunghezza) { stack.length = lunghezza; }

  function nuovoNumero() {
    const genitore = stack.length ? stack[stack.length - 1] : null;
    if (!genitore) { radiceContatore++; return String(radiceContatore); }
    genitore.figli++;
    return `${genitore.numero}.${genitore.figli}`;
  }

  function apriTitolo(titolo, extra) {
    const numero = nuovoNumero();
    risultato.push(Object.assign({ numero, tipo: 'titolo', titolo }, extra || {}));
    stack.push({ numero, figli: 0 });
    return numero;
  }

  function aggiungiVoce(codice, descrizione, um, prezzo, manodopera) {
    const numero = nuovoNumero();
    risultato.push({ numero, tipo: 'voce', codice, descrizione, um, prezzo, manodopera });
    return numero;
  }

  let capitoloCorrenteCodice = null;
  let sezioneOCapLunghezza = 0;   // lunghezza pila subito dopo capitolo+eventuale sezione
  let sottocapLunghezza = null;   // lunghezza pila subito dopo l'ultimo sottocapitolo aperto in questo blocco (null = nessuno ancora)
  let ancoraggioCorrente = 0;     // lunghezza pila a cui si aggancia la prossima "voce padre" (o voce madre)
  let codaSottotopic = [];
  let vocePadreApertaCodice = null;

  righeVoci.forEach(riga => {
    const codice = String(riga[0] ?? '').trim();
    const descrizione = String(riga[1] ?? '').trim();
    const um = String(riga[2] ?? '').trim();
    const prezzoGrezzo = riga[3];
    const manodoperaGrezza = riga[4];
    if (!codice && !descrizione) return;

    const haPrezzo = prezzoGrezzo !== '' && prezzoGrezzo !== null && prezzoGrezzo !== undefined;
    const manodopera = (manodoperaGrezza === '' || manodoperaGrezza === null || manodoperaGrezza === undefined || isNaN(Number(manodoperaGrezza)))
      ? null : Number(manodoperaGrezza);

    if (!haPrezzo) {
      if (!codice) return;

      if (_DEI_BARE_CAP_RE.test(codice)) {
        const coda = blocchiPerCapitolo.get(codice);
        const blocco = (coda && coda.length) ? coda.shift() : null;
        if (!blocco) {
          avvisi.push(`Capitolo "${codice}" (${descrizione}) non trovato nel foglio Indice: importato senza sotto-struttura.`);
        }
        const riapreStessoCapitolo = capitoloCorrenteCodice === codice && stack.length > 0;
        if (riapreStessoCapitolo) {
          tronca(1);
        } else {
          tronca(0);
          apriTitolo(descrizione || codice, { codiceVisibile: codice });
        }
        capitoloCorrenteCodice = codice;
        codaSottotopic = blocco ? blocco.sottotopic.slice() : [];
        sottocapLunghezza = null;
        vocePadreApertaCodice = null;
        if (blocco && blocco.sezione) {
          tronca(1);
          apriTitolo(blocco.sezione);
          sezioneOCapLunghezza = 2;
        } else {
          tronca(1);
          sezioneOCapLunghezza = 1;
        }
        ancoraggioCorrente = sezioneOCapLunghezza;
        return;
      }

      if (_DEI_SECTION_TAG_RE.test(codice)) {
        if (codaSottotopic.length && codaSottotopic[0] === descrizione) {
          codaSottotopic.shift();
          tronca(sezioneOCapLunghezza);
          apriTitolo(descrizione);
          sottocapLunghezza = stack.length;
        } else {
          tronca(sottocapLunghezza !== null ? sottocapLunghezza : sezioneOCapLunghezza);
          apriTitolo(descrizione);
        }
        ancoraggioCorrente = stack.length;
        vocePadreApertaCodice = null;
        return;
      }

      // voce padre: codice "proprio" (non CAP...), nessun prezzo
      tronca(ancoraggioCorrente);
      apriTitolo(descrizione, { codiceVisibile: codice });
      vocePadreApertaCodice = codice;
      return;
    }

    // riga con prezzo: voce figlia di una voce padre aperta (stesso codice
    // + una lettera finale), oppure voce autonoma (chiude la voce padre
    // eventualmente aperta, resta fratella sua e non figlia).
    const match = codice.match(_DEI_LEAF_LETTER_RE);
    const continuaVocePadre = match && vocePadreApertaCodice && match[1] === vocePadreApertaCodice;
    if (!continuaVocePadre) {
      tronca(ancoraggioCorrente);
      vocePadreApertaCodice = null;
    }
    const prezzoNum = Number(prezzoGrezzo);
    aggiungiVoce(codice, descrizione, um, isNaN(prezzoNum) ? 0 : prezzoNum, manodopera);
  });

  if (codaSottotopic.length) {
    avvisi.push(`Capitolo "${capitoloCorrenteCodice}": ${codaSottotopic.length} sottocapitolo/i dell'indice mai trovati nel foglio voci (${codaSottotopic.slice(0, 5).join('; ')}${codaSottotopic.length > 5 ? '...' : ''}).`);
  }
  blocchiPerCapitolo.forEach((coda, capCodice) => {
    if (coda.length) avvisi.push(`Capitolo "${capCodice}": presente nell'indice ma mai trovato nel foglio voci — ${coda.length} sezione/i non importate.`);
  });

  return { voci: risultato, avvisi };
}

// Un foglio è "l'indice" di un file DEI a due fogli se il suo nome inizia
// con "Indice" (case-insensitive) — convenzione osservata nei file reali
// di Giovanni — E ha la forma attesa (2 sole colonne popolate). Ritorna il
// nome del foglio indice, o null se il workbook non è di questo formato
// (allora si ricade sul Formato 1/2 a foglio singolo più sotto).
function _trovaFoglioIndiceDEI(workbook) {
  if (workbook.SheetNames.length < 2) return null;
  return workbook.SheetNames.find(nome => /^indice/i.test(nome)) || null;
}

function _sceglieFoglioDati(workbook) {
  if (workbook.SheetNames.length === 1) return workbook.SheetNames[0];
  let migliore = workbook.SheetNames[0];
  let maxRighe = -1;
  workbook.SheetNames.forEach(nome => {
    if (/indice/i.test(nome)) return; // salta fogli "Indice" (sommario, non dati)
    const righe = XLSX.utils.sheet_to_json(workbook.Sheets[nome], { header: 1 }).length;
    if (righe > maxRighe) { maxRighe = righe; migliore = nome; }
  });
  return migliore;
}

async function importaPrezzarioDaExcel(key, file) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;

  let voci;
  let avvisi = [];
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Formato 3 (vedi commento sopra _estraiVociGerarchicheDEIconIndice):
    // file DEI reale a due fogli, un "Indice_..." + il foglio voci vero e
    // proprio — è il formato prioritario quando riconosciuto, perché è
    // l'UNICO che sfrutta la vera gerarchia (fino a 6 livelli) invece di
    // appiattirla a 2-3 come i formati sotto.
    const nomeFoglioIndice = _trovaFoglioIndiceDEI(workbook);
    if (nomeFoglioIndice) {
      const nomeFoglioVoci = workbook.SheetNames.find(n => n !== nomeFoglioIndice);
      const righeIndice = XLSX.utils.sheet_to_json(workbook.Sheets[nomeFoglioIndice], { header: 1, defval: '' });
      const righeVoci = XLSX.utils.sheet_to_json(workbook.Sheets[nomeFoglioVoci], { header: 1, defval: '' });
      const esito = _estraiVociGerarchicheDEIconIndice(righeIndice, righeVoci);
      voci = esito.voci;
      avvisi = esito.avvisi;
    } else {
      const nomeFoglio = _sceglieFoglioDati(workbook);
      const foglio = workbook.Sheets[nomeFoglio];

      const righeArray = XLSX.utils.sheet_to_json(foglio, { header: 1, defval: '' });
      const primaRiga = righeArray[0] || [];
      const sembraIntestazione = primaRiga.some(cella => {
        const norm = _normalizzaChiave(cella);
        return norm === 'codice' || norm === 'descrizione' || norm === 'prezzo' || norm === 'um' || norm === 'u.m.';
      });

      if (sembraIntestazione) {
        const righeOggetto = XLSX.utils.sheet_to_json(foglio, { defval: '' });
        const vociFlat = righeOggetto.map(_mappaRigaConIntestazione).filter(v => v.codice || v.descrizione);
        voci = _costruisciAlberoDaFlat(vociFlat);
      } else {
        voci = _estraiVociGerarchicheDEI(righeArray);
      }
    }
  } catch (e) {
    alert('Impossibile leggere il file: ' + e.message);
    return;
  }

  if (avvisi.length) {
    alert('Import completato, ma con qualche avviso (nessun dato inventato, solo segnalato):\n\n' + avvisi.slice(0, 10).join('\n') + (avvisi.length > 10 ? `\n...e altri ${avvisi.length - 10}.` : ''));
  }

  await _confermaESalvaImportPrezzario(key, file.name, voci, 'Importa prezzario da Excel');
}

// Import diretto dal PDF ufficiale del Prezzario Regione Veneto (vedi
// commento sopra _parseRigheVenetoPdf per il formato). Stessa identica
// scelta "aggiungi/sostituisci" e stesso salvataggio a blocchi dell'import
// da Excel: solo la lettura del file cambia.
async function importaPrezzarioDaPDF(key, file) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;

  let voci;
  try {
    const items = await _leggiItemPdfVeneto(file);
    voci = _parseRigheVenetoPdf(items);
  } catch (e) {
    alert('Impossibile leggere il PDF: ' + e.message);
    return;
  }

  if (voci.length && !voci.some(v => v.tipo === 'voce')) {
    alert('Ho letto il PDF ma non ho trovato righe con un codice "VEN..-...": controlla che sia il PDF ufficiale del Prezzario Regione Veneto ("Stampa prezziario").');
    return;
  }

  await _confermaESalvaImportPrezzario(key, file.name, voci, 'Importa prezzario da PDF (Regione Veneto)');
}

// Scelta "aggiungi/sostituisci" + salvataggio a blocchi, condivisi tra
// l'import da Excel (DEI e formati con intestazione) e l'import diretto dal
// PDF ufficiale del Veneto: l'unica cosa che cambia tra i due è come si
// ottiene l'array "voci" ({numero, tipo, ...}), non cosa se ne fa dopo.
async function _confermaESalvaImportPrezzario(key, nomeFile, voci, titoloDialogo) {
  const state = PREZZARIO_STATE[key];
  if (!state) return;

  if (!voci || !voci.length) {
    alert('Non ho trovato righe valide in questo file. Se il formato è particolare, fammelo sapere così sistemo la lettura.');
    return;
  }

  const numVociVere = voci.filter(v => v.tipo === 'voce').length;

  // Un'unica scelta esplicita al posto della coppia di confirm() ambigui.
  const scelta = await chiediScelta({
    titolo: titoloDialogo,
    corpo: `Trovate ${voci.length} righe (${numVociVere} voci) nel file "${nomeFile}".\n\n` +
      `Ci sono già ${state.voci.length} righe caricate. Cosa vuoi fare?`,
    bottoni: [
      { valore: 'annulla', testo: 'Annulla' },
      { valore: 'aggiungi', testo: 'Aggiungi soltanto', classe: 'btn-blu' },
      { valore: 'sostituisci', testo: 'Sostituisci tutto', classe: 'btn-rosso' }
    ]
  });
  if (scelta === 'annulla' || !scelta) return;
  const sostituisci = scelta === 'sostituisci';

  const banner = document.getElementById(`${key}-import-banner`);
  if (banner) {
    banner.style.display = 'flex';
    banner.innerHTML = '<span>Importazione in corso, non chiudere la pagina...</span>';
  }

  try {
    const vociEsistenti = sostituisci ? [] : state.voci.slice();
    const nuoveVociImportate = voci.map(v => ({ id: _nuovoIdVoce(), ...v }));
    const vociComplessive = [...vociEsistenti, ...nuoveVociImportate];
    vociComplessive.sort((a, b) => confrontaVoci(a, b));

    // Un solo salvataggio "a blocchi" per l'intero import (vedi
    // _salvaBlocchiPrezzario più sotto): anche un prezzario da decine di
    // migliaia di voci diventa qui poche decine/centinaia di scritture
    // Firestore, non una per riga — il motivo per cui prima un import
    // grosso da solo poteva sforare il limite giornaliero gratuito.
    await _salvaBlocchiPrezzario(state.edizioniCollName, state.edizioneAttiva.id, vociComplessive, banner);

    state.voci = vociComplessive;
    _scriviCacheLocale(state.collName, state.voci);
    renderPrezzario(key);
    _aggiornaIndicatoreCachePrezzario(key);

    // Anteprima della prima voce importata direttamente nel popup di
    // conferma: serve a vedere SUBITO, senza dover riaprire l'albero e fare
    // uno screenshot, se la descrizione contiene davvero quello che ci si
    // aspetta (utile soprattutto per verificare l'import PDF del Veneto).
    const primaVoceImportata = nuoveVociImportate.find(v => v.tipo === 'voce');
    const anteprima = primaVoceImportata
      ? `\n\nEsempio prima voce importata (${primaVoceImportata.codice || primaVoceImportata.numero}):\n"${String(primaVoceImportata.descrizione || '').slice(0, 200)}"`
      : '';
    alert(`✓ Importazione completata.\n\n${voci.length} righe importate (${numVociVere} voci).${anteprima}`);
    if (banner) banner.style.display = 'none';
  } catch (e) {
    console.error('Errore importazione prezzario:', e);
    alert('Errore durante l\'importazione: ' + _messaggioErroreFirestore(e) + '\n\n(dettaglio tecnico in console: ' + (e && e.message) + ')');
  }
}

// ─── Prezzari: voci raggruppate "a blocchi" invece che un documento per voce ───
//
// Un prezzario può avere decine di migliaia di voci: se ognuna fosse un
// documento Firestore a sé stante (come nel modello usato dal magazzino
// Computo, e come i Prezzari usavano anche loro fino a poco fa), un solo
// import completo significa altrettante SCRITTURE — che da sole sforano
// il limite giornaliero gratuito di Firestore (piano Spark: 20.000
// scritture/giorno). Qui le voci di un'edizione vengono invece
// raggruppate in un piccolo numero di documenti "blocco" (fino a
// _BLOCCO_DIM voci ciascuno, ben sotto il limite di 1 MB per documento
// Firestore): un prezzario da 50mila voci diventa così ~112 documenti
// invece di 50mila, e un import o una cancellazione completa consumano
// ~112 operazioni — anche ripetuti più volte nello stesso giorno,
// restano lontanissimi dal tetto gratuito.
//
// Contropartita accettata consapevolmente: una modifica che cambia quante
// voci ci sono o come sono raggruppate (import, capitolo aggiunto/
// eliminato, cancella tutto) riscrive per intero l'edizione, non un
// singolo documento come prima. La modifica di UN SOLO campo di UNA voce
// già esistente (aggiornaCampoPrezzario, il caso più frequente in
// modalità "✎ Modifica") resta invece economica quanto prima: riscrive
// solo il blocco che contiene quella voce, 1 sola scrittura.
//
// Il magazzino Computo (per-progetto, tipicamente molto più piccolo) NON
// è toccato da questo cambiamento e continua a usare un documento
// Firestore per voce, con gli helper _cancellaTutteLeVoci/_scriviVociABatch
// qui sotto.
const _BLOCCO_DIM = 450;

function _nuovoIdVoce() {
  return 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function _chiaveCachePrezzarioEdizione(edizioniCollName, edizioneId) {
  return `${edizioniCollName}/${edizioneId}/voci`;
}

function _collBlocchi(edizioniCollName, edizioneId) {
  return db.collection(`${edizioniCollName}/${edizioneId}/blocchi`);
}

// Legge tutte le voci di un'edizione dai documenti "blocco" e le
// restituisce come array piatto (stesso formato di sempre: {id, numero,
// tipo, ...}, con in più il campo interno _blocco che indica in quale
// documento vive ciascuna voce — usato da aggiornaCampoPrezzario per
// riscrivere un solo blocco invece di tutti).
//
// Se non trova nessun blocco ma trova ancora dati nella VECCHIA
// sottocollezione "voci" (un documento Firestore per voce, il formato di
// prima di questo cambiamento), li migra automaticamente scrivendoli nel
// nuovo formato — un costo una tantum per edizione, non ripetuto alle
// aperture successive. I dati vecchi non vengono cancellati qui (restano
// semplicemente non più letti): la cancellazione avviene solo quando si
// elimina l'intera edizione (vedi eliminaEdizionePrezzario).
async function _leggiVociPrezzarioDaServer(edizioniCollName, edizioneId) {
  const blocchiSnap = await _collBlocchi(edizioniCollName, edizioneId).get();
  if (!blocchiSnap.empty) {
    const voci = [];
    blocchiSnap.docs.forEach(d => {
      const items = (d.data() && d.data().items) || [];
      items.forEach(v => voci.push({ ...v, _blocco: d.id }));
    });
    return voci;
  }
  const vecchiaSnap = await db.collection(`${edizioniCollName}/${edizioneId}/voci`).get();
  if (vecchiaSnap.empty) return [];
  const voci = vecchiaSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  await _salvaBlocchiPrezzario(edizioniCollName, edizioneId, voci);
  return voci; // _salvaBlocchiPrezzario annota già ogni voce col suo _blocco
}

// Riscrive per intero i documenti "blocco" di un'edizione a partire
// dall'array di voci passato (source of truth lato client in quel
// momento): lo suddivide in gruppi da _BLOCCO_DIM, sovrascrive un
// documento per gruppo (batch, come le altre scritture massive dell'app)
// e cancella eventuali blocchi rimasti in più da una versione più lunga
// di prima (es. dopo una cancellazione). Annota ogni voce con l'id (se
// non ne ha ancora uno) e col nuovo _blocco di appartenenza.
async function _salvaBlocchiPrezzario(edizioniCollName, edizioneId, voci, banner) {
  const collRef = _collBlocchi(edizioniCollName, edizioneId);
  const gruppi = [];
  for (let i = 0; i < voci.length; i += _BLOCCO_DIM) gruppi.push(voci.slice(i, i + _BLOCCO_DIM));

  const esistentiSnap = await collRef.get();
  const idEsistenti = esistentiSnap.docs.map(d => d.id);

  const BATCH_MAX = 450;
  const nuoviId = [];
  for (let i = 0; i < gruppi.length; i += BATCH_MAX) {
    const batch = db.batch();
    gruppi.slice(i, i + BATCH_MAX).forEach((gruppo, offset) => {
      const idBlocco = `b${i + offset}`;
      nuoviId.push(idBlocco);
      gruppo.forEach(v => { if (!v.id) v.id = _nuovoIdVoce(); v._blocco = idBlocco; });
      const items = gruppo.map(v => { const { _blocco, ...pulito } = v; return pulito; });
      batch.set(collRef.doc(idBlocco), { items });
    });
    await batch.commit();
    if (banner) banner.innerHTML = `<span>Salvataggio in corso: blocco ${Math.min(i + BATCH_MAX, gruppi.length)}/${gruppi.length}...</span>`;
  }

  const daCancellare = idEsistenti.filter(idB => !nuoviId.includes(idB));
  for (let i = 0; i < daCancellare.length; i += BATCH_MAX) {
    const batch = db.batch();
    daCancellare.slice(i, i + BATCH_MAX).forEach(idB => batch.delete(collRef.doc(idB)));
    await batch.commit();
  }
}

// Riscrive UN SOLO documento blocco: usato quando una modifica non cambia
// quante voci ci sono né come sono raggruppate (una modifica a un singolo
// campo di una voce già esistente) — 1 sola scrittura Firestore, come
// prima di questo cambiamento.
async function _salvaUnBloccoPrezzario(edizioniCollName, edizioneId, bloccoId, vociDelBlocco) {
  const items = vociDelBlocco.map(v => { const { _blocco, ...pulito } = v; return pulito; });
  await _collBlocchi(edizioniCollName, edizioneId).doc(bloccoId).set({ items });
}

// ─── Helper condivisi (usati anche da computo_module.js / prezzario_module.js) ───
// Accettano una CollectionReference vera e propria (non una stringa), così
// funzionano sia per collezioni di primo livello (prezzari) sia per
// sottocollezioni (progetti/{id}/voci). Restano usati dal magazzino
// Computo (un documento Firestore per voce, non cambiato) e dalla
// migrazione una tantum della vecchia collezione piatta dei Prezzari
// (state.collBase, precedente all'esistenza delle edizioni).
async function _cancellaTutteLeVoci(collRef, vociEsistenti) {
  const CHUNK = 450;
  for (let i = 0; i < vociEsistenti.length; i += CHUNK) {
    const chunk = vociEsistenti.slice(i, i + CHUNK);
    const batch = db.batch();
    chunk.forEach(v => batch.delete(collRef.doc(v.id)));
    await batch.commit();
  }
}

async function _scriviVociABatch(collRef, voci, banner) {
  const CHUNK = 450;
  let scritte = 0;
  for (let i = 0; i < voci.length; i += CHUNK) {
    const chunk = voci.slice(i, i + CHUNK);
    const batch = db.batch();
    chunk.forEach(v => batch.set(collRef.doc(), v));
    await batch.commit();
    scritte += chunk.length;
    if (banner) banner.innerHTML = `<span>Importazione in corso: ${scritte}/${voci.length} righe scritte...</span>`;
  }
}

// ─── Cache locale (localStorage) per i cataloghi a sola-consultazione ───
// Prezzari e Computo cambiano SOLO quando li importi/modifichi tu, non da
// soli: non serve rileggerli da Firestore ogni volta che li apri (ogni
// riga letta consuma una lettura della quota giornaliera gratuita). La
// prima volta su un dispositivo (o quando premi "Aggiorna") si legge
// davvero da Firestore e si salva qui; le aperture successive leggono da
// qui, a costo zero, finché non modifichi qualcosa (che aggiorna la
// cache in automatico) o premi di nuovo "Aggiorna".
function _chiaveCacheLocale(collName) {
  return `nt_cache_v1_${collName}`;
}

function _leggiCacheLocale(collName) {
  try {
    const raw = localStorage.getItem(_chiaveCacheLocale(collName));
    if (!raw) return null;
    const dati = JSON.parse(raw);
    if (!dati || !Array.isArray(dati.voci)) return null;
    return dati; // { voci, salvatoIl }
  } catch (e) {
    return null;
  }
}

function _scriviCacheLocale(collName, voci) {
  try {
    localStorage.setItem(_chiaveCacheLocale(collName), JSON.stringify({ voci, salvatoIl: Date.now() }));
  } catch (e) {
    // localStorage pieno o non disponibile (es. navigazione privata): non è
    // bloccante, semplicemente non avremo la cache alla prossima apertura.
    console.warn('Impossibile salvare la cache locale (proseguo comunque):', e.message);
  }
}

function _svuotaCacheLocale(collName) {
  try { localStorage.removeItem(_chiaveCacheLocale(collName)); } catch (e) {}
}

function _formattaOraCache(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Frammento HTML da inserire nell'intestazione delle pagine catalogo: mostra
// quando sono stati letti i dati e permette di rileggerli davvero dal
// server con un click esplicito (l'unica lettura reale, il resto è gratis).
function _htmlIndicatoreCache(collName, funzioneAggiornaJs) {
  const cache = _leggiCacheLocale(collName);
  const etichetta = cache ? `Dati locali del ${_formattaOraCache(cache.salvatoIl)}` : 'Dati appena letti dal server';
  return `<span style="font-size:12px;color:#888;display:inline-flex;align-items:center;gap:6px;white-space:nowrap">
    ${etichetta}
    <button class="btn btn-sm" onclick="${funzioneAggiornaJs}">⟳ Aggiorna</button>
  </span>`;
}
