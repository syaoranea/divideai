import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { groupService } from '@/lib/services/groupService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const email = session.user.email ?? '';

    const grupos = await groupService.getGroupsForUser(userId, email);
    
    // Para simplificar e manter a compatibilidade com o frontend que espera o include, 
    // podemos buscar os detalhes de cada grupo. Em uma aplicação real com muitos grupos, 
    // isso seria otimizado.
    const gruposComDetalhes = await Promise.all(
      grupos.map(g => groupService.getGroupWithDetails(g.id))
    );

    return NextResponse.json(gruposComDetalhes);
  } catch (error) {
    console.error('Error fetching grupos:', error);
    return NextResponse.json({ error: 'Erro ao buscar grupos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { nome, dataEvento, dataTermino, orcamentoMaximoPorPessoa } = body ?? {};

    if (!nome || !dataEvento || !orcamentoMaximoPorPessoa) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    const userId = (session.user as any)?.id;

    const grupo = await groupService.createGroup({
      nome,
      dataEvento: new Date(dataEvento),
      dataTermino: dataTermino ? new Date(dataTermino) : undefined,
      orcamentoMaximoPorPessoa: parseFloat(orcamentoMaximoPorPessoa),
      organizadorId: userId,
    });

    const grupoComDetalhes = await groupService.getGroupWithDetails(grupo.id);

    return NextResponse.json(grupoComDetalhes);
  } catch (error) {
    console.error('Error creating grupo:', error);
    return NextResponse.json({ error: 'Erro ao criar grupo' }, { status: 500 });
  }
}
