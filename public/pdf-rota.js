// ==============================
// PDF DA ROTA DO DIA  - POSTOS UNISETER
// ==============================

function gerarPDFRota(){

  const dataLocal = JSON.parse(localStorage.getItem("rota_postos") || "{}");
  const rota = dataLocal.rota || [];
  const data = dataLocal.data || new Date().toLocaleString("pt-BR");

  if(!rota.length){
    alert("Nenhum posto na rota para gerar PDF.");
    return;
  }

  function enderecoCompleto(p){
    return [
      p["ENDEREÇO I"],
      p["ENDEREÇO II"],
      p["ENDEREÇO III"],
      p["ENDEREÇO IV"]
    ].filter(Boolean).join(" - ");
  }

  function contatos(p){
    const lista = [];

    if(p["CONTATO 1 - Nome"] || p["CONTATO 1 - Telefone"]){
      lista.push(
        `${p["CONTATO 1 - Nome"] || ""} ${p["CONTATO 1 - Telefone"] || ""}`.trim()
      );
    }

    if(p["CONTATO 2 - Nome"] || p["CONTATO 2 - Telefone"]){
      lista.push(
        `${p["CONTATO 2 - Nome"] || ""} ${p["CONTATO 2 - Telefone"] || ""}`.trim()
      );
    }

    return lista.join("\n");
  }

  const conteudo = [];

  // 🔹 CABEÇALHO
  conteudo.push(
    { text: "ROTA DO DIA", style: "titulo", margin: [0,0,0,6] },
    { text: `Data: ${data}`, margin: [0,0,0,2] },
    { text: `Total de postos: ${rota.length}`, margin: [0,0,0,15] }
  );

  // 🔹 LISTA DE POSTOS
  rota.forEach((p, i) => {

    conteudo.push({
      stack: [

        // Ordem + Nome
        {
          text: `${i+1}. ${p["POSTOS DE SERVIÇOS / GRUPO SETER"] || "-"}`,
          style: "posto"
        },

        // Cidade
        {
          text: p.CIDADE || "",
          color: "#666",
          margin: [0, 0, 0, 4]
        },

        // Endereço
        {
          text: "Endereço:",
          bold: true,
          fontSize: 11
        },
        {
          text: enderecoCompleto(p),
          margin: [0, 0, 0, 4]
        },

        // Contato
        contatos(p) ? {
          text: "Contato:",
          bold: true,
          fontSize: 11
        } : null,

        contatos(p) ? {
          text: contatos(p),
          margin: [0, 0, 0, 6]
        } : null,

        // Linha separadora
        {
          canvas: [{
            type: "line",
            x1: 0, y1: 0, x2: 515, y2: 0,
            lineWidth: 0.5,
            lineColor: "#cccccc"
          }],
          margin: [0, 8, 0, 8]
        }

      ].filter(Boolean)
    });

  });

  const doc = {
    pageSize: "A4",
    pageMargins: [40, 80, 40, 60],

    header: {
      margin: [40, 20, 40, 10],
      text: "POSTOS UNISETER — ROTA DO DIA",
      style: "titulo",
      alignment: "center"
    },

    footer: function(currentPage, pageCount){
      return {
        margin: [40, 10, 40, 0],
        columns: [
          {
            text: `Gerado em ${new Date().toLocaleString("pt-BR")}`,
            fontSize: 9
          },
          {
            text: `Página ${currentPage} de ${pageCount}`,
            alignment: "right",
            fontSize: 9
          }
        ]
      };
    },

    content: conteudo,

    styles: {
      titulo: {
        fontSize: 16,
        bold: true
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
