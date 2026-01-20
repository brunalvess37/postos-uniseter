// ==========================================
// PDF GERAL — RELATÓRIO POSTOS UNISETER
// ==========================================
async function gerarPDFGeral() {

  // ==========================
  // CONFIGURAÇÃO DO RELATÓRIO
  // ==========================
  // "cidade" | "zona"
  const modoAgrupamento = "cidade";

  // ==========================
  // CARREGAR DADOS
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
  // ORDENAÇÃO
  // ==========================
  dados.sort((a, b) => {
    const chaveA = modoAgrupamento === "zona" ? a.ZONA : a.CIDADE;
    const chaveB = modoAgrupamento === "zona" ? b.ZONA : b.CIDADE;

    if ((chaveA || "") !== (chaveB || ""))
      return (chaveA || "").localeCompare(chaveB || "");

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
  const conteudo = [];

  conteudo.push(
    {
      text: "RELATÓRIO POSTOS UNISETER",
      style: "titulo",
      alignment: "center"
    },
    {
      text: `Gerado em: ${dataGeracao}`,
      alignment: "right",
      fontSize: 10,
      margin: [0, 0, 0, 14]
    }
  );

  // ==========================
  // AGRUPAMENTO COM FAIXA DESTACADA
  // ==========================
  let grupoAtual = null;

  dados.forEach(p => {
    const chaveGrupo = modoAgrupamento === "zona" ? p.ZONA : p.CIDADE;

    if (chaveGrupo !== grupoAtual) {
      grupoAtual = chaveGrupo;

      // FAIXA DE DESTAQUE (100% largura)
      conteudo.push({
        table: {
          widths: ["*"],
          body: [[{
            text: (grupoAtual || "—").toUpperCase(),
            style: "faixaGrupo"
          }]]
        },
        layout: "noBorders",
        margin: [0, 14, 0, 6]
      });

      // Cabeçalho da tabela
      conteudo.push({
        table: {
          headerRows: 1,
          widths: ["25%", "12%", "33%", "15%", "15%"],
          body: [
            [
              { text: "POSTO", style: "th" },
              { text: "TIPO", style: "th" },
              { text: "ENDEREÇO", style: "th" },
              { text: "OBSERVAÇÃO", style: "th" },
              { text: "CONTATOS", style: "th" }
            ]
          ]
        },
        layout: "lightHorizontalLines"
      });
    }

    conteudo[conteudo.length - 1].table.body.push([
      p["POSTOS DE SERVIÇOS / GRUPO SETER"] || "",
      p.TIPO || "",
      enderecoCompleto(p),
      p.OBSERVAÇÃO || "",
      contatosFormatados(p)
    ]);
  });

  // ==========================
  // DOCUMENTO FINAL
  // ==========================
  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "landscape",
    content: conteudo,

    footer: (currentPage, pageCount) => ({
      text: `Página ${currentPage} de ${pageCount}`,
      alignment: "center",
      fontSize: 9,
      margin: [0, 10, 0, 0]
    }),

    styles: {
      titulo: {
        fontSize: 16,
        bold: true,
        margin: [0, 0, 0, 6]
      },
      faixaGrupo: {
        fontSize: 14,
        bold: true,
        color: "#ffffff",
        fillColor: "#003c8d",
        alignment: "center",
        margin: [0, 6, 0, 6]
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
