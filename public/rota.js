let dados = JSON.parse(localStorage.getItem("rota_postos")||"{}");
let rota = dados.rota||[];
let dataRota = dados.data||null;

function salvarRota(){
  localStorage.setItem("rota_postos", JSON.stringify({rota,data:new Date().toLocaleString("pt-BR")}));
  listar(); alert("Rota salva.");
}

function limparRota(){
  if(confirm("Apagar rota?")){ rota=[]; dataRota=null; salvarRota(); }
}

function distancia(a,b){
  const R=6371, dLat=(b.lat-a.lat)*Math.PI/180, dLon=(b.lon-a.lon)*Math.PI/180;
  const s=Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s));
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
  document.getElementById("rota-info").innerHTML= dataRota?`📅 Rota criada em: ${dataRota}`:"Nenhuma rota salva";
  
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
  <div class='card'>
    <b>${i+1}. ${nome}</b>
    <br><small style="color:#555;">${cidade}</small>
    <br><small style="color:#777;">${endereco || "Endereço não disponível"}</small>

    <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
      <a href="${mapsUrl}" target="_blank"
         style="padding:4px 8px; border:1px solid #ccc; border-radius:6px; text-decoration:none;">
        📍 Google Maps
      </a>

      <a href="${wazeUrl}" target="_blank"
         style="padding:4px 8px; border:1px solid #ccc; border-radius:6px; text-decoration:none;">
        🚗 Waze
      </a>
    </div>

    <button onclick="remo(${i})">✖</button>
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
