// ==================== CARREGAR ROTA DO CELULAR ====================
let dados = JSON.parse(localStorage.getItem("rota_postos") || "{}");
let rota = dados.rota || [];
let dataRota = dados.data || null;


// ==================== SALVAR COM DATA E HORA ====================
function salvarRota(){
  localStorage.setItem("rota_postos", JSON.stringify({
    rota,
    data: new Date().toLocaleString("pt-BR")   // << grava data
  }));

  alert("Rota salva com sucesso!");
  listarRota(); // atualiza tela exibindo nova data
}


// ==================== LIMPAR TUDO ====================
function limparRota(){
  if(confirm("Deseja realmente apagar toda a rota?")){
    rota = [];
    dataRota = null;
    salvarRota();
  }
}


// ==================== CALCULAR DISTÂNCIA ENTRE DOIS PONTOS ====================
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


// ==================== OTIMIZAR ROTA GEO ====================
function ordenarRota(){
  if(rota.length < 2){
    alert("Adicione ao menos dois postos antes de otimizar.");
    return;
  }

  let base = rota[0]; // primeiro ponto da rota é referência

  rota = [
    base,
    ...rota.slice(1).sort((a,b)=>distancia(base,a) - distancia(base,b))
  ];

  salvarRota();
  alert("Rota otimizada com sucesso! (por proximidade)");
}


// ==================== REMOVER POSTO DA ROTA ====================
function remover(index){
  rota.splice(index,1);
  salvarRota();
}


// ==================== EXIBIR TELA ====================
function listarRota(){
  const area = document.getElementById("rota-lista");
  const info = document.getElementById("rota-info");

  area.innerHTML = "";

  // Exibe data registrada
  info.innerHTML = dataRota
    ? `<b>Rota criada/em uso desde:</b> ${dataRota}`
    : "Nenhuma rota registrada ainda.";

  if(rota.length === 0){
    area.innerHTML = "<p>Nenhum posto na rota.</p>";
    return;
  }

  rota.forEach((p, i)=>{
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <h3>${p.nome}</h3>
      <p><b>Lat:</b> ${p.lat} — <b>Lon:</b> ${p.lon}</p>
      <button onclick="remover(${i})">❌ Remover</button>
    `;
    area.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", listarRota);
