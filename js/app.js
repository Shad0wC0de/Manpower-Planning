import {staffInterval} from './core/erlang.js';
const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']; let profile=[]; let plan=[]; let activeCell=null; let selectionAnchor=null; let isSelecting=false;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

function initAccentTheme(){
 const picker=$('#accentTheme'); if(!picker)return;
 picker.value='blue'; document.body.dataset.accent='blue';
 picker.addEventListener('change',()=>{document.body.dataset.accent=picker.value});
}

function initDate(){const d=new Date();d.setMonth(d.getMonth()+1);$('#startMonth').value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function buildHoop(){const root=$('#hoop');root.innerHTML='';days.forEach((d,i)=>{const div=document.createElement('div');div.className='day';const closed=i===0||i===6;div.innerHTML=`<div><strong>${d}</strong> <label style="display:inline;float:right"><input class="opencheck" data-day="${i}" type="checkbox" ${closed?'':'checked'}> open</label></div><div class="times"><label class="time-field"><span>Start</span><input class="open" data-day="${i}" type="time" value="08:00"></label><label class="time-field"><span>End</span><input class="close" data-day="${i}" type="time" value="17:00"></label></div>`;root.appendChild(div)});$$('.opencheck').forEach(x=>x.addEventListener('change',()=>{x.closest('.day').classList.toggle('closed',!x.checked);recalc()}));$$('#hoop input').forEach(x=>x.addEventListener('change',recalc));$$('.opencheck').forEach(x=>x.closest('.day').classList.toggle('closed',!x.checked))}
function hoopHoursPerWeek(){let h=0;$$('.opencheck').forEach(c=>{if(!c.checked)return;const i=c.dataset.day,o=$(`.open[data-day="${i}"]`).value,cl=$(`.close[data-day="${i}"]`).value;const [oh,om]=o.split(':').map(Number),[ch,cm]=cl.split(':').map(Number);h+=Math.max(0,(ch*60+cm-oh*60-om)/60)});return h}
const rows=[['Assumptions','group'],['Volume','volume','100000'],['AHT (sec)','aht','420'],['SL Target (%)','sl','80'],['SL Threshold (sec)','threshold','30'],['Occupancy Cap (%)','occ','85'],['Shrinkage (%)','shrink','25'],['Outputs','group'],['Operating Hours / Month','opHours','out'],['Avg Volume / Interval','avgInt','out'],['Staff Required — Pre-Shrink','pre','out'],['Staff Required — Post-Shrink','post','out'],['Achieved SL (%)','achSL','out'],['ASA (sec)','asa','out'],['Occupancy (%)','achOcc','out'],['Estimated Monthly FTE','fte','out']];
function months(){const [y,m]=$('#startMonth').value.split('-').map(Number),n=+$('#horizon').value;return Array.from({length:n},(_,i)=>new Date(y,m-1+i,1))}
function buildPlan(){const ms=months();plan=ms.map((d,i)=>plan[i]||{});let html='<thead><tr><th>Metric</th>'+ms.map(d=>`<th>${d.toLocaleString('en',{month:'short',year:'2-digit'})}</th>`).join('')+'</tr></thead><tbody>';for(const r of rows){if(r[1]==='group'){html+=`<tr class="group"><td colspan="${ms.length+1}">${r[0]}</td></tr>`;continue}html+=`<tr><td>${r[0]}</td>`;ms.forEach((d,i)=>{if(r[2]==='out')html+=`<td class="output" data-out="${r[1]}" data-i="${i}">—</td>`;else{const prev=plan[i][r[1]]??(i?plan[i-1][r[1]]:r[2]);plan[i][r[1]]=prev;html+=`<td class="input-cell" data-key="${r[1]}" data-i="${i}"><input data-key="${r[1]}" data-i="${i}" type="number" value="${prev}"></td>`}});html+='</tr>'}$('#planTable').innerHTML=html;$$('#planTable input').forEach(x=>x.addEventListener('input',e=>{plan[+e.target.dataset.i][e.target.dataset.key]=+e.target.value;recalc()}));setupGridClipboard();recalc();buildValidation()}
function recalc(){if(!plan.length)return;const weekH=hoopHoursPerWeek(),interval=+$('#interval').value,paid=+$('#paidHours').value||8;plan.forEach((p,i)=>{const monthH=weekH*52/12,intervals=monthH/(interval/60),vpi=p.volume/Math.max(1,intervals);const r=staffInterval({volume:vpi,aht:p.aht,intervalMinutes:interval,slTarget:p.sl/100,slTime:p.threshold,occCap:p.occ/100,shrinkage:p.shrink/100});const productiveHours=monthH*(1-p.shrink/100);const fte=(r.post*monthH)/(paid*5*52/12);const vals={opHours:monthH,avgInt:vpi,pre:r.N,post:r.post,achSL:r.sl*100,asa:r.asa,achOcc:r.occ*100,fte};p.results=vals;Object.entries(vals).forEach(([k,v])=>{const el=$(`[data-out="${k}"][data-i="${i}"]`);if(el)el.textContent=Number.isFinite(v)?(k==='pre'?Math.ceil(v):v.toFixed(2)):'—'})}); if($('#validationTable'))buildValidation()}

const inputKeys=rows.filter(r=>r[1]!=='group'&&r[2]!=='out').map(r=>r[1]);
function cellCoords(td){return{r:inputKeys.indexOf(td.dataset.key),c:+td.dataset.i}}
function cellAt(r,c){return $(`#planTable td.input-cell[data-key="${inputKeys[r]}"][data-i="${c}"]`)}
function selectedCells(){return $$('#planTable td.input-cell.selected')}
function clearSelection(){selectedCells().forEach(c=>c.classList.remove('selected','active-cell'))}
function selectRect(a,b){clearSelection();const A=cellCoords(a),B=cellCoords(b),r1=Math.min(A.r,B.r),r2=Math.max(A.r,B.r),c1=Math.min(A.c,B.c),c2=Math.max(A.c,B.c);for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++)cellAt(r,c)?.classList.add('selected');b.classList.add('active-cell');activeCell=b}
function setupGridClipboard(){
 const cells=$$('#planTable td.input-cell');
 cells.forEach(td=>{
  td.addEventListener('mousedown',e=>{if(e.button!==0)return;isSelecting=true;if(e.shiftKey&&selectionAnchor)selectRect(selectionAnchor,td);else{selectionAnchor=td;selectRect(td,td)}});
  td.addEventListener('mouseenter',()=>{if(isSelecting&&selectionAnchor)selectRect(selectionAnchor,td)});
  td.querySelector('input').addEventListener('focus',()=>{if(!isSelecting){selectionAnchor=td;selectRect(td,td)}});
 });
 document.onmouseup=()=>isSelecting=false;
}
function selectionBounds(){const cells=selectedCells();if(!cells.length&&activeCell)return{r1:cellCoords(activeCell).r,r2:cellCoords(activeCell).r,c1:cellCoords(activeCell).c,c2:cellCoords(activeCell).c};if(!cells.length)return null;const cs=cells.map(cellCoords);return{r1:Math.min(...cs.map(x=>x.r)),r2:Math.max(...cs.map(x=>x.r)),c1:Math.min(...cs.map(x=>x.c)),c2:Math.max(...cs.map(x=>x.c))}}
function selectionTSV(){const b=selectionBounds();if(!b)return'';let out=[];for(let r=b.r1;r<=b.r2;r++){let row=[];for(let c=b.c1;c<=b.c2;c++)row.push(cellAt(r,c)?.querySelector('input').value??'');out.push(row.join('\t'))}return out.join('\n')}
function setCellValue(r,c,value){const td=cellAt(r,c);if(!td)return;const input=td.querySelector('input');const cleaned=String(value).trim().replace(/,/g,'').replace(/%$/,'');if(cleaned===''||Number.isNaN(Number(cleaned)))return;input.value=cleaned;plan[c][input.dataset.key]=+cleaned}
function pasteTSV(text){if(!activeCell)return;const start=cellCoords(activeCell),matrix=text.replace(/\r/g,'').split('\n').filter((x,i,a)=>x!==''||i<a.length-1).map(r=>r.split('\t'));if(!matrix.length)return;matrix.forEach((row,ri)=>row.forEach((v,ci)=>setCellValue(start.r+ri,start.c+ci,v)));const er=Math.min(inputKeys.length-1,start.r+matrix.length-1),ec=Math.min(plan.length-1,start.c+Math.max(...matrix.map(r=>r.length))-1);selectRect(cellAt(start.r,start.c),cellAt(er,ec));recalc()}
function fillRight(){if(!activeCell)return;const {r,c}=cellCoords(activeCell),value=activeCell.querySelector('input').value;for(let col=c+1;col<plan.length;col++)setCellValue(r,col,value);selectRect(activeCell,cellAt(r,plan.length-1));recalc()}
document.addEventListener('copy',e=>{if(!activeCell||!$('#plan').classList.contains('active'))return;const t=selectionTSV();if(!t)return;e.clipboardData.setData('text/plain',t);e.preventDefault()});
document.addEventListener('paste',e=>{if(!activeCell||!$('#plan').classList.contains('active'))return;const t=e.clipboardData.getData('text/plain');if(!t)return;e.preventDefault();pasteTSV(t)});

