/** Mesmo limite do servidor (lib/services/muralService.ts), com folga */
const LIMITE_BYTES = 650 * 1024;

export interface FotoPronta {
  base64: string;
  largura: number;
  altura: number;
  previewUrl: string;
}

function carregar(arquivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível abrir essa foto'));
    };
    img.src = url;
  });
}

function paraBlob(canvas: HTMLCanvasElement, qualidade: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao comprimir'))), 'image/jpeg', qualidade)
  );
}

function blobParaBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result).split(',')[1] ?? '');
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsDataURL(blob);
  });
}

/**
 * Reduz a foto no próprio celular antes de enviar: lado maior de até 1280px, JPEG,
 * baixando a qualidade (e, se preciso, o tamanho) até caber no limite.
 * O navegador já aplica a rotação do EXIF ao desenhar a imagem.
 */
export async function prepararFoto(arquivo: File): Promise<FotoPronta> {
  if (!arquivo.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem');
  const img = await carregar(arquivo);

  for (const ladoMax of [1280, 1024, 800]) {
    const escala = Math.min(1, ladoMax / Math.max(img.naturalWidth, img.naturalHeight));
    const largura = Math.max(1, Math.round(img.naturalWidth * escala));
    const altura = Math.max(1, Math.round(img.naturalHeight * escala));
    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Seu navegador não conseguiu processar a foto');
    ctx.fillStyle = '#fff'; // PNG com transparência vira fundo branco no JPEG
    ctx.fillRect(0, 0, largura, altura);
    ctx.drawImage(img, 0, 0, largura, altura);

    for (const qualidade of [0.82, 0.7, 0.58]) {
      const blob = await paraBlob(canvas, qualidade);
      if (blob.size <= LIMITE_BYTES) {
        return {
          base64: await blobParaBase64(blob),
          largura,
          altura,
          previewUrl: URL.createObjectURL(blob),
        };
      }
    }
  }
  throw new Error('Não deu para reduzir essa foto. Tente outra.');
}
