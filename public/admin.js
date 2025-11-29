// admin.js — atualizado para Clerk
document.addEventListener("DOMContentLoaded", async () => {

  // 🔐 1) Carregar Clerk e validar login
  await Clerk.load();
  if (!Clerk.user) {
    window.location.href = "/signin.html";
    return;
  }

  const input = document.getElementById("file");
  const preview = document.getElementById("preview");
  const sendBtn = document.getElementById("sendBtn");
  let fileData = null;

  // 📌 2) Ler e converter a planilha para JSON
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    fileData = XLSX.utils.sheet_to_json(sheet);

    preview.textContent = JSON.stringify(fileData, null, 2);
    sendBtn.style.display = "block";
  });

  // 📌 3) Enviar dados para serverless function
  sendBtn.addEventListener("click", async () => {
    if (!fileData) {
      alert("Selecione uma planilha antes de enviar.");
      return;
    }

    // 🔐 3.1) Obter token do Clerk
    const token = await Clerk.session.getToken();

    if (!token) {
      alert("Erro: não foi possível obter o token do usuário.");
      return;
    }

    // 🔐 3.2) Enviar token + JSON
    const res = await fetch("/.netlify/functions/upload-postos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ data: fileData })
    });

    const result = await res.text();
    alert(result);
  });
});
