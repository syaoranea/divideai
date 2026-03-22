import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { userService } from '@/lib/services/userService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, nome } = body ?? {};

    if (!email || !password || !nome) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      );
    }

    const existingUser = await userService.getUserByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      );
    }

    const senhaHash = await bcrypt.hash(password, 10);

    const user = await userService.createUser({
      email,
      nome,
      senhaHash,
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      nome: user.nome,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar conta' },
      { status: 500 }
    );
  }
}
