'use client';

import { useEffect, useState } from 'react';
import { X, Save, DollarSign, Calendar, User, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    participanteId: string;
    valor: number;
    dataPagamento: string;
    observacao: string;
  }) => Promise<void>;
  participantes: { id: string; nomeParticipante: string }[];
}

const hoje = () => new Date().toISOString().slice(0, 10);

export function AddPaymentModal({ isOpen, onClose, onSave, participantes }: AddPaymentModalProps) {
  const [participanteId, setParticipanteId] = useState('');
  const [valor, setValor] = useState('');
  const [dataPagamento, setDataPagamento] = useState(hoje());
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setParticipanteId(participantes?.[0]?.id ?? '');
      setValor('');
      setDataPagamento(hoje());
      setObservacao('');
      setError('');
    }
  }, [isOpen, participantes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const valorNumerico = parseFloat(valor);
    if (!participanteId) {
      setError('Selecione um participante');
      return;
    }
    if (!valorNumerico || valorNumerico <= 0) {
      setError('Informe um valor maior que zero');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        participanteId,
        valor: valorNumerico,
        dataPagamento,
        observacao,
      });
      onClose?.();
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao registrar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => onClose?.()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <DollarSign className="text-emerald-600" />
                Registrar Pagamento
              </h2>
              <button
                onClick={() => onClose?.()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Participante</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={participanteId}
                    onChange={(e) => setParticipanteId(e.target?.value ?? '')}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white appearance-none"
                  >
                    {(participantes ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nomeParticipante}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={valor}
                    onChange={(e) => setValor(e.target?.value ?? '')}
                    placeholder="0.00"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data do pagamento</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={dataPagamento}
                    onChange={(e) => setDataPagamento(e.target?.value ?? '')}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  O mês desta data define a competência na tabela do histórico.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observação (opcional)
                </label>
                <div className="relative">
                  <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target?.value ?? '')}
                    placeholder="Ex: Pix 1ª parcela"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    Registrar
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
