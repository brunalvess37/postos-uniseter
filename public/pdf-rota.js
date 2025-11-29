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

    // Cabeçalho PDF
    let conteudo = [
        { text:"POSTOS UNISETER — ROTA DO DIA", style:"titulo" },
        { text:`Data: ${data}`, margin:[0,0,0,10] },
        { text:`Total de postos na rota: ${rota.length}`, margin:[0,0,0,20] }
    ];

    // Tabela
    let tabela = {
        table:{
            headerRows:1,
            widths:["8%","30%","35%","27%"],
            body:[
                [
                    {text:"Ordem",style:"th"},
                    {text:"Posto",style:"th"},
                    {text:"Endereço",style:"th"},
                    {text:"Contato",style:"th"}
                ]
            ]
        }
    };

    rota.forEach((p,i)=>{

        // Endereço completo para exibição
        const endereco = 
              (p["ENDEREÇO I"]||"")
            + (p["ENDEREÇO II"]? " - "+p["ENDEREÇO II"]:"")
            + (p["ENDEREÇO III"]? " - "+p["ENDEREÇO III"]:"")
            + (p["ENDEREÇO IV"]? " - "+p["ENDEREÇO IV"]:"");

        // Contatos
        const contato =
            ((p["CONTATO 1 - Nome"]||"")+" "+(p["CONTATO 1 - Telefone"]||""))
            + "\n" +
            ((p["CONTATO 2 - Nome"]||"")+" "+(p["CONTATO 2 - Telefone"]||""));

        tabela.table.body.push([
            i+1,
            p.nome || "-",
            endereco,
            contato
        ]);

    });

    conteudo.push(tabela);

    const doc = {
        content:conteudo,
        styles:{
            titulo:{ fontSize:16, bold:true, margin:[0,0,0,15]},
            th:{ bold:true, fillColor:"#eeeeee" }
        },
        pageSize:"A4",
        pageOrientation:"portrait"
    };

    pdfMake.createPdf(doc).open();
}
