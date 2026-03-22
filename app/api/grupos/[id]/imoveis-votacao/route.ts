import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { votingService } from '@/lib/services/votingService';
import { propertyService } from '@/lib/services/propertyService';
import { db } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { imovelId } = body ?? {};

    if (!imovelId) {
      return NextResponse.json(
        { error: 'ID do imóvel é obrigatório' },
        { status: 400 }
      );
    }

    // Check if already has 3 properties in voting
    const votingProps = await votingService.getVotingPropertiesByGroupId(params.id);

    if (votingProps.length >= 3) {
      return NextResponse.json(
        { error: 'Máximo de 3 imóveis para votação' },
        { status: 400 }
      );
    }

    if (votingProps.some(vp => vp.imovelId === imovelId)) {
      return NextResponse.json(
        { error: 'Imóvel já adicionado à votação' },
        { status: 400 }
      );
    }

    const vp = await votingService.addVotingProperty(params.id, imovelId);
    const imovel = await propertyService.getPropertyById(imovelId);

    return NextResponse.json({
      ...vp,
      imovel
    });
  } catch (error: any) {
    console.error('Error adding imovel to votacao:', error);
    return NextResponse.json({ error: 'Erro ao adicionar imóvel' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const imovelId = searchParams.get('imovelId');

    if (!imovelId) {
      return NextResponse.json(
        { error: 'ID do imóvel é obrigatório' },
        { status: 400 }
      );
    }

    const snapshot = await db.collection('voting_properties')
      .where('grupoId', '==', params.id)
      .where('imovelId', '==', imovelId)
      .get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing imovel from votacao:', error);
    return NextResponse.json({ error: 'Erro ao remover imóvel' }, { status: 500 });
  }
}
