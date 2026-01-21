// ==========================================
// RELATÓRIO POSTOS UNISETER — VERSÃO ESTÁVEL
// ==========================================
async function gerarPDFGeral(filtros){

  let dados = await fetch("/api/postos").then(r => r.json());

  // ===== FAVORITOS =====
  if (filtros.tipo === "favoritos") {
    const fav = JSON.parse(localStorage.getItem("postos_favoritos") || "[]");
    dados = dados.filter((_, i) => fav.includes(i));
  }

  // ===== SELEÇÃO MANUAL =====
  if (filtros.tipo === "manual") {
    const selecionados = JSON.parse(localStorage.getItem("postos_selecionados") || "[]");
    if (!selecionados.length) {
      alert("Nenhum posto selecionado na tela Buscar Postos.");
      return;
    }
    dados = selecionados.map(i => dados[i]).filter(Boolean);
  }

  if (!dados.length) {
    alert("Nenhum posto encontrado para gerar relatório.");
    return;
  }

  // ===== ORDENAÇÃO CORRETA (A CHAVE DA SOLUÇÃO) =====
  const campoGrupo = filtros.ordem === "zona" ? "ZONA" : "CIDADE";

  dados.sort((a, b) => {
    const gA = (a[campoGrupo] || "").toUpperCase();
    const gB = (b[campoGrupo] || "").toUpperCase();

    if (gA !== gB) return gA.localeCompare(gB);

    return (a["POSTOS DE SERVIÇOS / GRUPO SETER"] || "")
      .localeCompare(b["POSTOS DE SERVIÇOS / GRUPO SETER"] || "");
  });

  // ===== FUNÇÕES AUXILIARES =====
  function enderecoCompleto(p) {
    return [
      p["ENDEREÇO I"],
      p["ENDEREÇO II"],
      p["ENDEREÇO III"],
      p["ENDEREÇO IV"],
      p.CIDADE
    ].filter(Boolean).join(" - ");
  }

  function contatosFormatados(p) {
    const linhas = [];

    if (p["CONTATO 1 - Nome"] || p["CONTATO 1 - Telefone"]) {
      linhas.push(
        `${p["CONTATO 1 - Nome"] || ""}${p["CONTATO 1 - Telefone"] ? " (" + p["CONTATO 1 - Telefone"] + ")" : ""}`
      );
    }

    if (p["CONTATO 2 - Nome"] || p["CONTATO 2 - Telefone"]) {
      linhas.push(
        `${p["CONTATO 2 - Nome"] || ""}${p["CONTATO 2 - Telefone"] ? " (" + p["CONTATO 2 - Telefone"] + ")" : ""}`
      );
    }

    return linhas.join("\n");
  }

  // ===== CONSTRUÇÃO DO CONTEÚDO (SEM PAGEBREAK) =====
  let grupoAtual = null;
  const conteudo = [];

  dados.forEach(p => {

    const grupo = (p[campoGrupo] || "NÃO INFORMADO").toUpperCase();

    if (grupo !== grupoAtual) {
      grupoAtual = grupo;
      conteudo.push({
        text: grupo,
        style: "grupo",
        margin: [0, 12, 0, 8]
      });
    }

    const linhas = [
      { text: p["POSTOS DE SERVIÇOS / GRUPO SETER"] + "\n", bold: true },
      (p.TIPO || "") + "\n",
      enderecoCompleto(p)
    ];

    if (p.OBSERVAÇÃO) {
      linhas.push("\n" + p.OBSERVAÇÃO);
    }

    const contatos = contatosFormatados(p);
    if (contatos) {
      linhas.push("\nContato:\n" + contatos);
    }

    conteudo.push({
      margin: [0, 0, 0, 12],
      text: linhas
    });
  });

  // ===== DOCUMENTO FINAL =====
  const doc = {
    pageSize: "A4",

    content: [
      {
        text: "RELATÓRIO POSTOS UNISETER",
        style: "titulo",
        margin: [0, 0, 0, 6]
      },
      {
        text: `Gerado em ${new Date().toLocaleString("pt-BR")}`,
        alignment: "right",
        margin: [0, 0, 0, 14]
      },
      ...conteudo
    ],

    footer: (p, t) => ({
      text: `Página ${p} de ${t}`,
      alignment: "center",
      fontSize: 9
    }),

    styles: {
      titulo: {
        fontSize: 16,
        bold: true,
        alignment: "center"
      },
      grupo: {
        fontSize: 13,
        bold: true,
        color: "#ffffff",
        fillColor: "#003a8f"
      }
    }
  };

  pdfMake.createPdf(doc).open();
}
