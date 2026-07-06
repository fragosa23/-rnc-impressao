let inputData=baseRows();
let monthlyMonth=4,monthlyYear=2026,annualYear=2026,comparisonMonth=4,comparisonYear=2026;

function go(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  if(id==="monthly")renderMonthly();
  if(id==="annual")renderAnnual();
  if(id==="comparison")renderComparison();
  if(id==="teams")renderTeams();
  if(id==="input")renderInputs();
}

function init(){
  document.querySelectorAll("[data-go]").forEach(btn=>btn.addEventListener("click",()=>go(btn.dataset.go)));
  document.getElementById("inMes").innerHTML=MONTHS.map((m,i)=>`<option value="${i}" ${i===4?"selected":""}>${m}</option>`).join("");
  document.getElementById("saveMonth").addEventListener("click",saveCurrentMonth);
  document.getElementById("loadMonth").addEventListener("click",loadInputMonth);
  document.getElementById("loadExample").addEventListener("click",loadExample);
  document.getElementById("clearInputs").addEventListener("click",clearInputs);
  document.getElementById("deleteMonth").addEventListener("click",deleteCurrentMonth);
  document.getElementById("exportBackup").addEventListener("click",downloadBackupFile);
  document.getElementById("importBackup").addEventListener("change",handleBackupImport);
  document.getElementById("prevMonth").addEventListener("click",()=>changeMonth(-1));
  document.getElementById("nextMonth").addEventListener("click",()=>changeMonth(1));
  document.getElementById("prevYear").addEventListener("click",()=>changeYear(-1));
  document.getElementById("nextYear").addEventListener("click",()=>changeYear(1));
  document.getElementById("prevCompMonth").addEventListener("click",()=>changeComparisonMonth(-1));
  document.getElementById("nextCompMonth").addEventListener("click",()=>changeComparisonMonth(1));
  document.getElementById("addTeam").addEventListener("click",addTeam);
  document.getElementById("addWorker").addEventListener("click",addWorker);
  ["filterSection","filterMachine","filterTeam","workerSearch"].forEach(id=>document.getElementById(id).addEventListener("input",renderTeamExplorer));
  document.getElementById("teamSection").addEventListener("change",renderTeamMachineOptions);
  setupSwipe("monthly",changeMonth);setupSwipe("annual",changeYear);setupSwipe("comparison",changeComparisonMonth);
  loadInputMonth();renderTeamControls();
}

