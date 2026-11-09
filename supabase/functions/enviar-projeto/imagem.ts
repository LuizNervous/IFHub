// imagem.ts
// O caminho COMPLETO que uma imagem enviada percorre antes de ser guardada:
//
//   base64 ──► 1) decodificar (com limites)
//          ──► 2) validar a estrutura do JPEG e descartar tudo que não é imagem  (jpegSeguro.ts)
//          ──► 3) RECONSTRUIR a imagem: decodificar os pixels e codificar de novo
//          ──► 4) validar de novo o resultado do nosso próprio codificador
//
// O passo 3 é a defesa mais forte: o arquivo guardado NÃO é o que o usuário mandou.
// É uma imagem nova, feita só com os pixels. Qualquer coisa escondida nos bytes originais
// (que passasse pelo passo 2) deixa de existir.

import jpeg from "jpeg-js";
import { ErroImagem, MAX_BASE64, MAX_IMAGEM_ENTRADA, MAX_IMAGEM_FINAL, sanitizarJpeg } from "./jpegSeguro.ts";

export { ErroImagem };

const QUALIDADE = 85;

/** Converte base64 em bytes, recusando entradas suspeitas ANTES de gastar memória. */
export function decodificarBase64(texto: string): Uint8Array {
  if (texto.length > MAX_BASE64) throw new ErroImagem("A imagem é grande demais.");
  if (texto.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(texto)) {
    throw new ErroImagem("Não foi possível ler a imagem enviada.");
  }

  let binario: string;
  try {
    binario = atob(texto);
  } catch {
    throw new ErroImagem("Não foi possível ler a imagem enviada.");
  }
  if (binario.length > MAX_IMAGEM_ENTRADA) throw new ErroImagem("A imagem é grande demais.");

  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

/** Decodifica os pixels e codifica de novo. O que sai é uma imagem inteiramente nova. */
function reconstruir(limpo: Uint8Array): Uint8Array {
  let bruto: { width: number; height: number; data: Uint8Array };
  try {
    bruto = jpeg.decode(limpo, {
      useTArray: true,
      formatAsRGBA: true,
      maxResolutionInMP: 2, // 1280×800 = ~1 MP; qualquer coisa maior que 2 MP é recusada
      maxMemoryUsageInMB: 96, // teto de memória do decodificador (protege contra bombas)
    }) as { width: number; height: number; data: Uint8Array };
  } catch {
    throw new ErroImagem("Não foi possível ler a imagem. Tente outro arquivo.");
  }

  if (bruto.width !== 1280 || bruto.height !== 800) {
    throw new ErroImagem("A imagem tem dimensões inválidas.");
  }

  const codificado = jpeg.encode({ data: bruto.data, width: bruto.width, height: bruto.height }, QUALIDADE);
  return new Uint8Array(codificado.data);
}

/** Recebe o texto base64 do formulário e devolve os bytes SEGUROS, prontos para guardar. */
export function processarImagem(base64: string): Uint8Array {
  const recebido = decodificarBase64(base64);
  const validado = sanitizarJpeg(recebido, MAX_IMAGEM_ENTRADA);
  const reconstruido = reconstruir(validado.bytes);
  return sanitizarJpeg(reconstruido, MAX_IMAGEM_FINAL).bytes;
}
