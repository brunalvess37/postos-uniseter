// ========= Carregar dados do Cloudflare KV =========
let postos = [];

async function carregarPostos(){
  try {
    const res = await fetch("/api/postos");
    
    if (!res.ok) throw new Error("Erro");

    postos = await res.json();
    
    console.log("Postos carregados:", postos);
    
  } catch (e) {
    alert("Erro ao carregar dados.");
    console.error(e);
  }
}

carregarPostos();

// ========= DOM =========
document.addEventListener("DOMContentLoaded", async () => {

  // carrega dados primeiro
  await carregarPostos();

  // ========= BUSCA =========
  const searchInput = document.getElementById("search");
  const suggestions = document.getElementById("suggestions");

  if (!searchInput || !suggestions) {
    console.warn("Campo de busca não encontrado no DOM");
    return;
  }

  searchInput.oninput = function () {
  const q = this.value.toLowerCase();

  if (!q) {
    suggestions.innerHTML = "";
    return;
  }

  const lista = postos.filter(p =>
    p["POSTOS DE SERVIÇOS / GRUPO SETER"]?.toLowerCase().includes(q) ||
    p.CIDADE?.toLowerCase().includes(q) ||
    (p.ENDERECO_COMPLETO || "").toLowerCase().includes(q)
  ).slice(0, 10);

  suggestions.innerHTML = lista.map(p => {
    const index = postos.indexOf(p);

    return `
<div class="suggestion-card" onclick="abrirDetalhes(${index})">
  <div class="suggestion-title">
    ${p["POSTOS DE SERVIÇOS / GRUPO SETER"]}
  </div>
  <div class="suggestion-city">
    ${p.CIDADE}
  </div>
</div>
`;
  }).join("");
};

// ========= DETALHES =========
function abrirDetalhes(i) {
  const p = postos[i];

  const end =
    (p["ENDEREÇO I"] || "") +
    (p["ENDEREÇO II"] ? " - " + p["ENDEREÇO II"] : "") +
    (p["ENDEREÇO III"] ? " - " + p["ENDEREÇO III"] : "") +
    (p["ENDEREÇO IV"] ? " - " + p["ENDEREÇO IV"] : "");

  document.getElementById("details").innerHTML = `
    <h3>${p["POSTOS DE SERVIÇOS / GRUPO SETER"]}</h3>
    <p><b>Cidade:</b> ${p.CIDADE}</p>
    <p><b>Endereço:</b> ${end}</p>
    <p><b>Contato 1:</b> ${p["CONTATO 1 - Nome"] || ""} — ${p["CONTATO 1 - Telefone"] || ""}</p>
    <p><b>Contato 2:</b> ${p["CONTATO 2 - Nome"] || ""} — ${p["CONTATO 2 - Telefone"] || ""}</p>
    <button onclick="addRota(${i})">➕ Adicionar à rota</button>
    <button onclick="location='rota.html'">📍 Abrir rota</button>
  `;
}

// ========= ROTA =========
function addRota(i) {
  let dados = JSON.parse(localStorage.getItem("rota_postos") || "{}");
  let rota = dados.rota || [];

  rota.push({
    nome: postos[i]["POSTOS DE SERVIÇOS / GRUPO SETER"],
    lat: postos[i].Latitude,
    lon: postos[i].Longitude,
    ...postos[i]
  });

  localStorage.setItem("rota_postos", JSON.stringify({
    rota,
    data: new Date().toLocaleString("pt-BR")
  }));

  alert("Posto adicionado à rota!");
}
