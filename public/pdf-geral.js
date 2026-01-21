// ==========================================
// RELATÓRIO POSTOS UNISETER (LAYOUT APROVADO)
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

  // ===== ORDENAÇÃO (ANTES DO AGRUPAMENTO) =====
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
  function enderecoCompleto(p){
    return [
      p["ENDEREÇO I"],
      p["ENDEREÇO II"],
      p["ENDEREÇO III"],
      p["ENDEREÇO IV"],
      p.CIDADE
    ].filter(Boolean).join(" - ");
  }

  function contatosFormatados(p){
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

    return contatos.join(" / ");
  }

  // ===== CONTEÚDO DO PDF =====
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
        style: "faixaGrupo",
        margin: [0, 16, 0, 8]
      });
    }

    conteudo.push({
      margin: [0, 0, 0, 12],
      text: [
        { text: p["POSTOS DE SERVIÇOS / GRUPO SETER"] + "\n", bold: true },
        (p.TIPO || "") + "\n",
        enderecoCompleto(p) + "\n",
        p.OBSERVAÇÃO ? p.OBSERVAÇÃO + "\n" : "",
        contatosFormatados(p) ? "Contato: " + contatosFormatados(p) : ""
      ]
    });
  });

  // ===== DOCUMENTO =====
  const doc = {
    pageSize: "A4",

    header: {
      margin: [40, 20, 40, 0],
      columns: [
        {
          text: "RELATÓRIO POSTOS UNISETER",
          style: "titulo",
          alignment: "center"
        }
      ]
    },

    footer: (p, t) => ({
      text: `Página ${p} de ${t}`,
      alignment: "center",
      fontSize: 9,
      margin: [0, 10, 0, 0]
    }),

    content: [
      {
        text: `Gerado em ${new Date().toLocaleString("pt-BR")}`,
        alignment: "right",
        margin: [0, 10, 0, 20],
        fontSize: 10
      },
      ...conteudo
    ],

    styles: {
      titulo: {
        fontSize: 16,
        bold: true
      },
      faixaGrupo: {
        fontSize: 13,
        bold: true,
        color: "#ffffff",
        fillColor: "#003A8F",
        margin: [0, 0, 0, 6]
      }
    }
  };

  pdfMake.createPdf(doc).open();
}
