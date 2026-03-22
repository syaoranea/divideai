require('dotenv').config();

const url = 'https://www.airbnb.com.br/rooms/10923065';
const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

console.log("Key length:", perplexityApiKey ? perplexityApiKey.length : 0);

async function test() {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${perplexityApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente especialista em extrair dados estruturados de links de acomodações na internet.
Você DEVE retornar APENAS um objeto JSON válido.
{
  "nome": "string"
}`
        },
        {
          role: 'user',
          content: `Por favor, acesse e extraia as informações deste anúncio do Airbnb: ${url}`
        }
      ],
      temperature: 0.1,
    }),
  });

  console.log("Status:", response.status);
  if (!response.ok) {
    console.log("Error:", await response.text());
  } else {
    const data = await response.json();
    console.log("Success:", data.choices?.[0]?.message?.content);
  }
}

test();
