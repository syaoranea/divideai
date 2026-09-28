import { NextResponse } from 'next/server';
import { identificarNoGrupo } from '@/lib/acesso';
import { muralService } from '@/lib/services/muralService';

export const dynamic = 'force-dynamic';

/**
 * Entrega a foto do post. O app busca com fetch (mandando o token no header),
 * então o link da imagem nunca carrega credencial na URL.
 */
export async function GET(req: Request, { params }: { params: { id: string; postId: string } }) {
  try {
    if (!(await identificarNoGrupo(req, params.id))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const foto = await muralService.buscarFoto(params.postId);
    if (!foto || foto.grupoId !== params.id) {
      return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(foto.bytes), {
      headers: {
        'Content-Type': foto.mime,
        // A foto de um post nunca muda: o navegador pode guardar por muito tempo
        'Cache-Control': 'private, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving mural photo:', error);
    return NextResponse.json({ error: 'Erro ao carregar foto' }, { status: 500 });
  }
}
