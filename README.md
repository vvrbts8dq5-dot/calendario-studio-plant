# not spannometrica

App web con 4 pagine (Progetti, Computo, Prezzario Regione Veneto, Prezzario
DEI), separate per disciplina (Elettrico / Meccanico) fin dal login: niente
build, niente npm per l'uso quotidiano — solo file HTML/JS che il browser
legge direttamente, Firebase caricato via CDN.

- Dopo il login viene chiesta la **disciplina** (Elettrico o Meccanico): da
  quel momento Computo, i due Prezzari e Progetti lavorano solo sui dati di
  quella disciplina (collezioni Firestore separate, es. `progetti_elettrico`
  / `progetti_meccanico`). Si cambia disciplina in qualsiasi momento dal
  pulsante "Cambia disciplina" in fondo alla sidebar.

- **Computo**, **Prezzario Regione Veneto** e **Prezzario DEI** sono tre
  **magazzini indipendenti**: tre database di voci separati, tutti con lo
  stesso identico comportamento — un catalogo consultabile e cercabile in
  vista ad albero (capitolo > sottocapitolo > voce), popolabile importando
  un file Excel oppure aggiungendo capitoli/voci a mano. Non sono legati a
  nessun progetto e non hanno quantità: sono solo un elenco di voci a
  disposizione. (Computo non ha il prezzo, i due Prezzari sì — sono cataloghi
  di prezziario, non il conteggio di un cantiere specifico.)

  I due Prezzari possono avere decine di migliaia di voci a edizione: per
  questo, a differenza del Computo, le loro voci non sono salvate un
  documento Firestore a voce ma raggruppate in pochi documenti "blocco"
  (vedi § **Come sono salvati i prezzari**, sotto) — altrimenti un solo
  import avrebbe sforato il limite giornaliero gratuito di scritture
  Firestore.

- **Progetti** è l'**unica sezione operativa**. La lista permette di creare
  un progetto (basta il nome) ed eliminarne uno singolarmente. Aprendo un
  progetto si vede una schermata divisa in due:
    - **a sinistra**, l'area di lavoro del progetto: l'elenco (piatto) delle
      voci scelte per quel cantiere, con quantità modificabile e — se la
      voce viene da un prezzario — prezzo e totale calcolato automaticamente;
    - **a destra**, un selettore con tre schede (Computo / Prezzario DEI /
      Prezzario Veneto): si sfoglia o cerca nell'albero del magazzino scelto
      e si preme **"+ Aggiungi"** su una voce per copiarla nell'area di
      lavoro a sinistra (la quantità si imposta lì, non nel magazzino).
      Si possono anche aggiungere voci manuali direttamente nell'area di
      lavoro, senza passare da un magazzino.

Tutti i collaboratori hanno le stesse possibilità (anche importare/aggiornare
i magazzini e creare/eliminare progetti).

---

## 1. Crea il progetto Firebase

1. https://console.firebase.google.com → **Aggiungi progetto** → nome a scelta (es. `computo-app`) → Analytics non serve.
2. **Authentication** → Get started → scheda **Sign-in method** → abilita **Email/Password**.
3. **Authentication** → scheda **Users** → **Add user** → crea un account (email+password) per te e per ogni collega.
4. **Firestore Database** → Create database → regione europea (es. `eur3`) → modalità produzione.
5. **Impostazioni progetto** (ingranaggio) → **Le tue app** → icona `</>` (Web) → registra un'app → **non serve** attivare Hosting da qui adesso.
6. Copia i valori mostrati (`apiKey`, `authDomain`, ecc.).

## 2. Inserisci le chiavi Firebase nel codice

Apri `app_init.js`, cerca il blocco:

```js
const FC = {
  apiKey: "...",
  authDomain: "....firebaseapp.com",
  ...
};
```

e sostituisci ogni valore con quello copiato al punto 1.6. Queste chiavi non sono segrete (sono pubbliche per design in tutte le app Firebase web), quindi non serve nasconderle in un `.env`: possono stare tranquillamente nel file.

## 3. Prova in locale

Basta aprire `index.html` con un server locale qualsiasi (aprirlo come file `file://` direttamente a volte dà problemi). Il più semplice, se hai Python installato:

```bash
cd computo-app
python3 -m http.server 8080
```

poi vai su `http://localhost:8080`. Accedi con uno degli utenti creati al punto 1.3, poi scegli la disciplina (Elettrico o Meccanico).

