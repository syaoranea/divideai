'use client';

import { useState, useEffect } from 'react';
import { X, Save, Calendar, DollarSign, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TemaPicker } from '@/components/tema-picker';
import { normalizarTema, type Tema } from '@/lib/temas';
import { TIPOS_CHAVE_PIX, type ConfigPix, type TipoChavePix } from '@/lib/pix';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    nome: string;
    dataEvento: string;
    dataTermino?: string;
    orcamentoMaximoPorPessoa: number;
    tema: Tema;
    pix: ConfigPix | null;
  }) => Promise<void>;
  group: {
    nome: string;
    dataEvento: string;
    dataTermino?: string;
    orcamentoMaximoPorPessoa: number;
    tema?: string;
    pix?: ConfigPix | null;
  } | null;
}

export function EditGroupModal({ isOpen, onClose, onSave, group }: EditGroupModalProps) {
  const [nome, setNome] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [dataTermino, setDataTermino] = useState('');
  const [orcamento, setOrcamento] = useState('');
  const [tema, setTema] = useState<Tema>(normalizarTema(undefined));
  const [pixTipo, setPixTipo] = useState<TipoChavePix>('telefone');
  const [pixChave, setPixChave] = useState('');
  const [pixNome, setPixNome] = useState('');
  const [pixCidade, setPixCidade] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (group) {
      setNome(group.nome ?? '');
      try {
        const d = new Date(group.dataEvento);
        setDataEvento(d.toISOString().split('T')[0]);
        if (group.dataTermino) {
          const dt = new Date(group.dataTermino);
          setDataTermino(dt.toISOString().split('T')[0]);
        } else {
          setDataTermino('');
        }
      } catch {
        setDataEvento('');
        setDataTermino('');
      }
      setOrcamento(String(group.orcamentoMaximoPorPessoa ?? 0));
      setTema(normalizarTema(group.tema));
      setPixTipo(group.pix?.tipo ?? 'telefone');
      setPixChave(group.pix?.chave ?? '');
      setPixNome(group.pix?.nome ?? '');
      setPixCidade(group.pix?.cidade ?? '');
      setError('');
    }
  }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSave({
        nome,
        dataEvento,
        dataTermino: dataTermino || undefined,
        orcamentoMaximoPorPessoa: parseFloat(orcamento) || 0,
        tema,
        pix: pixChave.trim()
          ? { tipo: pixTipo, chave: pixChave, nome: pixNome, cidade: pixCidade }
          : null,
      });
      onClose?.();
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao salvar alterações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && group && (
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
                <Users className="text-brand-600" />
                Editar Grupo
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Evento</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target?.value ?? '')}
                  placeholder="Nome do evento"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Calendar size={16} className="text-brand-600" />
                  Data do Evento
                </label>
                <input
                  type="date"
                  value={dataEvento}
                  onChange={(e) => setDataEvento(e.target?.value ?? '')}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Calendar size={16} className="text-brand-600" />
                  Término do Evento
                </label>
                <input
                  type="date"
                  value={dataTermino}
                  onChange={(e) => setDataTermino(e.target?.value ?? '')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <DollarSign size={16} className="text-brand-600" />
                  Orçamento (R$)
                </label>
                <input
                  type="number"
                  value={orcamento}
                  onChange={(e) => setOrcamento(e.target?.value ?? '0')}
                  placeholder="1500.00"
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Valor total disponível para o aluguel
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tema do evento</label>
                <TemaPicker value={tema} onChange={setTema} />
              </div>

              <fieldset className="rounded-xl border border-gray-200 p-4 space-y-3">
                <legend className="px-1 text-sm font-medium text-gray-700">Pix para receber</legend>
                <p className="text-xs text-gray-500 -mt-1">
                  Com isso, a família copia o Pix já com o valor certo na aba Pagar.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TIPOS_CHAVE_PIX.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPixTipo(t.id)}
                      className={`px-3 py-1 rounded-full text-sm font-semibold border transition-colors ${
                        pixTipo === t.id
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                      }`}
                    >
                      {t.nome}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={pixChave}
                  onChange={(e) => setPixChave(e.target?.value ?? '')}
                  placeholder={TIPOS_CHAVE_PIX.find((t) => t.id === pixTipo)?.exemplo}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={pixNome}
                    onChange={(e) => setPixNome(e.target?.value ?? '')}
                    placeholder="Nome de quem recebe"
                    required={!!pixChave.trim()}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
                  />
                  <input
                    type="text"
                    value={pixCidade}
                    onChange={(e) => setPixCidade(e.target?.value ?? '')}
                    placeholder="Cidade"
                    required={!!pixChave.trim()}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
                  />
                </div>
              </fieldset>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
