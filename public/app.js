// ========= ESTADO GLOBAL =========
let postos = [];
let favoritos = JSON.parse(localStorage.getItem("postos_favoritos") || "[]");
let historico = JSON.parse(localStorage.getItem("historico_busca") || "[]");

// ========= LOADER =========
const loader = document.createElement("div");
loader.className = "search-state";
loader.textContent = "Carregando postos…";
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".search-box")?.appendChild(loader);
});

// ========= CARREGAR DADOS =========
async function carregarPostos() {
  try {
    const res = await fetch("/api/postos");
    if (!res.ok) throw new Error("Erro ao buscar dados");
    postos = await res.json();
  } catch (e) {
    alert("Erro ao carregar postos.");
    console.error(e);
  } finally {
    loader.remove();
  }
}

// ========= FAVORITOS =========
function isFavorito(id) {
  return favoritos.includes(id);
}

function toggleFavorito(id) {
  if (isFavorito(id)) {
    favoritos = favoritos.filter(f => f !== id);
  } else {
    favoritos.push(id);
  }
  localStorage.setItem("postos_favoritos", JSON.stringify(favoritos));
  abrirDetalhes(id);
}

// ========= CONTATOS =========
function montarListaContatos(p) {
  const contatos = [];

  [["CONTATO 1 - Nome", "CONTATO 1 - Telefone"], ["CONTATO 2 - Nome", "CONTATO 2 - Telefone"]]
    .forEach(([nomeKey, telKey]) => {
      if (p[nomeKey] || p[telKey]) {
        contatos.push({
          nome: p[nomeKey],
          telefone: p[telKey]
        });
      }
    });

  if (!contatos.length) return "";

  return `
    <p><b>Contato:</b></p>
    ${contatos.map(c =>
      c.telefone
        ? `<div><a href="tel:${c.telefone}">${c.nome ? c.nome + " — " : ""}${c.telefone}</a></div>`
        : `<div>${c.nome}</div>`
    ).join("")}
  `;
}

// ========= DETALHES =========
function abrirDetalhes(i) {
  const p = postos[i];
  const favorito = isFavorito(i);

  const end =
    (p["ENDEREÇO I"] || "") +
    (p["ENDEREÇO II"] ? " - " + p["ENDEREÇO II"] : "") +
    (p["ENDEREÇO III"] ? " - " + p["ENDEREÇO III"] : "") +
    (p["ENDEREÇO IV"] ? " - " + p["ENDEREÇO IV"] : "");

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${p.Latitude},${p.Longitude}`;
  const wazeUrl = `https://waze.com/ul?ll=${p.Latitude},${p.Longitude}&navigate=yes`;

  document.getElementById("details").innerHTML = `
    <h3>
      ${p["POSTOS DE SERVIÇOS / GRUPO SETER"]}
      <button onclick="toggleFavorito(${i})" style="margin-left:8px;">
        ${favorito ? "★" : "☆"}
      </button>
    </h3>

    <p><b>Cidade:</b> ${p.CIDADE}</p>
    <p><b>Endereço:</b> ${end}</p>

    ${montarListaContatos(p)}

    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
      <a href="${mapsUrl}" target="_blank">
        <button>📍 Google Maps</button>
      </a>
      <a href="${wazeUrl}" target="_blank">
        <button>🚗 Waze</button>
      </a>
    </div>

    <div style="margin-top:12px;">
      <button onclick="addRota(${i})">➕ Adicionar à rota</button>
      <button onclick="location='rota.html'">📍 Abrir rota</button>
    </div>
  `;

  document.getElementById("suggestions").innerHTML = "";
  document.getElementById("search").value = "";
  document.getElementById("details").scrollIntoView({ behavior: "smooth" });
}

window.abrirDetalhes = abrirDetalhes;

// ========= ROTA =========
function addRota(i) {
  const dados = JSON.parse(localStorage.getItem("rota_postos") || "{}");
  const rota = dados.rota || [];

  rota.push({ ...postos[i] });

  localStorage.setItem("rota_postos", JSON.stringify({
    rota,
    data: new Date().toLocaleString("pt-BR")
  }));

  alert("Posto adicionado à rota!");
}

// ========= DOM =========
document.addEventListener("DOMContentLoaded", async () => {

  await carregarPostos();

  const searchInput = document.getElementById("search");
  const suggestions = document.getElementById("suggestions");

  // ===== HISTÓRICO =====
  function renderHistorico() {
    if (!historico.length) return;
    suggestions.innerHTML = historico.map(h => `
      <div class="suggestion-card">
        <div class="suggestion-city">🧾 ${h}</div>
      </div>
    `).join("");
  }

  searchInput.addEventListener("focus", () => {
    if (!searchInput.value) renderHistorico();
  });

  // ===== BUSCA =====
  searchInput.oninput = function () {
    const q = this.value.toLowerCase();
    suggestions.innerHTML = "";

    if (!q) {
      renderHistorico();
      return;
    }

    if (!historico.includes(q)) {
      historico.unshift(q);
      historico = historico.slice(0, 5);
      localStorage.setItem("historico_busca", JSON.stringify(historico));
    }

    const lista = postos.filter(p =>
      p["POSTOS DE SERVIÇOS / GRUPO SETER"]?.toLowerCase().includes(q) ||
      p.CIDADE?.toLowerCase().includes(q)
    ).slice(0, 10);

    suggestions.innerHTML = lista.map(p => {
      const index = postos.indexOf(p);
      return `
        <div class="suggestion-card" onclick="abrirDetalhes(${index})">
          <div class="suggestion-title">${p["POSTOS DE SERVIÇOS / GRUPO SETER"]}</div>
          <div class="suggestion-city">${p.CIDADE}</div>
        </div>
      `;
    }).join("");
  };
});
