// ══════════════════════════════════════════════════════════════════════
// STORICO BUDGET CONTRACT v2 — banner in Rubrica Commesse (admin.html),
// stesso pattern "anteprima → conferma → scrittura" degli altri strumenti.
//
// Sostituisce le vecchie righe "Storico importato" (import del 3 settembre
// 2026: ore aggregate, ~9.100 h "non classificate", 177 h mancanti) con le
// nuove righe per persona di storico_budget_v2_data.js (12.116,1 h, tutte
// le ore dei 249 file Excel).
//
// COSA TOCCA, e solo quello:
//  - cancella in commesse/{numero}/righe SOLO le righe dello storico
//    importato (id "storico_…"/"storico2_…", oppure origineStorico:true /
//    username "storico"), e MAI una riga con origineCalendario:true o
//    inserita da un dipendente/titolare/admin;
//  - scrive le nuove righe storico (id deterministici "storico2_…":
//    rilanciare lo strumento non crea doppioni);
//  - scrive commesse/{numero}.storicoV2Importato = true.
//
// COSA NON TOCCA: tutte le ore inserite dagli utenti (calendario
// dipendenti, Registro Titolare, righe manuali), stampe, tariffe, monte
// ore, fasi, nomi, note.
//
// Prima di scrivere legge le righe esistenti e mostra, commessa per
// commessa: ore storico vecchie → nuove, ore utenti mantenute, e le righe
// utenti con data non successiva all'ultimo salvataggio del file Excel
// (possibile doppio conteggio: solo segnalate, mai modificate).
// ══════════════════════════════════════════════════════════════════════

const SV2_LABELS = {
  '23004': ['AS BUILT APT', 'ESECUTIVO GENERALE'],
  '24058': ['DM+DEF+ESEC', 'VARIANTE OTT 2025'],
  '25084': ['DEFINITIVO', 'VARIANTE'],
  '25086': ['ESECUTIVO', 'PRELIMINARE']
};
const SV2_PERSONE_ID = {
  'Marco Dante':'MD','Michele Arnosti':'MA','Marco Sorgato':'MS','Marco Zabeo':'MZ',
  'Alessio Bertin':'AB','Enrico Boschetto':'EB','Giovanni Dante':'GD',
  'David Digioseffo':'DDG','Amine Raghib':'AR','Junior non indicato':'ND'
};
let SV2_PIANO = null; // calcolato da sv2Analizza(), usato da sv2Esegui()

function sv2Num(v){return Math.round((parseFloat(v)||0)*100)/100}
function sv2Fmt(v){return sv2Num(v).toLocaleString('it-IT',{maximumFractionDigits:2})}
function sv2Esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;')}

// Fase della commessa a cui appartiene un file storico
function sv2FaseId(c,rec){
  const fasi=bcFasi(c);
  if(rec.fase){
    const target=rec.fase.trim().toUpperCase();
    const perNome=fasi.find(f=>String(f.nome||'').trim().toUpperCase()===target);
    if(perNome)return perNome.id;
    const labels=SV2_LABELS[rec.numero];
    if(labels){
      const idx=labels.findIndex(l=>l.toUpperCase()===target);
      const id=idx===1?'fase2':'fase1';
      if(fasi.some(f=>f.id===id))return id;
    }
  }
  return fasi[0].id;
}

// Una riga è "storico importato" (quindi sostituibile) SOLO se ha i segni
// dell'import e nessun segno di inserimento da parte di un utente.
function sv2EStorico(id,d){
  if(d.origineCalendario===true)return false;
  if(['dipendente','admin','titolare'].includes(d.tipoPersona))return false;
  return id.startsWith('storico_')||id.startsWith('storico2_')||d.origineStorico===true||d.username==='storico';
}

