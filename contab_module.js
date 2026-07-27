// ── MONITORAGGIO CONTABILITA' ────────────────────────────────────────
const CONTAB_STATO_LABELS={
  '':'—',
  proforma_emessa:'Proforma emessa',
  fattura_emessa:'Fattura emessa',
  fattura_incassata:'Fattura incassata',
  incarico_avvocato:'Incarico ad avvocato',
  importo_da_verificare:'Importo da verificare',
  volontariato:'Volontariato'
};
let CONTAB_all=[], CONTAB_anno='tutti', CONTAB_filtro='tutti', CONTAB_editId=null, CONTAB_loaded=false, CONTAB_seedLoaded=false;

function ceur(v){return '€'+(parseFloat(v)||0).toFixed(2);}

async function loadContabilita(forza){
  if(CONTAB_loaded && !forza){
    if(!BC_commesseLoaded){try{await loadCommesse()}catch(e){}}
    renderContabImportBanner();
    renderContabilita();
    return;
  }
  document.getElementById('contab-tbody').innerHTML='<tr><td colspan="11" class="empty-state">Caricamento...</td></tr>';
  try{
    const snap=await db.collection('contabilita').get();
    CONTAB_all=snap.docs.map(d=>({id:d.id,...d.data()}));
    CONTAB_loaded=true;
  }catch(e){
    document.getElementById('contab-tbody').innerHTML='<tr><td colspan="11" class="empty-state">Errore: '+e.message+'</td></tr>';
    return;
  }
  if(!BC_commesseLoaded){try{await loadCommesse()}catch(e){}}
  renderContabImportBanner();
  renderContabilita();
}

function renderContabImportBanner(){
  const wrap=document.getElementById('contab-import-wrap');
  if(!wrap)return;
  if(CONTAB_all.length>0){wrap.innerHTML='';return}
  wrap.innerHTML=`<div class="contab-import-banner">
    <div class="contab-import-banner-txt">📥 Nessun dato presente in questa sezione. Puoi importare in un colpo solo lo storico 2022–2026 estratto dal file Excel originale (671 righe, con stato pagamento dedotto automaticamente dal colore delle righe).</div>
    <button class="btn btn-blu btn-sm" onclick="contabImportaStorico()">📥 Importa dati storici</button>
  </div>`;
}

function contabSetAnno(v){CONTAB_anno=v;renderContabilita();}
function contabSetFiltro(v,btn){
  CONTAB_filtro=v;
  document.querySelectorAll('#page-contabilita .btn-filtro').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  renderContabilita();
}

function contabRigheFiltrate(){
  return CONTAB_all.filter(r=>{
    if(CONTAB_anno!=='tutti' && String(r.anno)!==String(CONTAB_anno))return false;
    if(CONTAB_filtro==='pagati' && r.statoPagamento!=='fattura_incassata')return false;
    if(CONTAB_filtro==='aperti' && r.statoPagamento==='fattura_incassata')return false;
    return true;
  }).sort((a,b)=>(b.anno-a.anno)||String(a.codiceCommessa||'').localeCompare(String(b.codiceCommessa||'')));
}

function contabIncassato(r){
  return (r.acconto1||0)+(r.acconto2||0)+(r.acconto3||0)+(r.acconto4||0)+(r.acconto5||0)+(r.acconto6||0);
}

