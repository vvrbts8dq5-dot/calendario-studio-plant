// ══════════════════════════════════════════════════════════════════════
// PULIZIA DOPPIONI — banner Dashboard, stesso pattern del banner Contabilità
// e del banner Importa Storico. Rileva automaticamente richieste ferie/
// permessi/ROL/malattie duplicate (stesso dipendente, stesso tipo, stessa
// data) e mostra un pulsante per cancellarle in un colpo solo, tenendo
// sempre la prima copia creata. Il banner si nasconde da solo quando non
// ci sono più doppioni.
// ══════════════════════════════════════════════════════════════════════
function _dupTrovaGruppi(){
  const gruppiR={};
  (typeof tutteR!=='undefined'&&Array.isArray(tutteR)?tutteR:[]).forEach(r=>{
    const key=`richieste_assenza|${r.username}|${r.tipo}|${r.dataInizio}`;
    (gruppiR[key]=gruppiR[key]||[]).push({id:r.id,coll:'richieste_assenza',createdAt:r.createdAt||'',nome:r.nomeCompleto||r.username,tipo:r.tipo,data:r.dataInizio});
  });
  const gruppiM={};
  (typeof tutteMalattie!=='undefined'&&Array.isArray(tutteMalattie)?tutteMalattie:[]).forEach(m=>{
    const key=`malattie|${m.username}|${m.dataInizio}`;
    (gruppiM[key]=gruppiM[key]||[]).push({id:m.id,coll:'malattie',createdAt:m.createdAt||'',nome:m.nomeCompleto||m.username,tipo:'malattia',data:m.dataInizio});
  });
  const daCancellare=[]; const dettaglio=[];
  [...Object.values(gruppiR),...Object.values(gruppiM)].forEach(arr=>{
    if(arr.length>1){
      const ordinati=[...arr].sort((a,b)=>(a.createdAt||'').toString().localeCompare((b.createdAt||'').toString()));
      const[tieni,...extra]=ordinati;
      extra.forEach(e=>daCancellare.push({coll:e.coll,id:e.id}));
      dettaglio.push(`  • ${tieni.nome} — ${tieni.tipo} ${tieni.data}: ${arr.length} copie, ne cancello ${extra.length}`);
    }
  });
  return {daCancellare,dettaglio};
}

function renderDupCleanupBanner(){
  const wrap=document.getElementById('dup-cleanup-wrap');
  if(!wrap)return;
  const {daCancellare}=_dupTrovaGruppi();
  if(!daCancellare.length){wrap.innerHTML='';return}
  wrap.innerHTML=`<div class="contab-import-banner" style="border-color:var(--rosso);background:var(--rosso-light)">
    <div class="contab-import-banner-txt">⚠️ Trovate ${daCancellare.length} righe duplicate tra ferie/permessi/ROL/malattie (probabile doppio import). Puoi rimuoverle in un colpo solo: viene sempre tenuta la prima copia creata.</div>
    <button class="btn btn-rosso btn-sm" onclick="rimuoviDuplicatiStoricoBanner()">🧹 Rimuovi doppioni</button>
  </div>`;
}

async function rimuoviDuplicatiStoricoBanner(){
  const {daCancellare,dettaglio}=_dupTrovaGruppi();
  if(!daCancellare.length){ alert('Nessun doppione trovato.'); return; }
  const msg=`Trovati doppioni da rimuovere:\n\n${dettaglio.join('\n')}\n\nTotale righe da cancellare: ${daCancellare.length}.\nVerrà tenuta sempre la prima copia creata di ognuna. Confermi la cancellazione?`;
  if(!confirm(msg))return;
  const wrap=document.getElementById('dup-cleanup-wrap');
  if(wrap)wrap.innerHTML='<div class="empty-state">Pulizia in corso, non chiudere la pagina...</div>';
  const chunkSize=450;
  let cancellate=0;
  for(let i=0;i<daCancellare.length;i+=chunkSize){
    const chunk=daCancellare.slice(i,i+chunkSize);
    const batch=db.batch();
    chunk.forEach(x=>batch.delete(db.collection(x.coll).doc(x.id)));
    await batch.commit();
    cancellate+=chunk.length;
  }
  alert(`✓ Pulizia completata.\n\n${cancellate} righe duplicate cancellate.`);
  await loadDashboard();
  try{ if(typeof loadRichieste==='function') loadRichieste(); }catch(e){}
}
