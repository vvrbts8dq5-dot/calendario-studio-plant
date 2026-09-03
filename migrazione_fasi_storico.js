// ══════════════════════════════════════════════════════════════════════
// MIGRAZIONE FASI + IMPORT STORICO 249 COMMESSE — banner Rubrica Commesse,
// stesso pattern "una tantum" di correzione_nomi_commesse.js / correzione_storico_orario.js.
//
// Fa DUE cose, in un'unica operazione (bottone unico, un'unica anteprima):
//
// 1) Converte ogni commessa che non ha ancora il campo "fasi" (array) alla
//    nuova struttura a fasi: i vecchi campi piatti (tariffaSenior,
//    tariffaJunior, tariffaKm, monteOreEle, monteOreMec, listinoStampe)
//    diventano la prima fase "fase1" dentro l'array "fasi", e vengono
//    rimossi dal documento (restano solo dentro fasi[0]). Le righe/stampe
//    già registrate in commesse/{numero}/righe e /stampe vengono taggate
//    con faseId:'fase1' (nessun dato spostato, solo un campo aggiunto).
//
//    ECCEZIONE: le 4 commesse che risultano avere DUE Budget Contract
//    diversi tra i 249 file storici (23004, 24058, 25084, 25086) vengono
//    convertite con DUE fasi fin da subito, con il nome fase preso
//    dall'etichetta del file Excel (es. "Preliminare", "Esecutivo"...).
//    La fase2 nuova riceve le stesse tariffe della fase1 esistente (unico
//    dato disponibile in Firestore) ma monte ore a 0: da verificare a mano
//    da Giovanni in Budget Contract → Modifica dati.
//
// 2) Aggiunge, per ogni commessa/fase, una riga "storico importato" con i
//    totali ore per disciplina (Senior/Junior × Ele/Mec) ricavati dai 249
//    file Excel storici (vedi storico_budget_import_data.js). Le ore del
//    "formato vecchio" di Excel (senza distinzione Ele/Mec/Senior/Junior)
//    vengono importate come riga separata con nonClassificato:true: sono
//    visibili nel dettaglio commessa ma escluse dai calcoli di monte ore e
//    costo manodopera (vedi bcCalcRiepilogo in admin.html/dipendenti.html).
//    Km e spese vive storici finiscono su una di queste righe (mai
//    duplicati). ID deterministici (storico_NUMERO_FASE_...): rilanciare
//    lo strumento è sicuro, sovrascrive senza creare doppioni.
//
// NON tocca: righe/stampe già inserite a mano da qualcuno (restano dove
// sono, solo taggate con faseId), note, progetto, committente, anno.
// ══════════════════════════════════════════════════════════════════════

// Le uniche 4 commesse (su 249 file) con due Budget Contract distinti.
// Etichette = testo dopo "BUDGET CONTRACT" nel nome del file Excel,
// nello stesso ordine in cui compaiono in STORICO_BUDGET_IMPORT.
const MIGR_FASI_LABELS = {
  '23004': ['AS BUILT APT', 'ESECUTIVO GENERALE'],
  '24058': ['DM+DEF+ESEC', 'VARIANTE OTT 2025'],
  '25084': ['DEFINITIVO', 'VARIANTE'],
  '25086': ['ESECUTIVO', 'PRELIMINARE']
};

