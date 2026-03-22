'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import {
  ArrowLeft, Building2, DollarSign, Users, Wifi, Image as ImageIcon,
  Link as LinkIcon, FileText, Plus, X, Search, MapPin, Bed
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CadastrarImovelPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

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
  const [importing, setImporting] = useState(false);
  const [airbnbLink, setAirbnbLink] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const handleAddComodidade = () => {
    if (novaComodidade?.trim() && !comodidades?.includes(novaComodidade?.trim())) {
      setComodidades([...(comodidades ?? []), novaComodidade?.trim()]);
      setNovaComodidade('');
    }
  };

  const handleRemoveComodidade = (index: number) => {
    setComodidades((comodidades ?? []).filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (!airbnbLink) {
      setError('Por favor, insira um link do Airbnb.');
      return;
    }
    setImporting(true);
    setError('');

    try {
      const res = await fetch('/api/imoveis/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: airbnbLink }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao importar dados');
      }

      const data = await res.json();

      setNome(data.nome || '');
      setDescricao(data.descricao || '');
      setPreco(data.precoTotalDiaria?.toString() || '');
      setCapacidade(data.capacidadeMaxima?.toString() || '');
      setQuartos(data.quartos?.toString() || '0');
      setLocalizacao(data.localizacao || '');
      setImagemUrl(data.imagemUrl || '');
      if (Array.isArray(data.comodidades)) setComodidades(data.comodidades);


      setLinkReserva(airbnbLink);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao importar. Verifique o link e tente novamente.');
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/imoveis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          descricao,
          precoTotalDiaria: preco,
          capacidadeMaxima: capacidade,
          quartos,
          localizacao,
          comodidades: JSON.stringify(comodidades ?? []),
          imagemUrl,
          linkReserva,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error ?? 'Erro ao cadastrar');
      }

      setSuccess(true);
      // Reset form
      setNome('');
      setDescricao('');
      setPreco('');
      setCapacidade('');
      setQuartos('');
      setLocalizacao('');
      setImagemUrl('');
      setLinkReserva('');
      setComodidades([]);
      setAirbnbLink('');

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao cadastrar imóvel');
    } finally {
      setLoading(false);
    }
  };

  const commonComodidades = [
    'Wi-Fi', 'Piscina', 'Churrasqueira', 'Ar Condicionado', 'Estacionamento',
    'Cozinha', 'TV', 'Jacuzzi', 'Lareira', 'Varanda'
  ];

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
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
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <Building2 size={24} className="text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Cadastrar Imóvel</h1>
              <p className="text-gray-600">Adicione um novo imóvel ao catálogo</p>
            </div>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-800 font-medium">Ação realizada com sucesso!</p>
            </div>
          )}

          <div className="bg-emerald-50 rounded-xl p-5 mb-8 border border-emerald-100">
            <h2 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
              <Search size={16} />
              Importação Mágica
            </h2>
            <p className="text-sm text-emerald-700 mb-4">
              Cole o link de um anúncio do Airbnb para preencher os dados do imóvel automaticamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                value={airbnbLink}
                onChange={(e) => setAirbnbLink(e.target.value)}
                placeholder="https://www.airbnb.com/rooms/..."
                className="flex-1 px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleImport}
                disabled={importing}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 sm:w-auto"
              >
                {importing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Importar</>
                )}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Imóvel *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target?.value ?? '')}
                  placeholder="Ex: Casa de Praia Paraíso"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-600" />
                  Localização
                </label>
                <input
                  type="text"
                  value={localizacao}
                  onChange={(e) => setLocalizacao(e.target?.value ?? '')}
                  placeholder="Ex: Ubatuba, SP"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText size={16} className="text-emerald-600" />
                Descrição
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target?.value ?? '')}
                placeholder="Descreva o imóvel, seus atrativos e diferenciais..."
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <DollarSign size={16} className="text-emerald-600" />
                  Preço/Diária (R$) *
                </label>
                <input
                  type="number"
                  value={preco}
                  onChange={(e) => setPreco(e.target?.value ?? '')}
                  placeholder="450.00"
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Users size={16} className="text-emerald-600" />
                  Capacidade Máxima *
                </label>
                <input
                  type="number"
                  value={capacidade}
                  onChange={(e) => setCapacidade(e.target?.value ?? '')}
                  placeholder="8"
                  min="1"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Bed size={16} className="text-emerald-600" />
                  Número de Quartos
                </label>
                <input
                  type="number"
                  value={quartos}
                  onChange={(e) => setQuartos(e.target?.value ?? '')}
                  placeholder="Ex: 3"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <ImageIcon size={16} className="text-emerald-600" />
                URL da Imagem
              </label>
              <input
                type="url"
                value={imagemUrl}
                onChange={(e) => setImagemUrl(e.target?.value ?? '')}
                placeholder="https://exemplo.com/imagem.jpg"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <LinkIcon size={16} className="text-emerald-600" />
                Link de Reserva
              </label>
              <input
                type="url"
                value={linkReserva}
                onChange={(e) => setLinkReserva(e.target?.value ?? '')}
                placeholder="https://airbnb.com/rooms/..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Wifi size={16} className="text-emerald-600" />
                Comodidades
              </label>

              <div className="flex flex-wrap gap-2 mb-3">
                {(commonComodidades ?? []).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      if (!comodidades?.includes(c)) {
                        setComodidades([...(comodidades ?? []), c]);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      comodidades?.includes(c)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={novaComodidade}
                  onChange={(e) => setNovaComodidade(e.target?.value ?? '')}
                  placeholder="Outra comodidade..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddComodidade())}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddComodidade}
                  className="px-4 py-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>

              {(comodidades?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {(comodidades ?? []).map((c, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Building2 size={18} />
                  Cadastrar Imóvel
                </>
              )}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
