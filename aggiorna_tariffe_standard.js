// ══════════════════════════════════════════════════════════════════════
// AGGIORNAMENTO TARIFFE STANDARD — banner in Rubrica Commesse, stesso
// pattern "una tantum" di correzione_nomi_commesse.js / migrazione_monte_ore_split.js.
//
// Porta la tariffa Senior a 125 €/h e la tariffa Junior a 39 €/h su TUTTE
// le fasi di TUTTE le commesse (sovrascrive i valori attuali). I costi dei
// Budget Contract (bcCalcRiepilogo) si ricalcolano da soli visto che usano
// già fase.tariffaSenior/tariffaJunior: qui basta aggiornare le tariffe.
//
// Rilanciabile in sicurezza: una fase già a 125€/39€ viene saltata e non
// ricompare più nel banner. Non tocca monte ore, listino stampe, nomi
// fase, righe/stampe già inserite o altro.
//
// NOTA: legge le fasi con bcFasi(c), che per una commessa non ancora
// convertita alla struttura a fasi restituisce una fase "Generale" presa
// dai vecchi campi piatti — in quel caso la scrittura crea comunque il
// campo "fasi" corretto (stesso comportamento già usato da
// migrazione_monte_ore_split.js), quindi nessuna commessa viene saltata.
// ══════════════════════════════════════════════════════════════════════
const TARIFFE_STANDARD = { senior: 125, junior: 39 };

function tsCalcolaPiano(){
  const daAggiornare=[]; // {numero, committente, fasi:[...nuove...], fasiCambiate:[{nome,vecchioSr,vecchioJr}]}
  if(typeof BC_commesse==='undefined'||!BC_commesse)return{daAggiornare,nFasi:0};
  let nFasi=0;
  BC_commesse.forEach(c=>{
    const fasi=bcFasi(c);
    let cambiate=false;
    const fasiCambiate=[];
    const nuoveFasi=fasi.map(f=>{
      const srOk=(parseFloat(f.tariffaSenior)||0)===TARIFFE_STANDARD.senior;
      const jrOk=(parseFloat(f.tariffaJunior)||0)===TARIFFE_STANDARD.junior;
      if(srOk&&jrOk)return f;
      cambiate=true;nFasi++;
      fasiCambiate.push({nome:f.nome||f.id,vecchioSr:parseFloat(f.tariffaSenior)||0,vecchioJr:parseFloat(f.tariffaJunior)||0});
      return {...f,tariffaSenior:TARIFFE_STANDARD.senior,tariffaJunior:TARIFFE_STANDARD.junior};
    });
    if(cambiate)daAggiornare.push({numero:c.numero,committente:c.committente,fasi:nuoveFasi,fasiCambiate});
  });
  return{daAggiornare,nFasi};
}

// ── Banner "una tantum" in Rubrica Commesse ─────────────────────────────
function renderTariffeStandardBanner(){
  const wrap=document.getElementById('tariffe-standard-wrap');
  if(!wrap)return;
  if(typeof BC_commesseLoaded==='undefined'||!BC_commesseLoaded||!BC_commesse||!BC_commesse.length){wrap.innerHTML='';return}
  const {daAggiornare,nFasi}=tsCalcolaPiano();
  if(!daAggiornare.length){wrap.innerHTML='';return}
  wrap.innerHTML=`<div class="contab-import-banner">
    <div class="contab-import-banner-txt">💶 Tariffe standard (Senior 125€/h, Junior 39€/h) — ${daAggiornare.length} commesse (${nFasi} fasi) hanno tariffe diverse da aggiornare.</div>
    <button class="btn btn-blu btn-sm" onclick="tsApriAnteprima()">🔍 Anteprima e aggiornamento</button>
  </div>`;
}

