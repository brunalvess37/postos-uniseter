// ==========================================
// RELATÓRIO POSTOS UNISETER (COM FILTROS)
// ==========================================
async function gerarPDFGeral(filtros){

  let dados = await fetch("/api/postos").then(r=>r.json());

  // ===== FAVORITOS =====
  if(filtros.tipo === "favoritos"){
    const fav = JSON.parse(localStorage.getItem("postos_favoritos")||"[]");
    dados = dados.filter((_,i)=>fav.includes(i));
  }

  // ===== FILTROS =====
  if(filtros.cidade)
    dados = dados.filter(p=>p.CIDADE===filtros.cidade);

  if(filtros.zona)
    dados = dados.filter(p=>p.ZONA===filtros.zona);

  if(!dados.length){
    alert("Nenhum posto encontrado com esses filtros.");
    return;
  }

  // ===== ORDENAÇÃO =====
  dados.sort((a,b)=>{
    if(filtros.ordem==="posto")
      return a["POSTOS DE SERVIÇOS / GRUPO SETER"].localeCompare(b["POSTOS DE SERVIÇOS / GRUPO SETER"]);

    if(a.CIDADE!==b.CIDADE)
      return a.CIDADE.localeCompare(b.CIDADE);

    if(filtros.ordem==="cidade-zona" && a.ZONA!==b.ZONA)
      return (a.ZONA||"").localeCompare(b.ZONA||"");

    return a["POSTOS DE SERVIÇOS / GRUPO SETER"].localeCompare(b["POSTOS DE SERVIÇOS / GRUPO SETER"]);
  });

  // ===== AGRUPAMENTO =====
  let atual = "";
  const conteudo = [];

  dados.forEach(p=>{
    const grupo = filtros.zona ? p.ZONA : p.CIDADE;

    if(grupo !== atual){
      atual = grupo;
      conteudo.push({ text: grupo, style:"grupo", margin:[0,10,0,4] });
    }

    conteudo.push({
      margin:[0,0,0,8],
      text:[
        {text:p["POSTOS DE SERVIÇOS / GRUPO SETER"]+"\n", bold:true},
        p.TIPO+"\n",
        [p["ENDEREÇO I"],p["ENDEREÇO II"],p["ENDEREÇO III"],p["ENDEREÇO IV"]].filter(Boolean).join(" - ")+"\n",
        (p.OBSERVAÇÃO||"")+"\n",
        [p["CONTATO 1 - Nome"],p["CONTATO 1 - Telefone"],p["CONTATO 2 - Nome"],p["CONTATO 2 - Telefone"]]
          .filter(Boolean).join(" ")
      ]
    });
  });

  const doc = {
    pageSize:"A4",
    content:[
      {text:"RELATÓRIO POSTOS UNISETER", style:"titulo"},
      {text:`Gerado em ${new Date().toLocaleString("pt-BR")}`, alignment:"right", margin:[0,0,0,10]},
      ...conteudo
    ],
    footer:(p,t)=>({text:`Página ${p} de ${t}`, alignment:"center", fontSize:9}),
    styles:{
      titulo:{fontSize:16,bold:true,alignment:"center",margin:[0,0,0,10]},
      grupo:{fontSize:13,bold:true,fillColor:"#e8f0ff",margin:[0,8,0,4]}
    }
  };

  pdfMake.createPdf(doc).open();
}
