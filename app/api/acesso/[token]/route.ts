import { NextResponse } from 'next/server';
import { buscarParticipantePorToken } from '@/lib/acesso';

export const dynamic = 'force-dynamic';

/** Link pessoal: descobre de qual grupo e de quem é o token */
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  try {
    const participante = await buscarParticipantePorToken(params.token);
    if (!participante) {
      return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 404 });
    }
    return NextResponse.json({
      grupoId: participante.grupoId,
      nomeParticipante: participante.nomeParticipante,
    });
  } catch (error) {
    console.error('Error resolving token:', error);
    return NextResponse.json({ error: 'Erro ao validar link' }, { status: 500 });
  }
}
