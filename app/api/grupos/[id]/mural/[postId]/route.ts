import { NextResponse } from 'next/server';
import { identificarNoGrupo } from '@/lib/acesso';
import { muralService } from '@/lib/services/muralService';

export const dynamic = 'force-dynamic';

/** Organizador apaga qualquer post; cada um apaga os seus */
export async function DELETE(req: Request, { params }: { params: { id: string; postId: string } }) {
  try {
    const eu = await identificarNoGrupo(req, params.id);
    if (!eu) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const post = await muralService.buscar(params.postId);
    if (!post || post.grupoId !== params.id) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
    }
    const souAutor = post.autorId === (eu.participanteId ?? (eu.isOrganizer ? 'organizador' : null));
    if (!eu.isOrganizer && !souAutor) {
      return NextResponse.json({ error: 'Só quem publicou ou quem organiza pode apagar' }, { status: 403 });
    }
    await muralService.remover(post.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting mural post:', error);
    return NextResponse.json({ error: 'Erro ao apagar' }, { status: 500 });
  }
}
