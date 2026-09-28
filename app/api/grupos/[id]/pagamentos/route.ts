import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { groupService } from '@/lib/services/groupService';
import { participantService } from '@/lib/services/participantService';
import { paymentService } from '@/lib/services/paymentService';
import { resolverAcesso } from '@/lib/acesso';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await resolverAcesso(req, params.id))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const pagamentos = await paymentService.getPaymentsByGroupId(params.id);

    return NextResponse.json(pagamentos);
  } catch (error) {
    console.error('Error fetching pagamentos:', error);
    return NextResponse.json({ error: 'Erro ao buscar pagamentos' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
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

    const body = await req.json();
    const { participanteId, valor, dataPagamento, observacao } = body ?? {};

    const valorNumerico = parseFloat(valor);

    if (!participanteId || !valorNumerico || valorNumerico <= 0) {
      return NextResponse.json(
        { error: 'Informe o participante e um valor maior que zero' },
        { status: 400 }
      );
    }

    const participantes = await participantService.getParticipantsByGroupId(params.id);
    if (!participantes.some((p) => p.id === participanteId)) {
      return NextResponse.json(
        { error: 'Participante não encontrado neste grupo' },
        { status: 404 }
      );
    }

    // Datas vêm como 'YYYY-MM-DD' — interpretadas em UTC para não deslocar o mês
    const data = dataPagamento ? new Date(`${String(dataPagamento).slice(0, 10)}T12:00:00Z`) : new Date();

    if (isNaN(data.getTime())) {
      return NextResponse.json({ error: 'Data de pagamento inválida' }, { status: 400 });
    }

    const pagamento = await paymentService.addPayment({
      grupoId: params.id,
      participanteId,
      valor: valorNumerico,
      dataPagamento: data,
      observacao: observacao ?? '',
    });

    return NextResponse.json(pagamento, { status: 201 });
  } catch (error) {
    console.error('Error creating pagamento:', error);
    return NextResponse.json({ error: 'Erro ao registrar pagamento' }, { status: 500 });
  }
}
