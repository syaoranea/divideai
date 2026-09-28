import { randomBytes } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebaseAdmin';
import { participantService, type Participant } from '@/lib/services/participantService';

export type Acesso =
  | { tipo: 'usuario'; userId: string; email: string }
  | { tipo: 'convidado'; participante: Participant };

const soDigitos = (v?: string | null) => (v ?? '').replace(/\D/g, '');

/** 18 bytes aleatórios → 24 caracteres seguros para URL */
export function gerarToken() {
  return randomBytes(18).toString('base64url');
}

export async function buscarParticipantePorToken(token: string): Promise<Participant | null> {
  if (!token || token.length < 16) return null;
  const snap = await db.collection('participants').where('tokenAcesso', '==', token).limit(1).get();
  if (snap.empty) return null;
  const { tokenAcesso, ...data } = snap.docs[0].data();
  return { id: snap.docs[0].id, ...data, createdAt: data.createdAt?.toDate() } as Participant;
}

/** Garante que o participante tem token (só adiciona o campo se faltar) */
export async function garantirToken(participanteId: string): Promise<string | null> {
  const ref = db.collection('participants').doc(participanteId);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const existente = doc.data()?.tokenAcesso;
  if (existente) return existente;
  const token = gerarToken();
  await ref.update({ tokenAcesso: token });
  return token;
}

/**
 * Quem está fazendo o pedido para este grupo:
 * sessão (organizador/usuário) → link pessoal (x-guest-token) → telefone (x-guest-phone).
 * Retorna null se ninguém foi identificado ou se o convidado não é deste grupo.
 */
export async function resolverAcesso(req: Request, grupoId: string): Promise<Acesso | null> {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return {
      tipo: 'usuario',
      userId: (session.user as any)?.id,
      email: session.user.email ?? '',
    };
  }

  const token = req.headers.get('x-guest-token');
  if (token) {
    const participante = await buscarParticipantePorToken(token);
    return participante && participante.grupoId === grupoId
      ? { tipo: 'convidado', participante }
      : null;
  }

  const phone = soDigitos(req.headers.get('x-guest-phone'));
  if (phone) {
    const participantes = await participantService.getParticipantsByGroupId(grupoId);
    const participante = participantes.find((p) => soDigitos(p.telefoneParticipante) === phone);
    return participante ? { tipo: 'convidado', participante } : null;
  }

  return null;
}

export interface Identidade {
  isOrganizer: boolean;
  /** participante que está agindo (convidado, ou usuário logado com o mesmo e-mail) */
  participanteId: string | null;
}

/** Para rotas de escrita: quem é o organizador e/ou qual participante está agindo */
export async function identificarNoGrupo(req: Request, grupoId: string): Promise<Identidade | null> {
  const acesso = await resolverAcesso(req, grupoId);
  if (!acesso) return null;
  if (acesso.tipo === 'convidado') {
    return { isOrganizer: false, participanteId: acesso.participante.id };
  }
  const grupoDoc = await db.collection('groups').doc(grupoId).get();
  if (!grupoDoc.exists) return null;
  const isOrganizer = grupoDoc.data()?.organizadorId === acesso.userId;
  const participantes = await participantService.getParticipantsByGroupId(grupoId);
  const eu = acesso.email ? participantes.find((p) => p.emailParticipante === acesso.email) : undefined;
  if (!isOrganizer && !eu) return null;
  return { isOrganizer, participanteId: eu?.id ?? null };
}
