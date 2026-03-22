'use client';

import { useState, useEffect } from 'react';
import { X, Save, Phone, User, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    nomeParticipante: string;
    telefoneParticipante: string;
    statusParticipacao: string;
    valorPago: number;
  }) => Promise<void>;
  participant: {
    id: string;
    nomeParticipante: string;
    telefoneParticipante: string;
    statusParticipacao: 'CONFIRMADO' | 'PENDENTE' | 'RECUSADO';
    valorIndividual: number | null;
    valorPago: number;
  } | null;
}

export function EditParticipantModal({ isOpen, onClose, onSave, participant }: EditParticipantModalProps) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [status, setStatus] = useState('PENDENTE');
  const [valorPago, setValorPago] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (participant) {
      setNome(participant.nomeParticipante ?? '');
      setTelefone(participant.telefoneParticipante ?? '');
      setStatus(participant.statusParticipacao ?? 'PENDENTE');
      setValorPago(String(participant.valorPago ?? 0));
      setError('');
    }
  }, [participant]);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSave({
        nomeParticipante: nome,
        telefoneParticipante: telefone,
        statusParticipacao: status,
        valorPago: parseFloat(valorPago) || 0,
      });
      onClose?.();
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao salvar alterações');
    } finally {
      setLoading(false);
    }
  };

  const valorDevido = participant?.valorIndividual ?? 0;
  const pago = parseFloat(valorPago) || 0;
  const saldo = valorDevido - pago;

  return (
    <AnimatePresence>
      {isOpen && participant && (
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
                <User className="text-emerald-600" />
                Editar Participante
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target?.value ?? '')}
                    placeholder="Nome do participante"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(formatPhone(e.target?.value ?? ''))}
                    placeholder="(00) 00000-0000"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'CONFIRMADO', label: 'Confirmado', icon: CheckCircle, color: 'emerald' },
                    { value: 'PENDENTE', label: 'Pendente', icon: Clock, color: 'yellow' },
                    { value: 'RECUSADO', label: 'Recusado', icon: XCircle, color: 'red' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                        status === opt.value
                          ? opt.color === 'emerald'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : opt.color === 'yellow'
                            ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                            : 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <opt.icon size={20} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {status === 'CONFIRMADO' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Já Pago (R$)</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={valorPago}
                      onChange={(e) => setValorPago(e.target?.value ?? '0')}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                  {participant?.valorIndividual != null && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Valor devido:</span>
                        <span className="font-medium text-gray-800">R$ {valorDevido.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Valor pago:</span>
                        <span className="font-medium text-emerald-600">R$ {pago.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
                        <span className="text-gray-600 font-medium">Saldo restante:</span>
                        <span className={`font-bold ${saldo <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {saldo <= 0 ? 'Quitado ✓' : `R$ ${saldo.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                    <Save size={18} />
                    Salvar Alterações
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
