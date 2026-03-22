import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { groupService, StatusGrupo } from '@/lib/services/groupService';
import { votingService } from '@/lib/services/votingService';
import { participantService } from '@/lib/services/participantService';
import { propertyService } from '@/lib/services/propertyService';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;

    // Verify user is organizer
    const grupo = await groupService.getGroupById(params.id);

    if (!grupo || grupo.organizadorId !== userId) {
      return NextResponse.json(
        { error: 'Apenas o organizador pode finalizar a votação' },
        { status: 403 }
      );
    }

    const votingProps = await votingService.getVotingPropertiesByGroupId(params.id);
    const votos = await votingService.getVotesByGroupId(params.id);

    if (votingProps.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum imóvel em votação' },
        { status: 400 }
      );
    }

    // Count votes
    const contagemVotos: Record<string, number> = {};
    for (const voto of votos) {
      contagemVotos[voto.imovelId] = (contagemVotos[voto.imovelId] ?? 0) + 1;
    }

    // Find winner (most votes, or first added in case of tie)
    let vencedorId: string | null = null;
    let maxVotos = -1;

    for (const imovelVotacao of votingProps) {
      const vCount = contagemVotos[imovelVotacao.imovelId] ?? 0;
      if (vCount > maxVotos) {
        maxVotos = vCount;
        vencedorId = imovelVotacao.imovelId;
      }
    }

    // If no votes, use first property
    if (!vencedorId && votingProps.length > 0) {
      vencedorId = votingProps[0].imovelId;
    }

    if (!vencedorId) {
      return NextResponse.json(
        { error: 'Não foi possível determinar o vencedor' },
        { status: 400 }
      );
    }

    // Get winning property
    const imovelVencedor = await propertyService.getPropertyById(vencedorId);

    if (!imovelVencedor) {
      return NextResponse.json(
        { error: 'Imóvel vencedor não encontrado' },
        { status: 404 }
      );
    }

    // Update group status and chosen property
    await groupService.updateGroup(params.id, {
      statusGrupo: StatusGrupo.FECHADO,
      imovelEscolhidoId: vencedorId,
    });

    // Recalculate individual values
    await participantService.recalculateIndividualValues(params.id);

    // Fetch updated group
    const grupoAtualizado = await groupService.getGroupWithDetails(params.id);

    return NextResponse.json(grupoAtualizado);
  } catch (error) {
    console.error('Error finalizing votacao:', error);
    return NextResponse.json({ error: 'Erro ao finalizar votação' }, { status: 500 });
  }
}
