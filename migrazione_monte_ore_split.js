// ══════════════════════════════════════════════════════════════════════
// MIGRAZIONE MONTE ORE SENIOR/JUNIOR — banner Rubrica Commesse, stesso
// pattern "una tantum" di migrazione_fasi_storico.js / correzione_nomi_commesse.js.
//
// Ogni fase aveva finora UN solo "Monte Ore Elettrico" e UN solo "Monte Ore
// Meccanico" (monteOreEle / monteOreMec). Da oggi diventano 4 campi separati:
// monteOreEleSenior, monteOreEleJunior, monteOreMecSenior, monteOreMecJunior
// — così il budget di ore preventivate resta sempre diviso per livello,
// come le ore effettivamente lavorate lo sono già (bcCalcRiepilogo).
//
// Fonte dei valori:
// - Per 116 fasi (su 1549), i 249 file Excel storici contengono una tabella
//   "NUMERO DI ORE PREVENTIVATE IN OFFERTA" già divisa Senior/Junior × Ele/Mec
//   (solo nel formato Excel più recente). Questi valori sono in
//   monte_ore_preventivato_data.js e vengono applicati esattamente.
//   Verificato: per queste 116 fasi il valore Firestore attuale (monteOreEle +
//   monteOreMec) o coincide già con la somma Excel, o è a zero — zero conflitti.
// - Per tutte le altre fasi (Excel vecchio formato senza quella tabella, o
//   commessa non tra le 249): non esiste una fonte per dividere Senior/Junior,
//   quindi il valore singolo esistente (se c'è) va tutto su "Senior" e
//   "Junior" parte da 0 — Giovanni potrà correggere a mano da Budget Contract
//   → Modifica dati. Nella pratica oggi queste fasi sono già a 0/0.
//
// Rilanciare lo strumento è sicuro: una fase già con i 4 campi nuovi viene
// saltata (non sovrascrive mai un valore già impostato/corretto a mano).
// ══════════════════════════════════════════════════════════════════════

function migrMonteCalcolaPiano(){
  const daAggiornare=[];
  if(typeof BC_commesse==='undefined'||!BC_commesse)return{daAggiornare,daExcel:0,daDefault:0};
  const mappaExcel={};
  if(typeof MONTE_ORE_PREVENTIVATO_DATA!=='undefined'){
    MONTE_ORE_PREVENTIVATO_DATA.forEach(x=>{mappaExcel[x.numero+'::'+x.faseId]=x});
  }
  let daExcel=0,daDefault=0;
  BC_commesse.forEach(c=>{
    const fasi=bcFasi(c);
    let cambiate=false;
    const nuoveFasi=fasi.map(f=>{
      const giaMigrata=(f.monteOreEleSenior!==undefined||f.monteOreEleJunior!==undefined||f.monteOreMecSenior!==undefined||f.monteOreMecJunior!==undefined);
      if(giaMigrata)return f;
      cambiate=true;
      const match=mappaExcel[c.numero+'::'+f.id];
      const upd={...f};
      delete upd.monteOreEle;delete upd.monteOreMec;
      if(match){
        daExcel++;
        upd.monteOreEleSenior=match.monteOreEleSenior||0;
        upd.monteOreEleJunior=match.monteOreEleJunior||0;
        upd.monteOreMecSenior=match.monteOreMecSenior||0;
        upd.monteOreMecJunior=match.monteOreMecJunior||0;
        upd._fonteMonteOre='excel';
      }else{
        daDefault++;
        upd.monteOreEleSenior=parseFloat(f.monteOreEle)||0;
        upd.monteOreEleJunior=0;
        upd.monteOreMecSenior=parseFloat(f.monteOreMec)||0;
        upd.monteOreMecJunior=0;
      }
      return upd;
    });
    if(cambiate)daAggiornare.push({numero:c.numero,fasi:nuoveFasi});
  });
  return{daAggiornare,daExcel,daDefault};
}

function renderMigrMonteOreBanner(){
  const wrap=document.getElementById('migr-monte-ore-wrap');
  if(!wrap)return;
  if(typeof BC_commesseLoaded==='undefined'||!BC_commesseLoaded||!BC_commesse||!BC_commesse.length){wrap.innerHTML='';return}
  const {daAggiornare,daExcel,daDefault}=migrMonteCalcolaPiano();
  if(!daAggiornare.length){wrap.innerHTML='';return}
  wrap.innerHTML=`<div class="contab-import-banner">
    <div class="contab-import-banner-txt">🔀 Split Monte Ore Senior/Junior — ${daAggiornare.length} commesse da aggiornare (${daExcel} fasi con valori esatti dai file Excel, ${daDefault} fasi senza dato disponibile: valore attuale spostato su Senior, Junior a 0).</div>
    <button class="btn btn-blu btn-sm" onclick="migrMonteApriAnteprima()">🔍 Anteprima e migrazione</button>
  </div>`;
}

