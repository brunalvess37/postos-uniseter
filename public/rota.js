let dados = JSON.parse(localStorage.getItem("rota_postos")||"{}");
let rota = dados.rota||[];
let dataRota = dados.data||null;

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

    <small style="display:block; color:#666;">
      ${cidade}
    </small>

    <small style="
  display:block;
  color:#666;
  margin-bottom:10px;
">
  ${endereco || "Endereço não disponível"}
</small>

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
      return (r.id || r.nome) === (novo.id || novo.nome);
    });

    if (!existe){
      rota.push(novo);
    }

  });

  salvarRota();
  fecharModalZona();
}
