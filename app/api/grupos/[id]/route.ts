import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { groupService } from '@/lib/services/groupService';
import { normalizarTema } from '@/lib/temas';
import { resolverAcesso } from '@/lib/acesso';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const acesso = await resolverAcesso(req, params.id);

    if (!acesso) {
      const tentouConvidado = req.headers.has('x-guest-token') || req.headers.has('x-guest-phone');
      return NextResponse.json(
        { error: tentouConvidado ? 'Acesso negado' : 'Não autorizado' },
        { status: tentouConvidado ? 403 : 401 }
      );
    }

    const grupo = await groupService.getGroupWithDetails(params.id);

    if (!grupo) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    // Diz ao navegador quem é o convidado, para o app saber "minha parte" e "meu voto"
    return NextResponse.json({
      ...grupo,
      meuParticipanteId: acesso.tipo === 'convidado' ? acesso.participante.id : null,
    });
  } catch (error) {
    console.error('Error fetching grupo:', error);
    return NextResponse.json({ error: 'Erro ao buscar grupo' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const existing = await groupService.getGroupById(params.id);

    if (!existing || existing.organizadorId !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.nome !== undefined) updateData.nome = body.nome;
    if (body.dataEvento !== undefined) updateData.dataEvento = new Date(body.dataEvento);
    if (body.dataTermino !== undefined) updateData.dataTermino = body.dataTermino ? new Date(body.dataTermino) : null;
    if (body.orcamentoMaximoPorPessoa !== undefined) updateData.orcamentoMaximoPorPessoa = parseFloat(body.orcamentoMaximoPorPessoa);
    if (body.statusGrupo !== undefined) updateData.statusGrupo = body.statusGrupo;
    if (body.imovelEscolhidoId !== undefined) updateData.imovelEscolhidoId = body.imovelEscolhidoId;
    if (body.tema !== undefined) updateData.tema = normalizarTema(body.tema);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    await groupService.updateGroup(params.id, updateData);
    const grupo = await groupService.getGroupWithDetails(params.id);

    return NextResponse.json(grupo);
  } catch (error) {
    console.error('Error updating grupo:', error);
    return NextResponse.json({ error: 'Erro ao atualizar grupo' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const grupo = await groupService.getGroupById(params.id);

    if (!grupo || grupo.organizadorId !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    await groupService.deleteGroup(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting grupo:', error);
    return NextResponse.json({ error: 'Erro ao excluir grupo' }, { status: 500 });
  }
}