function migrMonteApriAnteprima(){
  const {daAggiornare,daExcel,daDefault}=migrMonteCalcolaPiano();
  const wrap=document.getElementById('migr-monte-ore-wrap');
  if(!wrap)return;
  const esc=s=>String(s==null?'':s).replace(/</g,'&lt;');

  // Mostriamo solo le righe con dato da Excel (le più interessanti da verificare);
  // quelle di default (già 0/0 oggi) sono solo contate, per non appesantire la tabella.
  const righeEsempio=[];
  daAggiornare.forEach(item=>{
    item.fasi.forEach(f=>{
      if(f._fonteMonteOre==='excel'){
        righeEsempio.push({numero:item.numero,fase:f.nome||f.id,ele:( (f.monteOreEleSenior||0)+(f.monteOreEleJunior||0) ),mec:( (f.monteOreMecSenior||0)+(f.monteOreMecJunior||0) ),eleSr:f.monteOreEleSenior||0,eleJr:f.monteOreEleJunior||0,mecSr:f.monteOreMecSenior||0,mecJr:f.monteOreMecJunior||0});
      }
    });
  });
  const rigaExcel=righeEsempio.sort((a,b)=>String(a.numero).localeCompare(String(b.numero),undefined,{numeric:true})).map(x=>`
    <tr>
      <td style="padding:5px 8px;white-space:nowrap">${esc(x.numero)}</td>
      <td style="padding:5px 8px">${esc(x.fase)}</td>
      <td style="padding:5px 8px;text-align:right">${x.eleSr}h</td>
      <td style="padding:5px 8px;text-align:right">${x.eleJr}h</td>
      <td style="padding:5px 8px;text-align:right">${x.mecSr}h</td>
      <td style="padding:5px 8px;text-align:right">${x.mecJr}h</td>
    </tr>`).join('');

  wrap.innerHTML=`<div class="contab-import-banner" style="flex-direction:column;align-items:stretch;gap:10px">
    <div class="contab-import-banner-txt">🔀 Anteprima split Monte Ore — <b>${daAggiornare.length}</b> commesse da aggiornare in totale. <b>${daExcel}</b> fasi con valori esatti trovati nei file Excel (tabella sotto), <b>${daDefault}</b> fasi senza dato disponibile nei file storici (il valore singolo attuale, se c'è, va tutto su Senior — oggi sono comunque quasi tutte a 0/0h). Nessuna scrittura è ancora stata effettuata: controlla con calma, poi conferma in fondo.</div>

    ${rigaExcel.length?`<div>
      <div style="font-weight:700;font-size:12px;margin-bottom:4px">Valori trovati nei file Excel (${rigaExcel.length} fasi)</div>
      <div style="max-height:280px;overflow:auto;border:1px solid var(--border);border-radius:8px">
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <thead style="position:sticky;top:0;background:#f4f4f4"><tr>
            <th style="text-align:left;padding:6px 8px">Numero</th><th style="text-align:left;padding:6px 8px">Fase</th>
            <th style="text-align:right;padding:6px 8px">Ele Senior</th><th style="text-align:right;padding:6px 8px">Ele Junior</th>
            <th style="text-align:right;padding:6px 8px">Mec Senior</th><th style="text-align:right;padding:6px 8px">Mec Junior</th>
          </tr></thead>
          <tbody>${rigaExcel}</tbody>
        </table>
      </div>
    </div>`:''}

    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn btn-sm" onclick="renderMigrMonteOreBanner()">Annulla</button>
      <button class="btn btn-ink btn-sm" onclick="migrMonteEseguiMigrazione()">✅ Conferma e scrivi su Firestore</button>
    </div>
  </div>`;
}

async function migrMonteEseguiMigrazione(){
  const {daAggiornare,daExcel,daDefault}=migrMonteCalcolaPiano();
  if(!daAggiornare.length){alert('Niente da migrare.');return}
  const msg=`Stai per scrivere su Firestore:\n\n`+
    `• ${daAggiornare.length} commesse aggiornate con i 4 campi Monte Ore Senior/Junior\n`+
    `• ${daExcel} fasi con valori esatti dai file Excel\n`+
    `• ${daDefault} fasi senza dato disponibile (valore attuale spostato su Senior, Junior a 0)\n\n`+
    `Confermi?`;
  if(!confirm(msg))return;
  const wrap=document.getElementById('migr-monte-ore-wrap');
  const setProgress=(txt)=>{if(wrap)wrap.innerHTML='<div class="empty-state">'+txt+'</div>'};
  setProgress('Scrittura in corso, non chiudere la pagina...');
  // Le fasi già migrate (giaMigrata) restano invariate: qui riscriviamo per intero
  // il campo "fasi" pulendo _fonteMonteOre (metadato solo per l'anteprima).
  for(let i=0;i<daAggiornare.length;i+=450){
    const chunk=daAggiornare.slice(i,i+450);
    const batch=db.batch();
    chunk.forEach(item=>{
      const fasiPulite=item.fasi.map(f=>{const x={...f};delete x._fonteMonteOre;return x});
      batch.set(db.collection('commesse').doc(item.numero),{fasi:fasiPulite},{merge:true});
    });
    await batch.commit();
    setProgress('Scrittura in corso: '+Math.min(i+450,daAggiornare.length)+'/'+daAggiornare.length+' commesse...');
  }
  alert(`✓ Migrazione completata.\n\n${daAggiornare.length} commesse aggiornate (${daExcel} fasi da Excel, ${daDefault} fasi di default).`);
  await loadCommesse(true);
  try{if(typeof renderRubrica==='function')renderRubrica();}catch(e){}
  try{renderMigrMonteOreBanner();}catch(e){}
}
