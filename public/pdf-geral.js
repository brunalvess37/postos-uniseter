// ==========================================
// RELATÓRIO POSTOS UNISETER — VERSÃO FINAL
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
    const selecionados = JSON.parse(localStorage.getItem("postos_selecionados") || "[]");
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

  // ===== ORDENAÇÃO GLOBAL (CRÍTICA) =====
  dados.sort((a, b) => {
    const grupoA = filtros.ordem === "zona" ? (a.ZONA || "") : (a.CIDADE || "");
    const grupoB = filtros.ordem === "zona" ? (b.ZONA || "") : (b.CIDADE || "");

    if (grupoA !== grupoB) return grupoA.localeCompare(grupoB);

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
        `${p["CONTATO 1 - Nome"] || ""} ${p["CONTATO 1 - Telefone"] || ""}`.trim()
      );
    }

    if (p["CONTATO 2 - Nome"] || p["CONTATO 2 - Telefone"]) {
      contatos.push(
        `${p["CONTATO 2 - Nome"] || ""} ${p["CONTATO 2 - Telefone"] || ""}`.trim()
      );
    }

    return contatos.length
      ? [{ text: "Contato:\n", bold: true }, contatos.join("\n")]
      : [];
  }

  // ===== CONTEÚDO =====
  let grupoAtual = null;
  const conteudo = [];

  dados.forEach(p => {

    const grupo = filtros.ordem === "zona"
      ? (p.ZONA || "ZONA NÃO INFORMADA")
      : (p.CIDADE || "CIDADE NÃO INFORMADA");

    if (grupo !== grupoAtual) {
      grupoAtual = grupo;

      conteudo.push({
        text: grupo.toUpperCase(),
        style: "grupo",
        margin: [0, 16, 0, 8]
      });
    }

    const bloco = [
      { text: p["POSTOS DE SERVIÇOS / GRUPO SETER"] + "\n", bold: true, fontSize: 11 },
      { text: (p.TIPO || "") + "\n", italics: true },
      { text: enderecoCompleto(p) + "\n" }
    ];

    if (p.OBSERVAÇÃO) {
      bloco.push({ text: p.OBSERVAÇÃO + "\n" });
    }

    bloco.push(...contatosFormatados(p));

    conteudo.push({
      margin: [0, 0, 0, 12],
      stack: bloco
    });
  });

  // ===== DOCUMENTO =====
  const doc = {
    pageSize: "A4",
    pageMargins: [40, 80, 40, 60],

    header: () => ({
      columns: [
        {
          text: "RELATÓRIO POSTOS UNISETER",
          alignment: "center",
          fontSize: 14,
          bold: true
        },
        {
          text: `Gerado em ${new Date().toLocaleString("pt-BR")}`,
          alignment: "right",
          fontSize: 9
        }
      ],
      margin: [40, 30, 40, 20]
    }),

    footer: (p, t) => ({
      text: `Página ${p} de ${t}`,
      alignment: "center",
      fontSize: 9,
      margin: [0, 20, 0, 0]
    }),

    content: conteudo,

    styles: {
      grupo: {
        fontSize: 12,
        bold: true,
        color: "#ffffff",
        fillColor: "#003c8d",
        alignment: "left",
        margin: [0, 8, 0, 8],
        padding: [8, 6, 8, 6]
      }
    }
  };

  pdfMake.createPdf(doc).open();
}
