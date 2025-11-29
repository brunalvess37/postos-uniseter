let rota = JSON.parse(localStorage.getItem("rota_postos") || "[]");

function salvarRota(){
  localStorage.setItem("rota_postos", JSON.stringify(rota));
  alert("Rota salva!");
}

function limparRota(){
  if(confirm("Deseja realmente limpar a rota?")){
    rota = [];
    salvarRota();
    listarRota();
  }
}

// Distância entre dois pontos (Haversine)
function distancia(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI/180;
  const dLon = (b.lon - a.lon) * Math.PI/180;
  const sa = Math.sin(dLat/2)**2 +
             Math.cos(a.lat*Math.PI/180) *
             Math.cos(b.lat*Math.PI/180) *
             Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(sa), Math.sqrt(1-sa));
}

function ordenarRota(){
  if(rota.length < 2){
    alert("Adicione mais de um posto para otimizar");
    return;
  }

  let base = rota[0];
  rota = [
    base,
    ...rota.slice(1).sort((a,b)=>distancia(base,a) - distancia(base,b))
  ];

  salvarRota();
  listarRota();
  alert("Rota otimizada com sucesso!");
}

function remover(index){
  rota.splice(index,1);
  salvarRota();
  listarRota();
}

// ========== LISTAR NA TELA ==========
function listarRota(){
  const area = document.getElementById("rota-lista");
  area.innerHTML = "";

  if(rota.length === 0){
    area.innerHTML = "<p>Nenhum posto foi adicionado à rota.</p>";
    return;
  }

  rota.forEach((p, i)=>{
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <h3>${p.nome}</h3>
      <p>Latitude: ${p.lat}</p>
      <p>Longitude: ${p.lon}</p>
      <button onclick="remover(${i})">Remover ❌</button>
    `;

    area.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", listarRota);
