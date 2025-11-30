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
  let fileData = null;

  // 📥 Lê planilha XLSX → JSON
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

  // 🚀 Envia JSON para Cloudflare Function
  sendBtn.addEventListener("click", async () => {
    if (!fileData) return alert("Selecione uma planilha primeiro.");

    const res = await fetch("/functions/upload-postos", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ data:fileData })
    });

    alert(await res.text());
  });
});
