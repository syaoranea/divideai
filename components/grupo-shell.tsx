'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Home, Wallet, MapPin, UtensilsCrossed, Camera, Settings, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { LogoIcon } from '@/components/logo';
import { GuestAccessModal } from '@/components/guest-access-modal';
import { useGrupo } from '@/lib/grupo-context';
import { emojiDoTema } from '@/lib/temas';

const ABAS = [
  { slug: '', label: 'Início', icon: Home },
  { slug: 'pagar', label: 'Pagar', icon: Wallet },
  { slug: 'local', label: 'Local', icon: MapPin },
  { slug: 'ceia', label: 'Ceia', icon: UtensilsCrossed },
  { slug: 'mural', label: 'Mural', icon: Camera },
  { slug: 'gerenciar', label: 'Gerenciar', icon: Settings, soOrganizador: true },
];

function Carregando() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function GrupoShell({ children }: { children: React.ReactNode }) {
  const { grupoId, grupo, acesso, tema, isOrganizer, entrarComTelefone } = useGrupo();
  const { status: authStatus } = useSession() || {};
  const pathname = usePathname() ?? '';
  const base = `/g/${grupoId}`;

  if (acesso === 'carregando') return <Carregando />;

  if (acesso !== 'liberado' || !grupo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <LogoIcon size={72} className="mb-4 drop-shadow-lg" />
        <h1 className="text-2xl font-extrabold text-brand-800">
          {acesso === 'nao-encontrado' ? 'Grupo não encontrado' : 'Bem-vindo à Casa Cheia'}
        </h1>
        <p className="text-gray-600 mt-2 max-w-sm">
          {acesso === 'nao-encontrado'
            ? 'Confira se o link está certo ou peça um novo para quem organiza.'
            : 'Use o link que você recebeu ou informe seu telefone para entrar.'}
        </p>
        {authStatus === 'authenticated' && (
          <Link href="/dashboard" className="text-brand-600 hover:underline mt-4">
            Voltar para meus grupos
          </Link>
        )}
        <GuestAccessModal
          isOpen={acesso === 'precisa-identificar'}
          grupoId={grupoId}
          onSuccess={entrarComTelefone}
        />
      </div>
    );
  }

  const abas = ABAS.filter((a) => !a.soOrganizador || isOrganizer);
  const hrefDe = (slug: string) => (slug ? `${base}/${slug}` : base);
  const ativa = (slug: string) =>
    slug ? pathname.startsWith(`${base}/${slug}`) : pathname === base || pathname === `${base}/`;

  return (
    <div className="min-h-screen md:flex">
      {/* Barra lateral (computador) */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:sticky md:top-0 md:h-screen border-r border-brand-100 bg-white/70 backdrop-blur p-4">
        <Link href={base} className="flex items-center gap-2 mb-6">
          <LogoIcon size={36} />
          <span className="text-lg font-extrabold tracking-tight text-brand-800">Casa Cheia</span>
        </Link>
        <div className="mb-6 p-3 rounded-xl bg-brand-50">
          <p className="text-xs text-brand-700 font-semibold uppercase tracking-wide">Evento</p>
          <p className="font-bold text-gray-800 leading-tight">
            {emojiDoTema(tema)} {grupo.nome}
          </p>
        </div>
        <nav className="flex flex-col gap-1">
          {abas.map((aba) => {
            const on = ativa(aba.slug);
            return (
              <Link
                key={aba.slug}
                href={hrefDe(aba.slug)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                  on ? 'text-white' : 'text-gray-600 hover:bg-brand-50 hover:text-brand-700'
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="aba-lateral"
                    className="absolute inset-0 rounded-xl bg-brand-600 shadow-md"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <aba.icon size={20} className="relative" />
                <span className="relative">{aba.label}</span>
              </Link>
            );
          })}
        </nav>
        {authStatus === 'authenticated' && (
          <Link
            href="/dashboard"
            className="mt-auto flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-brand-700"
          >
            <ArrowLeft size={16} />
            Meus grupos
          </Link>
        )}
      </aside>

      <div className="flex-1 min-w-0">
        {/* Topo (celular) */}
        <header className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-brand-100">
          <div className="flex items-center gap-3 px-4 h-14">
            {authStatus === 'authenticated' ? (
              <Link href="/dashboard" aria-label="Meus grupos" className="text-gray-500">
                <ArrowLeft size={20} />
              </Link>
            ) : (
              <LogoIcon size={28} />
            )}
            <p className="font-bold text-gray-800 truncate">
              {emojiDoTema(tema)} {grupo.nome}
            </p>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 pb-nav md:pb-10">{children}</main>
      </div>

      {/* Barra inferior (celular) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-brand-100 safe-bottom">
        <ul className="flex">
          {abas.map((aba) => {
            const on = ativa(aba.slug);
            return (
              <li key={aba.slug} className="flex-1">
                <Link
                  href={hrefDe(aba.slug)}
                  className={`relative flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-semibold transition-colors ${
                    on ? 'text-brand-700' : 'text-gray-500'
                  }`}
                >
                  {on && (
                    <motion.span
                      layoutId="aba-inferior"
                      className="absolute top-0 h-1 w-10 rounded-b-full bg-brand-600"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <motion.span animate={{ scale: on ? 1.15 : 1 }}>
                    <aba.icon size={22} strokeWidth={on ? 2.4 : 2} />
                  </motion.span>
                  {aba.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
