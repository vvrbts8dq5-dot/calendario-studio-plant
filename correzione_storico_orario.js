// ══════════════════════════════════════════════════════════════════════
// CORREZIONE STORICO ORARIO — corregge l'attribuzione errata delle ore già
// importate su Firestore da importa_storico_orario.js. Stesso pattern del
// banner "📥 Importa storico orario" e "🧹 Rimuovi doppioni": legge da
// dipDataCache (ZERO query Firestore aggiuntive) e appare in Dashboard
// finché la correzione non è stata applicata, poi sparisce da solo.
//
// Corregge:
//  • Marco Sorgato: era tutto sotto "Meccanici M.A." → spostato su "Elettrici M.D."
//    (scambia anche gli straordinari corrispondenti)
//  • Giulia Zoppellaro: era tutto sotto "Meccanici M.A." → spostato su "Attività Generali"
// ══════════════════════════════════════════════════════════════════════

// Elenco correzioni da applicare. Aggiungi altre righe qui se emergono altri
// dipendenti con lo stesso problema: 'swap_elettrico_meccanico' per chi è
// realmente Elettrico ma risulta tutto sotto Meccanici, oppure
// 'sposta_a_generali' per chi le ore non sono né Elettrico né Meccanico ma
// Attività Generali.
const CORREZIONI_STORICO = [
  { cognome:'SORGATO', nome:'MARCO', azione:'swap_elettrico_meccanico' },
  { cognome:'ZOPPELLARO', nome:'GIULIA', azione:'sposta_a_generali' },
];

function _corrNorm(s){
  return (s||'').toString().toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^A-Z ]/g,' ').replace(/\s+/g,' ').trim();
}
function _corrTrovaUsername(cognome,nome){
  const c=_corrNorm(cognome), n=_corrNorm(nome);
  return (dipList||[]).filter(e=>{
    const full=_corrNorm((e.nome||'')+' '+(e.cognome||''));
    return full.includes(c) && full.includes(n);
  });
}

// Una correzione (swap o sposta_a_generali) è considerata "già applicata" per
// un dipendente quando non ha più alcuna ora residua in Meccanici M.A. —
// in entrambi i casi la correzione azzera quel campo.
function _corrGiaApplicataPer(username){
  const days=(dipDataCache[username]&&dipDataCache[username].days)||{};
  return !Object.values(days).some(d=>(parseFloat(d.oreMeccaniciMA)||0)>0);
}

