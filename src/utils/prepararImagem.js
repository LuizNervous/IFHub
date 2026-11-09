// prepararImagem.js
// Transforma a imagem que o usuário escolheu em um JPEG padronizado de 1280×800.
//
// POR QUE fazer isso no navegador?
//   - Imagens de celular/monitor 4K têm vários MB; reduzidas, ficam com ~200 KB (envio muito mais rápido).
//   - Redesenhar a imagem num <canvas> descarta metadados (localização GPS do celular, nome da câmera...).
//   - Todos os cards do site ficam com a mesma proporção (16:10).
//
// ATENÇÃO: isto é CONVENIÊNCIA, não segurança. Um atacante pula o navegador e fala direto com o servidor.
// Por isso o servidor refaz TODAS as verificações (supabase/functions/enviar-projeto/imagem.ts).

export const LARGURA = 1280;
export const ALTURA = 800;

const TIPOS_ACEITOS = ["image/png", "image/jpeg", "image/webp"];
const MAX_ORIGINAL = 12 * 1024 * 1024; // 12 MB: um print de tela 4K em PNG cabe com folga
const MAX_FINAL = 900 * 1024; // o JPEG final precisa ficar abaixo de 900 KB
const MAX_PIXELS = 50_000_000; // 50 megapixels: acima disso o navegador pode travar
const MIN_LARGURA = 480;
const MIN_ALTURA = 300;
const QUALIDADES = [0.85, 0.75, 0.65, 0.55, 0.45]; // tenta a melhor qualidade primeiro

const paraBlob = (canvas, tipo, qualidade) =>
  new Promise((resolve) => canvas.toBlob(resolve, tipo, qualidade));

const blobParaBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      // resultado: "data:image/jpeg;base64,AAAA..." → o servidor quer só a parte depois da vírgula
      const texto = String(leitor.result);
      resolve(texto.slice(texto.indexOf(",") + 1));
    };
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    leitor.readAsDataURL(blob);
  });

/**
 * Recebe o arquivo escolhido e devolve { base64, previewUrl, nome, tamanho }.
 * Se algo estiver errado, LANÇA um Error cuja mensagem já é amigável para mostrar na tela.
 */
export async function prepararImagem(arquivo) {
  if (!(arquivo instanceof Blob)) throw new Error("Escolha um arquivo de imagem.");

  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    throw new Error("Use uma imagem nos formatos PNG, JPG ou WebP. (SVG e GIF não são aceitos.)");
  }
  if (arquivo.size > MAX_ORIGINAL) {
    throw new Error("A imagem é grande demais. O tamanho máximo é 12 MB.");
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(arquivo); // já corrige a rotação de fotos de celular
  } catch {
    throw new Error("Não foi possível abrir esta imagem. Ela pode estar corrompida; tente outro arquivo.");
  }

  const { width: larguraOriginal, height: alturaOriginal } = bitmap;
  if (larguraOriginal * alturaOriginal > MAX_PIXELS) {
    bitmap.close();
    throw new Error("A imagem tem dimensões grandes demais. Tire um print normal da tela.");
  }
  if (larguraOriginal < MIN_LARGURA || alturaOriginal < MIN_ALTURA) {
    bitmap.close();
    throw new Error(`A imagem é pequena demais. Use um print com pelo menos ${MIN_LARGURA}×${MIN_ALTURA} pixels.`);
  }

  // "Cover": preenche todo o quadro 1280×800. A parte que sobra é cortada,
  // sempre preservando o TOPO da imagem (onde fica o cabeçalho do site).
  const canvas = document.createElement("canvas");
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff"; // PNG com fundo transparente viraria preto no JPEG; pintamos de branco antes
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  ctx.imageSmoothingQuality = "high";

  const escala = Math.max(LARGURA / larguraOriginal, ALTURA / alturaOriginal);
  const larguraUtil = LARGURA / escala;
  const alturaUtil = ALTURA / escala;
  const origemX = (larguraOriginal - larguraUtil) / 2;
  ctx.drawImage(bitmap, origemX, 0, larguraUtil, alturaUtil, 0, 0, LARGURA, ALTURA);
  bitmap.close();

  // Tenta a melhor qualidade; se o arquivo ainda ficar grande, vai reduzindo.
  let blob = null;
  for (const qualidade of QUALIDADES) {
    const candidato = await paraBlob(canvas, "image/jpeg", qualidade);
    if (candidato && candidato.type === "image/jpeg") {
      blob = candidato;
      if (candidato.size <= MAX_FINAL) break;
    }
  }
  if (!blob) throw new Error("Seu navegador não conseguiu preparar a imagem. Tente outro navegador.");
  if (blob.size > MAX_FINAL) {
    throw new Error("A imagem ficou grande demais mesmo depois de reduzida. Tente um print mais simples.");
  }

  return {
    base64: await blobParaBase64(blob),
    previewUrl: URL.createObjectURL(blob), // endereço local, só para mostrar a prévia
    nome: arquivo.name, // só para exibir na tela: NUNCA é enviado ao servidor
    tamanho: blob.size,
  };
}