import { db } from '../firebaseAdmin';

export interface VotingProperty {
  id: string;
  grupoId: string;
  imovelId: string;
  createdAt: Date;
}

export interface Vote {
  id: string;
  grupoId: string;
  participanteId: string;
  imovelId: string;
  createdAt: Date;
}

export const votingService = {
  // Methods for VotingProperty (ImovelEmVotacao)
  async getVotingPropertiesByGroupId(groupId: string): Promise<VotingProperty[]> {
    const snapshot = await db.collection('voting_properties').where('grupoId', '==', groupId).get();
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
      } as VotingProperty;
    });
  },

  async addVotingProperty(groupId: string, imovelId: string): Promise<VotingProperty> {
    const newVotingProperty = {
      grupoId: groupId,
      imovelId,
      createdAt: new Date(),
    };
    const docRef = await db.collection('voting_properties').add(newVotingProperty);
    return {
      id: docRef.id,
      ...newVotingProperty,
    };
  },

  // Methods for Votes
  async getVotesByGroupId(groupId: string): Promise<Vote[]> {
    const snapshot = await db.collection('votes').where('grupoId', '==', groupId).get();
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
      } as Vote;
    });
  },

  async submitVote(groupId: string, participanteId: string, imovelId: string): Promise<Vote> {
    // Basic unique constraint check: one vote per participant per group
    const existingSnapshot = await db.collection('votes')
      .where('grupoId', '==', groupId)
      .where('participanteId', '==', participanteId)
      .limit(1)
      .get();
    
    if (!existingSnapshot.empty) {
      await existingSnapshot.docs[0].ref.update({ imovelId, createdAt: new Date() });
      return {
        id: existingSnapshot.docs[0].id,
        grupoId: groupId,
        participanteId,
        imovelId,
        createdAt: new Date(),
      };
    }

    const newVote = {
      grupoId: groupId,
      participanteId,
      imovelId,
      createdAt: new Date(),
    };
    const docRef = await db.collection('votes').add(newVote);
    return {
      id: docRef.id,
      ...newVote,
    };
  },
};
