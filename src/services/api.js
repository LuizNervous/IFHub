
const URL_ENVIO = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enviar-projeto`;

// Transforma segundos em um texto amigável: "3 minutos", "1 hora"...
function textoDeEspera(segundos) {
  if (!segundos || segundos < 60) return "alguns instantes";
  const minutos = Math.ceil(segundos / 60);
  if (minutos < 60) return `${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
  const horas = Math.ceil(minutos / 60);
  return `${horas} ${horas === 1 ? "hora" : "horas"}`;
}


export async function enviarProjeto(corpo) {
  let resposta;
  try {
    resposta = await fetch(URL_ENVIO, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(15000), // não deixa o usuário esperando para sempre
    });
  } catch {
    return {
      ok: false,
      codigo: "REDE",
      mensagem: "Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.",
      erros: {},
    };
  }

  let dados = null;
  try {
    dados = await resposta.json();
  } catch {
    // resposta sem JSON: tratamos como erro genérico logo abaixo
  }

  if (resposta.ok && dados?.ok) return { ok: true };

  let mensagem = dados?.mensagem ?? "Não foi possível enviar agora. Tente novamente em instantes.";
  if (dados?.codigo === "MUITAS_TENTATIVAS") {
    mensagem = `Você fez muitas tentativas. Tente novamente em ${textoDeEspera(dados.retry_apos_segundos)}.`;
  }

  return { ok: false, codigo: dados?.codigo ?? "ERRO", mensagem, erros: dados?.erros ?? {} };
}