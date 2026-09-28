import * as admin from 'firebase-admin';
import { db } from '../firebaseAdmin';

export const REACOES = ['amor', 'risada', 'festa', 'palmas'] as const;
export type Reacao = (typeof REACOES)[number];

/** Limite da foto já comprimida: o documento do Firestore aceita até 1 MiB */
export const TAMANHO_MAX_FOTO = 700 * 1024;

export interface PostMural {
  id: string;
  grupoId: string;
  /** id do participante, ou 'organizador' */
  autorId: string;
  autorNome: string;
  texto: string;
  temFoto: boolean;
  fotoLargura?: number;
  fotoAltura?: number;
  reacoes: Record<Reacao, string[]>;
  createdAt: Date;
}

const posts = () => db.collection('mural_posts');
const fotos = () => db.collection('mural_fotos');

function deDoc(doc: any): PostMural {
  const data = doc.data();
  const reacoes = Object.fromEntries(REACOES.map((r) => [r, data.reacoes?.[r] ?? []])) as PostMural['reacoes'];
  return { id: doc.id, ...data, reacoes, createdAt: data.createdAt?.toDate() } as PostMural;
}

export const muralService = {
  async listar(grupoId: string, limite = 100): Promise<PostMural[]> {
    // Sem orderBy na consulta para não exigir índice composto; o volume de uma família é pequeno
    const snap = await posts().where('grupoId', '==', grupoId).get();
    return snap.docs
      .map(deDoc)
      .sort((a: PostMural, b: PostMural) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
      .slice(0, limite);
  },

  async buscar(id: string): Promise<PostMural | null> {
    const doc = await posts().doc(id).get();
    return doc.exists ? deDoc(doc) : null;
  },

  async criar(
    dados: Omit<PostMural, 'id' | 'createdAt' | 'reacoes'>,
    foto?: { bytes: Buffer; mime: string }
  ): Promise<PostMural> {
    const ref = posts().doc();
    const novo = {
      ...dados,
      reacoes: Object.fromEntries(REACOES.map((r) => [r, []])),
      createdAt: new Date(),
    };
    const batch = db.batch();
    batch.set(ref, novo);
    if (foto) {
      batch.set(fotos().doc(ref.id), {
        grupoId: dados.grupoId,
        mime: foto.mime,
        dados: foto.bytes,
        createdAt: novo.createdAt,
      });
    }
    await batch.commit();
    return deDoc({ id: ref.id, data: () => ({ ...novo, createdAt: { toDate: () => novo.createdAt } }) });
  },

  async buscarFoto(postId: string): Promise<{ grupoId: string; mime: string; bytes: Buffer } | null> {
    const doc = await fotos().doc(postId).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    return { grupoId: data.grupoId, mime: data.mime, bytes: Buffer.from(data.dados) };
  },

  /** Liga/desliga a reação de alguém; arrayUnion/arrayRemove são atômicos */
  async alternarReacao(postId: string, reacao: Reacao, quem: string, ligar: boolean) {
    const op = ligar
      ? admin.firestore.FieldValue.arrayUnion(quem)
      : admin.firestore.FieldValue.arrayRemove(quem);
    await posts().doc(postId).update({ [`reacoes.${reacao}`]: op });
  },

  async remover(postId: string) {
    const batch = db.batch();
    batch.delete(posts().doc(postId));
    batch.delete(fotos().doc(postId));
    await batch.commit();
  },
};