// Calcola l'intero piano di migrazione, senza scrivere nulla: funzione
// pura, usata sia per il banner riassuntivo sia per l'anteprima dettagliata.
function migrCalcolaPiano(){
  const commesse=(typeof BC_commesse!=='undefined')?BC_commesse:[];
  const dataset=(typeof STORICO_BUDGET_IMPORT!=='undefined')?STORICO_BUDGET_IMPORT:[];
  const listinoDefault=(typeof BC_DEFAULT_LISTINO!=='undefined')?BC_DEFAULT_LISTINO:[];
  const numeriMap={};
  commesse.forEach(c=>{numeriMap[c.numero]=c});

  // 1) Piano conversione a fasi (solo commesse senza ancora il campo fasi)
  const commesseDaMigrare=[]; // {numero, fasi:[...], multifase}
  commesse.forEach(c=>{
    if(Array.isArray(c.fasi)&&c.fasi.length)return; // già migrata, salta
    const numero=c.numero;
    const flat={
      tariffaSenior:parseFloat(c.tariffaSenior)||0,
      tariffaJunior:parseFloat(c.tariffaJunior)||0,
      tariffaKm:parseFloat(c.tariffaKm)||0,
      monteOreEle:parseFloat(c.monteOreEle)||0,
      monteOreMec:parseFloat(c.monteOreMec)||0,
      listinoStampe:c.listinoStampe||JSON.parse(JSON.stringify(listinoDefault))
    };
    const labels=MIGR_FASI_LABELS[numero];
    let fasi;
    if(labels){
      fasi=[
        {id:'fase1',nome:labels[0],tariffaSenior:flat.tariffaSenior,tariffaJunior:flat.tariffaJunior,tariffaKm:flat.tariffaKm,
          monteOreEle:flat.monteOreEle,monteOreMec:flat.monteOreMec,listinoStampe:flat.listinoStampe},
        {id:'fase2',nome:labels[1],tariffaSenior:flat.tariffaSenior,tariffaJunior:flat.tariffaJunior,tariffaKm:flat.tariffaKm,
          monteOreEle:0,monteOreMec:0,listinoStampe:JSON.parse(JSON.stringify(flat.listinoStampe))}
      ];
    }else{
      fasi=[{id:'fase1',nome:'Generale',...flat}];
    }
    commesseDaMigrare.push({numero,fasi,multifase:!!labels});
  });

  // 2) Piano righe storiche (indipendente dal punto 1: funziona anche se
  // la commessa ha già le fasi da una migrazione precedente)
  const storicoDocs=[]; // {numero,id,data}
  const storicoSenzaCommessa=[]; // entry del dataset senza commessa corrispondente
  dataset.forEach(entry=>{
    const numero=entry.numero;
    const c=numeriMap[numero];
    if(!c){storicoSenzaCommessa.push(entry);return}
    let faseId='fase1';
    const labels=MIGR_FASI_LABELS[numero];
    if(labels){
      const idx=labels.findIndex(l=>l.trim().toUpperCase()===String(entry.fase||'').trim().toUpperCase());
      faseId=idx===1?'fase2':'fase1';
    }
    const baseId='storico_'+numero+'_'+faseId;
    const descr='Storico importato ('+(entry.fileOrigine||'')+')';
    const dataRiga=(c.anno||2024)+'-01-01';
    const common={username:'storico',nomeCompleto:'Storico importato',tipoPersona:'storico',
      data:dataRiga,faseId,origineStorico:true,
      createdBy:'import-storico-249',createdAt:new Date().toISOString()};
    const buckets=[
      {suffix:'sr_ele',livello:'senior',disciplina:'ele',ore:entry.oreSeniorEle},
      {suffix:'sr_mec',livello:'senior',disciplina:'mec',ore:entry.oreSeniorMec},
      {suffix:'jr_ele',livello:'junior',disciplina:'ele',ore:entry.oreJuniorEle},
      {suffix:'jr_mec',livello:'junior',disciplina:'mec',ore:entry.oreJuniorMec}
    ];
    let primaRiga=true;
    buckets.forEach(b=>{
      const ore=parseFloat(b.ore)||0;
      if(ore<=0)return;
      const data={...common,livello:b.livello,disciplina:b.disciplina,ore,descrizione:descr,speseVive:0,km:0};
      if(primaRiga){data.speseVive=parseFloat(entry.speseVive)||0;data.km=parseFloat(entry.km)||0;primaRiga=false}
      storicoDocs.push({numero,id:baseId+'_'+b.suffix,data});
    });
    const nc=parseFloat(entry.oreNonClassificate)||0;
    if(nc>0){
      const data={...common,livello:'senior',disciplina:'ele',ore:nc,nonClassificato:true,
        descrizione:descr+' — ore non classificate (vecchio formato Excel)',speseVive:0,km:0};
      if(primaRiga){data.speseVive=parseFloat(entry.speseVive)||0;data.km=parseFloat(entry.km)||0;primaRiga=false}
      storicoDocs.push({numero,id:baseId+'_nc',data});
    }
    if(primaRiga&&((parseFloat(entry.km)||0)>0||(parseFloat(entry.speseVive)||0)>0)){
      const data={...common,livello:'senior',disciplina:'ele',ore:0,descrizione:descr+' — trasferta',
        speseVive:parseFloat(entry.speseVive)||0,km:parseFloat(entry.km)||0};
      storicoDocs.push({numero,id:baseId+'_tr',data});
    }
  });

  return {commesseDaMigrare,storicoDocs,storicoSenzaCommessa};
}

