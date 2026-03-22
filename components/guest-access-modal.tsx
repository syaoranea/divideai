'use client';

import { useState } from 'react';
import { Phone, ArrowRight, Lock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GuestAccessModalProps {
  isOpen: boolean;
  grupoId: string;
  onSuccess: (phone: string) => void;
}

export function GuestAccessModal({ isOpen, grupoId, onSuccess }: GuestAccessModalProps) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = phone.replace(/\D/g, '');
    if (!normalizedPhone) {
      setError('Por favor, insira um número de telefone válido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Tenta buscar o grupo usando o telefone como header para verificar acesso
      const res = await fetch(`/api/grupos/${grupoId}`, {
        headers: {
          'x-guest-phone': normalizedPhone,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Não foi possível acessar o grupo com este telefone.');
      }

      // Se deu certo, salva no localStorage e notifica o pai
      localStorage.setItem(`guest_phone_${grupoId}`, normalizedPhone);
      onSuccess(normalizedPhone);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
            <Lock size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso ao Grupo</h2>
          <p className="text-gray-600">
            Informe seu número de telefone cadastrado no grupo para visualizar os detalhes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Phone size={16} className="text-emerald-600" />
              Seu Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-lg"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm"
            >
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading || !phone}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Ver Detalhes do Grupo
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500 italic">
          Acesso restrito para visualização. Funcionalidades de edição requerem login completo.
        </p>
      </motion.div>
    </div>
  );
}
