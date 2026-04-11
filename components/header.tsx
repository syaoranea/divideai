'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Home, Users, Building2, LogOut, Menu, X, Plus } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const { data: session } = useSession() || {};
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!session) return null;

  return (
    <header className="sticky top-0 z-50 glass-card shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-300 transition-shadow">
              <span className="text-white font-bold text-lg">🎄</span>
            </div>
            <span className="text-xl font-bold text-emerald-700 hidden sm:block">Natal 2026</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
            >
              <Home size={18} />
              <span>Meus Grupos</span>
            </Link>
            <Link
              href="/grupos/novo"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-md hover:shadow-lg"
            >
              <Plus size={18} />
              <span>Novo Grupo</span>
            </Link>
            <Link
              href="/imoveis/cadastrar"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 transition-colors"
            >
              <Building2 size={18} />
              <span>Cadastrar Imóvel</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            >
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-emerald-100 text-emerald-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 flex flex-col gap-2 overflow-hidden"
            >
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home size={18} />
                <span>Meus Grupos</span>
              </Link>
              <Link
                href="/grupos/novo"
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Plus size={18} />
                <span>Novo Grupo</span>
              </Link>
              <Link
                href="/imoveis/cadastrar"
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Building2 size={18} />
                <span>Cadastrar Imóvel</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut({ callbackUrl: '/login' });
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600"
              >
                <LogOut size={18} />
                <span>Sair</span>
              </button>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
