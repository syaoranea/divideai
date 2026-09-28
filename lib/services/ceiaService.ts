import { db } from '../firebaseAdmin';

export type CategoriaCeia = 'prato' | 'acompanhamento' | 'sobremesa' | 'bebida' | 'outro';

export const CATEGORIAS_CEIA: CategoriaCeia[] = ['prato', 'acompanhamento', 'sobremesa', 'bebida', 'outro'];

export interface ItemCeia {
  id: string;
  grupoId: string;
  nome: string;
  categoria: CategoriaCeia;
  quantidade: string;
  responsavelId: string | null;
  /** id do participante que criou, ou 'organizador' */
  criadoPor: string;
  createdAt: Date;
}

const colecao = () => db.collection('ceia_itens');

function deDoc(doc: any): ItemCeia {
  const data = doc.data();
  return { id: doc.id, ...data, createdAt: data.createdAt?.toDate() } as ItemCeia;
}

export const ceiaService = {
  async listar(grupoId: string): Promise<ItemCeia[]> {
    const snap = await colecao().where('grupoId', '==', grupoId).get();
    return snap.docs
      .map(deDoc)
      .sort((a: ItemCeia, b: ItemCeia) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
  },

  async buscar(id: string): Promise<ItemCeia | null> {
    const doc = await colecao().doc(id).get();
    return doc.exists ? deDoc(doc) : null;
  },

  async criar(dados: Omit<ItemCeia, 'id' | 'createdAt'>): Promise<ItemCeia> {
    const novo = { ...dados, createdAt: new Date() };
    const ref = await colecao().add(novo);
    return { id: ref.id, ...novo };
  },

  async criarVarios(grupoId: string, itens: { nome: string; categoria: CategoriaCeia }[]) {
    const batch = db.batch();
    for (const item of itens) {
      batch.set(colecao().doc(), {
        grupoId,
        nome: item.nome,
        categoria: item.categoria,
        quantidade: '',
        responsavelId: null,
        criadoPor: 'organizador',
        createdAt: new Date(),
      });
    }
    await batch.commit();
  },

  async atualizar(id: string, dados: Partial<Pick<ItemCeia, 'nome' | 'categoria' | 'quantidade' | 'responsavelId'>>) {
    await colecao().doc(id).update(dados);
  },

  /** Reserva só se o item ainda estiver livre (transação evita duas pessoas no mesmo item) */
  async reservar(id: string, participanteId: string): Promise<'ok' | 'ocupado' | 'inexistente'> {
    const ref = colecao().doc(id);
    return db.runTransaction(async (tx: any) => {
      const doc = await tx.get(ref);
      if (!doc.exists) return 'inexistente';
      const atual = doc.data().responsavelId;
      if (atual && atual !== participanteId) return 'ocupado';
      tx.update(ref, { responsavelId: participanteId });
      return 'ok';
    });
  },

  async remover(id: string) {
    await colecao().doc(id).delete();
  },
};