function sv2NuoveRighe(c,rec){
  const faseId=sv2FaseId(c,rec);
  const anno=parseInt(c.anno)||(2000+parseInt(String(rec.numero).slice(0,2)))||2024;
  const base={username:'storico',tipoPersona:'storico',data:anno+'-01-01',faseId,
    origineStorico:true,storicoVersione:2,fileOrigine:rec.file,
    createdBy:'import-storico-v2',createdAt:new Date().toISOString()};
  const out=[];
  rec.righe.forEach(r=>{
    const pid=SV2_PERSONE_ID[r.persona]||String(r.persona).replace(/[^A-Za-z]/g,'').slice(0,8);
    const id=`storico2_${rec.numero}_${faseId}_${pid}_${r.livello==='senior'?'sr':'jr'}_${r.disciplina}`;
    out.push({id,data:{...base,nomeCompleto:r.persona,livello:r.livello,disciplina:r.disciplina,
      ore:sv2Num(r.ore),speseVive:0,km:0,
      descrizione:`Storico Excel — ${rec.file}`+(r.disciplina==='nd'?' (disciplina non indicata nel file)':'')}});
  });
  if(sv2Num(rec.km)>0||sv2Num(rec.speseVive)>0){
    out.push({id:`storico2_${rec.numero}_${faseId}_trasferte`,data:{...base,nomeCompleto:'Trasferte (storico)',
      livello:'junior',disciplina:'nd',ore:0,km:sv2Num(rec.km),speseVive:sv2Num(rec.speseVive),
      descrizione:`Storico Excel — ${rec.file} — km e spese vive`}});
  }
  return {faseId,righe:out};
}

async function sv2PMap(items,worker,conc,onProg){
  let i=0,fatti=0;
  async function run(){while(i<items.length){const k=i++;await worker(items[k]);fatti++;if(onProg)onProg(fatti,items.length)}}
  await Promise.all(Array.from({length:conc},run));
}

function renderStoricoV2Banner(){
  const wrap=document.getElementById('storico-v2-wrap');
  if(!wrap)return;
  if(typeof STORICO_BUDGET_V2==='undefined'||typeof BC_commesseLoaded==='undefined'||!BC_commesseLoaded||!BC_commesse||!BC_commesse.length){wrap.innerHTML='';return}
  const numeri=[...new Set(STORICO_BUDGET_V2.map(r=>r.numero))];
  const daFare=numeri.filter(n=>{const c=BC_commesse.find(x=>x.numero===n);return c&&!c.storicoV2Importato});
  if(!daFare.length){wrap.innerHTML='';return}
  wrap.innerHTML=`<div class="contab-import-banner">
    <div class="contab-import-banner-txt">🧾 Storico Budget Contract v2 — ${daFare.length} commesse da aggiornare con le ore dei 249 file Excel divise per persona (Senior/Junior × Ele/Mec).</div>
    <button class="btn btn-blu btn-sm" onclick="sv2Analizza()">🔍 Analizza e mostra anteprima</button>
  </div>`;
}

// ── 1) Analisi in sola lettura ──────────────────────────────────────────
async function sv2Analizza(){
  const wrap=document.getElementById('storico-v2-wrap');
  const prog=t=>{wrap.innerHTML='<div class="empty-state">'+t+'</div>'};
  try{
    prog('Lettura delle righe esistenti in corso (sola lettura)...');
    const perNumero={};
    STORICO_BUDGET_V2.forEach(rec=>{(perNumero[rec.numero]=perNumero[rec.numero]||[]).push(rec)});
    const numeri=Object.keys(perNumero);
    const mancanti=[],commesse=[];
    numeri.forEach(n=>{const c=BC_commesse.find(x=>x.numero===n);if(c)commesse.push(c);else perNumero[n].forEach(r=>mancanti.push(r))});
    const piano=[];
    await sv2PMap(commesse,async c=>{
      const snap=await db.collection('commesse').doc(c.numero).collection('righe').get();
      const esistenti=snap.docs.map(d=>({id:d.id,...d.data()}));
      const recs=perNumero[c.numero];
      const nuove=[];const filePerFase={};
      recs.forEach(rec=>{const x=sv2NuoveRighe(c,rec);nuove.push(...x.righe);filePerFase[x.faseId]=rec});
      const idsNuovi=new Set(nuove.map(r=>r.id));
      const daCancellare=esistenti.filter(r=>sv2EStorico(r.id,r)&&!idsNuovi.has(r.id));
      const storicoEsistente=esistenti.filter(r=>sv2EStorico(r.id,r));
      const utenti=esistenti.filter(r=>!sv2EStorico(r.id,r));
      // righe utente con data non successiva al salvataggio del file Excel della stessa fase
      const sospette=utenti.filter(r=>{
        const rec=filePerFase[bcRigaFaseId(r,c)];
        return rec&&rec.salvatoIl&&r.data&&String(r.data)<=rec.salvatoIl&&(parseFloat(r.ore)||0)>0;
      });
      piano.push({numero:c.numero,nuove,daCancellare,
        oreVecchie:storicoEsistente.reduce((s,r)=>s+(parseFloat(r.ore)||0),0),
        oreNuove:nuove.reduce((s,r)=>s+(r.data.ore||0),0),
        oreUtenti:utenti.reduce((s,r)=>s+(parseFloat(r.ore)||0),0),nUtenti:utenti.length,
        sospette,recs});
    },20,(f,t)=>{if(f%20===0||f===t)prog(`Lettura righe esistenti: ${f}/${t} commesse (sola lettura)...`)});
    piano.sort((a,b)=>String(a.numero).localeCompare(String(b.numero),undefined,{numeric:true}));
    SV2_PIANO={piano,mancanti};
    sv2MostraAnteprima();
  }catch(e){
    console.error(e);
    wrap.innerHTML=`<div class="contab-import-banner"><div class="contab-import-banner-txt">❌ Errore durante l'analisi: ${sv2Esc(e.message)}. Nessuna modifica effettuata.</div><button class="btn btn-sm" onclick="renderStoricoV2Banner()">Chiudi</button></div>`;
  }
}

