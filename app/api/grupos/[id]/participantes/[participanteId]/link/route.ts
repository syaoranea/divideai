import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { groupService } from '@/lib/services/groupService';
import { participantService } from '@/lib/services/participantService';
import { garantirToken } from '@/lib/acesso';

export const dynamic = 'force-dynamic';

/** Organizador pega (ou cria, na primeira vez) o link pessoal de um participante */
export async function POST(
  _req: Request,
  { params }: { params: { id: string; participanteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const grupo = await groupService.getGroupById(params.id);
    if (!grupo || grupo.organizadorId !== (session.user as any)?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const participantes = await participantService.getParticipantsByGroupId(params.id);
    if (!participantes.some((p) => p.id === params.participanteId)) {
      return NextResponse.json({ error: 'Participante não encontrado' }, { status: 404 });
    }

    const token = await garantirToken(params.participanteId);
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error creating link:', error);
    return NextResponse.json({ error: 'Erro ao gerar link' }, { status: 500 });
  }
}
