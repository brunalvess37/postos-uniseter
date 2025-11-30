// 🔐 --- Função de Upload Seguro de Planilha para GitHub ---
// → Recebe JSON do admin.js
// → Atualiza arquivo /public/postos.json no repositório
// → Autenticado com token seguro armazenado no Cloudflare

export default {
 async fetch(request, env) {

   // 🔒 token agora é buscado no Cloudflare (NÃO no código público!)
   const TOKEN = env.UPLOAD_TOKEN;
   if (!TOKEN) return new Response("❌ TOKEN não configurado no servidor", { status: 500 });

   if (request.method !== "POST")
     return new Response("Método inválido", { status: 405 });

   // 📥 Recebe JSON enviado pelo admin.js
   const data = await request.json();
   if (!data.data) return new Response("Nenhuma planilha recebida.", { status: 400 });

   // 🔄 Converte JSON para texto formatado
   const newContent = JSON.stringify(data.data, null, 2);

   // 📌 CONFIG DO REPO
   const owner = "brunalvess37";
   const repo = "postos-uniseter";
   const path = "public/postos.json";  // <<< arquivo final que será atualizado
       
   // 🔍 1º busca o arquivo atual para pegar o SHA
   const getFile = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
     headers: { Authorization: `Bearer ${TOKEN}`, "User-Agent": "CloudflareWorker" }
   });

   const existing = await getFile.json();
   if (!existing.sha)
     return new Response("❌ Não foi possível ler o arquivo no GitHub.", { status: 400 });

   // 🚀 Envia alteração para o GitHub
   const update = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
     method: "PUT",
     headers: {
       Authorization: `Bearer ${TOKEN}`,
       "Content-Type": "application/json",
       "User-Agent": "CloudflareWorker"
     },
     body: JSON.stringify({
       message: "Atualização automática via painel Admin",
       content: btoa(newContent),
       sha: existing.sha
     })
   });

   return new Response("✔ Planilha atualizada com sucesso!", { status: 200 });
 }
};
