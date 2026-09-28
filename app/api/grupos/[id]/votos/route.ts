import { NextResponse } from 'next/server';
import { votingService } from '@/lib/services/votingService';
import { participantService, StatusParticipacao } from '@/lib/services/participantService';
import { propertyService } from '@/lib/services/propertyService';
import { resolverAcesso } from '@/lib/acesso';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const acesso = await resolverAcesso(req, params.id);

    if (!acesso) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { imovelId } = body ?? {};
    // Convidado só vota por si mesmo; usuário logado informa o participante
    const participanteId =
      acesso.tipo === 'convidado' ? acesso.participante.id : body?.participanteId;

    if (!participanteId || !imovelId) {
      return NextResponse.json(
        { error: 'Participante e imóvel são obrigatórios' },
        { status: 400 }
      );
    }

    const participants = await participantService.getParticipantsByGroupId(params.id);
    const targetParticipant = participants.find(p => p.id === participanteId);

    if (!targetParticipant) {
      return NextResponse.json({ error: 'Participante não encontrado' }, { status: 404 });
    }

    if (targetParticipant.statusParticipacao !== StatusParticipacao.CONFIRMADO) {
      return NextResponse.json(
        { error: 'Apenas participantes confirmados podem votar' },
        { status: 403 }
      );
    }

    // Verify imovel is in votacao for this group
    const votingProps = await votingService.getVotingPropertiesByGroupId(params.id);
    const imovelEmVotacao = votingProps.find(vp => vp.imovelId === imovelId);

    if (!imovelEmVotacao) {
      return NextResponse.json(
        { error: 'Imóvel não está em votação neste grupo' },
        { status: 400 }
      );
    }

    // Create or update vote
    const voto = await votingService.submitVote(params.id, participanteId, imovelId);
    
    // Add details for response
    const pInfo = await participantService.getParticipantsByGroupId(params.id);
    const p = pInfo.find(pi => pi.id === participanteId);
    const i = await propertyService.getPropertyById(imovelId);

    return NextResponse.json({
      ...voto,
      participante: p,
      imovel: i
    });
  } catch (error) {
    console.error('Error creating voto:', error);
    return NextResponse.json({ error: 'Erro ao registrar voto' }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rawVotos = await votingService.getVotesByGroupId(params.id);
    
    // Add details
    const votos = await Promise.all(rawVotos.map(async v => {
      const participants = await participantService.getParticipantsByGroupId(params.id);
      const p = participants.find(pi => pi.id === v.participanteId);
      const i = await propertyService.getPropertyById(v.imovelId);
      return { ...v, participante: p, imovel: i };
    }));

    // Count votes per imovel
    const contagemVotos: Record<string, number> = {};
    for (const voto of votos) {
      contagemVotos[voto.imovelId] = (contagemVotos[voto.imovelId] ?? 0) + 1;
    }

    return NextResponse.json({ votos, contagemVotos });
  } catch (error) {
    console.error('Error fetching votos:', error);
    return NextResponse.json({ error: 'Erro ao buscar votos' }, { status: 500 });
  }
}