// ── Anteprima dettagliata (nessuna scrittura) ───────────────────────────
function tsApriAnteprima(){
  const {daAggiornare,nFasi}=tsCalcolaPiano();
  const wrap=document.getElementById('tariffe-standard-wrap');
  if(!wrap)return;
  const esc=s=>String(s==null?'':s).replace(/</g,'&lt;');
  const righe=daAggiornare.flatMap(item=>item.fasiCambiate.map(f=>`
    <tr>
      <td style="padding:5px 8px;white-space:nowrap">${esc(item.numero)}</td>
      <td style="padding:5px 8px">${esc(item.committente||'—')}</td>
      <td style="padding:5px 8px">${esc(f.nome)}</td>
      <td style="padding:5px 8px;text-align:right">${f.vecchioSr}€ → <b>125€</b></td>
      <td style="padding:5px 8px;text-align:right">${f.vecchioJr}€ → <b>39€</b></td>
    </tr>`)).join('');
  wrap.innerHTML=`<div class="contab-import-banner" style="flex-direction:column;align-items:stretch;gap:10px">
    <div class="contab-import-banner-txt">💶 Anteprima aggiornamento tariffe — <b>${daAggiornare.length}</b> commesse, <b>${nFasi}</b> fasi da portare a Tariffa Senior 125€/h e Tariffa Junior 39€/h. Nessuna scrittura è ancora stata effettuata: controlla con calma, poi conferma in fondo.</div>
    <div style="max-height:340px;overflow:auto;border:1px solid var(--border);border-radius:8px">
      <table style="width:100%;font-size:12px;border-collapse:collapse">
        <thead style="position:sticky;top:0;background:#f4f4f4"><tr>
          <th style="text-align:left;padding:6px 8px">Numero</th><th style="text-align:left;padding:6px 8px">Committente</th><th style="text-align:left;padding:6px 8px">Fase</th>
          <th style="text-align:right;padding:6px 8px">Tariffa Senior</th><th style="text-align:right;padding:6px 8px">Tariffa Junior</th>
        </tr></thead><tbody>${righe}</tbody>
      </table>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn btn-sm" onclick="renderTariffeStandardBanner()">Annulla</button>
      <button class="btn btn-ink btn-sm" onclick="tsEseguiAggiornamento()">✅ Conferma e scrivi su Firestore</button>
    </div>
  </div>`;
}

// ── Scrittura effettiva (solo dopo conferma esplicita) ──────────────────
async function tsEseguiAggiornamento(){
  const {daAggiornare,nFasi}=tsCalcolaPiano();
  if(!daAggiornare.length){alert('Niente da aggiornare: tutte le tariffe sono già a Senior 125€/h e Junior 39€/h.');return}
  const msg=`Stai per scrivere su Firestore:\n\n`+
    `• ${daAggiornare.length} commesse aggiornate\n`+
    `• ${nFasi} fasi portate a Tariffa Senior 125€/h e Tariffa Junior 39€/h\n\n`+
    `Le altre voci della fase (monte ore, nomi, listino stampe) restano invariate.\n\nConfermi?`;
  if(!confirm(msg))return;

  const wrap=document.getElementById('tariffe-standard-wrap');
  const setProgress=(txt)=>{if(wrap)wrap.innerHTML='<div class="empty-state">'+txt+'</div>'};
  setProgress('Scrittura in corso, non chiudere la pagina...');

  for(let i=0;i<daAggiornare.length;i+=450){
    const chunk=daAggiornare.slice(i,i+450);
    const batch=db.batch();
    chunk.forEach(item=>{
      batch.set(db.collection('commesse').doc(item.numero),{fasi:item.fasi},{merge:true});
    });
    await batch.commit();
    setProgress('Scrittura in corso: '+Math.min(i+450,daAggiornare.length)+'/'+daAggiornare.length+' commesse...');
  }

  alert(`✓ Aggiornamento completato.\n\n${daAggiornare.length} commesse aggiornate, ${nFasi} fasi portate a Senior 125€/h e Junior 39€/h.`);
  await loadCommesse(true);
  try{if(typeof renderRubrica==='function')renderRubrica();}catch(e){}
  try{renderTariffeStandardBanner();}catch(e){}
}
