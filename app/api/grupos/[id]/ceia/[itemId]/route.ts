import { NextResponse } from 'next/server';
import { identificarNoGrupo } from '@/lib/acesso';
import { ceiaService, CATEGORIAS_CEIA } from '@/lib/services/ceiaService';
import { participantService } from '@/lib/services/participantService';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string; itemId: string } };

async function carregar(req: Request, params: Params['params']) {
  const eu = await identificarNoGrupo(req, params.id);
  if (!eu) return { erro: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
  const item = await ceiaService.buscar(params.itemId);
  if (!item || item.grupoId !== params.id) {
    return { erro: NextResponse.json({ error: 'Item não encontrado' }, { status: 404 }) };
  }
  return { eu, item };
}

/**
 * acao 'reservar' / 'liberar': o participante pega ou devolve um item.
 * Organizador também pode editar nome, categoria, quantidade e responsável.
 */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const r = await carregar(req, params);
    if (r.erro) return r.erro;
    const { eu, item } = r;
    const body = await req.json().catch(() => ({}));

    if (body?.acao === 'reservar') {
      if (!eu.participanteId) {
        return NextResponse.json({ error: 'Você não está na lista de participantes' }, { status: 403 });
      }
      const resultado = await ceiaService.reservar(item.id, eu.participanteId);
      if (resultado === 'ocupado') {
        return NextResponse.json({ error: 'Alguém já pegou esse item' }, { status: 409 });
      }
      return NextResponse.json({ success: true });
    }

    if (body?.acao === 'liberar') {
      if (!eu.isOrganizer && item.responsavelId !== eu.participanteId) {
        return NextResponse.json({ error: 'Esse item não é seu' }, { status: 403 });
      }
      await ceiaService.atualizar(item.id, { responsavelId: null });
      return NextResponse.json({ success: true });
    }

    if (!eu.isOrganizer) {
      return NextResponse.json({ error: 'Só quem organiza pode editar' }, { status: 403 });
    }

    const dados: Record<string, unknown> = {};
    if (body?.nome !== undefined) dados.nome = String(body.nome).trim().slice(0, 60);
    if (body?.quantidade !== undefined) dados.quantidade = String(body.quantidade).trim().slice(0, 40);
    if (body?.categoria !== undefined && CATEGORIAS_CEIA.includes(body.categoria)) dados.categoria = body.categoria;
    if (body?.responsavelId !== undefined) {
      if (body.responsavelId) {
        const participantes = await participantService.getParticipantsByGroupId(params.id);
        if (!participantes.some((p) => p.id === body.responsavelId)) {
          return NextResponse.json({ error: 'Participante não encontrado' }, { status: 400 });
        }
      }
      dados.responsavelId = body.responsavelId || null;
    }
    if (Object.keys(dados).length === 0 || dados.nome === '') {
      return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });
    }
    await ceiaService.atualizar(item.id, dados as any);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating ceia item:', error);
    return NextResponse.json({ error: 'Erro ao atualizar item' }, { status: 500 });
  }
}

/** Organizador apaga qualquer item; participante apaga o que ele mesmo criou */
export async function DELETE(req: Request, { params }: Params) {
  try {
    const r = await carregar(req, params);
    if (r.erro) return r.erro;
    const { eu, item } = r;
    if (!eu.isOrganizer && item.criadoPor !== eu.participanteId) {
      return NextResponse.json({ error: 'Só quem criou ou quem organiza pode apagar' }, { status: 403 });
    }
    await ceiaService.remover(item.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ceia item:', error);
    return NextResponse.json({ error: 'Erro ao apagar item' }, { status: 500 });
  }
}
