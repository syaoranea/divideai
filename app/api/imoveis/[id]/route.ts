import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { propertyService } from '@/lib/services/propertyService';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'ID do imóvel não fornecido' }, { status: 400 });
    }

    const body = await req.json();
    const { nome, descricao, precoTotalDiaria, capacidadeMaxima, quartos, localizacao, comodidades, imagemUrl, linkReserva } = body ?? {};

    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (precoTotalDiaria !== undefined) updateData.precoTotalDiaria = parseFloat(precoTotalDiaria);
    if (capacidadeMaxima !== undefined) updateData.capacidadeMaxima = parseInt(capacidadeMaxima);
    if (quartos !== undefined) updateData.quartos = parseInt(quartos);
    if (localizacao !== undefined) updateData.localizacao = localizacao;
    if (comodidades !== undefined) updateData.comodidades = typeof comodidades === 'string' ? comodidades : JSON.stringify(comodidades ?? []);
    if (imagemUrl !== undefined) updateData.imagemUrl = imagemUrl;
    if (linkReserva !== undefined) updateData.linkReserva = linkReserva;

    await propertyService.updateProperty(id, updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating imovel:', error);
    return NextResponse.json({ error: 'Erro ao atualizar imóvel' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'ID do imóvel não fornecido' }, { status: 400 });
    }

    await propertyService.deleteProperty(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting imovel:', error);
    return NextResponse.json({ error: 'Erro ao excluir imóvel' }, { status: 500 });
  }
}
