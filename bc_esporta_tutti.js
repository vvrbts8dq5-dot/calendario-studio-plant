// ══════════════════════════════════════════════════════════════════════
// ESPORTAZIONE MASSIVA BUDGET CONTRACT — un pulsante in Rubrica Commesse
// che esporta in un unico file (Excel o PDF) il RIEPILOGO di tutti i
// Budget Contract che rispettano il filtro anno/ricerca già impostato
// nella pagina (stessa lista di rubricaEsportaExcel/PDF, funzione
// rubricaListaFiltrata() già esistente in admin.html).
//
// Per ogni commessa e per ognuna delle sue fasi, viene scritta UNA riga
// con lo stesso riepilogo che si vede aprendo la singola commessa
// (bcCalcRiepilogo): tariffe, ore per categoria, costi, monte ore e
// residui. Non include le singole voci di ore/spese inserite (per quelle
// bisogna aprire la commessa): qui viene esportato solo il riepilogo,
// così il file resta leggibile anche con centinaia di commesse.
//
// Le righe/stampe di ogni commessa vivono nelle sottocollezioni
// commesse/{numero}/righe e /stampe: servono quindi letture Firestore,
// fatte in parallelo con concorrenza limitata (stesso pattern già usato
// da migrazione_fasi_storico.js / migrazione_storico_v2.js) così anche
// con centinaia di commesse l'esportazione richiede solo pochi secondi.
// ══════════════════════════════════════════════════════════════════════

async function bcExpPMap(items,worker,conc,onProg){
  let i=0,fatti=0;
  async function run(){while(i<items.length){const k=i++;await worker(items[k]);fatti++;if(onProg)onProg(fatti,items.length)}}
  await Promise.all(Array.from({length:conc},run));
}

function bcExpSetStatus(t){
  const el=document.getElementById('bc-exp-status');
  if(el)el.textContent=t||'';
}

// Legge righe+stampe di tutte le commesse della lista filtrata corrente e
// costruisce un array di {commessa, fase, riep} — una voce per commessa/fase.
async function bcEsportaTuttiPrepara(){
  const list=rubricaListaFiltrata(); // stesso filtro (ricerca + anno) già in uso nella Rubrica
  const righe=[];
  await bcExpPMap(list,async c=>{
    const [righeSnap,stampeSnap]=await Promise.all([
      db.collection('commesse').doc(c.numero).collection('righe').get(),
      db.collection('commesse').doc(c.numero).collection('stampe').get()
    ]);
    const tutteRighe=righeSnap.docs.map(d=>d.data());
    const tutteStampe=stampeSnap.docs.map(d=>d.data());
    bcFasi(c).forEach(fase=>{
      const righeFase=tutteRighe.filter(r=>bcRigaFaseId(r,c)===fase.id);
      const stampeFase=tutteStampe.filter(s=>bcRigaFaseId(s,c)===fase.id);
      const riep=bcCalcRiepilogo(fase,righeFase,stampeFase);
      righe.push({commessa:c,fase,riep});
    });
  },20,(f,t)=>{bcExpSetStatus(`Lettura Budget Contract: ${f}/${t} commesse...`)});
  // stesso ordinamento della Rubrica: anno decrescente, poi numero
  righe.sort((a,b)=>{
    const ay=(a.commessa.anno==null||a.commessa.anno==='')?-1:Number(a.commessa.anno);
    const by=(b.commessa.anno==null||b.commessa.anno==='')?-1:Number(b.commessa.anno);
    if(by!==ay)return by-ay;
    const cmp=String(a.commessa.numero).localeCompare(String(b.commessa.numero),undefined,{numeric:true});
    if(cmp!==0)return cmp;
    return String(a.fase.id).localeCompare(String(b.fase.id));
  });
  return righe;
}

const BC_EXP_HEADER=['Anno','Numero','Committente','Progetto','Fase',
  'Tariffa Senior €/h','Tariffa Junior €/h',
  'Ore Senior Ele','Ore Senior Mec','Ore Junior Ele','Ore Junior Mec','Ore disc. n.d.','Ore non classificate',
  'Costo Senior €','Costo Junior €','Spese Vive €','Costo Km €','Costo Stampe €','Costo Generale €',
  'Monte Ore Ele Senior','Monte Ore Ele Junior','Monte Ore Mec Senior','Monte Ore Mec Junior',
  'Residuo Ele Senior','Residuo Ele Junior','Residuo Mec Senior','Residuo Mec Junior'];

