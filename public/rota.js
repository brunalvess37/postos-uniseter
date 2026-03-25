let dados = JSON.parse(localStorage.getItem("rota_postos")||"{}");
let rota = dados.rota||[];
let dataRota = dados.data||null;
let selecionadosBusca = [];

function distancia(a, b) {
  const dx = a.Latitude - b.Latitude;
  const dy = a.Longitude - b.Longitude;
  return Math.sqrt(dx * dx + dy * dy);
}

function otimizarRota() {
  if (rota.length <= 2) return;

  const inicio = rota[0];
  const restantes = rota.slice(1);
  const novaRota = [inicio];

  let atual = inicio;

  while (restantes.length > 0) {
    let maisProximoIndex = 0;
    let menorDist = distancia(atual, restantes[0]);

    for (let i = 1; i < restantes.length; i++) {
      const d = distancia(atual, restantes[i]);
      if (d < menorDist) {
        menorDist = d;
        maisProximoIndex = i;
      }
    }

    const proximo = restantes.splice(maisProximoIndex, 1)[0];
    novaRota.push(proximo);
    atual = proximo;
  }

  rota = novaRota;

salvarRota();
listar();
}

function abrirNoGoogleMaps(){
  if(!rota.length) return alert("Sem rota.");

  // 🔹 filtra apenas pontos válidos
  const pontosValidos = rota.filter(p => {
    const lat = p.lat || p.Latitude;
    const lon = p.lon || p.Longitude;
    return lat && lon;
  });

  if(pontosValidos.length < 2){
    return alert("Rota precisa de pelo menos 2 pontos válidos.");
  }

  // 🔹 origem
  const origem = pontosValidos[0];
  const latOrigem = origem.lat || origem.Latitude;
  const lonOrigem = origem.lon || origem.Longitude;

  // 🔹 destino
  const destino = pontosValidos[pontosValidos.length - 1];
  const latDestino = destino.lat || destino.Latitude;
  const lonDestino = destino.lon || destino.Longitude;

  // 🔹 intermediários
  const waypoints = pontosValidos.slice(1, -1).map(p => {
    const lat = p.lat || p.Latitude;
    const lon = p.lon || p.Longitude;
    return `${lat},${lon}`;
  }).join("|");

  let url = `https://www.google.com/maps/dir/?api=1`;
  url += `&origin=${latOrigem},${lonOrigem}`;
  url += `&destination=${latDestino},${lonDestino}`;

  if(waypoints){
    url += `&waypoints=${waypoints}`;
  }

  window.open(url, "_blank");
}

function salvarRota(){
  dataRota = new Date().toLocaleString("pt-BR");
  
  localStorage.setItem("rota_postos", JSON.stringify({
    rota,
    data: dataRota
  }));
  
  listar();

  atualizarMapaRota();

const info = document.getElementById("rota-info");
info.innerText = "✔ Rota atualizada automaticamente";

setTimeout(() => {
  info.innerText = dataRota ? `📅 Rota criada em: ${dataRota}` : "";
}, 2000);
}

function limparRota(){
  if(confirm("Apagar rota?")){ rota=[]; dataRota=null; salvarRota(); }
}

function ordenarRota(){
  if(rota.length<2) return alert("Adicione pelo menos 2 destinos.");
  let base=rota[0];
  rota=[base,...rota.slice(1).sort((a,b)=>distancia(base,a)-distancia(base,b))];
  salvarRota();
}

// 🔥 Drag & Drop
document.addEventListener("DOMContentLoaded",()=>{
  listar();
  
  // 📤 Compartilhar rota (AGORA FUNCIONA)
document.getElementById("btnCompartilharRota").onclick = async () => {

  const texto = montarTextoRota();
  if (!texto) return;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Rota do dia — UNISETER",
        text: texto
      });
      return;
    } catch (err) {
      console.log("Compartilhamento cancelado");
    }
  }

  try {
    await navigator.clipboard.writeText(texto);
    alert("Rota copiada! Agora você pode colar.");
  } catch (e) {
    alert("Não foi possível copiar.\n\n" + texto);
  }
};

  
  Sortable.create(document.getElementById("rota-lista"),{
  animation:150,
  handle: ".drag-handle",   // 👈 ESSENCIAL
  delay: 150,               // 👈 evita drag acidental
  delayOnTouchOnly: true,   // 👈 só no celular
  touchStartThreshold: 5,   // 👈 melhora precisão

  onEnd:e=>{
    const item=rota.splice(e.oldIndex,1)[0];
    rota.splice(e.newIndex,0,item);
    salvarRota();
  }
});
  
});

