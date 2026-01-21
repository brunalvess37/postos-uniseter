// ==========================================
// RELATÓRIO POSTOS UNISETER — PDF FINAL
// ==========================================
async function gerarPDFGeral(filtros) {

  let dados = await fetch("/api/postos").then(r => r.json());

  // ===== FAVORITOS =====
  if (filtros.tipo === "favoritos") {
    const fav = JSON.parse(localStorage.getItem("postos_favoritos") || "[]");
    dados = dados.filter((_, i) => fav.includes(i));
  }

  // ===== SELEÇÃO MANUAL =====
  if (filtros.tipo === "manual") {
    const selecionados = JSON.parse(
      localStorage.getItem("postos_selecionados") || "[]"
    );

    if (!selecionados.length) {
      alert("Nenhum posto selecionado.");
      return;
    }

    dados = selecionados.map(i => dados[i]).filter(Boolean);
  }

  if (!dados.length) {
    alert("Nenhum posto encontrado para gerar relatório.");
    return;
  }

  // ===== ORDENAÇÃO =====
  dados.sort((a, b) => {
    if (filtros.ordem === "zona") {
      return (a.ZONA || "").localeCompare(b.ZONA || "") ||
        (a["POSTOS DE SERVIÇOS / GRUPO SETER"] || "")
          .localeCompare(b["POSTOS DE SERVIÇOS / GRUPO SETER"] || "");
    }

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
        `${p["CONTATO 1 - Nome"] || ""}${p["CONTATO 1 - Telefone"]
          ? " — " + p["CONTATO 1 - Telefone"]
          : ""}`
      );
    }

    if (p["CONTATO 2 - Nome"] || p["CONTATO 2 - Telefone"]) {
      linhas.push(
        `${p["CONTATO 2 - Nome"] || ""}${p["CONTATO 2 - Telefone"]
          ? " — " + p["CONTATO 2 - Telefone"]
          : ""}`
      );
    }

    if (!linhas.length) return "";

    return [
      { text: "Contato:\n", bold: true },
      linhas.join("\n")
    ];
  }

  // ===== CONTEÚDO =====
  let grupoAtual = null;
  const conteudo = [];

  dados.forEach(p => {

    const grupo =
      filtros.ordem === "zona"
        ? p.ZONA
        : p.CIDADE;

    // ===== FAIXA DE AGRUPAMENTO (AZUL REAL) =====
    if (grupo !== grupoAtual) {
      grupoAtual = grupo;

      conteudo.push({
        margin: [0, 16, 0, 10],
        table: {
          widths: ["*"],
          body: [[
            {
              text: grupo.toUpperCase(),
              style: "grupo"
            }
          ]]
        },
        layout: "noBorders"
      });
    }

    // ===== POSTO =====
    conteudo.push({
      margin: [0, 0, 0, 14],
      stack: [
        { text: p["POSTOS DE SERVIÇOS / GRUPO SETER"], style: "posto" },
        { text: p.TIPO || "", italics: true, margin: [0, 2, 0, 2] },
        { text: enderecoCompleto(p), margin: [0, 2, 0, 2] },
        p.OBSERVAÇÃO ? { text: p.OBSERVAÇÃO, margin: [0, 2, 0, 2] } : null,
        contatosFormatados(p)
      ].filter(Boolean)
    });
  });

  // ===== DOCUMENTO PDF =====
  const doc = {
    pageSize: "A4",
    pageMargins: [40, 90, 40, 60],

    header: {
      margin: [40, 20, 40, 10],
      stack: [
        {
          text: "RELATÓRIO POSTOS UNISETER",
          style: "titulo"
        },
        {
          text: `Gerado em ${new Date().toLocaleString("pt-BR")}`,
          alignment: "right",
          fontSize: 9
        }
      ]
    },

    footer: function (currentPage, pageCount) {
      return {
        text: `Página ${currentPage} de ${pageCount}`,
        alignment: "center",
        fontSize: 9,
        margin: [0, 10, 0, 0]
      };
    },

    content: conteudo,

    styles: {
      titulo: {
        fontSize: 16,
        bold: true,
        alignment: "center"
      },
      grupo: {
        fontSize: 13,
        bold: true,
        color: "white",
        fillColor: "#003c8d",
        margin: [0, 0, 0, 0],
        alignment: "left"
      },
      posto: {
        fontSize: 11,
        bold: true
      }
    }
  };

  pdfMake.createPdf(doc).open();
}
