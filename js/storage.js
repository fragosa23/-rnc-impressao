const MONTHS=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const SECTIONS=[{id:"Flexografia",name:"Flexografia"},{id:"Rotogravura",name:"Rotogravura"}];
const MACHINES=[
  {id:"IF1",name:"IF1",section:"Flexografia"},{id:"IF2",name:"IF2",section:"Flexografia"},
  {id:"IF3",name:"IF3",section:"Flexografia"},{id:"IF4",name:"IF4",section:"Flexografia"},
  {id:"IR1",name:"IR1",section:"Rotogravura"},{id:"IR3",name:"IR3",section:"Rotogravura"},
  {id:"IR4",name:"IR4",section:"Rotogravura"},{id:"IR5",name:"IR5",section:"Rotogravura"}
];

function baseRows(){return MACHINES.map(m=>({m:m.id,s:m.section,teamId:"",of:"",rnc:""}));}
function defaultMeta(){return{teams:[],workers:[]};}
function storageKey(year,month){return `rnc_${year}_${month}`;}
function num(v){return v===""||v===undefined||v===null?0:Number(v);}
function saveMonthData(year,month,rows){localStorage.setItem(storageKey(year,month),JSON.stringify(rows));}
function loadMonthData(year,month){const saved=localStorage.getItem(storageKey(year,month));return saved?JSON.parse(saved):baseRows();}
function deleteMonthData(year,month){localStorage.removeItem(storageKey(year,month));}
function loadMeta(){const raw=localStorage.getItem("rnc_meta");return raw?JSON.parse(raw):defaultMeta();}
function saveMeta(meta){localStorage.setItem("rnc_meta",JSON.stringify(meta));}
function newId(prefix){return prefix+"_"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function yearRows(year){
  const acc=baseRows().map(d=>({...d,of:0,rnc:0}));
  for(let m=0;m<12;m++){
    const saved=localStorage.getItem(storageKey(year,m));
    if(!saved) continue;
    JSON.parse(saved).forEach(row=>{
      const found=acc.find(a=>a.m===row.m && (a.teamId||"")===(row.teamId||""));
      if(found){found.of=num(found.of)+num(row.of);found.rnc=num(found.rnc)+num(row.rnc);}
      else acc.push({...row,of:num(row.of),rnc:num(row.rnc)});
    });
  }
  return acc;
}
function allProductionRows(){
  const rows=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(!k || !k.startsWith("rnc_") || k==="rnc_meta") continue;
    const parts=k.split("_");
    const year=Number(parts[1]),month=Number(parts[2]);
    JSON.parse(localStorage.getItem(k)).forEach(r=>rows.push({...r,year,month}));
  }
  return rows;
}
function exportAllData(){
  const payload={app:"RNC Impressao",version:2,exportedAt:new Date().toISOString(),meta:loadMeta(),data:{}};
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k && k.startsWith("rnc_") && k!=="rnc_meta") payload.data[k]=JSON.parse(localStorage.getItem(k));
  }
  return payload;
}
function importAllData(payload){
  if(!payload || !payload.data || typeof payload.data!=="object") throw new Error("Ficheiro inválido.");
  if(payload.meta) saveMeta(payload.meta);
  Object.keys(payload.data).forEach(k=>{if(k.startsWith("rnc_")) localStorage.setItem(k,JSON.stringify(payload.data[k]));});
}
