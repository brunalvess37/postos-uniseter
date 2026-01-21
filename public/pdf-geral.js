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
    const contatos = [];

    if (p["CONTATO 1 - Nome"] || p["CONTATO 1 - Telefone"]) {
      contatos.push(
        `${p["CONTATO 1 - Nome"] || ""}${p["CONTATO 1 - Telefone"]
          ? " — " + p["CONTATO 1 - Telefone"]
          : ""}`
      );
    }

    if (p["CONTATO 2 - Nome"] || p["CONTATO 2 - Telefone"]) {
      contatos.push(
        `${p["CONTATO 2 - Nome"] || ""}${p["CONTATO 2 - Telefone"]
          ? " — " + p["CONTATO 2 - Telefone"]
          : ""}`
      );
    }

    return contatos.join("\n");
  }

  // ===== CONTEÚDO =====
  let grupoAtual = null;
  const conteudo = [];

  dados.forEach(p => {

    const grupo =
      filtros.ordem === "zona"
        ? p.ZONA
        : p.CIDADE;

    if (grupo !== grupoAtual) {
      grupoAtual = grupo;

      conteudo.push({
        text: grupo.toUpperCase(),
        style: "grupo"
      });
    }

    conteudo.push({
      margin: [0, 6, 0, 14],
      text: [
        { text: p["POSTOS DE SERVIÇOS / GRUPO SETER"] + "\n", bold: true },
        (p.TIPO || "") + "\n",
        enderecoCompleto(p) + "\n",
        (p.OBSERVAÇÃO ? p.OBSERVAÇÃO + "\n" : ""),
        contatosFormatados(p)
      ]
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
        margin: [0, 16, 0, 8],
        padding: [8, 6, 8, 6]
      }
    }
  };

  pdfMake.createPdf(doc).open();
}
