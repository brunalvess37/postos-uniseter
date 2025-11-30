export default {
  async fetch(request) {
    // Método inválido
    if (request.method !== "POST") {
      return new Response("Método não permitido", { status: 405 });
    }

    // Corpo enviado pelo admin.js
    const { fileData } = await request.json();

    if (!fileData) {
      return new Response("Nenhuma planilha enviada", { status: 400 });
    }

    // Token GitHub (substituir pelo seu)
    const TOKEN = UPLOAD_TOKEN; // será lido do Cloudflare

    const repo = "brunalvess37/postos-uniseter";
    const path = "public/data.json";  // ← onde ficará salva a planilha convertida

    const commitMessage = "Atualização automática via painel UNISETER";

    // Enviar ao GitHub
    const base64 = btoa(JSON.stringify(fileData, null, 2));

    const upload = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: commitMessage,
        content: base64
      })
    });

    return new Response("Upload concluído com sucesso!", { status: 200 });
  }
}
