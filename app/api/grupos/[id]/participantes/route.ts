import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { participantService, StatusParticipacao } from '@/lib/services/participantService';
import { groupService } from '@/lib/services/groupService';
import { db } from '@/lib/firebaseAdmin';

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

    const body = await req.json();
    const { nomeParticipante, telefoneParticipante, statusParticipacao } = body ?? {};

    if (!nomeParticipante || !telefoneParticipante) {
      return NextResponse.json(
        { error: 'Nome e telefone são obrigatórios' },
        { status: 400 }
      );
    }

    // Check if participant already exists in this group by phone
    const participants = await participantService.getParticipantsByGroupId(params.id);
    const existing = participants.find(p => p.telefoneParticipante === telefoneParticipante);

    if (existing) {
      return NextResponse.json(
        { error: 'Este participante já foi adicionado ao grupo' },
        { status: 400 }
      );
    }

    const participante = await participantService.addParticipant({
      grupoId: params.id,
      nomeParticipante,
      emailParticipante: '',
      telefoneParticipante,
      statusParticipacao: (statusParticipacao as StatusParticipacao) ?? StatusParticipacao.PENDENTE,
      valorPago: 0,
    });

    await participantService.recalculateIndividualValues(params.id);

    return NextResponse.json(participante);
  } catch (error) {
    console.error('Error adding participante:', error);
    return NextResponse.json({ error: 'Erro ao adicionar participante' }, { status: 500 });
  }
}
