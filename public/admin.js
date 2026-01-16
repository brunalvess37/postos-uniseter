document.addEventListener("DOMContentLoaded", async () => {

  // 🔐 Carrega Clerk e valida login
  await Clerk.load();
  if (!Clerk.user) return location.href="/signin.html";

  const ADMIN = "brunalvess@hotmail.com";
  if (Clerk.user.primaryEmailAddress.emailAddress !== ADMIN) {
    alert("❌ Área restrita a administradores.");
    return location.href="/home.html";
  }

  const input = document.getElementById("file");
  const preview = document.getElementById("preview");
  const sendBtn = document.getElementById("sendBtn");
  const status = document.getElementById("status");
  let fileData = null;

  // 🔒 Estado inicial do botão
  sendBtn.disabled = true;
  sendBtn.textContent = "📤 Enviar Planilha";
  sendBtn.style.opacity = "0.5";
  sendBtn.style.cursor = "not-allowed";

  if (status) {
    status.textContent = "Selecione uma planilha para habilitar o envio.";
  }

  // 📥 Lê planilha XLSX → JSON
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    fileData = XLSX.utils.sheet_to_json(sheet);

    preview.textContent = JSON.stringify(fileData, null, 2);

    // 🔓 Habilita botão
    sendBtn.disabled = false;
    sendBtn.style.opacity = "1";
    sendBtn.style.cursor = "pointer";

    if (status) {
      status.textContent =
        "Arquivo carregado. Clique em 'Enviar Planilha' para atualizar os dados.";
    }
  });

  // 🚀 Envio da planilha
  sendBtn.addEventListener("click", async () => {
    if (!fileData) {
      alert("Selecione uma planilha primeiro.");
      return;
    }

    // ⏳ Feedback de envio
    sendBtn.disabled = true;
    sendBtn.textContent = "⏳ Enviando...";
    sendBtn.style.opacity = "0.6";

    try {
      const res = await fetch("/functions/upload-postos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: fileData })
      });

      alert(await res.text());
    } catch (err) {
      alert("Erro ao enviar a planilha.");
    }

    // 🔁 Restaura botão
    sendBtn.textContent = "📤 Enviar Planilha";
    sendBtn.disabled = false;
    sendBtn.style.opacity = "1";
  });

});
