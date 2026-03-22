'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Users, Calendar, DollarSign, ChevronRight, Home, Building2, Lock, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/header';

interface Grupo {
  id: string;
  nome: string;
  dataEvento: string;
  dataTermino?: string;
  orcamentoMaximoPorPessoa: number;
  statusGrupo: 'ABERTO' | 'FECHADO';
  organizador: { nome: string; email: string };
  participantes: any[];
  imovelEscolhido?: any;
}

export default function DashboardPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchGrupos();
    }
  }, [status]);

  const fetchGrupos = async () => {
    try {
      const res = await fetch('/api/grupos');
      const data = await res.json();
      setGrupos(data ?? []);
    } catch (error) {
      console.error('Error fetching grupos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string, endDateStr?: string) => {
    try {
      if (!dateStr) return '';
      // Para evitar problemas de fuso horário, garantimos que a string seja tratada de forma consistente
      // Se não houver 'T', adicionamos T12:00:00 para centralizar no dia, ou usamos métodos UTC
      const start = new Date(dateStr);
      
      const formatUTC = (d: Date, options: Intl.DateTimeFormatOptions) => {
        return new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: 'UTC' }).format(d);
      };

      if (endDateStr) {
        const end = new Date(endDateStr);
        if (start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear()) {
          const startDay = start.getUTCDate().toString().padStart(2, '0');
          const finalStr = formatUTC(end, { day: '2-digit', month: 'short', year: 'numeric' });
          return `${startDay} - ${finalStr}`;
        }
        const startStr = formatUTC(start, { day: '2-digit', month: 'short' });
        const finalStr = formatUTC(end, { day: '2-digit', month: 'short', year: 'numeric' });
        return `${startStr} - ${finalStr}`;
      }

      return formatUTC(start, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Olá, {(session?.user as any)?.name ?? 'Usuário'}! 👋
          </h1>
          <p className="text-gray-600">
            Gerencie seus grupos e divida custos com amigos de forma simples.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link href="/grupos/novo">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Criar Novo Grupo</h3>
                  <p className="text-white/80 text-sm">Organize um novo evento</p>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/imoveis/cadastrar">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Cadastrar Imóvel</h3>
                  <p className="text-white/80 text-sm">Adicione novos imóveis</p>
                </div>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Groups List */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Home size={24} className="text-emerald-600" />
            Meus Grupos
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (grupos?.length ?? 0) === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-12 text-center shadow-lg"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhum grupo ainda</h3>
              <p className="text-gray-600 mb-6">Crie seu primeiro grupo para começar a dividir custos!</p>
              <Link
                href="/grupos/novo"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
              >
                <Plus size={18} />
                Criar Grupo
              </Link>
            </motion.div>
          ) : (
            <div className="grid gap-4">
              {(grupos ?? []).map((grupo, index) => {
                const confirmados = (grupo.participantes ?? []).filter(
                  (p: any) => p?.statusParticipacao === 'CONFIRMADO'
                )?.length ?? 0;

                return (
                  <motion.div
                    key={grupo?.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={`/grupos/${grupo?.id}`}>
                      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">
                                {grupo?.nome ?? 'Grupo'}
                              </h3>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                  grupo?.statusGrupo === 'FECHADO'
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {grupo?.statusGrupo === 'FECHADO' ? (
                                  <><Lock size={12} /> Finalizado</>
                                ) : (
                                  <><Unlock size={12} /> Em andamento</>
                                )}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar size={16} className="text-emerald-500" />
                                {formatDate(grupo?.dataEvento ?? '', grupo?.dataTermino)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users size={16} className="text-emerald-500" />
                                {confirmados} confirmados
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign size={16} className="text-emerald-500" />
                                R$ {(grupo?.orcamentoMaximoPorPessoa ?? 0)?.toFixed?.(2)}
                              </span>
                            </div>

                            {grupo?.imovelEscolhido && (
                              <p className="mt-2 text-sm text-emerald-600 font-medium">
                                🏠 Imóvel: {grupo.imovelEscolhido?.nome ?? 'Definido'}
                              </p>
                            )}
                          </div>

                          <ChevronRight
                            size={24}
                            className="text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all"
                          />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
