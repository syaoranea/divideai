import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const headersList = headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  return {
    title: 'Natal 2026 - União e Confraternização',
    description: 'Organizando momentos inesquecíveis de união e confraternização em família.',
    metadataBase: new URL(baseUrl),
    icons: {
      icon: '/favicon.svg',
      shortcut: '/favicon.svg',
    },
    openGraph: {
      title: 'Natal 2026 - União e Confraternização',
      description: 'Organizando momentos inesquecíveis de união e confraternização em família.',
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
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
