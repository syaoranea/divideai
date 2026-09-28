import { NextResponse } from 'next/server';
import { identificarNoGrupo } from '@/lib/acesso';
import { muralService, REACOES, type Reacao } from '@/lib/services/muralService';

export const dynamic = 'force-dynamic';

/** Liga ou desliga uma das 4 reações fixas */
export async function POST(req: Request, { params }: { params: { id: string; postId: string } }) {
  try {
    const eu = await identificarNoGrupo(req, params.id);
    if (!eu) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const reacao = body?.reacao as Reacao;
    if (!REACOES.includes(reacao)) {
      return NextResponse.json({ error: 'Reação inválida' }, { status: 400 });
    }
    const post = await muralService.buscar(params.postId);
    if (!post || post.grupoId !== params.id) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
    }
    const quem = eu.participanteId ?? 'organizador';
    await muralService.alternarReacao(post.id, reacao, quem, body?.ligar !== false);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error toggling reaction:', error);
    return NextResponse.json({ error: 'Erro ao reagir' }, { status: 500 });
  }
}
