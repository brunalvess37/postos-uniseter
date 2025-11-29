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
    box.innerHTML+= `<div class='card'>${i+1}. ${p.nome}
    <br><small>${p.lat},${p.lon}</small>
    <button onclick="remo(${i})">✖</button></div>`;
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
