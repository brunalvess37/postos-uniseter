// ==============================
// PDF GERAL DOS POSTOS UNISETER
// ==============================
async function gerarPDFGeral() {

    // Carregar dados do Netlify Blobs
    const dados = await fetch("/.netlify/blobs/postos.json")
        .then(r => r.json())
        .catch(()=>[]);

    if(!dados.length){
        alert("Nenhum posto encontrado para gerar PDF.");
        return;
    }

    // Ordenação: Cidade > Nome
    dados.sort((a,b)=>{
        if(a.CIDADE !== b.CIDADE) return a.CIDADE.localeCompare(b.CIDADE);
        return a["POSTOS DE SERVIÇOS / GRUPO SETER"].localeCompare(b["POSTOS DE SERVIÇOS / GRUPO SETER"]);
    });

    // Cabeçalho
    let conteudo = [
        { text:"POSTOS UNISETER — LISTA COMPLETA", style:"titulo" },
        { text:`Data de emissão: ${new Date().toLocaleString("pt-BR")}`, margin:[0,0,0,10] },
        { text:`Total de postos cadastrados: ${dados.length}`, margin:[0,0,0,20] }
    ];

    // Montar tabela principal
    let tabela = {
        table:{
            headerRows:1,
            widths:["18%","28%","10%","10%","24%","10%"],
            body:[
                [
                    {text:"Cidade", style:"th"},
                    {text:"Posto", style:"th"},
                    {text:"Tipo", style:"th"},
                    {text:"Zona", style:"th"},
                    {text:"Endereço", style:"th"},
                    {text:"Contato", style:"th"}
                ]
            ]
        }
    };

    dados.forEach(p=>{
        const endereco = 
              (p["ENDEREÇO I"]||"")
            + (p["ENDEREÇO II"]?" - "+p["ENDEREÇO II"]:"")
            + (p["ENDEREÇO III"]?" - "+p["ENDEREÇO III"]:"")
            + (p["ENDEREÇO IV"]?" - "+p["ENDEREÇO IV"]:"");

        const contato =
              (p["CONTATO 1 - Nome"]||"")+" "+(p["CONTATO 1 - Telefone"]||"")
            + "\n"
            + (p["CONTATO 2 - Nome"]||"")+" "+(p["CONTATO 2 - Telefone"]||"");

        tabela.table.body.push([
            p.CIDADE,
            p["POSTOS DE SERVIÇOS / GRUPO SETER"],
            p.TIPO||"-",
            p.ZONA||"-",
            endereco,
            contato
        ]);
    });

    conteudo.push(tabela);

    // Documento PDF
    const doc = {
        content:conteudo,
        styles:{
            titulo:{ fontSize:16, bold:true, margin:[0,0,0,15]},
            th:{ bold:true, fillColor:"#eeeeee"}
        },
        pageOrientation:"landscape",
        pageSize:"A4"
    };

    pdfMake.createPdf(doc).open();
}