function setupSwipe(id,callback){let startX=null;document.getElementById(id).addEventListener("touchstart",e=>{startX=e.touches[0].clientX},{passive:true});document.getElementById(id).addEventListener("touchend",e=>{if(startX===null)return;const dx=e.changedTouches[0].clientX-startX;if(Math.abs(dx)>60)callback(dx<0?1:-1);startX=null},{passive:true});}
function teamsFor(section,machine){const meta=loadMeta();return meta.teams.filter(t=>(!section||t.section===section)&&(!machine||!t.machineId||t.machineId===machine));}
function teamName(id){const t=loadMeta().teams.find(x=>x.id===id);return t?t.name:"Sem equipa";}
function renderInputs(){
  document.getElementById("inputRows").innerHTML=inputData.map((d,i)=>{
    const opts=[`<option value="">Sem equipa</option>`].concat(teamsFor(d.s,d.m).map(t=>`<option value="${t.id}" ${d.teamId===t.id?"selected":""}>${t.name}</option>`)).join("");
    return `<tr><td class="sec">${d.s}</td><td class="left">${d.m}</td><td><select onchange="inputData[${i}].teamId=this.value">${opts}</select></td><td><input class="data-input" type="number" min="0" value="${d.of}" placeholder="0" oninput="inputData[${i}].of=this.value"></td><td><input class="data-input" type="number" min="0" value="${d.rnc}" placeholder="0" oninput="inputData[${i}].rnc=this.value"></td></tr>`;
  }).join("");
}
function saveCurrentMonth(){const year=Number(document.getElementById("inAno").value),month=Number(document.getElementById("inMes").value);saveMonthData(year,month,inputData);monthlyYear=year;monthlyMonth=month;annualYear=year;comparisonYear=year;comparisonMonth=month;document.getElementById("saveStatus").innerHTML=`Guardado: <b>${MONTHS[month]} ${year}</b>.`;}
function loadInputMonth(){const year=Number(document.getElementById("inAno").value),month=Number(document.getElementById("inMes").value);inputData=loadMonthData(year,month);renderInputs();document.getElementById("saveStatus").innerHTML=`Carregado/novo: <b>${MONTHS[month]} ${year}</b>.`;}
function deleteCurrentMonth(){const year=Number(document.getElementById("inAno").value),month=Number(document.getElementById("inMes").value);if(confirm(`Apagar ${MONTHS[month]} ${year}?`)){deleteMonthData(year,month);clearInputs();document.getElementById("saveStatus").innerHTML=`Apagado: <b>${MONTHS[month]} ${year}</b>.`;}}
function downloadBackupFile(){const data=exportAllData();const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");const date=new Date().toISOString().slice(0,10);a.href=url;a.download=`RNC_Impressao_${date}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);document.getElementById("saveStatus").innerHTML="Ficheiro de dados exportado.";}
function handleBackupImport(event){const file=event.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{importAllData(JSON.parse(reader.result));loadInputMonth();renderTeamControls();document.getElementById("saveStatus").innerHTML=`Importado: <b>${file.name}</b>.`;}catch(err){alert("Não foi possível importar o ficheiro.");}event.target.value="";};reader.readAsText(file);}
function clearInputs(){inputData=baseRows();renderInputs();}
function loadExample(){const ex={IF1:[150,5],IF2:[110,3],IF3:[180,1],IF4:[165,9],IR1:[10,2],IR3:[110,3],IR4:[120,2],IR5:[155,6]};inputData=baseRows();inputData.forEach(d=>{d.of=ex[d.m][0];d.rnc=ex[d.m][1];});renderInputs();}
function changeMonth(delta){monthlyMonth+=delta;if(monthlyMonth<0){monthlyMonth=11;monthlyYear--;}if(monthlyMonth>11){monthlyMonth=0;monthlyYear++;}renderMonthly();}
function changeYear(delta){annualYear+=delta;renderAnnual();}
function changeComparisonMonth(delta){comparisonMonth+=delta;if(comparisonMonth<0){comparisonMonth=11;comparisonYear--;}if(comparisonMonth>11){comparisonMonth=0;comparisonYear++;}renderComparison();}
function renderMonthly(){document.getElementById("monthlyTitle").textContent=`${MONTHS[monthlyMonth]} ${monthlyYear}`;document.getElementById("monthlyReport").innerHTML=reportHTML(`Impressão — ${MONTHS[monthlyMonth]} ${monthlyYear}`,loadMonthData(monthlyYear,monthlyMonth));}
function renderAnnual(){document.getElementById("annualTitle").textContent=annualYear;document.getElementById("annualReport").innerHTML=reportHTML(`Impressão — acumulado anual ${annualYear}`,yearRows(annualYear),trendYearHTML(annualYear));}
function renderComparison(){document.getElementById("comparisonTitle").textContent=`${MONTHS[comparisonMonth]} ${comparisonYear}`;document.getElementById("comparisonReport").innerHTML=comparisonHTML(`Comparação mensal — ${MONTHS[comparisonMonth]} ${comparisonYear}`,loadMonthData(comparisonYear,comparisonMonth))+comparisonHTML(`Comparação acumulada do ano — ${comparisonYear}`,yearRows(comparisonYear));}

