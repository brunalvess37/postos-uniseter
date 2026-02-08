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

    return (a.CIDADE || "").localeCompare(b.CIDADE || "") ||
      (a["POSTOS DE SERVIÇOS / GRUPO SETER"] || "")
        .localeCompare(b["POSTOS DE SERVIÇOS / GRUPO SETER"] || "");
  });

  // ===== FUNÇÕES AUXILIARES =====
  function enderecoCompleto(p) {
    return [
      p["ENDEREÇO I"],
      p["ENDEREÇO II"],
      p["ENDEREÇO III"],
      p["ENDEREÇO IV"]
    ].filter(Boolean).join(" - ");
  }

  function contatosFormatados(p) {
    const linhas = [];

    // CONTATO 1
    if (p["CONTATO 1 - Nome"] || p["CONTATO 1 - Telefone"]) {
      linhas.push(
        `• ${
          p["CONTATO 1 - Nome"] && p["CONTATO 1 - Telefone"]
            ? `${p["CONTATO 1 - Nome"]} — ${p["CONTATO 1 - Telefone"]}`
            : p["CONTATO 1 - Nome"] || p["CONTATO 1 - Telefone"]
        }`
      );
    }

    // CONTATO 2
    if (p["CONTATO 2 - Nome"] || p["CONTATO 2 - Telefone"]) {
      linhas.push(
        `• ${
          p["CONTATO 2 - Nome"] && p["CONTATO 2 - Telefone"]
            ? `${p["CONTATO 2 - Nome"]} — ${p["CONTATO 2 - Telefone"]}`
            : p["CONTATO 2 - Nome"] || p["CONTATO 2 - Telefone"]
        }`
      );
    }

    if (!linhas.length) return null;

    return [
    {
      text: "Contato:",
      bold: true,
      fontSize: 11,
      margin: [0, 0, 0, 1] // 👈 MESMO espaçamento do Endereço
    },
    {
      text: linhas.join("\n"),
      fontSize: 11,
      lineHeight: 1.15,
      margin: [0, 0, 0, 1] // 👈 MESMO espaçamento do texto do endereço
    }
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

    // ===== FAIXA DE AGRUPAMENTO =====
    if (grupo !== grupoAtual) {
      grupoAtual = grupo;

      conteudo.push({
        margin: [0, 18, 0, 12],
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

    // ===== BLOCO DO POSTO =====
conteudo.push({
  margin: [0, 0, 0, 14],
  pageBreak: 'avoid',   // 👈 sem quebra de página no bloco
  stack: [

    // Nome do posto
    {
      text: p["POSTOS DE SERVIÇOS / GRUPO SETER"],
      style: "posto",
      margin: [0, 0, 0, 2]
    },

    // Tipo do posto
    {
      text: p.TIPO || "",
      italics: true,
      fontSize: 8,
      color: "#666",
      margin: [0, 0, 0, 4]
    },

    // Endereço
    {
      text: "Endereço:",
      bold: true,
      fontSize: 11,
      margin: [12, 0, 0, 1]
    },
    {
      text: enderecoCompleto(p),
      fontSize: 11,
      lineHeight: 1.25,
      margin: [12, 0, 0, 1]
    },

    // Observação (se existir)
    p.OBSERVAÇÃO
      ? {
          text: p.OBSERVAÇÃO,
          fontSize: 8,
          color: "#555",
          italics: true,
          margin: [12, 0, 0, 4]
        }
      : null,

    // Contatos (já formatados)
    contatosFormatados(p)
      ? {
          stack: contatosFormatados(p),
          fontSize: 11,
          lineHeight: 1.25,
          margin: [12, 0, 0, 1]
        }
      : null,

    // Linha separadora entre postos
    {
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 0.5,
          lineColor: "#cccccc"
        }
      ],
      margin: [0, 8, 0, 0]
    }

  ].filter(Boolean)
});
    
  });

  // ===== USUÁRIO =====
  let linhaUsuario = null;
  if (filtros.usuario) {
    const nome = filtros.usuario.nome || "";
    const email = filtros.usuario.email || "";

    if (nome || email) {
      linhaUsuario = `Usuário: ${[nome, email].filter(Boolean).join(" - ")}`;
    }
  }

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
        },
        linhaUsuario
          ? {
              text: linhaUsuario,
              alignment: "right",
              fontSize: 9
            }
          : null
      ].filter(Boolean)
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
        alignment: "center",
        margin: [0, 6, 0, 6]
      },
      posto: {
        fontSize: 13,
        bold: true,
        color: "#003c8d"
      }
    }
  };

  pdfMake.createPdf(doc).open();
}
