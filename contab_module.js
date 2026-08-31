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
let CONTAB_all=[], CONTAB_anno='tutti', CONTAB_filtro='tutti', CONTAB_search='', CONTAB_editId=null;

function ceur(v){return '€'+(parseFloat(v)||0).toFixed(2);}

async function loadContabilita(){
  document.getElementById('contab-tbody').innerHTML='<tr><td colspan="11" class="empty-state">Caricamento...</td></tr>';
  try{
    const snap=await db.collection('contabilita').get();
    CONTAB_all=snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){
    document.getElementById('contab-tbody').innerHTML='<tr><td colspan="11" class="empty-state">Errore: '+e.message+'</td></tr>';
    return;
  }
  if(!BC_commesse.length){try{await loadCommesse()}catch(e){}}
  renderContabilita();
}


function contabSetAnno(v){CONTAB_anno=v;renderContabilita();}
function contabSetFiltro(v,btn){
  CONTAB_filtro=v;
  document.querySelectorAll('#page-contabilita .btn-filtro').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  renderContabilita();
}
function contabSetSearch(v){CONTAB_search=v;renderContabilita();}

function contabRigheFiltrate(){
  const f=(CONTAB_search||'').trim().toLowerCase();
  return CONTAB_all.filter(r=>{
    if(CONTAB_anno!=='tutti' && String(r.anno)!==String(CONTAB_anno))return false;
    if(CONTAB_filtro==='pagati' && r.statoPagamento!=='fattura_incassata')return false;
    if(CONTAB_filtro==='aperti' && r.statoPagamento==='fattura_incassata')return false;
    if(f && !(
      String(r.codiceCommessa||'').toLowerCase().includes(f)
      || String(r.codiceOfferta||'').toLowerCase().includes(f)
      || String(r.clienteDebitore||'').toLowerCase().includes(f)
      || String(r.descrizione||'').toLowerCase().includes(f)
    ))return false;
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
        <td style="font-family:'Inter',monospace">${r.codiceOfferta||''}</td>
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
  if(typeof makeAutocomplete==='function'){
    makeAutocomplete(
      document.getElementById('contab-r-codice'),
      ()=>(BC_commesse||[]).map(c=>({value:c.numero,label:c.numero+(c.committente?(' — '+c.committente):'')})),
      'Cerca o scrivi codice commessa...'
    );
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
    await loadContabilita();
  }catch(e){alertEl.innerHTML='<div class="alert-box alert-err">Errore: '+e.message+'</div>'}
}

async function contabEliminaRiga(){
  if(!CONTAB_editId)return;
  if(!confirm('Eliminare questa riga di contabilità? Operazione non reversibile.'))return;
  try{
    const row=CONTAB_all.find(x=>x.id===CONTAB_editId);
    if(row){const{id:_id,...dati}=row;await spostaNelCestino('contabilita',['contabilita',CONTAB_editId],dati,'Contabilità: '+(dati.codiceCommessa||'')+' — '+(dati.clienteDebitore||''),ADM.username);}
    await db.collection('contabilita').doc(CONTAB_editId).delete();
    document.getElementById('modal-contab-riga').classList.remove('open');
    await loadContabilita();
  }catch(e){alert('Errore: '+e.message)}
}


// ── ESPORTAZIONE CONTABILITA' (Excel / PDF) — rispetta i filtri correnti (anno, stato, ricerca) ──
function contabEtichettaPeriodo(){return CONTAB_anno==='tutti'?'Tutti gli anni':String(CONTAB_anno)}
function contabEsportaExcel(){
  const rows=contabRigheFiltrate();
  const hh=['Anno','Codice Commessa','Cod. Offerta','Cliente debitore','Descrizione','Preventivo €','Incassato €','Rimanenza €','Quota Marco D. €','Quota Michele A. €','Stato'];
  const rr=rows.map(r=>{
    const inc=contabIncassato(r);
    return [r.anno||'',r.codiceCommessa||'',r.codiceOfferta||'',r.clienteDebitore||'',r.descrizione||'',r.importoPreventivo||0,inc,(r.importoPreventivo||0)-inc,r.quotaMarcoD||0,r.quotaMicheleA||0,CONTAB_STATO_LABELS[r.statoPagamento||'']||''];
  });
  const totPrev=rows.reduce((s,r)=>s+(r.importoPreventivo||0),0);
  const totInc=rows.reduce((s,r)=>s+contabIncassato(r),0);
  const footRow=['','','','','TOTALE',totPrev,totInc,totPrev-totInc,rows.reduce((s,r)=>s+(r.quotaMarcoD||0),0),rows.reduce((s,r)=>s+(r.quotaMicheleA||0),0),''];
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,expFoglioExcel('Monitoraggio Contabilità',contabEtichettaPeriodo()+' · '+rows.length+' righe',hh,rr,footRow),'Contabilità');
  XLSX.writeFile(wb,`Contabilita_${contabEtichettaPeriodo().replace(/\s+/g,'_')}.xlsx`);
}
function contabEsportaPDF(){
  const rows=contabRigheFiltrate();
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  const filtroLbl=CONTAB_filtro==='tutti'?'Tutti':(CONTAB_filtro==='pagati'?'Pagati':'Aperti');
  const startY=expIntestazionePDF(doc,'Monitoraggio Contabilità',`Periodo: ${contabEtichettaPeriodo()} · Stato: ${filtroLbl} · ${rows.length} righe`);
  const totPrev=rows.reduce((s,r)=>s+(r.importoPreventivo||0),0);
  const totInc=rows.reduce((s,r)=>s+contabIncassato(r),0);
  doc.autoTable({
    startY,
    head:[['Anno','Codice','Cliente','Descrizione','Preventivo','Incassato','Rimanenza','Stato']],
    body:rows.map(r=>{const inc=contabIncassato(r);return[r.anno||'',r.codiceCommessa||'',r.clienteDebitore||'',r.descrizione||'',ceur(r.importoPreventivo),ceur(inc),ceur((r.importoPreventivo||0)-inc),CONTAB_STATO_LABELS[r.statoPagamento||'']||'']}),
    foot:[['','','','TOTALE',ceur(totPrev),ceur(totInc),ceur(totPrev-totInc),'']],
    styles:EXP_PDF_BODY_STYLE,
    headStyles:EXP_PDF_HEAD_STYLE,
    footStyles:EXP_PDF_FOOT_STYLE,
    theme:'striped'
  });
  doc.save(`Contabilita_${contabEtichettaPeriodo().replace(/\s+/g,'_')}.pdf`);
}