function renderTeamMachineOptions(){const sec=document.getElementById("teamSection").value;document.getElementById("teamMachine").innerHTML=MACHINES.filter(m=>m.section===sec).map(m=>`<option value="${m.id}">${m.name}</option>`).join("");}
function renderTeamControls(){const meta=loadMeta();document.getElementById("teamSection").innerHTML=SECTIONS.map(s=>`<option value="${s.id}">${s.name}</option>`).join("");renderTeamMachineOptions();document.getElementById("workerTeam").innerHTML=meta.teams.map(t=>`<option value="${t.id}">${t.name}</option>`).join("");document.getElementById("filterSection").innerHTML=`<option value="">Todas</option>`+SECTIONS.map(s=>`<option value="${s.id}">${s.name}</option>`).join("");document.getElementById("filterMachine").innerHTML=`<option value="">Todas</option>`+MACHINES.map(m=>`<option value="${m.id}">${m.name}</option>`).join("");document.getElementById("filterTeam").innerHTML=`<option value="">Todas</option>`+meta.teams.map(t=>`<option value="${t.id}">${t.name}</option>`).join("");renderTeamExplorer();}
function addTeam(){const name=document.getElementById("teamName").value.trim();if(!name)return;const meta=loadMeta();meta.teams.push({id:newId("team"),name,section:document.getElementById("teamSection").value,machineId:document.getElementById("teamMachine").value,members:[]});saveMeta(meta);document.getElementById("teamName").value="";renderTeamControls();renderInputs();}
function addWorker(){const name=document.getElementById("workerName").value.trim();if(!name)return;const teamId=document.getElementById("workerTeam").value;const meta=loadMeta();const id=newId("worker");meta.workers.push({id,name,role:document.getElementById("workerRole").value.trim(),teamId,notes:""});const team=meta.teams.find(t=>t.id===teamId);if(team)team.members=[...(team.members||[]),id];saveMeta(meta);document.getElementById("workerName").value="";document.getElementById("workerRole").value="";renderTeamControls();}
function aggregate(rows){const of=rows.reduce((a,r)=>a+num(r.of),0),rnc=rows.reduce((a,r)=>a+num(r.rnc),0);return{of,rnc,taxa:of?rnc/of*100:null,ofRnc:rnc?of/rnc:null};}
function workerRows(worker){return allProductionRows().filter(r=>r.teamId===worker.teamId);}
function renderCard(title,subtitle,rows,extra=""){const a=aggregate(rows);return `<div class="card"><h2>${title}</h2><p class="small">${subtitle}</p><div class="grid"><div class="kpi">OF<b>${a.of}</b></div><div class="kpi">RNC<b>${a.rnc}</b></div><div class="kpi">Taxa<b>${fmt(a.taxa)}</b></div><div class="kpi">OF/RNC<b>${a.ofRnc?String(a.ofRnc.toFixed(1)).replace(".",","):"Sem RNC"}</b></div></div>${extra}</div>`;}
function renderTeamExplorer(){const meta=loadMeta();const sec=document.getElementById("filterSection").value;const mach=document.getElementById("filterMachine").value;const team=document.getElementById("filterTeam").value;const q=document.getElementById("workerSearch").value.toLowerCase().trim();let rows=allProductionRows();if(sec)rows=rows.filter(r=>r.s===sec);if(mach)rows=rows.filter(r=>r.m===mach);if(team)rows=rows.filter(r=>r.teamId===team);let html="";if(sec)html+=renderCard(`Ficha da secção — ${sec}`,"Dados agregados da secção selecionada.",allProductionRows().filter(r=>r.s===sec));if(mach)html+=renderCard(`Ficha da máquina — ${mach}`,"Dados agregados da máquina selecionada.",allProductionRows().filter(r=>r.m===mach));if(team){const t=meta.teams.find(x=>x.id===team);const members=meta.workers.filter(w=>w.teamId===team).map(w=>w.name).join(", ")||"Sem trabalhadores registados";html+=renderCard(`Ficha da equipa — ${t?t.name:"Equipa"}`,`Membros: ${members}`,allProductionRows().filter(r=>r.teamId===team));}if(q){meta.workers.filter(w=>w.name.toLowerCase().includes(q)).forEach(w=>{html+=renderCard(`Ficha do trabalhador — ${w.name}`,`Função: ${w.role||"—"}. Dados associados à equipa, não desempenho individual direto.`,workerRows(w));});}const teams=meta.teams.map(t=>{const a=aggregate(allProductionRows().filter(r=>r.teamId===t.id));return{t,a};}).sort((x,y)=>(x.a.taxa??999)-(y.a.taxa??999));html+=`<div class="card"><h2>Ranking de equipas</h2><table><tr><th>Equipa</th><th>Secção</th><th>Máquina</th><th>OF</th><th>RNC</th><th>Taxa</th></tr>${teams.map(x=>`<tr><td>${x.t.name}</td><td>${x.t.section}</td><td>${x.t.machineId||"—"}</td><td>${x.a.of}</td><td>${x.a.rnc}</td><td>${fmt(x.a.taxa)}</td></tr>`).join("")}</table></div>`;document.getElementById("teamExplorer").innerHTML=html||"<p class='small'>Cria equipas e trabalhadores para ver as fichas.</p>";}
function renderTeams(){renderTeamControls();}

document.addEventListener("DOMContentLoaded",init);
