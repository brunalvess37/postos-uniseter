export async function onRequestGet({ env }) {
  try {
    const data = await env.POSTOS_KV.get("postos", "json");

    if (!data) {
      return new Response("[]", {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro ao ler dados do KV", detail: err.message }),
      { status: 500 }
    );
  }
}