**Attenzione:** aperta così, l'app parla comunque con il **Firestore vero**
(le chiavi in `app_init.js` puntano sempre al progetto reale) — va benissimo
per usare l'app normalmente. Da quando i Prezzari salvano le voci "a
blocchi" (vedi § **Come sono salvati i prezzari**) anche un import enorme
resta ben lontano dal limite giornaliero gratuito, quindi non serve più
nessuna precauzione particolare nemmeno per provare import grossi. Il
punto 3bis resta comunque utile se preferisci provare modifiche a codice/
struttura dati senza toccare affatto il progetto reale.

## 3bis. Sviluppare/testare senza toccare il progetto reale (Emulator Suite)

Se stai modificando il codice di import/gestione dei magazzini e vuoi
provare senza nessun rischio per i dati veri (anche solo per abitudine, o
per testare più a fondo), l'Emulator Suite di Firebase fa girare un
Firestore/Auth finti sul tuo computer — inclusa gratis in `firebase-tools`
(la stessa CLI del punto 4, quindi se l'hai già installata non serve altro).

`app_init.js` è già predisposto: quando l'app rileva di girare su
`localhost`/`127.0.0.1`, si collega da sola all'emulatore invece che al
progetto reale (compare un banner giallo "EMULATORE LOCALE" in alto per
non fare confusione). Per usarlo:

```bash
cd computo-app
firebase emulators:start
```

La prima volta apri anche la **UI dell'emulatore** su
`http://localhost:4000` → scheda **Authentication** → **Add user** e crea
un utente di prova (email+password a piacere: è un ambiente finto,
separato da quello vero, quindi non serve che coincida con gli utenti
reali). Poi, in un'altra finestra di terminale:

```bash
python3 -m http.server 8080
```

e vai su `http://localhost:8080`: vedrai il banner giallo, e potrai
accedere con l'utente appena creato sull'emulatore. Da qui puoi importare
il prezzario intero, cancellare tutto, riprovare quante volte vuoi — zero
consumo di quota, perché non stai toccando il progetto vero. I dati
dell'emulatore vivono solo in memoria e spariscono quando lo chiudi (a
meno di aggiungere `--export-on-exit=./emulator-data
--import=./emulator-data` al comando `emulators:start`, se vuoi che
sopravvivano da una sessione all'altra).

## 4. Pubblica le regole di sicurezza e il sito

Serve la CLI di Firebase (una tantum):

```bash
npm install -g firebase-tools
firebase login
cd computo-app          # cartella radice, dove c'è firebase.json
firebase use --add      # seleziona il progetto creato al punto 1
firebase deploy         # pubblica sia il sito sia le regole Firestore
```

Da questo momento l'app è online al link che ti mostra il comando (tipo `https://TUOPROGETTO.web.app`).

Per aggiornamenti futuri: modifichi i file nella cartella, poi rilanci semplicemente `firebase deploy`. Nessun build, nessuna dipendenza da installare per l'app in sé.

### Opzionale: collegare GitHub per pubblicare automaticamente a ogni push

Quando lanci `firebase init hosting` (oppure dal pulsante "Set up automatic builds and deploys with GitHub" nella sezione Hosting della Console Firebase), ti verrà chiesto se vuoi collegare un repo GitHub: rispondi di sì, e alla domanda "do you have a build step" rispondi **No** (qui non serve). Firebase crea da solo il workflow GitHub Actions — non serve scriverlo a mano.

## 5. Importa i dati (dal browser, senza terminale)

1. Fai login nell'app, scegli la disciplina.
2. Vai su **Computo** o su uno dei **Prezzari** (sono magazzini indipendenti, non serve aprire un progetto).
3. Clicca **"Importa da Excel"**, seleziona il tuo file.
4. L'app ti mostra quante righe ha trovato e ti chiede se vuoi aggiungerle soltanto o sostituire tutto quello che c'è già, poi importa in automatico.
5. Vai su **Progetti**, crea o apri un progetto, e dal pannello di destra premi **"+ Aggiungi"** sulle voci del magazzino che vuoi usare in quel cantiere.

Il **Computo** riconosce l'export TEKNO (colonne COD.C.M / COD.E.P. / DESIGNAZIONE / MISURE / U.M. / QUANTITA'). I **Prezzari** riconoscono colonne nominate (`codice`, `descrizione`, `um`, `prezzo`, `capitolo`) oppure il formato gerarchico posizionale stile DEI — vedi i commenti in cima a `import_prezzario.js` e `import_computo.js` per i dettagli, e l'oggetto `MAPPE_COLONNE` per aggiungere varianti di intestazione.

