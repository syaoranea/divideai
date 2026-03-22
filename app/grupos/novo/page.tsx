'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Calendar, DollarSign, Users, ArrowLeft, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function NovoGrupoPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [dataTermino, setDataTermino] = useState('');
  const [orcamento, setOrcamento] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/grupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          dataEvento,
          dataTermino: dataTermino || undefined,
          orcamentoMaximoPorPessoa: parseFloat(orcamento),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? 'Erro ao criar grupo');
      }

      router.replace(`/grupos/${data?.id}`);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao criar grupo');
    } finally {
      setLoading(false);
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

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Voltar ao dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Users size={24} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Criar Novo Grupo</h1>
              <p className="text-gray-600">Defina os detalhes do seu evento</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Evento</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target?.value ?? '')}
                placeholder="Ex: Final de semana na praia"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-emerald-600" />
                Data do Evento
              </label>
              <input
                type="date"
                value={dataEvento}
                onChange={(e) => setDataEvento(e.target?.value ?? '')}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-600" />
                Orçamento (R$)
              </label>
              <input
                type="number"
                value={orcamento}
                onChange={(e) => setOrcamento(e.target?.value ?? '')}
                placeholder="1500.00"
                min="0"
                step="0.01"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
              <p className="text-sm text-gray-500 mt-1">
                Valor total disponível para o aluguel do imóvel
              </p>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus size={18} />
                  Criar Grupo
                </>
              )}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