function parseCSV(text){const lines=text.trim().split(/\r?\n/);const headers=lines.shift().split(',').map(x=>x.trim().toLowerCase());return lines.map(l=>{const c=l.split(',');let o={};headers.forEach((h,i)=>o[h]=c[i]?.trim());return o})}
function renderIntervals(){const tb=$('#intervalTable tbody');tb.innerHTML='';const interval=+$('#interval').value;profile.slice(0,500).forEach(x=>{const r=staffInterval({volume:+x.volume,aht:+x.aht,intervalMinutes:interval,slTarget:.8,slTime:30,occCap:.85,shrinkage:.25});tb.insertAdjacentHTML('beforeend',`<tr><td>${x.date||''}</td><td>${x.interval||''}</td><td>${x.volume}</td><td>${x.aht}</td><td>${r.A.toFixed(2)}</td><td>${r.N}</td><td>${(r.sl*100).toFixed(1)}%</td><td>${r.asa.toFixed(1)}</td><td>${(r.occ*100).toFixed(1)}%</td><td>${r.post.toFixed(2)}</td></tr>`)})}
function scenarioUI(){const fields=[['Volume','volume',100000],['AHT','aht',420],['SL Target %','sl',80],['SL Threshold sec','threshold',30],['Occupancy Cap %','occ',85],['Shrinkage %','shrink',25],['Available Staff','staff',50]];$('#scenarioGrid').innerHTML=['A','B'].map((s,si)=>`<div class="scenario-box"><h3>Scenario ${s}</h3>${fields.map(f=>`<div class="field"><label>${f[0]}</label><input id="s${s}-${f[1]}" type="number" value="${f[2]*(si&&f[1]==='volume'?1.1:1)}"></div>`).join('')}</div>`).join('')}
function runScenario(){const interval=+$('#interval').value,weekH=hoopHoursPerWeek(),monthH=weekH*52/12,ints=monthH/(interval/60);const get=s=>{let o={};['volume','aht','sl','threshold','occ','shrink','staff'].forEach(k=>o[k]=+$(`#s${s}-${k}`).value);const r=staffInterval({volume:o.volume/ints,aht:o.aht,intervalMinutes:interval,slTarget:o.sl/100,slTime:o.threshold,occCap:o.occ/100,shrinkage:o.shrink/100});const staffPre=o.staff*(1-o.shrink/100),vpi=o.volume/ints,A=(vpi/(interval/60))*o.aht/3600;const actual=staffInterval({volume:vpi,aht:o.aht,intervalMinutes:interval,slTarget:0,slTime:o.threshold,occCap:null,shrinkage:0});return{o,r,required:r.post,gap:o.staff-r.post,actualOcc:A/Math.max(.0001,staffPre)}};const a=get('A'),b=get('B');const rs=[['Required staff',a.required,b.required],['Staffing gap',a.gap,b.gap],['Required pre-shrink',a.r.N,b.r.N],['Achieved SL at requirement %',a.r.sl*100,b.r.sl*100],['ASA at requirement',a.r.asa,b.r.asa],['Occupancy at requirement %',a.r.occ*100,b.r.occ*100],['Workload occupancy vs available %',a.actualOcc*100,b.actualOcc*100]];$('#scenarioTable').innerHTML='<thead><tr><th>Metric</th><th>A</th><th>B</th><th>Δ B-A</th></tr></thead><tbody>'+rs.map(r=>`<tr><td>${r[0]}</td><td>${r[1].toFixed(2)}</td><td>${r[2].toFixed(2)}</td><td>${(r[2]-r[1]).toFixed(2)}</td></tr>`).join('')+'</tbody>'}
let validationRefs=[];
function buildValidation(){
 const table=$('#validationTable'); if(!table||!plan.length)return;
 const old=validationRefs.slice(); validationRefs=plan.map((_,i)=>old[i]??''); const ms=months();
 const planner=plan.map(p=>p.results?.fte);
 table.innerHTML='<thead><tr><th>Metric</th>'+ms.map(d=>`<th>${d.toLocaleString('en',{month:'short',year:'2-digit'})}</th>`).join('')+'</tr></thead><tbody>'+
 `<tr><td>Planning File FTE</td>${validationRefs.map((v,i)=>`<td class="validation-input"><input data-vi="${i}" inputmode="decimal" value="${v}"></td>`).join('')}</tr>`+
 `<tr><td>WFM Planner FTE</td>${planner.map(v=>`<td>${Number.isFinite(v)?v.toFixed(2):'—'}</td>`).join('')}</tr>`+
 `<tr><td>Variance</td>${planner.map((v,i)=>`<td data-vout="err" data-i="${i}">—</td>`).join('')}</tr>`+
 `<tr><td>Absolute Variance</td>${planner.map((v,i)=>`<td data-vout="abs" data-i="${i}">—</td>`).join('')}</tr>`+
 `<tr><td>Absolute % Error</td>${planner.map((v,i)=>`<td data-vout="ape" data-i="${i}">—</td>`).join('')}</tr></tbody>';
 $$('#validationTable input').forEach(x=>x.addEventListener('input',e=>{validationRefs[+e.target.dataset.vi]=e.target.value;calcValidation()}));
 calcValidation();
}
function calcValidation(){
 if(!plan.length)return; const errors=[],absErrors=[],apes=[];
 plan.forEach((p,i)=>{const ref=Number(String(validationRefs[i]??'').replace(/,/g,'')),valid=String(validationRefs[i]??'').trim()!==''&&Number.isFinite(ref),ours=p.results?.fte;let err,ab,ape;
  if(valid&&Number.isFinite(ours)){err=ours-ref;ab=Math.abs(err);if(ref!==0)ape=ab/Math.abs(ref);errors.push(err);absErrors.push(ab);if(Number.isFinite(ape))apes.push(ape)}
  const put=(k,v,fmt)=>{const el=$(`[data-vout="${k}"][data-i="${i}"]`);if(el)el.textContent=Number.isFinite(v)?fmt(v):'—'};
  put('err',err,v=>(v>=0?'+':'')+v.toFixed(2));put('abs',ab,v=>v.toFixed(2));put('ape',ape,v=>(v*100).toFixed(2)+'%');
 });
 const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:NaN; const summary=$('#validationSummary');if(!summary)return;
 const cards=[['Months Compared',errors.length,0],['Mean Error',mean(errors),'fte'],['MAE',mean(absErrors),'fte'],['MAPE',mean(apes),'pct'],['Min Error',errors.length?Math.min(...errors):NaN,'fte'],['Max Error',errors.length?Math.max(...errors):NaN,'fte']];
 summary.innerHTML=cards.map(([label,v,t])=>`<div class="metric-card"><span>${label}</span><strong>${t==='pct'&&Number.isFinite(v)?(v*100).toFixed(3)+'%':t==='fte'&&Number.isFinite(v)?(v>=0&&label!=='MAE'?'+':'')+v.toFixed(3)+' FTE':v}</strong></div>`).join('');
}
function clearValidation(){validationRefs=plan.map(()=> '');buildValidation()}
function exportXlsx(){
  const ms=months();
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const data=[['Metric',...ms.map(d=>d.toLocaleString('en',{month:'short',year:'numeric'}))]];
  rows.filter(r=>r[1]!=='group').forEach(r=>data.push([r[0],...plan.map(p=>r[2]==='out'?p.results?.[r[1]]??'':p[r[1]])]));
  const table=data.map((row,ri)=>'<tr>'+row.map(v=>`<${ri===0?'th':'td'}>${esc(v)}</${ri===0?'th':'td'}>`).join('')+'</tr>').join('');
  const html=`<!doctype html><html><head><meta charset="utf-8"><style>table{border-collapse:collapse;font-family:Arial,sans-serif}th,td{border:1px solid #999;padding:5px 8px}th{background:#e9eef5;font-weight:700}</style></head><body><table>${table}</table></body></html>`;
  const blob=new Blob(['\ufeff',html],{type:'application/vnd.ms-excel;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='WFM_Planner.xls';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
$$('.tab').forEach(b=>b.onclick=()=>{$$('.tab,.page').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.tab).classList.add('active')});$('#rebuild').onclick=buildPlan;$('#fillRight').onclick=fillRight;$('#export').onclick=exportXlsx;$('#interval').onchange=()=>{recalc();renderIntervals()};$('#paidHours').oninput=recalc;$('#copyHoop').onclick=()=>{const o=$('.open[data-day="1"]').value,c=$('.close[data-day="1"]').value;[1,2,3,4,5].forEach(i=>{$(`.open[data-day="${i}"]`).value=o;$(`.close[data-day="${i}"]`).value=c;$$('.opencheck')[i].checked=true});recalc()};$('#csvFile').onchange=async e=>{profile=parseCSV(await e.target.files[0].text());$('#importStatus').textContent=`${profile.length} intervals loaded.`;renderIntervals()};$('#template').onclick=()=>{const blob=new Blob(['Date,Interval,Volume,AHT\n2026-10-05,08:00,22,410\n2026-10-05,08:30,31,425\n'],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='interval_template.csv';a.click()};$('#runScenario').onclick=runScenario;$('#clearValidation').onclick=clearValidation;initAccentTheme();initDate();buildHoop();scenarioUI();buildPlan();runScenario();
