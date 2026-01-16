document.addEventListener("DOMContentLoaded", async () => {

  // 🔐 Carrega Clerk e valida login
  await Clerk.load();
  if (!Clerk.user) return location.href = "/signin.html";

  const ADMIN = "brunalvess@hotmail.com";
  if (Clerk.user.primaryEmailAddress.emailAddress !== ADMIN) {
    alert("❌ Área restrita a administradores.");
    return location.href = "/home.html";
  }

  const input   = document.getElementById("file");
  const preview = document.getElementById("preview");
  const sendBtn = document.getElementById("sendBtn");
  const status  = document.getElementById("status");

  let fileData = null;

  // 🔒 Estado inicial
  sendBtn.disabled = true;
  sendBtn.style.opacity = "0.5";
  sendBtn.style.cursor = "not-allowed";
  status.textContent = "Selecione uma planilha para habilitar o envio.";

  // 📥 Lê planilha XLSX → JSON
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    fileData = XLSX.utils.sheet_to_json(sheet);

    preview.textContent = JSON.stringify(fileData, null, 2);

    // 🔓 Habilita envio
    sendBtn.disabled = false;
    sendBtn.style.opacity = "1";
    sendBtn.style.cursor = "pointer";
    sendBtn.textContent = "📤 Enviar Planilha";

    status.textContent =
      "Arquivo carregado. Clique em “Enviar Planilha” para atualizar os dados.";
  });

  // 🚀 Envio para Cloudflare Function
  sendBtn.addEventListener("click", async () => {
    if (!fileData) return alert("Selecione uma planilha primeiro.");

    sendBtn.disabled = true;
    sendBtn.textContent = "⏳ Enviando...";
    sendBtn.style.opacity = "0.6";
    sendBtn.style.cursor = "wait";

    try {
      const res = await fetch("/functions/upload-postos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: fileData })
      });

      const msg = await res.text();
      alert(msg);

      status.textContent = "Planilha enviada com sucesso ✅";
    } catch (err) {
      alert("Erro ao enviar planilha.");
      status.textContent = "Erro ao enviar a planilha ❌";
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "📤 Enviar Planilha";
      sendBtn.style.opacity = "1";
      sendBtn.style.cursor = "pointer";
    }
  });

});
