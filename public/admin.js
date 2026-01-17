document.addEventListener("DOMContentLoaded", async () => {

  // 🔐 Autenticação
  await Clerk.load();
  if (!Clerk.user) return location.href = "/signin.html";

  const ADMIN = "brunalvess@hotmail.com";
  if (Clerk.user.primaryEmailAddress.emailAddress !== ADMIN) {
    alert("❌ Área restrita a administradores.");
    return location.href = "/home.html";
  }

  const input = document.getElementById("file");
  const sendBtn = document.getElementById("sendBtn");
  const status = document.getElementById("status");

  let fileData = null;

  // Estado inicial
  sendBtn.disabled = true;
  sendBtn.style.opacity = "0.5";
  sendBtn.style.cursor = "not-allowed";

  // 📥 Seleção da planilha
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;

    status.textContent = "⏳ Lendo planilha...";
    
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    fileData = XLSX.utils.sheet_to_json(sheet);

    // Habilita botão
    sendBtn.disabled = false;
    sendBtn.style.opacity = "1";
    sendBtn.style.cursor = "pointer";

    status.textContent =
      "✅ Planilha carregada. Clique em 'Enviar Planilha' para atualizar os dados.";
  });

  // 🚀 Envio
  sendBtn.addEventListener("click", async () => {
    if (!fileData) return;

    sendBtn.disabled = true;
    sendBtn.textContent = "⏳ Enviando...";
    status.textContent = "⏳ Enviando dados para o servidor...";

    try {
      const res = await fetch("/api/upload-postos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: fileData })
      });

      const msg = await res.text();
      alert(msg);
      status.textContent = "✅ Planilha enviada com sucesso.";
      sendBtn.textContent = "📤 Enviar Planilha";

    } catch (e) {
      alert("❌ Erro ao enviar a planilha.");
      status.textContent = "❌ Falha no envio.";
      sendBtn.disabled = false;
      sendBtn.textContent = "📤 Enviar Planilha";
    }
  });

});
