import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { groupService } from '@/lib/services/groupService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const guestPhone = req.headers.get('x-guest-phone');
    
    if (!session?.user && !guestPhone) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const grupo = await groupService.getGroupWithDetails(params.id);

    if (!grupo) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    // Se não estiver logado, verifica se o telefone de convidado é de um participante do grupo
    if (!session?.user && guestPhone) {
      const isParticipant = grupo.participantes.some((p: any) => {
        const pPhone = p.telefoneParticipante?.replace(/\D/g, '') || '';
        const gPhone = guestPhone.replace(/\D/g, '') || '';
        return pPhone === gPhone && pPhone !== '';
      });
      if (!isParticipant) {
        return NextResponse.json({ error: 'Acesso negado: telefone não encontrado no grupo' }, { status: 403 });
      }
    }

    return NextResponse.json(grupo);
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
