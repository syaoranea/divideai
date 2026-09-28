import { NextResponse } from 'next/server';
import { identificarNoGrupo } from '@/lib/acesso';
import { db } from '@/lib/firebaseAdmin';
import { participantService } from '@/lib/services/participantService';
import { muralService, TAMANHO_MAX_FOTO } from '@/lib/services/muralService';

export const dynamic = 'force-dynamic';

/** Confere a assinatura do arquivo: só JPEG e WebP (é o que o app gera no celular) */
function tipoDaImagem(bytes: Buffer): string | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length > 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await identificarNoGrupo(req, params.id))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json(await muralService.listar(params.id));
  } catch (error) {
    console.error('Error listing mural:', error);
    return NextResponse.json({ error: 'Erro ao carregar o mural' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const eu = await identificarNoGrupo(req, params.id);
    if (!eu) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const texto = String(body?.texto ?? '').trim().slice(0, 500);

    let foto: { bytes: Buffer; mime: string } | undefined;
    if (body?.foto) {
      const bytes = Buffer.from(String(body.foto), 'base64');
      if (bytes.length > TAMANHO_MAX_FOTO) {
        return NextResponse.json({ error: 'A foto ficou grande demais. Tente outra.' }, { status: 413 });
      }
      const mime = tipoDaImagem(bytes);
      if (!mime) {
        return NextResponse.json({ error: 'Formato de foto não suportado' }, { status: 400 });
      }
      foto = { bytes, mime };
    }

    if (!texto && !foto) {
      return NextResponse.json({ error: 'Escreva algo ou escolha uma foto' }, { status: 400 });
    }

    let autorId: string;
    let autorNome: string;
    if (eu.participanteId) {
      const participantes = await participantService.getParticipantsByGroupId(params.id);
      autorId = eu.participanteId;
      autorNome = participantes.find((p) => p.id === eu.participanteId)?.nomeParticipante ?? 'Alguém';
    } else {
      const grupo = await db.collection('groups').doc(params.id).get();
      const organizador = await db.collection('users').doc(grupo.data()?.organizadorId).get();
      autorId = 'organizador';
      autorNome = organizador.data()?.nome ?? 'Organização';
    }

    const largura = Math.round(Number(body?.largura)) || undefined;
    const altura = Math.round(Number(body?.altura)) || undefined;

    const post = await muralService.criar(
      {
        grupoId: params.id,
        autorId,
        autorNome,
        texto,
        temFoto: !!foto,
        ...(foto && largura && altura ? { fotoLargura: largura, fotoAltura: altura } : {}),
      },
      foto
    );
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating mural post:', error);
    return NextResponse.json({ error: 'Erro ao publicar' }, { status: 500 });
  }
}
