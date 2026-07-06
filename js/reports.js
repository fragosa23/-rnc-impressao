function sectionTable(rows,section,avg){
  const list=rows.filter(d=>d.s===section);
  const of=list.reduce((a,d)=>a+num(d.of),0),r=list.reduce((a,d)=>a+num(d.rnc),0),tr=of?r/of*100:null;
  let html="<table><tr><th>Máquina</th><th>OF</th><th>RNC</th><th>RNC/100 OF</th></tr>";
  list.forEach(d=>{const v=rate(d);html+=`<tr><td>${d.m}</td><td>${num(d.of)}</td><td>${num(d.rnc)}</td><td class="${rateClass(v,avg)}">${fmt(v)}</td></tr>`;});
  html+=`<tr><th>Total</th><th>${of}</th><th>${r}</th><th>${fmt(tr)}</th></tr></table>`;
  return{html,of,r,tr};
}

function reportHTML(title,rows,extraTrend=""){
  const st=stats(rows),avg=st.avg;
  const flex=sectionTable(rows,"Flexografia",avg),roto=sectionTable(rows,"Rotogravura",avg);
  let best="—";
  if(flex.of>0&&roto.of>0)best=flex.tr<roto.tr?"Flexografia":roto.tr<flex.tr?"Rotogravura":"Equivalente";
  const ranked=[...rows].map(d=>({...d,taxa:rate(d)})).filter(d=>d.taxa!==null).sort((a,b)=>b.taxa-a.taxa);
  const above=ranked.filter(d=>(d.taxa||0)>avg),critical=ranked.filter(d=>(d.taxa||0)>5);
  const msg=st.of===0?["Ainda não há dados suficientes."]:[
    critical.length?`<b>Crítico:</b> ${critical.map(d=>d.m+" ("+fmt(d.taxa)+")").join(", ")}.`:"",
    above.length?`<b>Acima da média:</b> ${above.map(d=>d.m).join(", ")}.`:"Não há máquinas acima da média global.",
    "O volume de trabalhos não justifica, por si só, o número de não conformidades. Recomenda-se análise de causa-raiz.",
    `Melhor desempenho por secção: <b>${best}</b>.`
  ].filter(Boolean);
  return `<div class="card"><h2>${title}</h2><div class="grid"><div class="kpi">Total OF<b>${st.of}</b></div><div class="kpi">Total RNC<b>${st.rnc}</b></div><div class="kpi">Taxa global<b>${fmt(avg)}</b></div><div class="kpi">Melhor secção<b>${best}</b></div></div></div><div class="card"><h2>Ranking — taxa RNC por 100 OF</h2>${barRanking(rows,avg)}<div class="small">Verde só em 0%. Amarelo >0 até média. Laranja acima da média até 5%. Vermelho >5%.</div></div><div class="row"><div class="card"><h2>Flexografia</h2>${flex.html}</div><div class="card"><h2>Rotogravura</h2>${roto.html}</div></div>${extraTrend}<div class="card alert"><h2>Alerta automático</h2><p>${msg.join("</p><p>")}</p></div>`;
}

function trendYearHTML(year){
  const items=[];
  for(let m=0;m<12;m++){
    const rows=loadMonthData(year,m),st=stats(rows);
    if(st.of>0)items.push({m:MONTHS[m],of:st.of,rnc:st.rnc,taxa:st.avg});
  }
  if(!items.length)return `<div class="card"><h2>Evolução mensal</h2><p class="small">Sem meses guardados neste ano.</p></div>`;
  const max=Math.max(...items.map(i=>i.taxa),1);
  const bars=items.map(i=>`<div class="barline"><div class="section-tag">${i.m}</div><div class="barbox"><div class="bar red" style="width:${Math.max(3,i.taxa/max*100)}%;background:var(--azul)">${fmt(i.taxa)}</div></div><div class="small">${i.of} OF / ${i.rnc} RNC</div></div>`).join("");
  return `<div class="card"><h2>Evolução mensal do ano</h2>${bars}</div>`;
}
