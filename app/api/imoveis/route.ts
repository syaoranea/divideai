import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { propertyService } from '@/lib/services/propertyService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orcamentoTotal = searchParams.get('orcamentoTotal');
    const capacidadeMinima = searchParams.get('capacidadeMinima');

    let imoveis = await propertyService.getAllProperties();

    if (orcamentoTotal) {
      const orcamento = parseFloat(orcamentoTotal);
      imoveis = imoveis.filter(i => i.precoTotalDiaria <= orcamento);
    }

    if (capacidadeMinima) {
      const capacidade = parseInt(capacidadeMinima);
      imoveis = imoveis.filter(i => i.capacidadeMaxima >= capacidade);
    }

    // Ordenação simples por preço
    imoveis.sort((a, b) => a.precoTotalDiaria - b.precoTotalDiaria);

    return NextResponse.json(imoveis);
  } catch (error) {
    console.error('Error fetching imoveis:', error);
    return NextResponse.json({ error: 'Erro ao buscar imóveis' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { nome, descricao, precoTotalDiaria, capacidadeMaxima, quartos, localizacao, comodidades, imagemUrl, linkReserva } = body ?? {};

    if (!nome || !descricao || !precoTotalDiaria || !capacidadeMaxima) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    const imovel = await propertyService.createProperty({
      nome,
      descricao,
      precoTotalDiaria: parseFloat(precoTotalDiaria),
      capacidadeMaxima: parseInt(capacidadeMaxima),
      quartos: quartos ? parseInt(quartos) : 0,
      localizacao: localizacao ?? '',

      comodidades: typeof comodidades === 'string' ? comodidades : JSON.stringify(comodidades ?? []),
      imagemUrl: imagemUrl ?? '',
      linkReserva: linkReserva ?? '',
    });

    return NextResponse.json(imovel);
  } catch (error) {
    console.error('Error creating imovel:', error);
    return NextResponse.json({ error: 'Erro ao criar imóvel' }, { status: 500 });
  }
}
