const DB_KEY="rnc_impressao_v3";
const MONTHS=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function uid(prefix){return prefix+"_"+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function n(v){return v===""||v===null||v===undefined?0:Number(v)}
function rate(rnc,of){return n(of)>0?n(rnc)/n(of)*100:null}
function fmt(v){return v===null||Number.isNaN(v)?"N/A":v.toFixed(2).replace(".",",")+"%"}
function cls(v,avg){if(v===null)return"";if(v===0)return"green";if(v<=avg)return"yellow";if(v<=5)return"orange";return"red"}

function seedDb(){return{
  app:"RNC Impressão",version:3,updatedAt:new Date().toISOString(),
  sections:[{id:"flexo",name:"Flexografia"},{id:"roto",name:"Rotogravura"}],
  machines:[
    {id:"IF1",name:"IF1",sectionId:"flexo",manufacturer:"",year:"",colors:"",width:"",notes:""},
    {id:"IF2",name:"IF2",sectionId:"flexo",manufacturer:"",year:"",colors:"",width:"",notes:""},
    {id:"IF3",name:"IF3",sectionId:"flexo",manufacturer:"",year:"",colors:"",width:"",notes:""},
    {id:"IF4",name:"IF4",sectionId:"flexo",manufacturer:"",year:"",colors:"",width:"",notes:""},
    {id:"IR1",name:"IR1",sectionId:"roto",manufacturer:"",year:"",colors:"",width:"",notes:""},
    {id:"IR3",name:"IR3",sectionId:"roto",manufacturer:"",year:"",colors:"",width:"",notes:""},
    {id:"IR4",name:"IR4",sectionId:"roto",manufacturer:"",year:"",colors:"",width:"",notes:""},
    {id:"IR5",name:"IR5",sectionId:"roto",manufacturer:"",year:"",colors:"",width:"",notes:""}
  ],
  teams:[],workers:[],productionRecords:[],rncCauses:[],trainingRecords:[]
}}
function loadDb(){const raw=localStorage.getItem(DB_KEY);return raw?JSON.parse(raw):seedDb()}
function saveDb(db){db.updatedAt=new Date().toISOString();localStorage.setItem(DB_KEY,JSON.stringify(db))}
function exportDb(){return loadDb()}
function importDb(payload){if(!payload||payload.version<3)throw new Error("Ficheiro inválido ou antigo.");localStorage.setItem(DB_KEY,JSON.stringify(payload))}
function sectionName(db,id){return (db.sections.find(x=>x.id===id)||{}).name||id}
function machineName(db,id){return (db.machines.find(x=>x.id===id)||{}).name||id}
function teamName(db,id){return (db.teams.find(x=>x.id===id)||{}).name||"Sem equipa"}
function workerName(db,id){return (db.workers.find(x=>x.id===id)||{}).name||id}
function recordsFor(db,filter={}){return db.productionRecords.filter(r=>(!filter.year||r.year==filter.year)&&(!filter.month&&filter.month!==0||r.month==filter.month)&&(!filter.sectionId||r.sectionId===filter.sectionId)&&(!filter.machineId||r.machineId===filter.machineId)&&(!filter.teamId||r.teamId===filter.teamId)&&(!filter.workerId||((r.workerIds||[]).includes(filter.workerId))))}
function aggregate(records){const of=records.reduce((a,r)=>a+n(r.jobs),0),rnc=records.reduce((a,r)=>a+n(r.rnc),0);return{of,rnc,taxa:rate(rnc,of),ofRnc:rnc?of/rnc:null}}
