import { db } from '../firebaseAdmin';

export enum StatusParticipacao {
  CONFIRMADO = 'CONFIRMADO',
  PENDENTE = 'PENDENTE',
  RECUSADO = 'RECUSADO',
}

export interface Participant {
  id: string;
  grupoId: string;
  usuarioId?: string;
  nomeParticipante: string;
  emailParticipante: string;
  telefoneParticipante: string;
  statusParticipacao: StatusParticipacao;
  valorIndividual?: number;
  valorPago: number;
  createdAt: Date;
}

export const participantService = {
  async getParticipantsByGroupId(groupId: string): Promise<Participant[]> {
    const snapshot = await db.collection('participants').where('grupoId', '==', groupId).get();
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
      } as Participant;
    });
  },

  async addParticipant(data: Omit<Participant, 'id' | 'createdAt'>): Promise<Participant> {
    const newParticipant = {
      ...data,
      createdAt: new Date(),
    };
    const docRef = await db.collection('participants').add(newParticipant);
    return {
      id: docRef.id,
      ...newParticipant,
    };
  },

  async updateParticipant(id: string, data: Partial<Participant>): Promise<void> {
    await db.collection('participants').doc(id).update(data);
  },

  async deleteParticipant(id: string): Promise<void> {
    await db.collection('participants').doc(id).delete();
  },

  async recalculateIndividualValues(groupId: string): Promise<void> {
    const groupDoc = await db.collection('groups').doc(groupId).get();
    if (!groupDoc.exists) return;
    const groupData = groupDoc.data()!;

    const participantsSnapshot = await db.collection('participants').where('grupoId', '==', groupId).get();
    const participants = participantsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Participant));
    const confirmados = participants.filter((p: any) => p.statusParticipacao === StatusParticipacao.CONFIRMADO);
    
    if (confirmados.length === 0) {
      const batch = db.batch();
      participants.forEach((p: any) => batch.update(db.collection('participants').doc(p.id), { valorIndividual: null }));
      await batch.commit();
      return;
    }

    let valorBase: number;
    if (groupData.imovelEscolhidoId) {
      const pdoc = await db.collection('properties').doc(groupData.imovelEscolhidoId).get();
      valorBase = pdoc.exists ? pdoc.data()!.precoTotalDiaria : groupData.orcamentoMaximoPorPessoa;
    } else {
      valorBase = groupData.orcamentoMaximoPorPessoa;
    }

    const valorIndividual = valorBase / confirmados.length;
    const batch = db.batch();
    
    participants.forEach((p: any) => {
      const pRef = db.collection('participants').doc(p.id);
      if (p.statusParticipacao === StatusParticipacao.CONFIRMADO) {
        batch.update(pRef, { valorIndividual });
      } else {
        batch.update(pRef, { valorIndividual: null });
      }
    });

    await batch.commit();
  },
};
