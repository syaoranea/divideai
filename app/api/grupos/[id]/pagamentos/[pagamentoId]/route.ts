import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { groupService } from '@/lib/services/groupService';
import { paymentService } from '@/lib/services/paymentService';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; pagamentoId: string } }
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

    const pagamento = await paymentService.getPaymentById(params.pagamentoId);

    if (!pagamento || pagamento.grupoId !== params.id) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    await paymentService.deletePayment(params.pagamentoId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pagamento:', error);
    return NextResponse.json({ error: 'Erro ao excluir pagamento' }, { status: 500 });
  }
}
