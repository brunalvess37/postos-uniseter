// ==========================================
// RELATÓRIO POSTOS UNISETER
// (VISUAL APROVADO — NÃO ALTERAR)
// ==========================================
async function gerarPDFGeral(filtros){

  // ==========================
  // CARREGAR DADOS
  // ==========================
  let dados = [];
  try {
    const res = await fetch("/api/postos");
    if(!res.ok) throw new Error("Erro ao buscar dados");
    dados = await res.json();
  } catch(e){
    alert("Erro ao carregar dados para o relatório.");
    console.error(e);
    return;
  }

  // ==========================
  // FILTRO: FAVORITOS
  // ==========================
  if(filtros.tipo === "favoritos"){
    const fav = JSON.parse(localStorage.getItem("postos_favoritos") || "[]");
    dados = dados.filter((_, i) => fav.includes(i));
  }

  // ==========================
  // FILTRO: SELEÇÃO MANUAL
  // ==========================
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

  // ==========================
  // ORDENAÇÃO
  // ==========================
  dados.sort((a,b)=>{
    if(filtros.ordem === "zona"){
      return (a.ZONA || "").localeCompare(b.ZONA || "") ||
        (a["POSTOS DE SERVIÇOS / GRUPO SETER"] || "")
          .localeCompare(b["POSTOS DE SERVIÇOS / GRUPO SETER"] || "");
    }

    return (a["POSTOS DE SERVIÇOS / GRUPO SETER"] || "")
      .localeCompare(b["POSTOS DE SERVIÇOS / GRUPO SETER"] || "");
  });

  // ==========================
  // CONTEÚDO (VISUAL APROVADO)
  // ==========================
  let atual = "";
  const conteudo = [];

  dados.forEach(p => {

    const grupo =
      filtros.ordem === "zona"
        ? (p.ZONA || "Zona não informada")
        : (p.CIDADE || "Cidade não informada");

    if(grupo !== atual){
      atual = grupo;
      conteudo.push({
        text: grupo,
        style: "grupo",
        margin: [0,12,0,6]
      });
    }

    const endereco = [
      p["ENDEREÇO I"],
      p["ENDEREÇO II"],
      p["ENDEREÇO III"],
      p["ENDEREÇO IV"]
    ].filter(Boolean).join(" - ");

    const contatos = [
      p["CONTATO 1 - Nome"],
      p["CONTATO 1 - Telefone"],
      p["CONTATO 2 - Nome"],
      p["CONTATO 2 - Telefone"]
    ].filter(Boolean).join(" ");

    conteudo.push({
      margin:[0,0,0,10],
      text:[
        { text: p["POSTOS DE SERVIÇOS / GRUPO SETER"] + "\n", bold:true },
        (p.TIPO || "") + "\n",
        endereco + "\n",
        (p.OBSERVAÇÃO || "") + "\n",
        contatos
      ]
    });
  });

  // ==========================
  // DOCUMENTO PDF
  // ==========================
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
        fillColor:"#e8f0ff"
      }
    }
  };

  pdfMake.createPdf(doc).open();
}
