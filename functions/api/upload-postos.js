export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    if (!body.data || !Array.isArray(body.data)) {
      return new Response("Dados inválidos", { status: 400 });
    }

    await env.POSTOS_KV.put(
      "POSTOS",
      JSON.stringify(body.data)
    );

    return new Response("✔ Dados salvos no KV com sucesso");
  } catch (err) {
    return new Response("Erro ao salvar dados", { status: 500 });
  }
}
