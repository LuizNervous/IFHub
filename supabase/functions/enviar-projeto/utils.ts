// utils.ts
// Funções PURAS: recebem um valor e devolvem outro, sem depender de rede ou banco.
// Por isso são fáceis de testar e de entender.

// Caracteres de controle e "invisíveis" (inclusive os que invertem o sentido do texto,
// usados para disfarçar nomes e links). Newline (\n), tab (\t) e \r ficam de fora de propósito.
const INVISIVEIS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

/** Texto de UMA linha: normaliza, remove invisíveis e colapsa espaços/quebras. */
export function limparLinha(texto: string): string {
  return texto.normalize("NFC").replace(INVISIVEIS, "").replace(/\s+/g, " ").trim();
}

/** Texto com parágrafos (descrição): mantém quebras de linha, mas no máximo uma linha em branco. */
export function limparParagrafos(texto: string): string {
  return texto
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(INVISIVEIS, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Parâmetros de rastreamento: não fazem parte do "endereço de verdade" do site.
const RASTREIO = /^(utm_|fbclid$|gclid$|mc_|igshid$)/i;

/**
 * Valida e normaliza uma URL. Devolve a URL limpa, ou null se não for aceitável.
 * Regras: só http/https, sem usuário:senha, só domínio com ponto (nada de IP,
 * localhost ou nomes internos), sem #fragmento, sem parâmetros de rastreamento.
 */
export function normalizarUrl(bruta: string): string | null {
  let url: URL;
  try {
    url = new URL(limparLinha(bruta));
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username !== "" || url.password !== "") return null;

  // O `new URL` já converte domínios com acento para "punycode" (xn--...),
  // o que também ajuda contra links que imitam outros sites com letras parecidas.
  const host = url.hostname.toLowerCase();
  // Cada trecho começa e termina com letra/número (nada de "-.com"), e o último trecho
  // (a terminação, como "com" ou "br") começa com letra e tem 2+ caracteres: isso descarta IPs.
  const pareceDominio = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*[a-z0-9]$/.test(host);
  const interno = /(^|\.)(localhost|local|internal|lan|home|corp)$/.test(host);
  if (!pareceDominio || interno) return null;

  url.hash = "";
  for (const chave of [...url.searchParams.keys()]) {
    if (RASTREIO.test(chave)) url.searchParams.delete(chave);
  }

  const final = url.toString();
  return final.length <= 500 ? final : null;
}

/** Escapa texto para colocar dentro de HTML (usado no e-mail aos admins). */
export function escaparHtml(texto: string): string {
  const mapa: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return texto.replace(/[&<>"']/g, (c) => mapa[c]);
}

/** HMAC-SHA256 em hexadecimal. Usado para guardar o IP sem guardar o IP. */
export async function hmacHex(segredo: string, valor: string): Promise<string> {
  const codificador = new TextEncoder();
  const chave = await crypto.subtle.importKey(
    "raw",
    codificador.encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const assinatura = await crypto.subtle.sign("HMAC", chave, codificador.encode(valor));
  return [...new Uint8Array(assinatura)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** IP do visitante. O cabeçalho cf-connecting-ip é colocado pela infraestrutura (Cloudflare). */
export function obterIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const encaminhado = req.headers.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0].trim();
  return "desconhecido";
}
