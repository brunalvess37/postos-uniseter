document.addEventListener("DOMContentLoaded", function () {

  // CRIA MENU
  const menu = document.createElement("div");
  menu.id = "menuLateral";
  menu.className = "menu-lateral";

  menu.innerHTML = `
    <div class="menu-top">
      <div onclick="location.href='home.html'">Mais ferramentas</div>
    </div>

    <div class="menu-bottom" onclick="sair()">
      Sair
    </div>
  `;

  document.body.appendChild(menu);

});

function abrirMenu(){
  document.getElementById("menuLateral").style.left = "0";
}

document.addEventListener("click", function(e){
  const menu = document.getElementById("menuLateral");
  if(!menu) return;

  if(!menu.contains(e.target) && !e.target.innerText.includes("☰")){
    menu.style.left = "-260px";
  }
});