function renderContabilita(){
  const rows=contabRigheFiltrate();
  const tbody=document.getElementById('contab-tbody');
  if(!rows.length){
    tbody.innerHTML='<tr><td colspan="11" class="empty-state">Nessuna riga per i filtri selezionati</td></tr>';
  }else{
    tbody.innerHTML=rows.map(r=>{
      const bcMatch=BC_commesse.find(c=>c.numero===r.codiceCommessa);
      const bcLink=bcMatch?`<br><button class="btn btn-sm btn-bc-link" onclick="apriCommessaBC('${bcMatch.numero}')">📁 Apri in Budget Contract</button>`:'';
      const incassato=contabIncassato(r);
      const rimanenza=(r.importoPreventivo||0)-incassato;
      const rowCls=r.statoPagamento?`contab-row-${r.statoPagamento}`:'';
      return `<tr class="${rowCls}">
        <td>${r.anno||''}</td>
        <td style="font-family:'Inter',monospace;font-weight:600">${r.codiceCommessa||''}</td>
        <td>${r.clienteDebitore||''}</td>
        <td>${r.descrizione||''}${bcLink}</td>
        <td class="td-r">${ceur(r.importoPreventivo)}</td>
        <td class="td-r">${ceur(incassato)}</td>
        <td class="td-r td-bold">${ceur(rimanenza)}</td>
        <td class="td-r">${ceur(r.quotaMarcoD)}</td>
        <td class="td-r">${ceur(r.quotaMicheleA)}</td>
        <td><select class="sel-stato" onchange="contabCambiaStatoRapido('${r.id}',this.value)">
          ${Object.keys(CONTAB_STATO_LABELS).map(k=>`<option value="${k}" ${(r.statoPagamento||'')===k?'selected':''}>${CONTAB_STATO_LABELS[k]}</option>`).join('')}
        </select></td>
        <td><button class="btn btn-sm" onclick="contabApriForm('${r.id}')">✎</button></td>
      </tr>`;
    }).join('');
  }
  renderContabTotali(rows);
}

async function contabCambiaStatoRapido(id,val){
  try{
    await db.collection('contabilita').doc(id).update({statoPagamento:val,updatedAt:new Date().toISOString(),updatedBy:ADM.username});
    const r=CONTAB_all.find(x=>x.id===id);
    if(r)r.statoPagamento=val;
    renderContabilita();
  }catch(e){alert('Errore: '+e.message)}
}

function renderContabTotali(rows){
  let totPrev=0,totIncassato=0,totRimanenza=0,totMarco=0,totMichele=0;
  rows.forEach(r=>{
    const inc=contabIncassato(r);
    totPrev+=r.importoPreventivo||0;
    totIncassato+=inc;
    totRimanenza+=(r.importoPreventivo||0)-inc;
    totMarco+=r.quotaMarcoD||0;
    totMichele+=r.quotaMicheleA||0;
  });
  const el=document.getElementById('contab-totali');
  if(!el)return;
  el.innerHTML=`
    <div class="contab-tot-card"><div class="contab-tot-lbl">Commesse</div><div class="contab-tot-val">${rows.length}</div></div>
    <div class="contab-tot-card"><div class="contab-tot-lbl">Tot. Preventivato</div><div class="contab-tot-val">${ceur(totPrev)}</div></div>
    <div class="contab-tot-card"><div class="contab-tot-lbl">Tot. Incassato</div><div class="contab-tot-val" style="color:var(--verde)">${ceur(totIncassato)}</div></div>
    <div class="contab-tot-card"><div class="contab-tot-lbl">Tot. Rimanenza</div><div class="contab-tot-val" style="color:var(--amber)">${ceur(totRimanenza)}</div></div>
    <div class="contab-tot-card"><div class="contab-tot-lbl">Quota Marco D.</div><div class="contab-tot-val">${ceur(totMarco)}</div></div>
    <div class="contab-tot-card"><div class="contab-tot-lbl">Quota Michele A.</div><div class="contab-tot-val">${ceur(totMichele)}</div></div>
  `;
}

const CONTAB_FORM_IDS=['contab-r-anno','contab-r-codice','contab-r-offerta','contab-r-cliente','contab-r-descrizione','contab-r-importo',
  'contab-r-acc1','contab-r-acc2','contab-r-acc3','contab-r-acc4','contab-r-acc5','contab-r-acc6',
  'contab-r-quotamarco','contab-r-quotamichele','contab-r-altriimp','contab-r-altridest','contab-r-altripag','contab-r-annotazioni'];