// ── Banner "una tantum" nella pagina Rubrica Commesse ──────────────────
function renderMigrFasiStoricoBanner(){
  const wrap=document.getElementById('migr-fasi-storico-wrap');
  if(!wrap)return;
  if(typeof BC_commesseLoaded==='undefined'||!BC_commesseLoaded||!BC_commesse||!BC_commesse.length){wrap.innerHTML='';return}
  if(typeof STORICO_BUDGET_IMPORT==='undefined'){wrap.innerHTML='';return}
  const {commesseDaMigrare,storicoDocs,storicoSenzaCommessa}=migrCalcolaPiano();
  if(!commesseDaMigrare.length&&!storicoDocs.length){wrap.innerHTML='';return}
  const multifase=commesseDaMigrare.filter(x=>x.multifase).length;
  wrap.innerHTML=`<div class="contab-import-banner">
    <div class="contab-import-banner-txt">🗂️ Migrazione a fasi + storico 249 commesse — ${commesseDaMigrare.length} commesse da convertire alla struttura a fasi${multifase?(' ('+multifase+' con 2 fasi)'):''}, ${storicoDocs.length} righe di storico da importare${storicoSenzaCommessa.length?(', <b style="color:var(--rosso, #c0392b)">'+storicoSenzaCommessa.length+' file senza commessa corrispondente</b>'):''}.</div>
    <button class="btn btn-blu btn-sm" onclick="migrApriAnteprima()">🔍 Anteprima e migrazione</button>
  </div>`;
}

