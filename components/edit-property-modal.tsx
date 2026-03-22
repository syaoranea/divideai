'use client';

import { useState, useEffect } from 'react';
import { X, Save, Building2, MapPin, DollarSign, Users, Bed, Wifi, Image as ImageIcon, Link as LinkIcon, FileText, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  property: {
    id: string;
    nome: string;
    descricao: string;
    precoTotalDiaria: number;
    capacidadeMaxima: number;
    quartos?: number;
    localizacao?: string;
    comodidades: string | string[];
    imagemUrl: string;
    linkReserva: string;
  } | null;
}

export function EditPropertyModal({ isOpen, onClose, onSave, onDelete, property }: EditPropertyModalProps) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [capacidade, setCapacidade] = useState('');
  const [quartos, setQuartos] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [linkReserva, setLinkReserva] = useState('');
  const [comodidades, setComodidades] = useState<string[]>([]);
  const [novaComodidade, setNovaComodidade] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (property) {
      setNome(property.nome ?? '');
      setDescricao(property.descricao ?? '');
      setPreco(property.precoTotalDiaria?.toString() ?? '');
      setCapacidade(property.capacidadeMaxima?.toString() ?? '');
      setQuartos(property.quartos?.toString() ?? '');
      setLocalizacao(property.localizacao ?? '');
      setImagemUrl(property.imagemUrl ?? '');
      setLinkReserva(property.linkReserva ?? '');
      
      let parsedComodidades: string[] = [];
      if (Array.isArray(property.comodidades)) {
        parsedComodidades = property.comodidades;
      } else {
        try {
          parsedComodidades = JSON.parse(property.comodidades ?? '[]');
        } catch {
          parsedComodidades = [];
        }
      }
      setComodidades(parsedComodidades);
      setError('');
    }
  }, [property]);

  const handleAddComodidade = () => {
    if (novaComodidade?.trim() && !comodidades?.includes(novaComodidade?.trim())) {
      setComodidades([...(comodidades ?? []), novaComodidade?.trim()]);
      setNovaComodidade('');
    }
  };

  const handleRemoveComodidade = (index: number) => {
    setComodidades((comodidades ?? []).filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSave({
        nome,
        descricao,
        precoTotalDiaria: preco,
        capacidadeMaxima: capacidade,
        quartos,
        localizacao,
        comodidades,
        imagemUrl,
        linkReserva,
      });
      onClose?.();
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao salvar alterações');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!property?.id || !onDelete) return;
    if (!confirm('Tem certeza que deseja excluir este imóvel? A ação não pode ser desfeita.')) return;
    
    setDeleteLoading(true);
    setError('');
    try {
      await onDelete(property.id);
      onClose?.();
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao excluir imóvel');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && property && (
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
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Building2 className="text-emerald-600" />
                Editar Imóvel
              </h2>
              <button
                onClick={() => onClose?.()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                type="button"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Imóvel *</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    Localização
                  </label>
                  <input
                    type="text"
                    value={localizacao}
                    onChange={(e) => setLocalizacao(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FileText size={16} className="text-gray-400" />
                  Descrição *
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <DollarSign size={16} className="text-gray-400" />
                    Preço/Diária (R$) *
                  </label>
                  <input
                    type="number"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    Capacidade *
                  </label>
                  <input
                    type="number"
                    value={capacidade}
                    onChange={(e) => setCapacidade(e.target.value)}
                    min="1"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Bed size={16} className="text-gray-400" />
                    Quartos
                  </label>
                  <input
                    type="number"
                    value={quartos}
                    onChange={(e) => setQuartos(e.target.value)}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <ImageIcon size={16} className="text-gray-400" />
                    URL da Imagem
                  </label>
                  <input
                    type="url"
                    value={imagemUrl}
                    onChange={(e) => setImagemUrl(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <LinkIcon size={16} className="text-gray-400" />
                    Link de Reserva
                  </label>
                  <input
                    type="url"
                    value={linkReserva}
                    onChange={(e) => setLinkReserva(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Wifi size={16} className="text-gray-400" />
                  Comodidades
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={novaComodidade}
                    onChange={(e) => setNovaComodidade(e.target.value)}
                    placeholder="Adicionar comodidade..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddComodidade())}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddComodidade}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {comodidades.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {comodidades.map((c, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm"
                      >
                        {c}
                        <button
                          type="button"
                          onClick={() => handleRemoveComodidade(idx)}
                          className="hover:text-emerald-900"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                {onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteLoading || loading}
                    className="flex-1 py-3 px-4 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleteLoading ? (
                      <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Trash2 size={18} />
                        Excluir Imóvel
                      </>
                    )}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || deleteLoading}
                  className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
