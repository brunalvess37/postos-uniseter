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

function salvarRota(){
  localStorage.setItem("rota_postos", JSON.stringify({rota,data:new Date().toLocaleString("pt-BR")}));
  listar();
  document.getElementById("rota-info").innerText = "✔ Rota atualizada automaticamente";
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
  Sortable.create(document.getElementById("rota-lista"),{
    animation:150,
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

    <a href="${mapsUrl}" target="_blank">
      <button style="
  padding:8px 14px;
  border-radius:8px;
  border:1px solid #ccc;
  background:#f9f9f9;
  cursor:pointer;
">
  📍 Google Maps
</button>

    </a>
    
    <a href="${wazeUrl}" target="_blank">
      <button style="
  padding:8px 14px;
  border-radius:8px;
  border:1px solid #ccc;
  background:#f9f9f9;
  cursor:pointer;
">
  🚗 Waze
</button>
    </a>

    </div>

  </div>`;
  
});
}

function remo(i){ rota.splice(i,1); salvarRota(); }

// ================= 🌍 MAPA EXPANSÍVEL =================
function toggleMapa(){
  let m=document.getElementById("mapa");
  m.style.height= m.style.height=="0px"?"350px":"0px";
}

// ================= 🚗 WAZE =================
function abrirNoWaze(){
  if(!rota.length) return alert("Sem rota.");
  let u=`https://waze.com/ul?ll=${rota[0].lat},${rota[0].lon}&navigate=yes`;
  rota.slice(1).forEach(p=>u+=`&ll=${p.lat},${p.lon}`);
  window.open(u,"_blank");
}
