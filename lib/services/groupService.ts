import { db } from '../firebaseAdmin';

export enum StatusGrupo {
  ABERTO = 'ABERTO',
  FECHADO = 'FECHADO',
}

export interface Group {
  id: string;
  nome: string;
  dataEvento: Date;
  dataTermino?: Date;
  organizadorId: string;
  orcamentoMaximoPorPessoa: number;
  statusGrupo: StatusGrupo;
  imovelEscolhidoId?: string;
  createdAt: Date;
}

export const groupService = {
  async getGroupById(id: string): Promise<Group | null> {
    const doc = await db.collection('groups').doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      dataEvento: data.dataEvento?.toDate(),
      dataTermino: data.dataTermino?.toDate(),
      createdAt: data.createdAt?.toDate(),
    } as Group;
  },

  async getGroupsByOrganizadorId(organizadorId: string): Promise<Group[]> {
    const snapshot = await db.collection('groups').where('organizadorId', '==', organizadorId).get();
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dataEvento: data.dataEvento?.toDate(),
        dataTermino: data.dataTermino?.toDate(),
        createdAt: data.createdAt?.toDate(),
      } as Group;
    });
  },

  async createGroup(data: Omit<Group, 'id' | 'createdAt' | 'statusGrupo'>): Promise<Group> {
    const newGroup = {
      ...data,
      statusGrupo: StatusGrupo.ABERTO,
      createdAt: new Date(),
    };
    const docRef = await db.collection('groups').add(newGroup);
    return {
      id: docRef.id,
      ...newGroup,
    };
  },

  async getGroupsForUser(userId: string, email: string): Promise<Group[]> {
    // Fetch groups where user is organizer
    const orgSnapshot = await db.collection('groups').where('organizadorId', '==', userId).get();
    const orgGroups = orgSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      dataEvento: doc.data().dataEvento?.toDate(),
      dataTermino: doc.data().dataTermino?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
    } as Group));

    // Fetch groups where user is participant
    const partSnapshot = await db.collection('participants').where('emailParticipante', '==', email).get();
    const groupIds = Array.from(new Set(partSnapshot.docs.map((doc: any) => doc.data().grupoId)));
    
    const partGroups: Group[] = [];
    for (const gid of groupIds) {
      // Avoid fetching if already in orgGroups
      if (orgGroups.some((g: any) => g.id === gid)) continue;
      
      const gdoc = await db.collection('groups').doc(gid).get();
      if (gdoc.exists) {
        partGroups.push({
          id: gdoc.id,
          ...gdoc.data(),
          dataEvento: gdoc.data()!.dataEvento?.toDate(),
          dataTermino: gdoc.data()!.dataTermino?.toDate(),
          createdAt: gdoc.data()!.createdAt?.toDate(),
        } as Group);
      }
    }

    return [...orgGroups, ...partGroups].sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getGroupWithDetails(groupId: string): Promise<any> {
    const group = await this.getGroupById(groupId);
    if (!group) return null;

    // Fetch organizer info
    const organizer = await db.collection('users').doc(group.organizadorId).get();
    const organizerData = organizer.exists 
      ? { id: organizer.id, nome: organizer.data()!.nome, email: organizer.data()!.email } 
      : { id: group.organizadorId, nome: 'Usuário Desconhecido', email: '' };

    // Fetch participants
    const participantsSnapshot = await db.collection('participants').where('grupoId', '==', groupId).get();
    const participants = participantsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    // Fetch chosen property if any
    let imovelEscolhido = null;
    if (group.imovelEscolhidoId) {
      const pdoc = await db.collection('properties').doc(group.imovelEscolhidoId).get();
      if (pdoc.exists) imovelEscolhido = { id: pdoc.id, ...pdoc.data() };
    }

    // Fetch properties in voting
    const votingPropsSnapshot = await db.collection('voting_properties').where('grupoId', '==', groupId).get();
    const imoveisEmVotacao = [];
    for (const vp of votingPropsSnapshot.docs) {
      const pdoc = await db.collection('properties').doc(vp.data().imovelId).get();
      if (pdoc.exists) {
        imoveisEmVotacao.push({
          id: vp.id,
          ...vp.data(),
          imovel: { id: pdoc.id, ...pdoc.data() }
        });
      }
    }

    return {
      ...group,
      organizador: organizerData,
      participantes: participants,
      imovelEscolhido,
      imoveisEmVotacao
    };
  },

  async updateGroup(id: string, data: Partial<Group>): Promise<void> {
    await db.collection('groups').doc(id).update(data);
  },

  async deleteGroup(id: string): Promise<void> {
    await db.collection('groups').doc(id).delete();
  },
};
