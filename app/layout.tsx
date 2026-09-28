import './globals.css';
import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { Providers } from './providers';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' });

const TITULO = 'Casa Cheia';
const DESCRICAO = 'A família reunida, cada um fazendo a sua parte.';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  return {
    title: TITULO,
    description: DESCRICAO,
    metadataBase: new URL(baseUrl),
    icons: {
      icon: '/favicon.svg',
      shortcut: '/favicon.svg',
    },
    openGraph: {
      title: TITULO,
      description: DESCRICAO,
      images: ['/og-image.png'],
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
        <style dangerouslySetInnerHTML={{ __html: '[data-hydration-error] { display: none !important; }' }} />
      </head>
      <body className={`${nunito.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
