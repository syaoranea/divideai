import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { participantService, StatusParticipacao } from '@/lib/services/participantService';
import { paymentService } from '@/lib/services/paymentService';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; participanteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { statusParticipacao, nomeParticipante, telefoneParticipante, valorPagoAdicional } =
      body ?? {};

    const updateData: any = {};

    if (statusParticipacao) {
      updateData.statusParticipacao = statusParticipacao as StatusParticipacao;
    }
    if (nomeParticipante !== undefined) {
      updateData.nomeParticipante = nomeParticipante;
    }
    if (telefoneParticipante !== undefined) {
      updateData.telefoneParticipante = telefoneParticipante;
    }

    // O valor informado é somado ao que já foi pago: total = pago informado + total anterior
    const adicional = parseFloat(valorPagoAdicional) || 0;
    if (adicional !== 0) {
      const atuais = await participantService.getParticipantsByGroupId(params.id);
      const atual = atuais.find((p) => p.id === params.participanteId);

      if (!atual) {
        return NextResponse.json({ error: 'Participante não encontrado' }, { status: 404 });
      }

      updateData.valorPago = Math.max((atual.valorPago ?? 0) + adicional, 0);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    await participantService.updateParticipant(params.participanteId, updateData);

    await participantService.recalculateIndividualValues(params.id);

    // Fetch updated participant
    const participants = await participantService.getParticipantsByGroupId(params.id);
    const participante = participants.find(p => p.id === params.participanteId);

    return NextResponse.json(participante);
  } catch (error) {
    console.error('Error updating participante:', error);
    return NextResponse.json({ error: 'Erro ao atualizar participante' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; participanteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await paymentService.deletePaymentsByParticipant(params.participanteId);

    await participantService.deleteParticipant(params.participanteId);

    await participantService.recalculateIndividualValues(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting participante:', error);
    return NextResponse.json({ error: 'Erro ao remover participante' }, { status: 500 });
  }
}