async function correggiStoricoOrario(){
  if(!dipList.length){ await loadDashboard(); }

  // 1) risolvi ogni voce a uno username reale
  const risolti=[]; const problemi=[];
  CORREZIONI_STORICO.forEach(c=>{
    const match=_corrTrovaUsername(c.cognome,c.nome);
    if(match.length===1) risolti.push({...c, username:match[0].username, nomeCompleto:`${match[0].nome||''} ${match[0].cognome||''}`.trim()});
    else problemi.push({...c, match});
  });
  if(problemi.length){
    let msg='Attenzione, alcune correzioni non sono state abbinate a un dipendente univoco:\n\n';
    problemi.forEach(p=>msg+=`- ${p.nome} ${p.cognome}: ${p.match.length===0?'NON TROVATO':'AMBIGUO ('+p.match.map(m=>m.username).join(', ')+')'}\n`);
    msg+='\nQuesti verranno SALTATI. Vuoi continuare comunque con gli altri ('+risolti.length+' corrette)?';
    if(!confirm(msg)) return;
  }
  if(!risolti.length){ alert('Nessun dipendente da correggere trovato.'); return; }

  const riepilogo=risolti.map(r=>`  • ${r.nomeCompleto} (${r.username}): ${r.azione==='swap_elettrico_meccanico'?'Meccanici → Elettrici (+ straordinari)':'Meccanici → Attività Generali'}`).join('\n');
  if(!confirm(`Correzione storico orario ${ANNO}-${ANNO+1}\n\n${riepilogo}\n\nQuesta operazione MODIFICA i documenti già presenti su Firestore in timesheets/${ANNO} e timesheets/${ANNO+1} (dipendenti/{username}/giorni/*). Confermi la scrittura?`)) return;

  const wrap=document.getElementById('correzione-storico-wrap');
  if(wrap)wrap.innerHTML='<div class="empty-state">Correzione in corso, non chiudere la pagina...</div>';

  // 2) per ogni dipendente, leggi tutti i giorni e prepara le correzioni.
  // IMPORTANTE: la dashboard/calendario mostrano una finestra mobile di 12 mesi
  // che copre sia timesheets/{ANNO} sia timesheets/{ANNO+1} (vedi loadDashboard()),
  // quindi la correzione deve scrivere su ENTRAMBI gli anni, altrimenti i giorni
  // che ricadono nel documento ANNO+1 restano sbagliati anche dopo la "correzione".
  let totCorretti=0;
  for(const r of risolti){
    for(const annoDoc of [ANNO, ANNO+1]){
      const giorniRef=db.collection('timesheets').doc(String(annoDoc)).collection('dipendenti').doc(r.username).collection('giorni');
      const snap=await giorniRef.get();
      const batchOps=[];
      snap.forEach(doc=>{
        const d=doc.data();
        let cambia=false, upd={};
        if(r.azione==='swap_elettrico_meccanico'){
          const oldE=parseFloat(d.oreElectriciMD)||0, oldM=parseFloat(d.oreMeccaniciMA)||0;
          const oldSE=parseFloat(d.oreStraordinariElettrico)||0, oldSM=parseFloat(d.oreStraordinariMeccanico)||0;
          // Applica lo scambio SOLO se c'è ancora qualcosa da spostare via da Meccanici
          // (oldM>0). Senza questo controllo, rilanciando la correzione una seconda
          // volta su un giorno già corretto (oldM già a 0), lo scambio si applicherebbe
          // di nuovo alla rovescia, ripristinando l'errore invece di lasciarlo com'è.
          if(oldM>0&&(oldE!==oldM||oldSE!==oldSM)){
            upd={oreElectriciMD:oldE+oldM, oreMeccaniciMA:0, oreStraordinariElettrico:oldSE+oldSM, oreStraordinariMeccanico:0};
            cambia=true;
          }
        }else if(r.azione==='sposta_a_generali'){
          const oldM=parseFloat(d.oreMeccaniciMA)||0, oldG=parseFloat(d.oreAttivitaGenerali)||0;
          if(oldM>0){
            upd={oreAttivitaGenerali:oldG+oldM, oreMeccaniciMA:0};
            cambia=true;
          }
        }
        if(cambia){ batchOps.push({ref:doc.ref,data:upd}); }
      });
      // 3) scrivi a batch da 450
      for(let i=0;i<batchOps.length;i+=450){
        const batch=db.batch();
        batchOps.slice(i,i+450).forEach(op=>batch.update(op.ref,op.data));
        await batch.commit();
      }
      totCorretti+=batchOps.length;
      console.log(`Corretti ${batchOps.length} giorni (anno ${annoDoc}) per ${r.nomeCompleto}`);
    }
  }

  alert(`✓ Correzione completata.\n\n${totCorretti} giorni aggiornati su Firestore.`);
  console.log('Correzione storico orario completata:',totCorretti,'giorni.');
  if(wrap)wrap.innerHTML='';
  // loadDashboard() ricarica dipDataCache da Firestore con i valori corretti,
  // così il banner rileva subito che non c'è più nulla da correggere.
  try{ await loadDashboard(); }catch(e){}
  try{ if(typeof loadRichieste==='function') loadRichieste(); }catch(e){}
  try{ if(typeof renderCorrezioneStoricoBanner==='function') renderCorrezioneStoricoBanner(); }catch(e){}
}

// ══════════════════════════════════════════════════════════════════════
// Banner "una tantum" in Dashboard — stesso identico pattern (e stessa fonte
// dati, dipDataCache già caricata da loadDashboard) del banner
// "📥 Importa storico orario" e "🧹 Rimuovi doppioni". Nessuna query
// Firestore aggiuntiva, nessuna nuova collection: legge solo i dati già in
// memoria, quindi funziona con le regole di sicurezza esistenti.
// ══════════════════════════════════════════════════════════════════════
function renderCorrezioneStoricoBanner(){
  const wrap=document.getElementById('correzione-storico-wrap');
  if(!wrap)return;
  if(!dipList.length){wrap.innerHTML='';return}
  const daFare=CORREZIONI_STORICO.filter(c=>{
    const match=_corrTrovaUsername(c.cognome,c.nome);
    if(match.length!==1)return false; // non trovato/ambiguo: non lo segnaliamo
    return !_corrGiaApplicataPer(match[0].username);
  });
  if(!daFare.length){wrap.innerHTML='';return}
  const elenco=daFare.map(c=>`${c.nome} ${c.cognome}`).join(', ');
  wrap.innerHTML=`<div class="contab-import-banner">
    <div class="contab-import-banner-txt">🛠️ Rilevata attribuzione errata nello storico orario importato (ore finite nel reparto sbagliato) per: ${elenco}. Puoi correggerla in un colpo solo.</div>
    <button class="btn btn-blu btn-sm" onclick="correggiStoricoOrario()">🛠️ Correggi storico orario</button>
  </div>`;
}