// LISTA
function listar(){
  let box=document.getElementById("rota-lista");
  box.innerHTML="";
  document.getElementById("rota-info").innerHTML =
  rota.length
    ? (dataRota ? `📅 Rota criada em: ${dataRota}` : "")
    : "Nenhuma rota salva";
  
  rota.forEach((p,i)=>{

  const nome = p.nome || p["POSTOS DE SERVIÇOS / GRUPO SETER"] || "Sem nome";
  const cidade = p.cidade || p.CIDADE || "";

  const endereco = [
  p["ENDEREÇO I"],
  p["ENDEREÇO II"],
  p["ENDEREÇO III"],
  p["ENDEREÇO IV"]
].filter(Boolean).join(" - ");

const lat = p.lat || p.Latitude;
const lon = p.lon || p.Longitude;

const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
const wazeUrl = `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;

    
box.innerHTML+= `
  <div class='card' style="
  position:relative;
  padding:16px;
  margin:12px 0;
  border:1px solid #e0e0e0;
  border-radius:12px;
  background:#fff;
">

    <button onclick="remo(${i})"
      style="
  position:absolute;
  top:10px;
  right:10px;
  border:none;
  background:#f0f0f0;
  border-radius:6px;
  padding:4px 8px;
  cursor:pointer;
">
      ✖
    </button>

    <b style="
  display:block;
  padding-right:30px;
  font-size:16px;
  margin-bottom:4px;
">

<span class="drag-handle" style="
  cursor:grab;
  margin-right:8px;
  color:#003c8d;
  font-size:18px;
">☰</span>

      ${i+1}. ${nome}
    </b>

    <div style="
  margin-left:26px;
  margin-top:4px;
">

  <div style="
    font-size:14px;
    font-weight:500;
    color:#1976d2;
    margin-bottom:2px;
  ">
    ${cidade}
  </div>

  <div style="
    font-size:13px;
    color:#666;
  ">
    ${endereco || "Endereço não disponível"}
  </div>

</div>

    <div style="
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin:16px 0;
">

  <button onclick="window.open('${mapsUrl}', '_blank')" style="
  display:flex;
  align-items:center;
  gap:6px;
  padding:8px 14px;
  border-radius:8px;
  border:1px solid #ccc;
  background:#f9f9f9;
  cursor:pointer;
">
  <img src="icons/google-maps.png" style="width:18px;height:18px;">
  Google Maps
</button>

<button onclick="window.open('${wazeUrl}', '_blank')" style="
  display:flex;
  align-items:center;
  gap:6px;
  padding:8px 14px;
  border-radius:8px;
  border:1px solid #ccc;
  background:#f9f9f9;
  cursor:pointer;
">
  <img src="icons/waze.png" style="width:18px;height:18px;">
  Waze
</button>

    </div>

  </div>`;
  
});
}

function remo(i){ rota.splice(i,1); salvarRota(); }

// ================= 🌍 MAPA EXPANSÍVEL =================
let mapRota = null;
let layerRotaMap = null;

function atualizarMapaRota(){

  if (!mapRota || !layerRotaMap) return;

  layerRotaMap.clearLayers();

  const rota = JSON.parse(localStorage.getItem("rota_postos") || "{}").rota || [];

  if (!rota.length) return;

  rota.forEach((p, i) => {

    if (!p.Latitude || !p.Longitude) return;

    const lat = p.Latitude;
    const lon = p.Longitude;

    let cor = "#003c8d";
    if (i === 0) cor = "#2e7d32";
    else if (i === rota.length - 1) cor = "#c62828";

    const icon = L.divIcon({
      className: "",
      html: `
        <div style="
          background:${cor};
          width:26px;
          height:26px;
          border-radius:50%;
          border:2px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,.3);
          display:flex;
          align-items:center;
          justify-content:center;
          color:white;
          font-size:12px;
          font-weight:bold;
        ">
          ${i+1}
        </div>
      `
    });

    const marker = L.marker([lat, lon], { icon }).addTo(layerRotaMap);

    marker.bindPopup(`<b>${i+1}. ${p["POSTOS DE SERVIÇOS / GRUPO SETER"] || ""}</b>`);
  });

  // 🔹 ajustar zoom
  const pontos = rota
    .filter(p => p.Latitude && p.Longitude)
    .map(p => [p.Latitude, p.Longitude]);

  if (pontos.length){
    mapRota.fitBounds(pontos, { padding: [20, 20] });
  }
}

function toggleMapa(){

  const div = document.getElementById("map-rota");

  const visivel = div.style.display === "block";
  div.style.display = visivel ? "none" : "block";

  if (visivel) return;

  // 🔹 cria mapa só uma vez
  if (!mapRota){

    mapRota = L.map("map-rota").setView([-22.9,-47.06], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
      .addTo(mapRota);

    layerRotaMap = L.layerGroup().addTo(mapRota);
  }

  // ✅ ÚNICA LINHA RESPONSÁVEL PELO DESENHO
  atualizarMapaRota();

  // 🔧 corrigir render
  setTimeout(() => {
    mapRota.invalidateSize();
  }, 200);
}

// ================= 🚗 WAZE =================
function abrirNoWaze(){
  if(!rota.length) return alert("Sem rota.");

  // 🔹 pega primeiro ponto corretamente
  const primeiro = rota[0];
  const lat = primeiro.lat || primeiro.Latitude;
  const lon = primeiro.lon || primeiro.Longitude;

  let url = `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;

  // 🔹 adiciona os demais pontos
  rota.slice(1).forEach(p => {
    const lat = p.lat || p.Latitude;
    const lon = p.lon || p.Longitude;
    url += `&ll=${lat},${lon}`;
  });

  window.open(url, "_blank");
}

// ================= 📤 COMPARTILHAR =================
function montarTextoRota() {

  const rota = JSON.parse(localStorage.getItem("rota_postos") || "{}").rota || [];

  if (!rota.length) {
    alert("A rota está vazia.");
    return null;
  }

  let texto = "Rota do dia — UNISETER\n\n";

  rota.forEach((p, i) => {

    const nome = p["POSTOS DE SERVIÇOS / GRUPO SETER"] || "Sem nome";

    const endereco = [
      p["ENDEREÇO I"],
      p["ENDEREÇO II"],
      p["ENDEREÇO III"],
      p["ENDEREÇO IV"]
    ].filter(Boolean).join(" - ");

    texto += `${i + 1}) *${nome}*\n`;
    texto += `${endereco || "Endereço não disponível"}\n\n`;
  });

  return texto;
}

// ================= 🧭 MODAL ZONA =================

function abrirModalZona(){
  document.getElementById("modalZona").style.display = "flex";
}

function fecharModalZona(){
  document.getElementById("modalZona").style.display = "none";
}

function obterPostosPorZona(zona){

  // 🔹 usa MESMA BASE do mapa
  const todos = JSON.parse(localStorage.getItem("postos_cache") || "[]");

  return todos.filter(p => {
    return (p.ZONA || "").toLowerCase() === zona.toLowerCase();
  });
}

document.addEventListener("DOMContentLoaded", () => {

const select = document.getElementById("selectZona");

if (select){

  const postos = JSON.parse(localStorage.getItem("postos_cache") || "[]");

  const zonas = [...new Set(
    postos.map(p => p.ZONA).filter(Boolean)
  )].sort();

  zonas.forEach(z => {
  const opt = document.createElement("option");
  opt.value = z;
  opt.textContent = z;
  select.appendChild(opt);
});

// ✅ NOVO BLOCO 
select.onchange = () => {

  const zona = select.value;

  if (!zona){
    document.getElementById("infoZona").innerText = "Selecione uma zona";
    return;
  }

  const lista = obterPostosPorZona(zona);

  document.getElementById("infoZona").innerText =
    lista.length
      ? `Serão adicionados ${lista.length} postos`
      : "Nenhum posto encontrado nesta zona";
};

}

// ================= 🔎 BUSCA NO MODAL =================

const inputBusca = document.getElementById("buscaRota");
const sugestoes = document.getElementById("sugestoesRota");

if (inputBusca){

  inputBusca.addEventListener("input", () => {

    const q = inputBusca.value.toLowerCase();
    sugestoes.innerHTML = "";

    if (!q) return;

    const postos = JSON.parse(localStorage.getItem("postos_cache") || "[]");

    const lista = postos.filter(p =>
      p["POSTOS DE SERVIÇOS / GRUPO SETER"]?.toLowerCase().includes(q) ||
      p.CIDADE?.toLowerCase().includes(q) ||
      p["ENDEREÇO III"]?.toLowerCase().includes(q)
    ).slice(0, 8);

    sugestoes.innerHTML = lista.map(p => {

  const nome = p["POSTOS DE SERVIÇOS / GRUPO SETER"];
  const jaSelecionado = selecionadosBusca.some(x =>
  x["POSTOS DE SERVIÇOS / GRUPO SETER"] === nome
);
  const cidade = p.CIDADE;
  const bairro = p["ENDEREÇO III"];

  const regex = new RegExp(q, "gi");

  const nomeH = nome?.replace(regex, m => `<mark>${m}</mark>`);
  const cidadeH = cidade?.replace(regex, m => `<mark>${m}</mark>`);
  const bairroH = bairro?.replace(regex, m => `<mark>${m}</mark>`);

  return `
  <div class="item-busca" 
     onclick='toggleSelecionadoBusca(${JSON.stringify(p)})'
     data-nome="${nome}"
     style="
      display:flex;
      align-items:flex-start;
      gap:10px;
      padding:10px;
      border-bottom:1px solid #eee;
      cursor:pointer;
      transition:background 0.2s;
      background:${jaSelecionado ? "#e3f2fd" : "#fff"};
     ">

    <!-- ✅ CHECKBOX VISUAL -->
    <div class="check-busca" style="
  width:18px;
  height:18px;
  border:2px solid ${jaSelecionado ? "#003c8d" : "#bbb"};
  border-radius:4px;
  margin-top:2px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:12px;
  color:#fff;
  background:${jaSelecionado ? "#003c8d" : "#fff"};
">
  ${jaSelecionado ? "✔" : ""}
</div>

    <!-- TEXTO -->
    <div style="flex:1;">
      <div style="font-weight:500">${nomeH}</div>
      <div style="font-size:12px;color:#666">
        ${cidadeH || ""}
        ${bairroH ? " — " + bairroH : ""}
      </div>
    </div>

  </div>
`;
}).join("");
  });

}
  
});

function confirmarZona(){

  const zona = document.getElementById("selectZona").value;

  if (!zona) return alert("Selecione uma zona.");

  const novos = obterPostosPorZona(zona);

  if (!novos.length) return alert("Nenhum posto encontrado.");

  // 🔹 evita duplicados
  novos.forEach(novo => {

    const existe = rota.some(r => {
  return (
    r["POSTOS DE SERVIÇOS / GRUPO SETER"] ===
    novo["POSTOS DE SERVIÇOS / GRUPO SETER"]
  );
});

    if (!existe){
      rota.push(novo);
    }

  });

  salvarRota();
  fecharModalZona();
}

  // Busca de postos dentro de Adicionar
function addPostoBusca(p){

  const existe = rota.some(r => {
    return r["POSTOS DE SERVIÇOS / GRUPO SETER"] ===
           p["POSTOS DE SERVIÇOS / GRUPO SETER"];
  });

  if (!existe){
    rota.push(p);
    salvarRota();
  }

  // limpa busca
  document.getElementById("buscaRota").value = "";
  document.getElementById("sugestoesRota").innerHTML = "";

  fecharModalZona();
}

  // Selecionar mais de um posto na Busca
function toggleSelecionadoBusca(p){

  const nome = p["POSTOS DE SERVIÇOS / GRUPO SETER"];

  const index = selecionadosBusca.findIndex(x =>
    x["POSTOS DE SERVIÇOS / GRUPO SETER"] === nome
  );

  if (index >= 0){
    selecionadosBusca.splice(index, 1);
  } else {
    selecionadosBusca.push(p);
  }

  atualizarUISelecionados();

  document.getElementById("buscaRota").value = "";
  document.getElementById("sugestoesRota").innerHTML = "";
}

  // Mostrar postos Selecionados na Busca
function renderSelecionadosBusca(){

  const box = document.getElementById("infoZona");

  if (!selecionadosBusca.length){
    box.innerText = "Nenhum posto selecionado";
    return;
  }

  box.innerText = `✔ ${selecionadosBusca.length} posto(s) selecionado(s)`;
}

  // Confirmar Add Busca
function confirmarAdicao(){

  if (!selecionadosBusca.length){
    return alert("Selecione ao menos um posto.");
  }

  selecionadosBusca.forEach(p => {

    const existe = rota.some(r =>
      r["POSTOS DE SERVIÇOS / GRUPO SETER"] ===
      p["POSTOS DE SERVIÇOS / GRUPO SETER"]
    );

    if (!existe){
      rota.push(p);
    }

  });

  salvarRota();

  selecionadosBusca = [];
  document.getElementById("buscaRota").value = "";
  document.getElementById("sugestoesRota").innerHTML = "";

  fecharModalZona();
}

  // Função UI
function atualizarUISelecionados(){

  const itens = document.querySelectorAll(".item-busca");

  itens.forEach(item => {

    const nome = item.dataset.nome;

    const selecionado = selecionadosBusca.some(p =>
      p["POSTOS DE SERVIÇOS / GRUPO SETER"] === nome
    );

    const check = item.querySelector(".check-busca");

    if (selecionado){
      item.style.background = "#e3f2fd";
      check.style.background = "#003c8d";
      check.style.borderColor = "#003c8d";
      check.innerHTML = "✔";
    } else {
      item.style.background = "#fff";
      check.style.background = "#fff";
      check.style.borderColor = "#bbb";
      check.innerHTML = "";
    }

  });

  // Atualiza contador
  const box = document.getElementById("infoZona");

  if (selecionadosBusca.length){
    box.innerText = `${selecionadosBusca.length} selecionado(s)`;
  }

}
