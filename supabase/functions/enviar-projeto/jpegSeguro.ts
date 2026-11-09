// jpegSeguro.ts
// Lê um JPEG "por dentro", segmento por segmento, e devolve uma CÓPIA LIMPA.
// Não depende de nenhuma biblioteca: só de bytes. Por isso é fácil de testar.
//
// Um arquivo JPEG é uma sequência de "segmentos". Cada segmento começa com 0xFF + um
// código (o "marcador") e, quase sempre, um tamanho. Atacantes escondem coisas em:
//   - segmentos de metadados (EXIF, XMP, perfis de cor, comentários);
//   - bytes soltos DEPOIS do fim da imagem (o marcador EOI);
//   - arquivos que nem são JPEG (HTML, SVG, executáveis, PNG com a extensão trocada).
//
// Aqui usamos uma LISTA PERMITIDA: só copiamos os segmentos que a imagem realmente
// precisa para ser desenhada. Todo o resto é descartado ou faz o arquivo ser recusado.

export const LARGURA = 1280;
export const ALTURA = 800;

export const MAX_IMAGEM_ENTRADA = 1024 * 1024; // 1 MB recebido (o navegador já comprime bem abaixo disso)
export const MAX_IMAGEM_FINAL = 1536 * 1024; // 1,5 MB depois de reconstruída
// Tamanho máximo do texto base64 equivalente a MAX_IMAGEM_ENTRADA (base64 ocupa 4/3 do original)
export const MAX_BASE64 = Math.ceil((MAX_IMAGEM_ENTRADA * 4) / 3) + 8;

const TAMANHO_MINIMO = 2 * 1024;
const MAX_SEGMENTOS = 2000; // um JPEG normal tem dezenas; mais que isso é suspeito

export class ErroImagem extends Error {
  mensagem: string;
  constructor(mensagem: string) {
    super("IMAGEM_INVALIDA");
    this.mensagem = mensagem; // texto amigável, seguro para mostrar ao usuário
  }
}

export interface JpegLimpo {
  bytes: Uint8Array;
  largura: number;
  altura: number;
}

/**
 * Valida e limpa um JPEG.
 * @param entrada   os bytes recebidos
 * @param maximo    tamanho máximo aceito, em bytes
 * Lança ErroImagem (com mensagem amigável) se qualquer regra for violada.
 */
