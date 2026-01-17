export async function onRequestGet({ env }) {
  try {
    const dados = await env.POSTOS_KV.get("POSTOS", "json");

    return new Response(JSON.stringify(dados || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response("Erro ao ler KV", { status: 500 });
  }
}
