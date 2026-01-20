// ==========================================
// RELATÓRIO POSTOS UNISETER
// ==========================================
async function gerarPDFGeral(filtros = {}){

  // 🔒 valores padrão (EVITA QUEBRA SILENCIOSA)
  filtros.tipo  = filtros.tipo  || "todos";
  filtros.ordem = filtros.ordem || "posto";

  let dados = await fetch("/api/postos").then(r=>r.json());

  // ===== FAVORITOS =====
  if(filtros.tipo === "favoritos"){
    const fav = JSON.parse(localStorage.getItem("postos_favoritos") || "[]");
    dados = dados.filter((_,i)=>fav.includes(i));
  }

  // ===== SELEÇÃO MANUAL =====
  if(filtros.tipo === "manual"){
    const selecionados = JSON.parse(
      localStorage.getItem("postos_selecionados") || "[]"
    );

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
      p["ENDEREÇO IV"]
    ].filter(Boolean).join(" - ");
  }

  function contatosFormatados(p){
    const contatos = [];

    if(p["CONTATO 1 - Nome"] || p["CONTATO 1 - Telefone"]){
      contatos.push(
        `${p["CONTATO 1 - Nome"] || ""}${
          p["CONTATO 1 - Telefone"] ? " — " + p["CONTATO 1 - Telefone"] : ""
        }`
      );
    }

    if(p["CONTATO 2 - Nome"] || p["CONTATO 2 - Telefone"]){
      contatos.push(
        `${p["CONTATO 2 - Nome"] || ""}${
          p["CONTATO 2 - Telefone"] ? " — " + p["CONTATO 2 - Telefone"] : ""
        }`
      );
    }

    return contatos.join("\n");
  }

  // ===== AGRUPAMENTO =====
  let grupoAtual = null;
  const conteudo = [];

  dados.forEach(p => {

    const grupo =
      filtros.ordem === "zona"
        ? (p.ZONA || "Zona não informada")
        : (p.CIDADE || "Cidade não informada");

    if(grupo !== grupoAtual){
      grupoAtual = grupo;
      conteudo.push({
        text: grupo.toUpperCase(),
        style: "grupo",
        margin: [0,12,0,6]
      });
    }

    conteudo.push({
      margin:[0,0,0,10],
      text:[
        { text: p["POSTOS DE SERVIÇOS / GRUPO SETER"] + "\n", bold:true },
        (p.TIPO || "") + "\n",
        enderecoCompleto(p) + "\n",
        (p.OBSERVAÇÃO || "") + "\n",
        contatosFormatados(p)
      ]
    });
  });

  // ===== DOCUMENTO =====
  const doc = {
    pageSize: "A4",

    content: [
      { text: "RELATÓRIO POSTOS UNISETER", style:"titulo" },
      {
        text: `Gerado em ${new Date().toLocaleString("pt-BR")}`,
        alignment: "right",
        margin:[0,0,0,12]
      },
      ...conteudo
    ],

    footer: (p,t)=>({
      text:`Página ${p} de ${t}`,
      alignment:"center",
      fontSize:9
    }),

    styles:{
      titulo:{
        fontSize:16,
        bold:true,
        alignment:"center",
        margin:[0,0,0,10]
      },
      grupo:{
        fontSize:13,
        bold:true,
        fillColor:"#e8f0ff",
        margin:[0,8,0,4]
      }
    }
  };

  pdfMake.createPdf(doc).open();
}