export function sanitizarJpeg(entrada: Uint8Array, maximo: number): JpegLimpo {
  const n = entrada.length;
  if (n < TAMANHO_MINIMO) throw new ErroImagem("A imagem é pequena demais ou está corrompida.");
  if (n > maximo) throw new ErroImagem("A imagem é grande demais.");

  // Assinatura ("magic bytes"): todo JPEG começa com FF D8 FF.
  // Não confiamos na extensão do arquivo nem no Content-Type, que o atacante controla.
  if (entrada[0] !== 0xff || entrada[1] !== 0xd8 || entrada[2] !== 0xff) {
    throw new ErroImagem("O arquivo não é uma imagem JPEG válida.");
  }

  const partes: Uint8Array[] = [Uint8Array.of(0xff, 0xd8)];
  let i = 2;
  let largura = 0;
  let altura = 0;
  let viuSOF = false;
  let viuDQT = false;
  let varreduras = 0;
  let terminou = false;
  let segmentos = 0;

  while (i < n && !terminou) {
    if (++segmentos > MAX_SEGMENTOS) throw new ErroImagem("A imagem tem uma estrutura inválida.");
    if (entrada[i] !== 0xff) throw new ErroImagem("A imagem tem uma estrutura inválida.");

    while (i < n && entrada[i] === 0xff) i++; // bytes de preenchimento antes do marcador
    if (i >= n) throw new ErroImagem("A imagem está incompleta.");
    const marcador = entrada[i++];

    if (marcador === 0xd9) { // EOI: fim da imagem. TUDO depois disso é descartado.
      terminou = true;
      break;
    }

    // Marcadores sem tamanho não podem aparecer fora dos dados da imagem.
    if (marcador === 0x00 || marcador === 0x01 || marcador === 0xd8 || (marcador >= 0xd0 && marcador <= 0xd7)) {
      throw new ErroImagem("A imagem tem uma estrutura inválida.");
    }

    if (i + 2 > n) throw new ErroImagem("A imagem está incompleta.");
    const tamanho = (entrada[i] << 8) | entrada[i + 1]; // inclui os 2 bytes do próprio tamanho
    if (tamanho < 2 || i + tamanho > n) throw new ErroImagem("A imagem tem uma estrutura inválida.");

    const inicioSegmento = i - 2; // posição do 0xFF do marcador
    const fimSegmento = i + tamanho; // exclusivo

    if (marcador === 0xc0 || marcador === 0xc1 || marcador === 0xc2) {
      // SOF: cabeçalho da imagem (baseline, estendido ou progressivo)
      if (viuSOF || tamanho < 8) throw new ErroImagem("A imagem tem uma estrutura inválida.");
      const precisao = entrada[i + 2];
      altura = (entrada[i + 3] << 8) | entrada[i + 4];
      largura = (entrada[i + 5] << 8) | entrada[i + 6];
      const componentes = entrada[i + 7];

      if (precisao !== 8) throw new ErroImagem("Formato de JPEG não suportado.");
      if (componentes !== 1 && componentes !== 3) throw new ErroImagem("Formato de cores não suportado.");
      if (tamanho !== 8 + 3 * componentes) throw new ErroImagem("A imagem tem uma estrutura inválida.");
      // Dimensões EXATAS: elimina "bombas de descompressão" e padroniza os cards do site.
      if (largura !== LARGURA || altura !== ALTURA) {
        throw new ErroImagem(`A imagem precisa ter ${LARGURA}×${ALTURA} pixels (o formulário ajusta isso automaticamente).`);
      }
      viuSOF = true;
      partes.push(entrada.subarray(inicioSegmento, fimSegmento));
      i = fimSegmento;
    } else if (marcador === 0xdb) {
      viuDQT = true; // tabelas de quantização
      partes.push(entrada.subarray(inicioSegmento, fimSegmento));
      i = fimSegmento;
    } else if (marcador === 0xc4 || marcador === 0xdd) {
      // DHT (tabelas de Huffman) e DRI (intervalo de reinício): necessários para decodificar
      partes.push(entrada.subarray(inicioSegmento, fimSegmento));
      i = fimSegmento;
    } else if ((marcador >= 0xe0 && marcador <= 0xef) || marcador === 0xfe) {
      // APP0..APP15 (EXIF, XMP, ICC, JFIF, Adobe...) e COM (comentário): DESCARTADOS.
      i = fimSegmento;
    } else if (marcador === 0xda) {
      // SOS: início dos dados da imagem
      if (!viuSOF) throw new ErroImagem("A imagem tem uma estrutura inválida.");
      partes.push(entrada.subarray(inicioSegmento, fimSegmento));
      i = fimSegmento;

      // Os dados comprimidos seguem até o próximo marcador "de verdade".
      // Dentro deles, "FF 00" é um FF literal e "FF D0..D7" são marcadores de reinício.
      const inicioDados = i;
      let j = i;
      while (j < n) {
        if (entrada[j] !== 0xff) { j++; continue; }
        const proximo = entrada[j + 1];
        if (proximo === undefined) throw new ErroImagem("A imagem está incompleta.");
        if (proximo === 0x00 || (proximo >= 0xd0 && proximo <= 0xd7)) { j += 2; continue; }
        if (proximo === 0xff) { j++; continue; }
        break; // achamos um marcador real
      }
      if (j >= n) throw new ErroImagem("A imagem está incompleta.");
      partes.push(entrada.subarray(inicioDados, j));
      i = j;
      varreduras++;
    } else {
      // Qualquer outro marcador (JPEG aritmético, sem perdas, hierárquico, extensões...) é recusado.
      throw new ErroImagem("Formato de JPEG não suportado.");
    }
  }

  if (!terminou || !viuSOF || !viuDQT || varreduras < 1) {
    throw new ErroImagem("A imagem está incompleta ou corrompida.");
  }

  partes.push(Uint8Array.of(0xff, 0xd9)); // um único EOI, escrito por NÓS

  let total = 0;
  for (const parte of partes) total += parte.length;
  const bytes = new Uint8Array(total);
  let posicao = 0;
  for (const parte of partes) {
    bytes.set(parte, posicao);
    posicao += parte.length;
  }
  return { bytes, largura, altura };
}