function sv2MostraAnteprima(){
  const wrap=document.getElementById('storico-v2-wrap');
  const {piano,mancanti}=SV2_PIANO;
  const tot=k=>piano.reduce((s,p)=>s+p[k],0);
  const nSosp=piano.reduce((s,p)=>s+p.sospette.length,0);
  const oreSosp=piano.reduce((s,p)=>s+p.sospette.reduce((a,r)=>a+(parseFloat(r.ore)||0),0),0);
  const th='style="text-align:left;padding:6px 8px"',thr='style="text-align:right;padding:6px 8px"',td='style="padding:5px 8px"',tdr='style="padding:5px 8px;text-align:right"';
  const righe=piano.map(p=>{
    const sosp=p.sospette.length?`<span style="color:#c0392b;font-weight:600">${p.sospette.length} (${sv2Fmt(p.sospette.reduce((a,r)=>a+(parseFloat(r.ore)||0),0))} h)</span>`:'—';
    const dett=p.nuove.filter(r=>r.data.ore>0).map(r=>`${sv2Esc(r.data.nomeCompleto)} ${r.data.livello==='senior'?'Sr':'Jr'} ${r.data.disciplina==='ele'?'Ele':r.data.disciplina==='mec'?'Mec':'n.d.'} ${sv2Fmt(r.data.ore)}h`).join(' · ');
    return `<tr style="border-top:1px solid var(--border)">
      <td ${td}><b>${sv2Esc(p.numero)}</b></td>
      <td ${tdr}>${sv2Fmt(p.oreVecchie)} h</td>
      <td ${tdr}><b>${sv2Fmt(p.oreNuove)} h</b></td>
      <td ${tdr}>${p.nUtenti} righe · ${sv2Fmt(p.oreUtenti)} h</td>
      <td ${tdr}>${sosp}</td>
      <td style="padding:5px 8px;font-size:11px;color:var(--ink4)">${dett}</td>
    </tr>`}).join('');
  const sospRows=piano.flatMap(p=>p.sospette.map(r=>`<tr><td ${td}>${sv2Esc(p.numero)}</td><td ${td}>${sv2Esc(r.data)}</td><td ${td}>${sv2Esc(r.nomeCompleto||r.username)}</td><td ${td}>${sv2Esc(r.descrizione)}</td><td ${tdr}>${sv2Fmt(r.ore)} h</td></tr>`)).join('');
  const manc=mancanti.map(r=>`<li>${sv2Esc(r.numero)} — ${sv2Esc(r.file)} (${sv2Fmt(r.righe.reduce((s,x)=>s+x.ore,0))} h)</li>`).join('');
  wrap.innerHTML=`<div class="contab-import-banner" style="flex-direction:column;align-items:stretch;gap:10px">
    <div class="contab-import-banner-txt">🧾 <b>Anteprima Storico v2</b> — nessuna scrittura effettuata finora.<br>
      ${piano.length} commesse · ore storico attuali <b>${sv2Fmt(tot('oreVecchie'))} h</b> → nuove <b>${sv2Fmt(tot('oreNuove'))} h</b> ·
      righe storico da scrivere <b>${piano.reduce((s,p)=>s+p.nuove.length,0)}</b>, vecchie da togliere <b>${piano.reduce((s,p)=>s+p.daCancellare.length,0)}</b>.<br>
      Ore inserite dagli utenti nell'app: <b>${sv2Fmt(tot('oreUtenti'))} h</b> in ${tot('nUtenti')} righe — <b>restano tutte invariate</b>.
      ${nSosp?`<br><span style="color:#c0392b">⚠️ ${nSosp} righe utente (${sv2Fmt(oreSosp)} h) hanno una data non successiva all'ultimo salvataggio del file Excel: potrebbero essere già contate nel file. Vengono solo segnalate (elenco sotto), non modificate.</span>`:''}
    </div>
    <div style="max-height:340px;overflow:auto;border:1px solid var(--border);border-radius:8px">
      <table style="width:100%;font-size:12px;border-collapse:collapse">
        <thead style="position:sticky;top:0;background:#f4f4f4"><tr>
          <th ${th}>Commessa</th><th ${thr}>Storico attuale</th><th ${thr}>Storico nuovo</th><th ${thr}>Ore utenti (mantenute)</th><th ${thr}>Da verificare</th><th ${th}>Dettaglio nuove righe</th>
        </tr></thead><tbody>${righe}</tbody>
      </table>
    </div>
    ${sospRows?`<details><summary style="cursor:pointer;font-weight:700;font-size:12px">Righe utente da verificare (${nSosp})</summary>
      <div style="max-height:220px;overflow:auto;border:1px solid var(--border);border-radius:8px;margin-top:6px">
      <table style="width:100%;font-size:12px;border-collapse:collapse"><thead style="background:#f4f4f4"><tr><th ${th}>Commessa</th><th ${th}>Data</th><th ${th}>Chi</th><th ${th}>Descrizione</th><th ${thr}>Ore</th></tr></thead><tbody>${sospRows}</tbody></table></div></details>`:''}
    ${manc?`<div style="font-size:12px;color:#c0392b"><b>File senza commessa in Firestore (non importati):</b><ul style="margin:4px 0 0 18px">${manc}</ul></div>`:''}
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn btn-sm" onclick="SV2_PIANO=null;renderStoricoV2Banner()">Annulla</button>
      <button class="btn btn-ink btn-sm" onclick="sv2Esegui()">✅ Conferma e scrivi su Firestore</button>
    </div>
  </div>`;
}

// ── 2) Scrittura (solo dopo conferma) ───────────────────────────────────
async function sv2Esegui(){
  if(!SV2_PIANO){alert('Rifai prima l\'analisi.');return}
  const {piano}=SV2_PIANO;
  const nNuove=piano.reduce((s,p)=>s+p.nuove.length,0),nDel=piano.reduce((s,p)=>s+p.daCancellare.length,0);
  const oreNuove=piano.reduce((s,p)=>s+p.oreNuove,0);
  if(!confirm(`Stai per scrivere su Firestore:\n\n• ${piano.length} commesse\n• ${nDel} vecchie righe di storico rimosse\n• ${nNuove} nuove righe di storico (${sv2Fmt(oreNuove)} h)\n\nLe ore inserite dagli utenti NON vengono toccate.\n\nConfermi?`))return;
  const wrap=document.getElementById('storico-v2-wrap');
  const prog=t=>{wrap.innerHTML='<div class="empty-state">'+t+'</div>'};
  const ops=[];
  piano.forEach(p=>{
    const col=db.collection('commesse').doc(p.numero).collection('righe');
    p.daCancellare.forEach(r=>{
      // doppio controllo di sicurezza al momento della scrittura
      if(!sv2EStorico(r.id,r))return;
      ops.push(b=>b.delete(col.doc(r.id)));
    });
    p.nuove.forEach(r=>ops.push(b=>b.set(col.doc(r.id),r.data)));
    ops.push(b=>b.set(db.collection('commesse').doc(p.numero),{storicoV2Importato:true},{merge:true}));
  });
  try{
    for(let i=0;i<ops.length;i+=400){
      const batch=db.batch();
      ops.slice(i,i+400).forEach(f=>f(batch));
      await batch.commit();
      prog(`Scrittura in corso, non chiudere la pagina: ${Math.min(i+400,ops.length)}/${ops.length} operazioni...`);
    }
  }catch(e){
    console.error(e);
    alert('❌ Errore durante la scrittura: '+e.message+'\n\nLo strumento si può rilanciare in sicurezza: riprende da dove serve senza creare doppioni.');
    SV2_PIANO=null;await loadCommesse(true);renderStoricoV2Banner();return;
  }
  SV2_PIANO=null;
  alert(`✓ Storico v2 completato.\n\n${piano.length} commesse aggiornate, ${nNuove} righe scritte (${sv2Fmt(oreNuove)} h), ${nDel} vecchie righe storico rimosse.\nOre degli utenti invariate.`);
  await loadCommesse(true);
  try{if(typeof renderRubrica==='function')renderRubrica()}catch(e){}
  renderStoricoV2Banner();
}
