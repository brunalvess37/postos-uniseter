// ==========================================
// PDF GERAL — RELATÓRIO POSTOS UNISETER
// ==========================================
async function gerarPDFGeral() {

  // ==========================
  // CARREGAR DADOS DO SISTEMA
  // ==========================
  let dados = [];
  try {
    const res = await fetch("/api/postos");
    if (!res.ok) throw new Error("Erro ao buscar dados");
    dados = await res.json();
  } catch (e) {
    alert("Erro ao carregar dados para o relatório.");
    console.error(e);
    return;
  }

  if (!dados.length) {
    alert("Nenhum posto encontrado para gerar PDF.");
    return;
  }

  // ==========================
  // ORDENAÇÃO PADRÃO
  // Cidade + Zona + Nome
  // ==========================
  dados.sort((a, b) => {
    if (a.CIDADE !== b.CIDADE)
      return (a.CIDADE || "").localeCompare(b.CIDADE || "");

    if ((a.ZONA || "") !== (b.ZONA || ""))
      return (a.ZONA || "").localeCompare(b.ZONA || "");

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
        `${p["CONTATO 1 - Nome"] || ""}${p["CONTATO 1 - Telefone"] ? " — " + p["CONTATO 1 - Telefone"] : ""}`
      );
    }

    if (p["CONTATO 2 - Nome"] || p["CONTATO 2 - Telefone"]) {
      contatos.push(
        `${p["CONTATO 2 - Nome"] || ""}${p["CONTATO 2 - Telefone"] ? " — " + p["CONTATO 2 - Telefone"] : ""}`
      );
    }

    return contatos.join("\n");
  }

  // ==========================
  // CONTEÚDO DO PDF
  // ==========================
  const dataGeracao = new Date().toLocaleString("pt-BR");

  const conteudo = [
    {
      text: "RELATÓRIO POSTOS UNISETER",
      style: "titulo",
      alignment: "center"
    },
    {
      text: `Gerado em: ${dataGeracao}`,
      style: "subtitulo",
      alignment: "right",
      margin: [0, 0, 0, 10]
    },
    {
      text: `Total de postos: ${dados.length}`,
      margin: [0, 0, 0, 12]
    },
    {
      table: {
        headerRows: 1,
        widths: ["18%", "22%", "10%", "30%", "20%"],
        body: [
          [
            { text: "POSTO", style: "th" },
            { text: "TIPO", style: "th" },
            { text: "CIDADE / ZONA", style: "th" },
            { text: "ENDEREÇO", style: "th" },
            { text: "CONTATOS", style: "th" }
          ],
          ...dados.map(p => [
            p["POSTOS DE SERVIÇOS / GRUPO SETER"] || "",
            p.TIPO || "",
            `${p.CIDADE || ""}${p.ZONA ? " / " + p.ZONA : ""}`,
            enderecoCompleto(p),
            contatosFormatados(p)
          ])
        ]
      },
      layout: "lightHorizontalLines"
    }
  ];

  // ==========================
  // DEFINIÇÃO DO DOCUMENTO
  // ==========================
  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "landscape",

    content: conteudo,

    footer: function (currentPage, pageCount) {
      return {
        text: `Página ${currentPage} de ${pageCount}`,
        alignment: "center",
        fontSize: 9,
        margin: [0, 10, 0, 0]
      };
    },

    styles: {
      titulo: {
        fontSize: 16,
        bold: true,
        margin: [0, 0, 0, 6]
      },
      subtitulo: {
        fontSize: 10,
        italics: true
      },
      th: {
        bold: true,
        fillColor: "#eeeeee"
      }
    }
  };

  // ==========================
  // GERAR PDF
  // ==========================
  pdfMake.createPdf(docDefinition).open();
}
