const MONTHS=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function baseRows(){
  return [
    {m:"IF1",s:"Flexografia",of:"",rnc:""},{m:"IF2",s:"Flexografia",of:"",rnc:""},
    {m:"IF3",s:"Flexografia",of:"",rnc:""},{m:"IF4",s:"Flexografia",of:"",rnc:""},
    {m:"IR1",s:"Rotogravura",of:"",rnc:""},{m:"IR3",s:"Rotogravura",of:"",rnc:""},
    {m:"IR4",s:"Rotogravura",of:"",rnc:""},{m:"IR5",s:"Rotogravura",of:"",rnc:""}
  ];
}

function storageKey(year,month){return `rnc_${year}_${month}`;}
function num(v){return v===""||v===undefined||v===null?0:Number(v);}
function saveMonthData(year,month,rows){localStorage.setItem(storageKey(year,month),JSON.stringify(rows));}
function loadMonthData(year,month){const saved=localStorage.getItem(storageKey(year,month));return saved?JSON.parse(saved):baseRows();}
function deleteMonthData(year,month){localStorage.removeItem(storageKey(year,month));}
function yearRows(year){
  const acc=baseRows().map(d=>({...d,of:0,rnc:0}));
  for(let m=0;m<12;m++){
    const saved=localStorage.getItem(storageKey(year,m));
    if(!saved) continue;
    JSON.parse(saved).forEach(row=>{
      const found=acc.find(a=>a.m===row.m);
      if(found){found.of=num(found.of)+num(row.of);found.rnc=num(found.rnc)+num(row.rnc);}
    });
  }
  return acc;
}

function exportAllData(){
  const payload={
    app:"RNC Impressao",
    version:1,
    exportedAt:new Date().toISOString(),
    data:{}
  };
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k && k.startsWith("rnc_")) payload.data[k]=JSON.parse(localStorage.getItem(k));
  }
  return payload;
}

function importAllData(payload){
  if(!payload || !payload.data || typeof payload.data!=="object") throw new Error("Ficheiro inválido.");
  Object.keys(payload.data).forEach(k=>{
    if(k.startsWith("rnc_")) localStorage.setItem(k,JSON.stringify(payload.data[k]));
  });
}
