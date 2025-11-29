document.addEventListener("DOMContentLoaded", async () => {

  // 📌 Carregar dados do Netlify Blobs
  const postos = await fetch("/.netlify/blobs/postos.json")
    .then(r => r.json())
    .catch(() => []);

  const input = document.getElementById("search");
  const suggestions = document.getElementById("suggestions");
  const details = document.getElementById("details");

  input.addEventListener("input", () => {
    const termo = input.value.toLowerCase().trim();
    suggestions.innerHTML = "";
    if (termo.length < 2) return;

    const resultado = postos.filter(p =>
      JSON.stringify(p).toLowerCase().includes(termo)
    );

    resultado.slice(0, 10).forEach(posto => {
      const div = document.createElement("div");
      div.classList.add("suggest-item");
      div.textContent = `${posto.Nome || posto.nome} — ${posto.Cidade || posto.cidade}`;
      div.onclick = () => exibirPosto(posto);
      suggestions.appendChild(div);
    });
  });

  function exibirPosto(p) {
    suggestions.innerHTML = "";
    input.value = "";

    details.innerHTML = `
      <div class="card">
        <h3>${p.Nome}</h3>
        <p><b>Cidade:</b> ${p.Cidade}</p>
        <p><b>Endereço:</b> ${p.EnderecoCompleto}</p>
        <p><b>Contato:</b> ${p.Telefone}</p>

        <button onclick="window.open('${p.Waze}','_blank')">Abrir no Waze</button>
        <button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.EnderecoCompleto)}','_blank')">Abrir no Maps</button>
        <button onclick="adicionarRota('${p.Nome}')">Adicionar à rota</button>
      </div>
    `;
  }

});

// 🔥 ROTA (será implementado no próximo passo)
function adicionarRota(nome){
  alert("Posto adicionado à rota (função será ativada na próxima etapa)");
}
