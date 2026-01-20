// ==========================================
// RELATÓRIO POSTOS UNISETER — LAYOUT FINAL
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
      alert("Nenhum posto selecionado na tela Buscar Postos.");
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

  function endereco(p) {
    return [
      p["ENDEREÇO I"],
      p["ENDEREÇO II"],
      p["ENDEREÇO III"],
      p["ENDEREÇO IV"]
    ].filter(Boolean).join(" - ");
  }

  function contatos(p) {
    const c = [];
    if (p["CONTATO 1 - Nome"] || p["CONTATO 1 - Telefone"])
      c.push(`${p["CONTATO 1 - Nome"] || ""} ${p["CONTATO 1 - Telefone"] || ""}`);
    if (p["CONTATO 2 - Nome"] || p["CONTATO 2 - Telefone"])
      c.push(`${p["CONTATO 2 - Nome"] || ""} ${p["CONTATO 2 - Telefone"] || ""}`);
    return c.join(" • ");
  }

  let grupoAtual = null;
  const conteudo = [];

  dados.forEach(p => {
    const grupo = filtros.ordem === "zona"
      ? (p.ZONA || "Zona não informada")
      : (p.CIDADE || "Cidade não informada");

    if (grupo !== grupoAtual) {
      grupoAtual = grupo;
      conteudo.push({
        text: grupo.toUpperCase(),
        style: "grupo",
        margin: [0, 18, 0, 10]
      });
    }

    conteudo.push({
      margin: [0, 0, 0, 14],
      stack: [
        { text: p["POSTOS DE SERVIÇOS / GRUPO SETER"], style: "posto" },
        { text: p.TIPO || "", style: "tipo" },
        { text: endereco(p), style: "endereco" },
        p.OBSERVAÇÃO ? { text: p.OBSERVAÇÃO, style: "obs" } : {},
        contatos(p) ? { text: contatos(p), style: "contato" } : {},
        {
          canvas: [{ type: "line", x1: 0, y1: 6, x2: 515, y2: 6, lineWidth: 0.5, lineColor: "#dddddd" }]
        }
      ]
    });
  });

  const doc = {
    pageSize: "A4",
    content: [
      { text: "RELATÓRIO POSTOS UNISETER", style: "titulo" },
      {
        text: `Gerado em ${new Date().toLocaleString("pt-BR")}`,
        alignment: "right",
        margin: [0, 0, 0, 20],
        fontSize: 9
      },
      ...conteudo
    ],
    footer: (p, t) => ({
      text: `Página ${p} de ${t}`,
      alignment: "center",
      fontSize: 9
    }),
    styles: {
      titulo: { fontSize: 16, bold: true, alignment: "center" },
      grupo: { fontSize: 13, bold: true, fillColor: "#eef3ff", margin: [0, 8, 0, 6] },
      posto: { fontSize: 11, bold: true },
      tipo: { fontSize: 9, italics: true, margin: [0, 1, 0, 2] },
      endereco: { fontSize: 9 },
      obs: { fontSize: 9, italics: true, margin: [0, 2, 0, 0] },
      contato: { fontSize: 9, margin: [0, 2, 0, 0] }
    }
  };

  pdfMake.createPdf(doc).open();
}
