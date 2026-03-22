import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { url } = await req.json();

    if (!url || !url.includes('airbnb')) {
      return NextResponse.json({ error: 'URL do Airbnb inválida ou ausente' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Chave da API do Gemini não configurada' }, { status: 500 });
    }

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: `Você é um assistente especialista em extrair dados estruturados de links de acomodações na internet.
Você DEVE retornar APENAS um objeto JSON válido, sem nenhum texto adicional antes ou depois.
O JSON deve obedecer à seguinte estrutura exata:
{
  "nome": "",
  "descricao": "",
  "precoTotalDiaria": 0,
  "capacidadeMaxima": 0,
  "quartos": 0,
  "localizacao": "",
  "imagemUrl": "",
  "comodidades": []
}`
            }
          ]
        },
        contents: [
          {
            parts: [
              {
                text: `Por favor, acesse e extraia as informações deste anúncio do Airbnb: ${url}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return NextResponse.json({ error: 'Falha ao buscar dados na API do Gemini' }, { status: 502 });
    }

    const data = await response.json();
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return NextResponse.json({ error: 'Resposta vazia da IA' }, { status: 502 });
    }

    // Try to parse JSON from the markdown block if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Find the first '{' and the last '}' to extract the JSON object
    const startIndex = content.indexOf('{');
    const endIndex = content.lastIndexOf('}');
    
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      content = content.substring(startIndex, endIndex + 1);
    }

    try {
      const parsed = JSON.parse(content);
      
      // Enforce strict structure and types
      const validatedData = {
        nome: String(parsed.nome || ''),
        descricao: String(parsed.descricao || ''),
        precoTotalDiaria: Number(parsed.precoTotalDiaria || 0),
        capacidadeMaxima: Number(parsed.capacidadeMaxima || 0),
        quartos: Number(parsed.quartos || 0),
        localizacao: String(parsed.localizacao || ''),
        imagemUrl: String(parsed.imagemUrl || ''),
        comodidades: Array.isArray(parsed.comodidades) ? parsed.comodidades.map(String) : []
      };

      return NextResponse.json(validatedData);
    } catch (parseError) {
      console.error('JSON Parse error:', content);
      return NextResponse.json({ error: 'Erro ao processar os dados recebidos da IA' }, { status: 500 });
    }


  } catch (error) {
    console.error('Error importing from Airbnb:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