I file **PDF** che hai vanno prima convertiti in Excel (manualmente o con un tool di conversione tabelle) prima di poterli importare — l'estrazione automatica di tabelle da PDF è troppo soggetta a errori per dati economici.

## Come sono salvati i prezzari (voci "a blocchi", non un documento a voce)

Il piano gratuito Spark di Firestore concede **20.000 scritture al
giorno**. Un prezzario DEI o Veneto ha spesso decine di migliaia di voci:
se ognuna fosse un documento Firestore a sé — come succedeva nelle prime
versioni di quest'app, e come succede tuttora per il Computo — un solo
import completo avrebbe consumato altrettante scritture, sforando da solo
il limite giornaliero.

Per questo le voci di un'edizione di Prezzario **non** vivono più una per
documento, ma raggruppate in pochi documenti "blocco" (sottocollezione
`blocchi`, fino a 450 voci ciascuno, ben sotto il limite di 1 MB per
documento Firestore): un prezzario da 50mila voci diventa così ~112
documenti invece di 50mila, e un import o una cancellazione completa
consumano ~112 operazioni — anche ripetuti più volte nello stesso giorno,
restano lontanissimi dal tetto gratuito. La modifica di un singolo campo
di una voce già esistente (modalità "✎ Modifica") resta invece economica
come prima: riscrive solo il blocco che contiene quella voce, 1 sola
scrittura.

Tutta questa logica vive in `import_prezzario.js`
(`_salvaBlocchiPrezzario`, `_leggiVociPrezzarioDaServer`,
`_salvaUnBloccoPrezzario`): il resto del codice (vista ad albero, ricerca,
selezione in un progetto) continua a lavorare su un semplice array di voci
in memoria esattamente come prima, senza saperne nulla — il raggruppamento
è solo un dettaglio di come viene scritto/letto da Firestore.

**Dati già esistenti**: se un'edizione ha ancora voci nel vecchio formato
(un documento a voce, sottocollezione `voci`), vengono lette e convertite
automaticamente al nuovo formato al primo accesso dopo l'aggiornamento —
non serve nessuna azione manuale, e i dati vecchi non vengono cancellati
finché non elimini l'intera edizione.

Il magazzino **Computo** non è toccato da questo cambiamento e continua a
usare un documento Firestore per voce: se in futuro dovesse ricapitare lo
stesso problema anche lì (es. import di computi molto grandi), si può
applicare la stessa tecnica.

## 6. Metti il progetto su GitHub

```bash
cd computo-app
git init
git add .
git commit -m "Prima versione"
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/computo-app.git
git push -u origin main
```

(Oppure trascina la cartella nel browser come già fatto, ricordandoti di includere i file nascosti tipo `.gitignore`.)

## Struttura del repo

```
computo-app/
├─ index.html            login + scelta disciplina + shell con le 4 pagine
├─ tree_view.js           helper condivisi (confronto numerico, vista ad albero collassabile)
├─ computo_module.js      magazzino Computo (per-disciplina, vista ad albero, indipendente)
├─ import_computo.js      import Excel (TEKNO) nel magazzino Computo
├─ prezzario_module.js    magazzino prezzari (riutilizzato per Veneto/DEI, vista ad albero)
├─ import_prezzario.js    import Excel dei prezzari + salvataggio "a blocchi" + helper batch condivisi
├─ progetti_module.js     Progetti — sezione operativa, schermo diviso (area di lavoro + selettore magazzino)
├─ app_init.js            config Firebase, login/logout, scelta disciplina, navigazione, modale di scelta
├─ xlsx-style.min.js      libreria per leggere/scrivere Excel (la tua)
├─ firestore.rules        regole di sicurezza (per disciplina)
├─ firebase.json          config Hosting (serve la cartella così com'è, nessun build)
└─ README.md
```

## Prossimi passi possibili

- Modifica inline di descrizione/codice delle voci (oggi si modifica solo eliminando e riaggiungendo)
- Rinumerazione automatica delle voci quando se ne aggiungono/eliminano manualmente
- Gestione inviti collaboratori direttamente dall'interfaccia (per ora si aggiungono via Console Firebase)
- Import dei file PDF, una volta convertiti in Excel
