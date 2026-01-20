// ==========================================
// RELATÓRIO POSTOS UNISETER — VERSÃO FINAL
// Layout aprovado + filtros consolidados
// ==========================================
async function gerarPDFGeral(filtros) {

  // ==========================
  // CARREGAR DADOS
  // ==========================
  let dados = await fetch("/api/postos").then(r => r.json());

  // ==========================
  // FAVORITOS
  // ==========================
  if (filtros.tipo === "favoritos") {
    const fav = JSON.parse(localStorage.getItem("postos_favoritos") || "[]");
    dados = dados.filter((_, i) => fav.includes(i));
  }

  // ==========================
  // SELEÇÃO MANUAL
  // ==========================
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

  // ==========================
  // ORDENAÇÃO
  // ==========================
  dados.sort((a, b) => {
    if (filtros.ordem === "zona") {
      return (a.ZONA || "").localeCompare(b.ZONA || "") ||
        (a["POSTOS DE SERVIÇOS / GRUPO SETER"] || "")
          .localeCompare(b["POSTOS DE SERVIÇOS / GRUPO SETER"] || "");
    }

    return (a["POSTOS DE SERVIÇOS / GRUPO SETER"] || "")
      .localeCompare(b["POSTOS DE SERVIÇOS / GRUPO SETER"] || "");
  });

  // ==========================
  // FUNÇÕES AUXILIARES
  // ==========================
  function enderecoCompleto(p) {
    return [
      p["ENDEREÇO I"],
      p["ENDEREÇO II"],
      p["ENDEREÇO III"],
      p["ENDEREÇO IV"]
    ].filter(Boolean).join(" - ");
  }

  function contatosFormatados(p) {
    const contatos = [];

    if (p["CONTATO 1 - Nome"] || p["CONTATO 1 - Telefone"]) {
      contatos.push(
        `${p["CONTATO 1 - Nome"] || ""}${p["CONTATO 1 - Telefone"] ? " (" + p["CONTATO 1 - Telefone"] + ")" : ""}`
      );
    }

    if (p["CONTATO 2 - Nome"] || p["CONTATO 2 - Telefone"]) {
      contatos.push(
        `${p["CONTATO 2 - Nome"] || ""}${p["CONTATO 2 - Telefone"] ? " (" + p["CONTATO 2 - Telefone"] + ")" : ""}`
      );
    }

    return contatos.join(" • ");
  }

  // ==========================
  // CONTEÚDO DO PDF (LAYOUT)
  // ==========================
  let grupoAtual = null;
  const conteudo = [];

  dados.forEach(p => {

    const grupo =
      filtros.ordem === "zona"
        ? (p.ZONA || "Zona não informada")
        : (p.CIDADE || "Cidade não informada");

    if (grupo !== grupoAtual) {
      grupoAtual = grupo;
      conteudo.push({
        text: grupo,
        style: "grupo",
        margin: [0, 14, 0, 8]
      });
    }

    conteudo.push({
      margin: [0, 0, 0, 12],
      stack: [
        {
          text: p["POSTOS DE SERVIÇOS / GRUPO SETER"],
          bold: true,
          fontSize: 11
        },
        {
          text: p.TIPO || "",
          italics: true,
          fontSize: 9,
          margin: [0, 1, 0, 2]
        },
        {
          text: enderecoCompleto(p),
          fontSize: 9
        },
        p.OBSERVAÇÃO
          ? {
              text: p.OBSERVAÇÃO,
              fontSize: 9,
              margin: [0, 2, 0, 0]
            }
          : {},
        contatosFormatados(p)
          ? {
              text: contatosFormatados(p),
              fontSize: 9,
              margin: [0, 2, 0, 0]
            }
          : {}
      ]
    });
  });

  // ==========================
  // DOCUMENTO FINAL
  // ==========================
  const doc = {
    pageSize: "A4",

    content: [
      {
        text: "RELATÓRIO POSTOS UNISETER",
        style: "titulo"
      },
      {
        text: `Gerado em ${new Date().toLocaleString("pt-BR")}`,
        alignment: "right",
        fontSize: 9,
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
        alignment: "center",
        margin: [0, 0, 0, 12]
      },
      grupo: {
        fontSize: 12,
        bold: true,
        fillColor: "#e8f0ff",
        margin: [0, 10, 0, 6]
      }
    }
  };

  pdfMake.createPdf(doc).open();
}
