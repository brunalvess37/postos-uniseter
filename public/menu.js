document.addEventListener("DOMContentLoaded", function () {

  const overlay = document.createElement("div");
  overlay.className = "menu-overlay";
  document.body.appendChild(overlay);
  
  overlay.onclick = fecharMenu;

  
  const menu = document.createElement("div");
  menu.id = "menuLateral";
  menu.className = "menu-lateral";

  .menu-item img {
  width: 18px;
  opacity: 0.8;
}

  document.body.appendChild(menu);

  // começa fechado
  menu.style.left = "-280px";
});

function abrirMenu(){
  document.getElementById("menuLateral").style.left = "0";
  document.querySelector(".menu-overlay").style.display = "block";
}

function fecharMenu(){
  document.getElementById("menuLateral").style.left = "-280px";
  document.querySelector(".menu-overlay").style.display = "none";
}

// fechar clicando fora
document.addEventListener("click", function(e){
  const menu = document.getElementById("menuLateral");

  if(!menu) return;

  if(!menu.contains(e.target) && !e.target.closest(".app-header-menu")){
    menu.style.left = "-280px";
  }
});
