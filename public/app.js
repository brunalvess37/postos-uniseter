function mostrarPosto(p) {
  const enderecoExibicao = 
    (p["ENDEREÇO I"] || "") +
    (p["ENDEREÇO II"] ? " - " + p["ENDEREÇO II"] : "") +
    (p["ENDEREÇO III"] ? " - " + p["ENDEREÇO III"] : "") +
    (p["ENDEREÇO IV"] ? " - " + p["ENDEREÇO IV"] : "");

  details.innerHTML = `
    <div class="card">
      <h3>${p["POSTOS DE SERVIÇOS / GRUPO SETER"]}</h3>
      <p><b>Cidade:</b> ${p.CIDADE}</p>
      <p><b>Endereço:</b> ${enderecoExibicao}</p>

      <p><b>Contato 1:</b> ${p["CONTATO 1 - Nome"] || "-"} 
      — <a href="tel:${p["CONTATO 1 - Telefone"]}">${p["CONTATO 1 - Telefone"]}</a></p>

      <p><b>Contato 2:</b> ${p["CONTATO 2 - Nome"] || "-"} 
      — <a href="tel:${p["CONTATO 2 - Telefone"]}">${p["CONTATO 2 - Telefone"]}</a></p>

      <p><b>Obs:</b> ${p.OBSERVAÇÃO || "-"}</p>
      <p><b>Zona:</b> ${p.ZONA || "-"}</p>

      <button onclick="adicionarRota(${p.Latitude},${p.Longitude},'${p["POSTOS DE SERVIÇOS / GRUPO SETER"]}', '${enderecoExibicao}')">Adicionar à rota</button>
      <button onclick="window.open('${p.LINK}','_blank')">Abrir no Waze</button>
      <button onclick="window.open('https://www.google.com/maps?q=${encodeURIComponent(p.ENDERECO_COMPLETO)}','_blank')">Maps</button>
    </div>
  `;
}