function bcExpRigaArray(x){
  const c=x.commessa,fase=x.fase,r=x.riep;
  return [c.anno||'',c.numero||'',c.committente||'',c.progetto||'',fase.nome||fase.id,
    r.tariffaSenior,r.tariffaJunior,
    r.oreSeniorEle,r.oreSeniorMec,r.oreJuniorEle,r.oreJuniorMec,r.oreSeniorNd+r.oreJuniorNd,r.oreNonClassificateTot,
    r.costoSeniorTot,r.costoJuniorTot,r.speseViveTot,r.costoKmTot,r.costoStampeTot,r.costoGenerale,
    r.monteOreEleSenior,r.monteOreEleJunior,r.monteOreMecSenior,r.monteOreMecJunior,
    r.residuoEleSenior,r.residuoEleJunior,r.residuoMecSenior,r.residuoMecJunior];
}

async function bcEsportaTuttiExcel(){
  if(typeof rubricaListaFiltrata!=='function'){alert('Errore: apri prima la pagina Rubrica Commesse.');return}
  bcExpSetStatus('Lettura Budget Contract in corso...');
  try{
    const righe=await bcEsportaTuttiPrepara();
    if(!righe.length){alert('Nessuna commessa da esportare con il filtro/ricerca corrente.');bcExpSetStatus('');return}
    bcExpSetStatus('Generazione Excel...');
    const rr=righe.map(bcExpRigaArray);
    const totGenerale=righe.reduce((s,x)=>s+x.riep.costoGenerale,0);
    const footRow=new Array(BC_EXP_HEADER.length).fill('');
    footRow[4]='TOTALE';
    footRow[18]=totGenerale; // colonna "Costo Generale €"
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,expFoglioExcel('Budget Contract — Riepilogo tutte le commesse',
      `${rubricaEtichettaPeriodo()} · ${righe.length} righe (commessa/fase)`,BC_EXP_HEADER,rr,footRow),'Budget Contract');
    XLSX.writeFile(wb,`Budget_Contract_Tutti_${rubricaEtichettaPeriodo().replace(/\s+/g,'_')}.xlsx`);
  }catch(e){
    console.error(e);
    alert('Errore durante l\'esportazione: '+e.message);
  }
  bcExpSetStatus('');
}

async function bcEsportaTuttiPDF(){
  if(typeof rubricaListaFiltrata!=='function'){alert('Errore: apri prima la pagina Rubrica Commesse.');return}
  bcExpSetStatus('Lettura Budget Contract in corso...');
  try{
    const righe=await bcEsportaTuttiPrepara();
    if(!righe.length){alert('Nessuna commessa da esportare con il filtro/ricerca corrente.');bcExpSetStatus('');return}
    bcExpSetStatus('Generazione PDF...');
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
    const startY=expIntestazionePDF(doc,'Tutti i Budget Contract — Riepilogo',
      `${rubricaEtichettaPeriodo()} · ${righe.length} righe (commessa/fase)`);
    const totGenerale=righe.reduce((s,x)=>s+x.riep.costoGenerale,0);
    const footRow=['','','','','TOTALE','','','','','','','','',bcEuro(totGenerale)];
    doc.autoTable({
      startY,
      head:[['Anno','Numero','Committente','Progetto','Fase','Sr €/h','Jr €/h','Ore Sr','Ore Jr','Costo Sr','Costo Jr','Trasferta','Stampe','Generale']],
      body:righe.map(x=>{
        const c=x.commessa,fase=x.fase,r=x.riep;
        const oreSr=r.oreSeniorEle+r.oreSeniorMec+r.oreSeniorNd;
        const oreJr=r.oreJuniorEle+r.oreJuniorMec+r.oreJuniorNd;
        return [c.anno||'',c.numero||'',c.committente||'',c.progetto||'',fase.nome||fase.id,
          bcEuro(r.tariffaSenior),bcEuro(r.tariffaJunior),oreSr+'h',oreJr+'h',
          bcEuro(r.costoSeniorTot),bcEuro(r.costoJuniorTot),bcEuro(r.costoTrasferta),bcEuro(r.costoStampeTot),bcEuro(r.costoGenerale)];
      }),
      foot:[footRow],
      styles:{...EXP_PDF_BODY_STYLE,fontSize:6.5},
      headStyles:EXP_PDF_HEAD_STYLE,
      footStyles:EXP_PDF_FOOT_STYLE,
      theme:'striped'
    });
    doc.save(`Budget_Contract_Tutti_${rubricaEtichettaPeriodo().replace(/\s+/g,'_')}.pdf`);
  }catch(e){
    console.error(e);
    alert('Errore durante l\'esportazione: '+e.message);
  }
  bcExpSetStatus('');
}
