import { db } from '../firebaseAdmin';

export interface Payment {
  id: string;
  grupoId: string;
  participanteId: string;
  valor: number;
  /** Mês de competência no formato YYYY-MM */
  competencia: string;
  dataPagamento: Date;
  observacao: string;
  createdAt: Date;
}

const toDate = (value: any): Date | undefined => {
  if (!value) return undefined;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? undefined : parsed;
};

/** Deriva a competência (YYYY-MM) a partir da data do pagamento, sempre em UTC. */
export const competenciaFromDate = (date: Date): string => {
  const ano = date.getUTCFullYear();
  const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}`;
};

export const paymentService = {
  async getPaymentsByGroupId(groupId: string): Promise<Payment[]> {
    const snapshot = await db.collection('payments').where('grupoId', '==', groupId).get();
    const payments = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        valor: Number(data.valor) || 0,
        dataPagamento: toDate(data.dataPagamento),
        createdAt: toDate(data.createdAt),
      } as Payment;
    });

    // Ordena na memória para não exigir índice composto no Firestore
    return payments.sort(
      (a: Payment, b: Payment) =>
        (a.dataPagamento?.getTime() ?? 0) - (b.dataPagamento?.getTime() ?? 0)
    );
  },

  async getPaymentById(id: string): Promise<Payment | null> {
    const doc = await db.collection('payments').doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      valor: Number(data.valor) || 0,
      dataPagamento: toDate(data.dataPagamento),
      createdAt: toDate(data.createdAt),
    } as Payment;
  },

  async addPayment(data: Omit<Payment, 'id' | 'createdAt' | 'competencia'>): Promise<Payment> {
    const newPayment = {
      ...data,
      valor: Number(data.valor) || 0,
      competencia: competenciaFromDate(data.dataPagamento),
      createdAt: new Date(),
    };
    const docRef = await db.collection('payments').add(newPayment);

    await this.adjustParticipantTotal(data.participanteId, newPayment.valor);

    return { id: docRef.id, ...newPayment };
  },

  async deletePayment(id: string): Promise<void> {
    const payment = await this.getPaymentById(id);
    if (!payment) return;

    await db.collection('payments').doc(id).delete();
    await this.adjustParticipantTotal(payment.participanteId, -payment.valor);
  },

  async deletePaymentsByParticipant(participanteId: string): Promise<void> {
    const snapshot = await db
      .collection('payments')
      .where('participanteId', '==', participanteId)
      .get();

    if (snapshot.empty) return;

    const batch = db.batch();
    snapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
    await batch.commit();
  },

  /**
   * Mantém o campo `valorPago` do participante coerente com os lançamentos.
   * Usa incremento para preservar valores lançados manualmente no cadastro.
   */
  async adjustParticipantTotal(participanteId: string, delta: number): Promise<void> {
    if (!delta) return;
    const ref = db.collection('participants').doc(participanteId);
    const doc = await ref.get();
    if (!doc.exists) return;

    const atual = Number(doc.data()!.valorPago) || 0;
    await ref.update({ valorPago: Math.max(atual + delta, 0) });
  },
};