// ── Anteprima dettagliata (nessuna scrittura) ───────────────────────────
function migrApriAnteprima(){
  const {commesseDaMigrare,storicoDocs,storicoSenzaCommessa}=migrCalcolaPiano();
  const wrap=document.getElementById('migr-fasi-storico-wrap');
  if(!wrap)return;
  const esc=s=>String(s==null?'':s).replace(/</g,'&lt;');

  const rigaMigr=commesseDaMigrare.map(x=>`
    <tr>
      <td style="padding:5px 8px;white-space:nowrap">${esc(x.numero)}</td>
      <td style="padding:5px 8px;white-space:nowrap">${x.multifase?'2 fasi':'1 fase (Generale)'}</td>
      <td style="padding:5px 8px">${x.fasi.map(f=>esc(f.nome)).join(' · ')}</td>
    </tr>`).join('');

  const storicoPerCommessa={};
  storicoDocs.forEach(d=>{
    const k=d.numero+'::'+d.data.faseId;
    if(!storicoPerCommessa[k])storicoPerCommessa[k]={numero:d.numero,faseId:d.data.faseId,ore:0,km:0,spese:0,nc:0};
    storicoPerCommessa[k].ore+=(d.data.nonClassificato?0:(parseFloat(d.data.ore)||0));
    storicoPerCommessa[k].nc+=(d.data.nonClassificato?(parseFloat(d.data.ore)||0):0);
    storicoPerCommessa[k].km+=parseFloat(d.data.km)||0;
    storicoPerCommessa[k].spese+=parseFloat(d.data.speseVive)||0;
  });
  const rigaStorico=Object.values(storicoPerCommessa).sort((a,b)=>String(a.numero).localeCompare(String(b.numero),undefined,{numeric:true})).map(x=>`
    <tr>
      <td style="padding:5px 8px;white-space:nowrap">${esc(x.numero)}</td>
      <td style="padding:5px 8px;white-space:nowrap">${esc(x.faseId)}</td>
      <td style="padding:5px 8px;text-align:right">${x.ore?x.ore.toFixed(1)+'h':'—'}</td>
      <td style="padding:5px 8px;text-align:right">${x.nc?x.nc.toFixed(1)+'h':'—'}</td>
      <td style="padding:5px 8px;text-align:right">${x.km?x.km.toFixed(0)+' km':'—'}</td>
      <td style="padding:5px 8px;text-align:right">${x.spese?'€ '+x.spese.toFixed(2):'—'}</td>
    </tr>`).join('');

  const rigaMancanti=storicoSenzaCommessa.map(x=>`
    <tr><td style="padding:5px 8px;white-space:nowrap">${esc(x.numero)}</td><td style="padding:5px 8px">${esc(x.fase)}</td><td style="padding:5px 8px">${esc(x.fileOrigine)}</td></tr>`).join('');

  wrap.innerHTML=`<div class="contab-import-banner" style="flex-direction:column;align-items:stretch;gap:10px">
    <div class="contab-import-banner-txt">🗂️ Anteprima migrazione a fasi + storico — <b>${commesseDaMigrare.length}</b> commesse da convertire, <b>${storicoDocs.length}</b> righe di storico da scrivere. Nessuna scrittura è ancora stata effettuata: controlla con calma, poi conferma in fondo.</div>

    ${commesseDaMigrare.length?`<div>
      <div style="font-weight:700;font-size:12px;margin-bottom:4px">Conversione a fasi (${commesseDaMigrare.length})</div>
      <div style="max-height:220px;overflow:auto;border:1px solid var(--border);border-radius:8px">
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <thead style="position:sticky;top:0;background:#f4f4f4"><tr>
            <th style="text-align:left;padding:6px 8px">Numero</th><th style="text-align:left;padding:6px 8px">Fasi</th><th style="text-align:left;padding:6px 8px">Nomi fase</th>
          </tr></thead>
          <tbody>${rigaMigr}</tbody>
        </table>
      </div>
    </div>`:''}

    ${rigaStorico.length?`<div>
      <div style="font-weight:700;font-size:12px;margin-bottom:4px">Righe storico da importare, per commessa/fase (${Object.keys(storicoPerCommessa).length})</div>
      <div style="max-height:280px;overflow:auto;border:1px solid var(--border);border-radius:8px">
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <thead style="position:sticky;top:0;background:#f4f4f4"><tr>
            <th style="text-align:left;padding:6px 8px">Numero</th><th style="text-align:left;padding:6px 8px">Fase</th>
            <th style="text-align:right;padding:6px 8px">Ore classificate</th><th style="text-align:right;padding:6px 8px">Ore non classif.</th>
            <th style="text-align:right;padding:6px 8px">Km</th><th style="text-align:right;padding:6px 8px">Spese</th>
          </tr></thead>
          <tbody>${rigaStorico}</tbody>
        </table>
      </div>
    </div>`:''}

    ${rigaMancanti.length?`<div>
      <div style="font-weight:700;font-size:12px;margin-bottom:4px;color:#c0392b">⚠️ File senza commessa corrispondente in Firestore (${storicoSenzaCommessa.length}) — non verranno importati</div>
      <div style="max-height:160px;overflow:auto;border:1px solid var(--border);border-radius:8px">
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <thead style="position:sticky;top:0;background:#f4f4f4"><tr><th style="text-align:left;padding:6px 8px">Numero</th><th style="text-align:left;padding:6px 8px">Fase</th><th style="text-align:left;padding:6px 8px">File</th></tr></thead>
          <tbody>${rigaMancanti}</tbody>
        </table>
      </div>
    </div>`:''}

    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn btn-sm" onclick="renderMigrFasiStoricoBanner()">Annulla</button>
      <button class="btn btn-ink btn-sm" onclick="migrEseguiMigrazione()">✅ Conferma e scrivi su Firestore</button>
    </div>
  </div>`;
}

