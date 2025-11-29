document.addEventListener("DOMContentLoaded", async () => {

  await Clerk.load();            // Carrega autenticação
  if (!Clerk.user) return location.href = "/signin.html";

  // E-mail autorizado
  const adminEmail = "brunalvess@hotmail.com";
  const userEmail = Clerk.user.primaryEmailAddress.emailAddress;

  // 🔒 Bloqueio — só você pode enviar planilha
  if (userEmail !== adminEmail) {
    alert("Acesso negado — Apenas a administradora pode enviar planilha.");
    return location.href = "/home.html";
  }

  // ---------- VARIÁVEIS DE INTERFACE ----------
  const input   = document.getElementById("file");
  const preview = document.getElementById("preview");
  const sendBtn = document.getElementById("sendBtn");

  let fileData = null;

  // --------- LER EXCEL E TRANSFORMAR EM JSON ---------
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    fileData = XLSX.utils.sheet_to_json(sheet);

    preview.textContent = JSON.stringify(fileData, null, 2);
    sendBtn.style.display = "block";
  });

  // --------- ENVIAR PARA O GITHUB DIRETO NO REPOSITÓRIO ---------
  sendBtn.addEventListener("click", async () => {

    if (!fileData) return alert("Selecione uma planilha primeiro.");

    const token = await Clerk.session.getToken();
    if (!token) return alert("Erro ao obter token de segurança.");

    // CONFIGURAÇÃO GITHUB
    const owner = "brunalvess37";
    const repo  = "postos-uniseter";
    const path  = "data/postos.json";

    const content = btoa(JSON.stringify(fileData, null, 2)); // codifica para base64

    // SALVAR OU SUBSTITUIR ARQUIVO
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Atualização automática via painel admin",
        content: content,
      })
    });

    alert(res.ok ? "✔ Planilha atualizada no GitHub!" : "❌ Falha no upload");
  });
});
