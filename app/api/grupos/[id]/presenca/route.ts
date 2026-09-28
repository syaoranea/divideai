import { NextResponse } from 'next/server';
import { resolverAcesso } from '@/lib/acesso';
import { participantService, StatusParticipacao } from '@/lib/services/participantService';

export const dynamic = 'force-dynamic';

const quantidade = (v: unknown) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 20) : undefined;
};

/**
 * O próprio participante responde se vai e quantos acompanhantes leva.
 * Só dá para responder enquanto está PENDENTE: depois, mudar é com o organizador,
 * porque confirmar muda o valor de todo mundo.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const acesso = await resolverAcesso(req, params.id);
    if (!acesso) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const participantes = await participantService.getParticipantsByGroupId(params.id);
    const eu =
      acesso.tipo === 'convidado'
        ? participantes.find((p) => p.id === acesso.participante.id)
        : participantes.find((p) => acesso.email && p.emailParticipante === acesso.email);

    if (!eu) {
      return NextResponse.json({ error: 'Você não está na lista deste grupo' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const updateData: Record<string, unknown> = {};

    if (body?.statusParticipacao !== undefined) {
      const novo = body.statusParticipacao;
      if (novo !== StatusParticipacao.CONFIRMADO && novo !== StatusParticipacao.RECUSADO) {
        return NextResponse.json({ error: 'Resposta inválida' }, { status: 400 });
      }
      if (eu.statusParticipacao !== StatusParticipacao.PENDENTE && novo !== eu.statusParticipacao) {
        return NextResponse.json(
          { error: 'Sua resposta já foi registrada. Para mudar, fale com quem organiza.' },
          { status: 409 }
        );
      }
      updateData.statusParticipacao = novo;
    }

    const adultos = quantidade(body?.acompanhantesAdultos);
    const criancas = quantidade(body?.acompanhantesCriancas);
    if (adultos !== undefined) updateData.acompanhantesAdultos = adultos;
    if (criancas !== undefined) updateData.acompanhantesCriancas = criancas;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });
    }

    await participantService.updateParticipant(eu.id, updateData as any);
    if (updateData.statusParticipacao && updateData.statusParticipacao !== eu.statusParticipacao) {
      await participantService.recalculateIndividualValues(params.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating presenca:', error);
    return NextResponse.json({ error: 'Erro ao salvar resposta' }, { status: 500 });
  }
}
