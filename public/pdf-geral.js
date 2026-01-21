// ==========================================
// RELATÓRIO POSTOS UNISETER — VERSÃO FINAL
// ==========================================
async function gerarPDFGeral(filtros){

  let dados = await fetch("/api/postos").then(r=>r.json());

  // ===== FAVORITOS =====
  if(filtros.tipo === "favoritos"){
    const fav = JSON.parse(localStorage.getItem("postos_favoritos") || "[]");
    dados = dados.filter((_,i)=>fav.includes(i));
  }

  // ===== SELEÇÃO MANUAL =====
  if(filtros.tipo === "manual"){
    const selecionados = JSON.parse(localStorage.getItem("postos_selecionados") || "[]");
    if(!selecionados.length){
      alert("Nenhum posto selecionado na tela Buscar Postos.");
      return;
    }
    dados = selecionados.map(i => dados[i]).filter(Boolean);
  }

  if(!dados.length){
    alert("Nenhum posto encontrado para gerar relatório.");
    return;
  }

  // ===== ORDENAÇÃO =====
  dados.sort((a,b)=>{
    if(filtros.ordem === "zona"){
      return (a.ZONA || "").localeCompare(b.ZONA || "") ||
        (a["POSTOS DE SERVIÇOS / GRUPO SETER"] || "")
          .localeCompare(b["POSTOS DE SERVIÇOS / GRUPO SETER"] || "");
    }

    return (a["POSTOS DE SERVIÇOS / GRUPO SETER"] || "")
      .localeCompare(b["POSTOS DE SERVIÇOS / GRUPO SETER"] || "");
  });

  // ===== FUNÇÕES AUXILIARES =====
  function enderecoCompleto(p){
    return [
      p["ENDEREÇO I"],
      p["ENDEREÇO II"],
      p["ENDEREÇO III"],
      p["ENDEREÇO IV"],
      p.CIDADE
    ].filter(Boolean).join(" - ");
  }

  function contatosFormatados(p){
    const linhas = [];

    if(p["CONTATO 1 - Nome"] || p["CONTATO 1 - Telefone"]){
      linhas.push(
        `${p["CONTATO 1 - Nome"] || ""}${p["CONTATO 1 - Telefone"] ? " (" + p["CONTATO 1 - Telefone"] + ")" : ""}`
      );
    }

    if(p["CONTATO 2 - Nome"] || p["CONTATO 2 - Telefone"]){
      linhas.push(
        `${p["CONTATO 2 - Nome"] || ""}${p["CONTATO 2 - Telefone"] ? " (" + p["CONTATO 2 - Telefone"] + ")" : ""}`
      );
    }

    return linhas.join("\n");
  }

  // ===== AGRUPAMENTO CORRETO (SEM QUEBRA ENTRE PÁGINAS) =====
  const grupos = {};
  const campoGrupo = filtros.ordem === "zona" ? "ZONA" : "CIDADE";

  dados.forEach(p=>{
    const chave = p[campoGrupo] || "NÃO INFORMADO";
    if(!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(p);
  });

  const conteudo = [];

  Object.keys(grupos).forEach((grupo, idx)=>{

    const bloco = [];

    // ===== FAIXA DE SUBTÍTULO =====
    bloco.push({
      text: grupo.toUpperCase(),
      style: "grupo",
      margin: [0,12,0,10]
    });

    // ===== POSTOS DO GRUPO =====
    grupos[grupo].forEach(p=>{

      const linhas = [
        { text: p["POSTOS DE SERVIÇOS / GRUPO SETER"] + "\n", bold:true },
        (p.TIPO || "") + "\n",
        enderecoCompleto(p)
      ];

      if(p.OBSERVAÇÃO){
        linhas.push("\n" + p.OBSERVAÇÃO);
      }

      const contatos = contatosFormatados(p);
      if(contatos){
        linhas.push("\nContato:\n" + contatos);
      }

      bloco.push({
        margin:[0,0,0,12],
        text: linhas
      });
    });

    conteudo.push({
      stack: bloco,
      pageBreak: idx === 0 ? undefined : "before"
    });
  });

  // ===== DOCUMENTO FINAL =====
  const doc = {
    pageSize: "A4",

    content: [
      {
        text: "RELATÓRIO POSTOS UNISETER",
        style:"titulo",
        margin:[0,0,0,6]
      },
      {
        text: `Gerado em ${new Date().toLocaleString("pt-BR")}`,
        alignment:"right",
        margin:[0,0,0,14]
      },
      ...conteudo
    ],

    footer: (p,t)=>({
      text:`Página ${p} de ${t}`,
      alignment:"center",
      fontSize:9,
      margin:[0,10,0,0]
    }),

    styles:{
      titulo:{
        fontSize:16,
        bold:true,
        alignment:"center"
      },
      grupo:{
        fontSize:13,
        bold:true,
        color:"#ffffff",
        fillColor:"#003a8f",
        margin:[0,8,0,6]
      }
    }
  };

  pdfMake.createPdf(doc).open();
}