function contabApriForm(id){
  CONTAB_editId=id;
  document.getElementById('contab-riga-alert').innerHTML='';
  document.getElementById('contab-btn-elimina').style.display=id?'inline-flex':'none';
  if(id){
    const r=CONTAB_all.find(x=>x.id===id);
    if(!r)return;
    document.getElementById('contab-modal-title').textContent='Modifica Riga — '+(r.codiceCommessa||'');
    document.getElementById('contab-r-anno').value=r.anno||'';
    document.getElementById('contab-r-codice').value=r.codiceCommessa||'';
    document.getElementById('contab-r-offerta').value=r.codiceOfferta||'';
    document.getElementById('contab-r-cliente').value=r.clienteDebitore||'';
    document.getElementById('contab-r-descrizione').value=r.descrizione||'';
    document.getElementById('contab-r-importo').value=r.importoPreventivo||'';
    document.getElementById('contab-r-acc1').value=r.acconto1||'';
    document.getElementById('contab-r-acc2').value=r.acconto2||'';
    document.getElementById('contab-r-acc3').value=r.acconto3||'';
    document.getElementById('contab-r-acc4').value=r.acconto4||'';
    document.getElementById('contab-r-acc5').value=r.acconto5||'';
    document.getElementById('contab-r-acc6').value=r.acconto6||'';
    document.getElementById('contab-r-quotamarco').value=r.quotaMarcoD||'';
    document.getElementById('contab-r-quotamichele').value=r.quotaMicheleA||'';
    document.getElementById('contab-r-altriimp').value=r.altriImporti||'';
    document.getElementById('contab-r-altridest').value=r.altriImportiDestinatario||'';
    document.getElementById('contab-r-altripag').value=r.altriImportiPagato||'';
    document.getElementById('contab-r-annotazioni').value=r.annotazioni||'';
    document.getElementById('contab-r-stato').value=r.statoPagamento||'';
  }else{
    document.getElementById('contab-modal-title').textContent='Nuova Riga Contabilità';
    CONTAB_FORM_IDS.forEach(fid=>document.getElementById(fid).value='');
    document.getElementById('contab-r-stato').value='';
    document.getElementById('contab-r-anno').value=CONTAB_anno!=='tutti'?CONTAB_anno:ANNO;
  }
  contabRicalcolaAnteprima();
  document.getElementById('modal-contab-riga').classList.add('open');
}

function contabRicalcolaAnteprima(){
  const imp=parseFloat(document.getElementById('contab-r-importo').value)||0;
  let acc=0;
  document.querySelectorAll('.contab-acc').forEach(el=>acc+=parseFloat(el.value)||0);
  document.getElementById('contab-r-rimanenza-preview').textContent=ceur(imp-acc);
}