// ── Scrittura effettiva (solo dopo conferma esplicita) ──────────────────
async function migrEseguiMigrazione(){
  const {commesseDaMigrare,storicoDocs,storicoSenzaCommessa}=migrCalcolaPiano();
  if(!commesseDaMigrare.length&&!storicoDocs.length){alert('Niente da migrare.');return}

  const msg=`Stai per scrivere su Firestore:\n\n`+
    `• ${commesseDaMigrare.length} commesse convertite alla struttura a fasi (le righe/stampe già presenti restano dove sono, solo taggate con la fase)\n`+
    `• ${storicoDocs.length} righe di storico importate dai 249 file Excel\n`+
    (storicoSenzaCommessa.length?`• ${storicoSenzaCommessa.length} file storici SALTATI perché non trovano una commessa corrispondente\n`:'')+
    `\nL'operazione può richiedere qualche minuto (si leggono/scrivono le righe già registrate di ogni commessa). Confermi?`;
  if(!confirm(msg))return;

  const wrap=document.getElementById('migr-fasi-storico-wrap');
  const setProgress=(txt)=>{if(wrap)wrap.innerHTML='<div class="empty-state">'+txt+'</div>'};
  setProgress('Migrazione in corso, non chiudere la pagina... (0/'+commesseDaMigrare.length+' commesse)');

  // 1) Conversione a fasi + tag faseId sulle righe/stampe già esistenti
  let fatte=0;
  for(const item of commesseDaMigrare){
    try{
      await db.collection('commesse').doc(item.numero).update({
        fasi:item.fasi,
        tariffaSenior:firebase.firestore.FieldValue.delete(),
        tariffaJunior:firebase.firestore.FieldValue.delete(),
        tariffaKm:firebase.firestore.FieldValue.delete(),
        monteOreEle:firebase.firestore.FieldValue.delete(),
        monteOreMec:firebase.firestore.FieldValue.delete(),
        listinoStampe:firebase.firestore.FieldValue.delete()
      });
      const [righeSnap,stampeSnap]=await Promise.all([
        db.collection('commesse').doc(item.numero).collection('righe').get(),
        db.collection('commesse').doc(item.numero).collection('stampe').get()
      ]);
      const batch=db.batch();
      let nBatch=0;
      righeSnap.docs.forEach(d=>{if(!d.data().faseId){batch.update(d.ref,{faseId:'fase1'});nBatch++}});
      stampeSnap.docs.forEach(d=>{if(!d.data().faseId){batch.update(d.ref,{faseId:'fase1'});nBatch++}});
      if(nBatch)await batch.commit();
    }catch(e){console.log('Migrazione fasi, errore su commessa '+item.numero+':',e.message)}
    fatte++;
    if(fatte%5===0||fatte===commesseDaMigrare.length)setProgress('Migrazione in corso, non chiudere la pagina... ('+fatte+'/'+commesseDaMigrare.length+' commesse)');
  }

  // 2) Scrittura righe storico (batch da 450)
  setProgress('Scrittura righe storico in corso...');
  for(let i=0;i<storicoDocs.length;i+=450){
    const chunk=storicoDocs.slice(i,i+450);
    const batch=db.batch();
    chunk.forEach(doc=>{
      const ref=db.collection('commesse').doc(doc.numero).collection('righe').doc(doc.id);
      batch.set(ref,doc.data,{merge:true});
    });
    await batch.commit();
  }

  alert(`✓ Migrazione completata.\n\n${commesseDaMigrare.length} commesse convertite a fasi, ${storicoDocs.length} righe di storico importate.`+
    (storicoSenzaCommessa.length?`\n\n⚠️ ${storicoSenzaCommessa.length} file storici saltati (nessuna commessa corrispondente in Firestore) — vedi l'anteprima per l'elenco.`:''));
  await loadCommesse(true);
  try{if(typeof renderRubrica==='function')renderRubrica();}catch(e){}
  try{renderMigrFasiStoricoBanner();}catch(e){}
}
