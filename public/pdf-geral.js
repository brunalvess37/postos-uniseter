// ==========================================
// RELATÓRIO POSTOS UNISETER — PDF FINAL
// ==========================================
async function gerarPDFGeral(filtros) {

  let dados = await fetch("/api/postos").then(r => r.json());

  function isCadastroInativo(p) {
  return !!(
    p.DATA_INATIVO &&
    String(p.DATA_INATIVO).trim() !== ""
  );
}


  // ===== ATIVOS x TODOS =====
if (filtros.tipo === "ativos") {
  dados = dados.filter(p => !isCadastroInativo(p));
}

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

  // ZONA (mantém exatamente como está)
  if (filtros.ordem === "zona") {
    return (a.ZONA || "").localeCompare(b.ZONA || "") ||
      (a["POSTOS DE SERVIÇOS / GRUPO SETER"] || "")
        .localeCompare(b["POSTOS DE SERVIÇOS / GRUPO SETER"] || "");
  }

  // CIDADE (novo nome para o comportamento atual)
  if (filtros.ordem === "cidade") {
    return (a.CIDADE || "").localeCompare(b.CIDADE || "") ||
      (a["POSTOS DE SERVIÇOS / GRUPO SETER"] || "")
        .localeCompare(b["POSTOS DE SERVIÇOS / GRUPO SETER"] || "");
  }

  // NOME DO POSTO (novo: A–Z simples, sem agrupamento)
  return (a["POSTOS DE SERVIÇOS / GRUPO SETER"] || "")
    .localeCompare(b["POSTOS DE SERVIÇOS / GRUPO SETER"] || "");
});

  // ===== MAPA PARA RASTREAR PÁGINAS REAIS =====
const mapaPaginas = dados.map((p, i) => ({
  id: `posto_${i}`, // identificador único no PDF
  rotulo: `${p["POSTOS DE SERVIÇOS / GRUPO SETER"] || ""} (${p.CIDADE || ""})`,
  pagina: null
}));

// ===== LISTA DO ÍNDICE (derivada do mapa de páginas) =====
const listaIndice = mapaPaginas.map(mp => ({
  rotulo: mp.rotulo,
  pagina: null
}));


// ===== FUNÇÕES DO ÍNDICE =====

// Linha compacta do índice com pontilhado e número alinhado à direita
function linhaIndice(rotulo, pagina) {
  return {
    columns: [
      {
        text: rotulo,
        fontSize: 8,
        noWrap: false   // ← permite quebrar linha se o nome for muito grande
      },
      {
        text:
          "........................................................................................",
        fontSize: 8,
        color: "#999"
      },
      {
        text: (pagina ?? "").toString(),
        fontSize: 8,
        alignment: "right",
        width: 20
      }
    ],
    columnGap: 4,
    margin: [0, 0, 0, 2]
  };
}


// Distribui itens em 3 colunas (coluna 0, 1 ou 2)
// Monta o índice em 3 colunas alinhadas linha a linha (tabela)
function montarIndiceEmTresColunas(lista) {

  const linhas = [];

  for (let i = 0; i < lista.length; i += 3) {
    const c1 = lista[i];
    const c2 = lista[i + 1];
    const c3 = lista[i + 2];

    linhas.push([
      c1 ? linhaIndice(c1.rotulo, c1.pagina) : { text: "" },
      c2 ? linhaIndice(c2.rotulo, c2.pagina) : { text: "" },
      c3 ? linhaIndice(c3.rotulo, c3.pagina) : { text: "" }
    ]);
  }

  return {
    table: {
      widths: ["*", "*", "*"], // 3 colunas iguais
      body: linhas
    },
    layout: "noBorders"
  };
}


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

  let primeiroDaCidade = false;

  dados.forEach((p, i) => {

    let grupo = null;

if (filtros.ordem === "zona") {
  grupo = p.ZONA;
} else if (filtros.ordem === "cidade") {
  grupo = p.CIDADE;
}


    // ===== FAIXA DE AGRUPAMENTO =====
    if (grupo && grupo !== grupoAtual) {
  grupoAtual = grupo;
  primeiroDaCidade = true;

  conteudo.push({
    _tipo: "faixa",
    margin: [0, 10, 0, 12],
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
const blocoPosto = {
  margin: [0, 0, 0, 0],
  unbreakable: true,
  stack: [

    // 🔹 MARCADOR INVISÍVEL PARA PAGINAÇÃO REAL
    {
      text: "",
      id: mapaPaginas[i].id
    },

    // Nome do posto
{
  text: p["POSTOS DE SERVIÇOS / GRUPO SETER"],
  style: "posto",
  margin: [0, 0, 0, 2]
},


    // Tipo do posto
    {
  text: isCadastroInativo(p)
    ? [
        { text: p.TIPO || "", italics: true, color: "#666" },
        { text: "  (Cadastro INATIVO)", italics: true, color: "#b71c1c" }
      ]
    : (p.TIPO || ""),
  fontSize: 8,
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

    p.OBSERVAÇÃO
      ? {
          text: p.OBSERVAÇÃO,
          fontSize: 11,
          color: "#555",
          italics: true,
          margin: [12, 0, 0, 4]
        }
      : null,

    contatosFormatados(p)
      ? {
          stack: contatosFormatados(p),
          fontSize: 11,
          lineHeight: 1.25,
          margin: [12, 0, 0, 1]
        }
      : null,

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
};

// 🔒 linha do posto (como tabela)
const linhaPosto = {
  unbreakable: true,
  table: {
    widths: isCadastroInativo(p) ? [2, "*"] : [0.1, "*"], // 👈 Largura da Tarja - nunca zero
    body: [[
      isCadastroInativo(p)
        ? { fillColor: "#b71c1c", text: "" }
        : { text: "" },
      blocoPosto
    ]]
  },
  layout: "noBorders"
};


if (primeiroDaCidade) {
  const faixa = conteudo.pop(); // remove a faixa recém inserida

  conteudo.push({
    unbreakable: true,
    stack: [
      faixa,
      linhaPosto
    ]
  });

  primeiroDaCidade = false;
} else {
  conteudo.push(linhaPosto);
}

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
      style: "titulo",
      margin: [0, 0, 0, 6]
    },
    {
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 1,        // 👈 mais forte que as linhas dos postos
          lineColor: "#999999" // 👈 cinza mais escuro
        }
      ],
      margin: [0, 0, 0, 6]
    }
  ]
},


    footer: function (currentPage, pageCount) {
  return {
    margin: [40, 10, 40, 0],
    columns: [
      {
        text: [
          `Gerado em ${new Date().toLocaleString("pt-BR")}`,
          linhaUsuario ? `\n${linhaUsuario}` : ""
        ],
        fontSize: 9,
        alignment: "left"
      },
      {
        text: `Página ${currentPage} de ${pageCount}`,
        fontSize: 9,
        alignment: "right"
      }
    ]
  };
},

    content: [
  ...(filtros.incluirIndice
    ? [
        {
          // ← NÃO usamos mais pageBreak:"before" aqui
          stack: [
            {
              text: "POSTOS UNISETER",
              style: "titulo",
              alignment: "center",
              margin: [0, 0, 0, 2]
            },
            {
              text: "ÍNDICE",
              fontSize: 11,
              alignment: "center",
              margin: [0, 0, 0, 8]
            },

            montarIndiceEmTresColunas(listaIndice)

          ],
          pageBreak: "after" // ← QUEBRA DE PÁGINA APÓS O ÍNDICE
        }
      ]
    : []),
  ...conteudo
],


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