async function contabSalvaRiga(){
  const alertEl=document.getElementById('contab-riga-alert');
  const codice=document.getElementById('contab-r-codice').value.trim();
  const anno=parseInt(document.getElementById('contab-r-anno').value);
  if(!codice){alertEl.innerHTML='<div class="alert-box alert-err">Inserisci il codice commessa</div>';return}
  if(!anno){alertEl.innerHTML='<div class="alert-box alert-err">Inserisci l\'anno</div>';return}
  const rec={
    anno,
    codiceCommessa:codice,
    codiceOfferta:document.getElementById('contab-r-offerta').value.trim(),
    clienteDebitore:document.getElementById('contab-r-cliente').value.trim(),
    descrizione:document.getElementById('contab-r-descrizione').value.trim(),
    importoPreventivo:parseFloat(document.getElementById('contab-r-importo').value)||0,
    acconto1:parseFloat(document.getElementById('contab-r-acc1').value)||0,
    acconto2:parseFloat(document.getElementById('contab-r-acc2').value)||0,
    acconto3:parseFloat(document.getElementById('contab-r-acc3').value)||0,
    acconto4:parseFloat(document.getElementById('contab-r-acc4').value)||0,
    acconto5:parseFloat(document.getElementById('contab-r-acc5').value)||0,
    acconto6:parseFloat(document.getElementById('contab-r-acc6').value)||0,
    quotaMarcoD:parseFloat(document.getElementById('contab-r-quotamarco').value)||0,
    quotaMicheleA:parseFloat(document.getElementById('contab-r-quotamichele').value)||0,
    altriImporti:parseFloat(document.getElementById('contab-r-altriimp').value)||0,
    altriImportiDestinatario:document.getElementById('contab-r-altridest').value.trim(),
    altriImportiPagato:parseFloat(document.getElementById('contab-r-altripag').value)||0,
    annotazioni:document.getElementById('contab-r-annotazioni').value.trim(),
    statoPagamento:document.getElementById('contab-r-stato').value,
    updatedAt:new Date().toISOString(),
    updatedBy:ADM.username
  };
  try{
    if(CONTAB_editId){
      await db.collection('contabilita').doc(CONTAB_editId).update(rec);
    }else{
      rec.createdAt=new Date().toISOString();
      rec.createdBy=ADM.username;
      await db.collection('contabilita').add(rec);
    }
    document.getElementById('modal-contab-riga').classList.remove('open');
    await loadContabilita(true);
  }catch(e){alertEl.innerHTML='<div class="alert-box alert-err">Errore: '+e.message+'</div>'}
}

async function contabEliminaRiga(){
  if(!CONTAB_editId)return;
  if(!confirm('Eliminare questa riga di contabilità? Operazione non reversibile.'))return;
  try{
    await db.collection('contabilita').doc(CONTAB_editId).delete();
    document.getElementById('modal-contab-riga').classList.remove('open');
    await loadContabilita(true);
  }catch(e){alert('Errore: '+e.message)}
}

function contabCaricaSeed(){
  return new Promise((resolve,reject)=>{
    if(CONTAB_seedLoaded){resolve();return}
    const s=document.createElement('script');
    s.src='contab_seed_data.js';
    s.onload=()=>{CONTAB_seedLoaded=true;resolve();};
    s.onerror=()=>reject(new Error('Impossibile caricare contab_seed_data.js (verifica che il file sia nella stessa cartella di admin.html)'));
    document.body.appendChild(s);
  });
}

async function contabImportaStorico(){
  const wrap=document.getElementById('contab-import-wrap');
  const bannerOrig=wrap.innerHTML;
  const btn=wrap.querySelector('button');
  if(btn){btn.disabled=true;btn.textContent='Caricamento dati storici...';}
  try{
    await contabCaricaSeed();
  }catch(e){
    wrap.innerHTML='<div class="alert-box alert-err">Errore: '+e.message+'</div>';
    return;
  }
  if(!confirm('Importare '+CONTAB_SEED_DATA.length+' righe storiche (2022-2026) estratte dal file Excel originale? Da fare una sola volta.')){
    wrap.innerHTML=bannerOrig;
    return;
  }
  wrap.innerHTML='<div class="empty-state">Importazione in corso, non chiudere la pagina...</div>';
  try{
    const chunkSize=400;
    for(let i=0;i<CONTAB_SEED_DATA.length;i+=chunkSize){
      const chunk=CONTAB_SEED_DATA.slice(i,i+chunkSize);
      const batch=db.batch();
      chunk.forEach(rec=>{
        const ref=db.collection('contabilita').doc();
        batch.set(ref,Object.assign({},rec,{createdBy:ADM.username,createdAt:new Date().toISOString()}));
      });
      await batch.commit();
    }
    await loadContabilita(true);
  }catch(e){wrap.innerHTML='<div class="alert-box alert-err">Errore import: '+e.message+'</div>'}
}

