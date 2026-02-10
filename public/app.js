// =====================================================
// ESTADO GLOBAL
// =====================================================
let postos = [];
let favoritos = JSON.parse(localStorage.getItem("postos_favoritos") || "[]");
let historico = JSON.parse(localStorage.getItem("historico_busca") || "[]");

// =====================================================
// STATUS DO CADASTRO
// =====================================================
function isCadastroInativo(p) {
  return !!p.DATA_INATIVO;
}

// =====================================================
// LOADER
// =====================================================
const loader = document.createElement("div");
loader.className = "search-state";
loader.textContent = "Carregando postos…";

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".search-box")?.appendChild(loader);
});

// =====================================================
// CARREGAR DADOS
// =====================================================
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

// =====================================================
// FAVORITOS
// =====================================================
function isFavorito(id) {
  return favoritos.includes(id);
}

function toggleFavorito(id) {
  const p = postos[id];

  if (isCadastroInativo(p)) {
    alert("⚠️ Cadastro inativo não pode ser favoritado.");
    return;
  }

  favoritos = isFavorito(id)
    ? favoritos.filter(f => f !== id)
    : [...favoritos, id];

  localStorage.setItem("postos_favoritos", JSON.stringify(favoritos));
  abrirDetalhes(id);
}


// =====================================================
// CONTATOS
// =====================================================
function montarListaContatos(p) {
  const contatos = [];

  [
    ["CONTATO 1 - Nome", "CONTATO 1 - Telefone"],
    ["CONTATO 2 - Nome", "CONTATO 2 - Telefone"]
  ].forEach(([n, t]) => {
    if (p[n] || p[t]) contatos.push({ nome: p[n], telefone: p[t] });
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

// =====================================================
// DETALHES DO POSTO
// =====================================================
function abrirDetalhes(i) {
  const p = postos[i];
  if (!p) return;

  const inativo = isCadastroInativo(p);

  const end = [
    p["ENDEREÇO I"],
    p["ENDEREÇO II"],
    p["ENDEREÇO III"],
    p["ENDEREÇO IV"]
  ].filter(Boolean).join(" - ");

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${p.Latitude},${p.Longitude}`;
  const wazeUrl = `https://waze.com/ul?ll=${p.Latitude},${p.Longitude}&navigate=yes`;

  document.getElementById("details").innerHTML = `
  <h3>
  ${p["POSTOS DE SERVIÇOS / GRUPO SETER"]}
  <button
    ${inativo ? "disabled title='Cadastro inativo não pode ser favoritado'" : ""}
    onclick="${inativo ? "" : `toggleFavorito(${i})`}"
  >
    ${isFavorito(i) ? "★" : "☆"}
  </button>
</h3>

${inativo ? `
  <div style="
    margin:8px 0;
    padding:8px;
    background:#ffe5e5;
    color:#b71c1c;
    font-weight:bold;
    border-radius:6px;
    text-align:center;
  ">
    ⚠️ CADASTRO INATIVO
  </div>
` : ""}


  ${inativo ? `
    <div style="
      margin:8px 0;
      padding:8px;
      background:#ffe5e5;
      color:#b71c1c;
      font-weight:bold;
      border-radius:6px;
      text-align:center;
    ">
      ⚠️ CADASTRO INATIVO
    </div>
  ` : ""}


    <p><b>Cidade:</b> ${p.CIDADE}</p>
    <p><b>Endereço:</b> ${end}</p>

    ${montarListaContatos(p)}

    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
      <a href="${mapsUrl}" target="_blank"><button>📍 Google Maps</button></a>
      <a href="${wazeUrl}" target="_blank"><button>🚗 Waze</button></a>
    </div>

    <div style="margin-top:12px;">
  <button
    ${inativo ? "disabled title='Cadastro inativo não pode entrar na rota'" : ""}
    onclick="${inativo ? "" : `addRota(${i})`}"
  >
    ➕ Adicionar à rota
  </button>
  <button onclick="location='rota.html'">📍 Abrir rota</button>
</div>

  `;

  document.getElementById("suggestions").innerHTML = "";
  document.getElementById("search").value = "";
  document.getElementById("details").scrollIntoView({ behavior: "smooth" });
}

window.abrirDetalhes = abrirDetalhes;

// =====================================================
// ROTA
// =====================================================
function addRota(i) {
  const p = postos[i];

  if (isCadastroInativo(p)) {
    alert("⚠️ Cadastro inativo não pode ser adicionado à rota.");
    return;
  }

  const dados = JSON.parse(localStorage.getItem("rota_postos") || "{}");
  const rota = dados.rota || [];

  rota.push({ ...p });

  localStorage.setItem("rota_postos", JSON.stringify({
    rota,
    data: new Date().toLocaleString("pt-BR")
  }));

  alert("Posto adicionado à rota!");
}


// =====================================================
// BUSCA + HISTÓRICO + TECLADO
// =====================================================
document.addEventListener("DOMContentLoaded", async () => {

  await carregarPostos();

  const searchInput = document.getElementById("search");
  const suggestions = document.getElementById("suggestions");
  let activeIndex = -1;

  function renderHistorico() {
    if (!historico.length) return;

    suggestions.innerHTML = historico.map(h => `
      <div class="suggestion-card" data-historico="${h}">
        <div class="suggestion-city">🧾 ${h}</div>
      </div>
    `).join("");

    document.querySelectorAll("[data-historico]").forEach(el => {
      el.onclick = () => {
        searchInput.value = el.dataset.historico;
        searchInput.dispatchEvent(new Event("input"));
      };
    });
  }

  searchInput.addEventListener("focus", () => {
    if (!searchInput.value) renderHistorico();
  });

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();
    suggestions.innerHTML = "";
    activeIndex = -1;

    if (!q) {
      renderHistorico();
      return;
    }

    if (!historico.includes(q)) {
      historico.unshift(q);
      historico = historico.slice(0, 5);
      localStorage.setItem("historico_busca", JSON.stringify(historico));
    }

    // 🔎 BUSCA: NOME + CIDADE + BAIRRO (ENDEREÇO III)
    const lista = postos.filter(p =>
      p["POSTOS DE SERVIÇOS / GRUPO SETER"]?.toLowerCase().includes(q) ||
      p.CIDADE?.toLowerCase().includes(q) ||
      p["ENDEREÇO III"]?.toLowerCase().includes(q)
    ).slice(0, 10);

    suggestions.innerHTML = lista.map(p => {
      const i = postos.indexOf(p);

      const nome = p["POSTOS DE SERVIÇOS / GRUPO SETER"]
        ?.replace(new RegExp(q, "gi"), m => `<mark>${m}</mark>`);

      const cidade = p.CIDADE
        ?.replace(new RegExp(q, "gi"), m => `<mark>${m}</mark>`);

      const bairro = p["ENDEREÇO III"]
        ?.replace(new RegExp(q, "gi"), m => `<mark>${m}</mark>`);

      return `
        <div class="suggestion-card" data-index="${i}">
          <div class="suggestion-title">${nome}</div>
          <div class="suggestion-city">
            ${cidade}${bairro ? " — " + bairro : ""}
          </div>
        </div>
      `;
    }).join("");

    document.querySelectorAll(".suggestion-card[data-index]").forEach(card => {
      card.onclick = () => abrirDetalhes(card.dataset.index);
    });
  });

  searchInput.addEventListener("keydown", e => {
    const items = document.querySelectorAll(".suggestion-card[data-index]");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
    }

    if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      items[activeIndex].click();
      return;
    }

    items.forEach((el, i) =>
      el.classList.toggle("active", i === activeIndex)
    );
  });

});
