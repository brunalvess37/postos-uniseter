export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    if (!body.data || !Array.isArray(body.data)) {
      return new Response("Dados inválidos", { status: 400 });
    }

    // Conteúdo final do JSON
    const json = JSON.stringify(body.data, null, 2);

    // Grava em /data/postos.json (Pages Assets)
    await env.ASSETS.put(
      "data/postos.json",
      new TextEncoder().encode(json)
    );

    return new Response("Planilha importada com sucesso ✅", {
      status: 200
    });

  } catch (err) {
    console.error(err);
    return new Response("Erro ao salvar dados ❌", { status: 500 });
  }
}
