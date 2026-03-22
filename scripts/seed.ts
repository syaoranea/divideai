import { PrismaClient, StatusParticipacao } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // Create test user
  const senhaHash = await bcrypt.hash('johndoe123', 10);
  
  const adminUser = await prisma.usuario.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      nome: 'João Organizador',
      email: 'john@doe.com',
      senhaHash,
    },
  });

  console.log('Usuário admin criado:', adminUser.email);

  // Create properties
  const imoveis = [
    {
      nome: 'Casa de Praia Paraíso',
      descricao: 'Maravilhosa casa de praia com piscina privativa, a 100m do mar. Vista espetacular e total privacidade para você e seus amigos.',
      precoTotalDiaria: 450,
      capacidadeMaxima: 8,
      comodidades: JSON.stringify(['Piscina', 'Wi-Fi', 'Ar Condicionado', 'Churrasqueira', 'Estacionamento', 'Vista para o mar']),
      imagemUrl: 'https://cdn.abacus.ai/images/3c88fe33-1608-4fa0-9c86-12168cfb680b.png',
      linkReserva: 'https://exemplo.com/reserva/casa-praia',
    },
    {
      nome: 'Chalé Montanha Encantada',
      descricao: 'Chalé aconchegante nas montanhas, perfeito para um final de semana de descanso. Lareira, vista panorâmica e muito verde.',
      precoTotalDiaria: 280,
      capacidadeMaxima: 6,
      comodidades: JSON.stringify(['Lareira', 'Wi-Fi', 'Aquecimento', 'Trilhas', 'Estacionamento', 'Vista para montanhas']),
      imagemUrl: 'https://cdn.abacus.ai/images/e17a00cc-5689-4532-9537-3b4fbf84b90e.png',
      linkReserva: 'https://exemplo.com/reserva/chale-montanha',
    },
    {
      nome: 'Sítio Recanto Verde',
      descricao: 'Sítio completo com área gourmet, churrasqueira profissional e muito espaço verde. Ideal para reunir a família ou amigos.',
      precoTotalDiaria: 600,
      capacidadeMaxima: 12,
      comodidades: JSON.stringify(['Churrasqueira', 'Piscina', 'Campo de futebol', 'Wi-Fi', 'Cozinha completa', 'Área gourmet']),
      imagemUrl: 'https://cdn.abacus.ai/images/7f06f0a6-4f00-40b1-ad43-91b0a7c02786.png',
      linkReserva: 'https://exemplo.com/reserva/sitio-verde',
    },
    {
      nome: 'Villa Moderna Luxo',
      descricao: 'Villa moderna com design contemporâneo, piscina aquecida e total conforto. Para quem busca sofisticação e praticidade.',
      precoTotalDiaria: 950,
      capacidadeMaxima: 10,
      comodidades: JSON.stringify(['Piscina aquecida', 'Jacuzzi', 'Wi-Fi', 'Ar Condicionado', 'Smart TV', 'Cozinha gourmet', 'Garagem']),
      imagemUrl: 'https://cdn.abacus.ai/images/7d99108f-c565-475b-9d15-e2080922ee1c.png',
      linkReserva: 'https://exemplo.com/reserva/villa-luxo',
    },
    {
      nome: 'Casa do Lago Serenidade',
      descricao: 'Casa à beira do lago com deck privativo e caiaque incluso. Perfeita para quem busca tranquilidade e contato com a natureza.',
      precoTotalDiaria: 380,
      capacidadeMaxima: 4,
      comodidades: JSON.stringify(['Deck privativo', 'Caiaque', 'Wi-Fi', 'Churrasqueira', 'Vista para lago', 'Pesca']),
      imagemUrl: 'https://cdn.abacus.ai/images/04c9fe04-231e-442a-8f8e-1cbe06002228.png',
      linkReserva: 'https://exemplo.com/reserva/casa-lago',
    },
  ];

  for (const imovel of imoveis) {
    await prisma.imovel.upsert({
      where: { id: imovel.nome.toLowerCase().replace(/\s/g, '-') },
      update: imovel,
      create: {
        id: imovel.nome.toLowerCase().replace(/\s/g, '-'),
        ...imovel,
      },
    });
  }

  console.log('5 imóveis criados');
  console.log('Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
