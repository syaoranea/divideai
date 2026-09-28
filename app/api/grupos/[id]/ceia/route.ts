import { NextResponse } from 'next/server';
import { identificarNoGrupo } from '@/lib/acesso';
import { ceiaService, CATEGORIAS_CEIA, type CategoriaCeia } from '@/lib/services/ceiaService';
import { participantService } from '@/lib/services/participantService';

export const dynamic = 'force-dynamic';

const texto = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await identificarNoGrupo(req, params.id))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json(await ceiaService.listar(params.id));
  } catch (error) {
    console.error('Error listing ceia:', error);
    return NextResponse.json({ error: 'Erro ao buscar a lista' }, { status: 500 });
  }
}

/**
 * Organizador: cria item livre (ou já com responsável), ou a lista sugerida inteira.
 * Participante: cria algo que ele mesmo vai levar (já fica reservado para ele).
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const eu = await identificarNoGrupo(req, params.id);
    if (!eu) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    if (Array.isArray(body?.sugestoes)) {
      if (!eu.isOrganizer) {
        return NextResponse.json({ error: 'Só quem organiza pode fazer isso' }, { status: 403 });
      }
      const itens = body.sugestoes
        .slice(0, 60)
        .map((s: any) => ({ nome: texto(s?.nome, 60), categoria: s?.categoria }))
        .filter((s: any) => s.nome && CATEGORIAS_CEIA.includes(s.categoria));
      await ceiaService.criarVarios(params.id, itens);
      return NextResponse.json({ success: true, criados: itens.length });
    }

    const nome = texto(body?.nome, 60);
    const categoria = body?.categoria as CategoriaCeia;
    if (!nome || !CATEGORIAS_CEIA.includes(categoria)) {
      return NextResponse.json({ error: 'Informe o nome e a categoria' }, { status: 400 });
    }

    let responsavelId: string | null = null;
    if (eu.isOrganizer && body?.responsavelId) {
      const participantes = await participantService.getParticipantsByGroupId(params.id);
      if (!participantes.some((p) => p.id === body.responsavelId)) {
        return NextResponse.json({ error: 'Participante não encontrado' }, { status: 400 });
      }
      responsavelId = body.responsavelId;
    } else if (!eu.isOrganizer) {
      responsavelId = eu.participanteId;
    }

    const item = await ceiaService.criar({
      grupoId: params.id,
      nome,
      categoria,
      quantidade: texto(body?.quantidade, 40),
      responsavelId,
      criadoPor: eu.isOrganizer ? 'organizador' : (eu.participanteId as string),
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating ceia item:', error);
    return NextResponse.json({ error: 'Erro ao adicionar item' }, { status: 500 });
  }
}
