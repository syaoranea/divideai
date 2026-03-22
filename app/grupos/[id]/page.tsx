'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { ParticipantCard } from '@/components/participant-card';
import { PropertyCard } from '@/components/property-card';
import { VotingCard } from '@/components/voting-card';
import { AddParticipantModal } from '@/components/add-participant-modal';
import { EditParticipantModal } from '@/components/edit-participant-modal';
import { EditGroupModal } from '@/components/edit-group-modal';
import { EditPropertyModal } from '@/components/edit-property-modal';
import { GuestAccessModal } from '@/components/guest-access-modal';
import { CollectionChart } from '@/components/collection-chart';
import {
  ArrowLeft, Users, Calendar, DollarSign, Plus, Building2, Vote,
  CheckCircle, AlertCircle, ExternalLink, Trophy, Lock, ChevronRight, Pencil,
  Utensils, Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface Participante {
  id: string;
  nomeParticipante: string;
  emailParticipante: string;
  telefoneParticipante: string;
  statusParticipacao: 'CONFIRMADO' | 'PENDENTE' | 'RECUSADO';
  valorIndividual: number | null;
  valorPago: number;
}

interface Imovel {
  id: string;
  nome: string;
  descricao: string;
  precoTotalDiaria: number;
  capacidadeMaxima: number;
  quartos?: number;
  localizacao?: string;
  comodidades: string;
  imagemUrl: string;
  linkReserva: string;
}

interface ImovelEmVotacao {
  id: string;
  imovelId: string;
  imovel: Imovel;
}

interface Grupo {
  id: string;
  nome: string;
  dataEvento: string;
  dataTermino?: string;
  orcamentoMaximoPorPessoa: number;
  statusGrupo: 'ABERTO' | 'FECHADO';
  organizador: { id: string; nome: string; email: string };
  participantes: Participante[];
  imovelEscolhido: Imovel | null;
  imoveisEmVotacao: ImovelEmVotacao[];
  votos: { participanteId: string; imovelId: string }[];
}

export default function GrupoDetailsPage() {
  const { data: session, status: authStatus } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const grupoId = params?.id as string;

  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participante | null>(null);
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Imovel | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [guestPhone, setGuestPhone] = useState<string | null>(null);
  const [showGuestModal, setShowGuestModal] = useState(false);

  const userId = (session?.user as any)?.id;
  const userEmail = session?.user?.email;

  const confirmados = (grupo?.participantes ?? []).filter(
    (p) => p?.statusParticipacao === 'CONFIRMADO'
  );
  const numConfirmados = confirmados?.length ?? 0;
  const isOrganizer = grupo?.organizador?.id === userId;
  const orcamentoTotal = grupo?.orcamentoMaximoPorPessoa ?? 0;

  // Find current user's participant record
  const myParticipant = (grupo?.participantes ?? []).find(
    (p) => (userEmail && p?.emailParticipante === userEmail) || 
           (guestPhone && p?.telefoneParticipante?.replace(/\D/g, '') === guestPhone.replace(/\D/g, ''))
  );
  const canVote = !!myParticipant && myParticipant.statusParticipacao === 'CONFIRMADO';
  const myVote = (grupo?.votos ?? []).find((v) => v?.participanteId === myParticipant?.id);

  const fetchGrupo = useCallback(async (phoneOverride?: string) => {
    try {
      const headers: Record<string, string> = {};
      const currentPhone = phoneOverride || guestPhone;
      
      if (currentPhone) {
        headers['x-guest-phone'] = currentPhone;
      }

      const res = await fetch(`/api/grupos/${grupoId}`, { headers });
      const data = await res.json();
      
      if (!res.ok && res.status === 401) {
        setShowGuestModal(true);
        return;
      }
      
      setGrupo(data);

      // Determine active phase
      if (data?.statusGrupo === 'FECHADO') {
        setActivePhase('D');
      } else if ((data?.imoveisEmVotacao?.length ?? 0) > 0) {
        setActivePhase('C');
      } else if (numConfirmados >= 2) {
        setActivePhase('B');
      } else {
        setActivePhase('A');
      }
    } catch (error) {
      console.error('Error fetching grupo:', error);
    } finally {
      setLoading(false);
    }
  }, [grupoId, numConfirmados]);

  const fetchImoveis = useCallback(async () => {
    if (numConfirmados < 2) return;
    try {
      const res = await fetch(
        `/api/imoveis?orcamentoTotal=${orcamentoTotal}&capacidadeMinima=${numConfirmados}`
      );
      const data = await res.json();
      setImoveis(data ?? []);
    } catch (error) {
      console.error('Error fetching imoveis:', error);
    }
  }, [orcamentoTotal, numConfirmados]);

  useEffect(() => {
    // Carrega telefone de convidado se existir
    const savedPhone = localStorage.getItem(`guest_phone_${grupoId}`);
    if (savedPhone) {
      setGuestPhone(savedPhone);
    }
  }, [grupoId]);

  useEffect(() => {
    if (authStatus === 'unauthenticated' && !guestPhone) {
      // Pequeno delay para evitar flash antes de carregar localStorage
      const timer = setTimeout(() => {
        const savedPhone = localStorage.getItem(`guest_phone_${grupoId}`);
        if (!savedPhone) {
          setShowGuestModal(true);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [authStatus, guestPhone, grupoId]);

  useEffect(() => {
    if ((authStatus === 'authenticated' || guestPhone) && grupoId) {
      fetchGrupo();
    }
  }, [authStatus, guestPhone, grupoId, fetchGrupo]);

  useEffect(() => {
    if (grupo && activePhase === 'B') {
      fetchImoveis();
    }
  }, [grupo, activePhase, fetchImoveis]);

  const handleAddParticipant = async (data: { nome: string; telefone: string; status: string }) => {
    const res = await fetch(`/api/grupos/${grupoId}/participantes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nomeParticipante: data.nome,
        telefoneParticipante: data.telefone,
        statusParticipacao: data.status,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error ?? 'Erro ao adicionar');
    }
    await fetchGrupo();
  };

  const handleEditParticipant = async (data: {
    nomeParticipante: string;
    telefoneParticipante: string;
    statusParticipacao: string;
    valorPago: number;
  }) => {
    if (!editingParticipant) return;
    const res = await fetch(`/api/grupos/${grupoId}/participantes/${editingParticipant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error ?? 'Erro ao salvar');
    }
    await fetchGrupo();
  };

  const handleEditGroup = async (data: { nome: string; dataEvento: string; orcamentoMaximoPorPessoa: number }) => {
    const res = await fetch(`/api/grupos/${grupoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error ?? 'Erro ao salvar');
    }
    await fetchGrupo();
  };

  const openEditPropertyModal = (imovel: Imovel) => {
    setEditingProperty(imovel);
    setShowEditPropertyModal(true);
  };

  const handleEditProperty = async (data: any) => {
    if (!editingProperty) return;
    const res = await fetch(`/api/imoveis/${editingProperty.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error ?? 'Erro ao salvar imóvel');
    }
    await fetchImoveis();
    await fetchGrupo();
  };

  const handleDeleteProperty = async (id: string) => {
    const res = await fetch(`/api/imoveis/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error ?? 'Erro ao excluir imóvel');
    }
    await fetchImoveis();
    await fetchGrupo();
  };

  const openEditModal = (p: Participante) => {
    setEditingParticipant(p);
    setShowEditModal(true);
  };

  // Collection chart data
  const totalDevido = confirmados.reduce((sum, p) => sum + (p?.valorIndividual ?? 0), 0);
  const totalArrecadado = confirmados.reduce((sum, p) => sum + (p?.valorPago ?? 0), 0);

  const handleAddToVoting = async (imovelId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/grupos/${grupoId}/imoveis-votacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imovelId }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err?.error ?? 'Erro ao adicionar');
      }
      await fetchGrupo();
    } catch (error) {
      console.error('Error adding to voting:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFromVoting = async (imovelId: string) => {
    setActionLoading(true);
    try {
      await fetch(`/api/grupos/${grupoId}/imoveis-votacao?imovelId=${imovelId}`, {
        method: 'DELETE',
      });
      await fetchGrupo();
    } catch (error) {
      console.error('Error removing from voting:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVote = async (imovelId: string) => {
    if (!myParticipant) return;
    setActionLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (guestPhone) {
        headers['x-guest-phone'] = guestPhone;
      }

      await fetch(`/api/grupos/${grupoId}/votos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          participanteId: myParticipant.id,
          imovelId,
        }),
      });
      await fetchGrupo();
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalizarVotacao = async () => {
    if (!confirm('Tem certeza que deseja finalizar a votação? Esta ação não pode ser desfeita.')) return;
    setActionLoading(true);
    try {
      await fetch(`/api/grupos/${grupoId}/finalizar-votacao`, {
        method: 'POST',
      });
      await fetchGrupo();
    } catch (error) {
      console.error('Error finalizing:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string, endDateStr?: string) => {
    try {
      if (!dateStr) return '';
      const start = new Date(dateStr);
      
      const formatUTC = (d: Date, options: Intl.DateTimeFormatOptions) => {
        return new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: 'UTC' }).format(d);
      };
      
      if (endDateStr) {
        const end = new Date(endDateStr);
        if (start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear()) {
          const startDay = start.getUTCDate().toString().padStart(2, '0');
          const finalStr = formatUTC(end, { day: '2-digit', month: 'long', year: 'numeric' });
          return `${startDay} - ${finalStr}`;
        }
        const startStr = formatUTC(start, { day: '2-digit', month: 'short' });
        const finalStr = formatUTC(end, { day: '2-digit', month: 'short', year: 'numeric' });
        return `${startStr} - ${finalStr}`;
      }

      return formatUTC(start, { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Vote counts
  const voteCounts: Record<string, number> = {};
  for (const voto of grupo?.votos ?? []) {
    voteCounts[voto.imovelId] = (voteCounts[voto.imovelId] ?? 0) + 1;
  }

  const selectedImovelIds = (grupo?.imoveisEmVotacao ?? []).map((iv) => iv.imovelId);

  if (authStatus === 'loading' || (loading && !guestPhone && authStatus !== 'unauthenticated')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!grupo) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {authStatus === 'unauthenticated' ? 'Acesse o grupo para continuar' : 'Grupo não encontrado'}
          </h1>
          <p className="text-gray-600 mt-2">
            {authStatus === 'unauthenticated' 
              ? 'Insira seu telefone para visualizar os detalhes do evento.' 
              : 'Verifique se o link está correto ou se o grupo ainda existe.'}
          </p>
          <Link href="/dashboard" className="text-emerald-600 hover:underline mt-4 inline-block">
            Voltar ao início
          </Link>
        </main>
        
        <GuestAccessModal
          isOpen={showGuestModal}
          grupoId={grupoId}
          onSuccess={(phone) => {
            setGuestPhone(phone);
            setShowGuestModal(false);
            fetchGrupo(phone);
          }}
        />
      </div>
    );
  }

  let parsedComodidades: string[] = [];
  try {
    parsedComodidades = JSON.parse(grupo?.imovelEscolhido?.comodidades ?? '[]');
  } catch {
    parsedComodidades = [];
  }

  return (
    <div className="min-h-screen pb-12">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>

        {/* Group Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{grupo?.nome}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    grupo?.statusGrupo === 'FECHADO'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {grupo?.statusGrupo === 'FECHADO' ? 'Finalizado' : 'Em andamento'}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar size={16} className="text-emerald-500" />
                  {formatDate(grupo?.dataEvento ?? '', grupo?.dataTermino)}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={16} className="text-emerald-500" />
                  {numConfirmados} confirmados
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign size={16} className="text-emerald-500" />
                  R$ {(grupo?.orcamentoMaximoPorPessoa ?? 0)?.toFixed?.(2)} (total)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">Organizador</p>
                <p className="font-medium text-gray-800">{grupo?.organizador?.nome}</p>
              </div>
              {isOrganizer && grupo?.statusGrupo !== 'FECHADO' && (
                <button
                  onClick={() => setShowEditGroupModal(true)}
                  className="p-2 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors"
                  title="Editar grupo"
                >
                  <Pencil size={18} className="text-emerald-600" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Collection Chart */}
        {numConfirmados > 0 && totalDevido > 0 && (
          <div className="mb-6">
            <CollectionChart
              totalDevido={totalDevido}
              totalArrecadado={totalArrecadado}
              participantes={(grupo?.participantes ?? []).map(p => ({
                nomeParticipante: p.nomeParticipante,
                valorIndividual: p.valorIndividual,
                valorPago: p.valorPago ?? 0,
                statusParticipacao: p.statusParticipacao,
              }))}
            />
          </div>
        )}

        {/* Phase Navigation */}
        {grupo?.statusGrupo !== 'FECHADO' && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { key: 'A', label: 'Participantes', icon: Users },
              { key: 'B', label: 'Imóveis', icon: Building2, disabled: numConfirmados < 2 },
              { key: 'C', label: 'Votação', icon: Vote, disabled: selectedImovelIds?.length === 0 },
              { key: 'E', label: 'Refeição', icon: Utensils, disabled: true },
              { key: 'F', label: 'Atividades', icon: Map, disabled: true },
            ].map((phase) => (
              <button
                key={phase.key}
                onClick={() => !phase.disabled && setActivePhase(phase.key as any)}
                disabled={phase.disabled}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                  activePhase === phase.key
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : phase.disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-600 hover:bg-emerald-50'
                }`}
              >
                <phase.icon size={18} />
                {phase.label}
                {phase.disabled && <Lock size={14} />}
              </button>
            ))}
          </div>
        )}

        {/* Validation Warning */}
        {activePhase === 'A' && numConfirmados < 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3"
          >
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-yellow-800">Adicione mais participantes</p>
              <p className="text-sm text-yellow-700">
                Você precisa de pelo menos 2 participantes confirmados para avançar para a seleção de imóveis.
              </p>
            </div>
          </motion.div>
        )}

        {/* Phase A: Participants */}
        {activePhase === 'A' && grupo?.statusGrupo !== 'FECHADO' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="text-emerald-600" />
                Participantes ({grupo?.participantes?.length ?? 0})
              </h2>
              {isOrganizer && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  <Plus size={18} />
                  Adicionar
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(grupo?.participantes ?? []).map((p) => (
                <ParticipantCard
                  key={p?.id}
                  id={p?.id ?? ''}
                  nome={p?.nomeParticipante ?? ''}
                  telefone={p?.telefoneParticipante ?? ''}
                  status={p?.statusParticipacao ?? 'PENDENTE'}
                  valorIndividual={p?.valorIndividual}
                  valorPago={p?.valorPago ?? 0}
                  onClick={isOrganizer ? () => openEditModal(p) : undefined}
                />
              ))}
            </div>

            {numConfirmados >= 2 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setActivePhase('B')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                >
                  Avançar para Imóveis
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Phase B: Property Selection */}
        {activePhase === 'B' && grupo?.statusGrupo !== 'FECHADO' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-emerald-50 rounded-xl p-4 mb-6">
              <p className="text-emerald-800">
                <strong>Orçamento total do grupo:</strong> R$ {orcamentoTotal?.toFixed?.(2)}
                <span className="text-emerald-600 ml-2">(R$ {numConfirmados > 0 ? (orcamentoTotal / numConfirmados).toFixed(2) : '0.00'}/pessoa)</span>
              </p>
              <p className="text-sm text-emerald-700 mt-1">
                Mostrando apenas imóveis dentro do orçamento. Selecione até 3 para votação.
              </p>
            </div>

            {selectedImovelIds?.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <p className="text-blue-800 font-medium">
                  {selectedImovelIds?.length}/3 imóveis selecionados para votação
                </p>
                {selectedImovelIds?.length > 0 && isOrganizer && (
                  <button
                    onClick={() => setActivePhase('C')}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Ir para Votação
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            )}

            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 className="text-emerald-600" />
              Imóveis Disponíveis
            </h2>

            {(imoveis?.length ?? 0) === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                <p className="text-gray-600">Nenhum imóvel disponível dentro do orçamento.</p>
                <Link
                  href="/imoveis/cadastrar"
                  className="inline-flex items-center gap-2 mt-4 text-emerald-600 hover:underline"
                >
                  <Plus size={18} />
                  Cadastrar novo imóvel
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {(imoveis ?? []).map((imovel) => (
                  <PropertyCard
                    key={imovel?.id}
                    {...imovel}
                    numConfirmados={numConfirmados}
                    isSelected={selectedImovelIds?.includes(imovel?.id ?? '')}
                    showVotingButtons={isOrganizer}
                    onAddToVoting={() => handleAddToVoting(imovel?.id ?? '')}
                    onRemoveFromVoting={() => handleRemoveFromVoting(imovel?.id ?? '')}
                    onClick={isOrganizer ? () => openEditPropertyModal(imovel) : undefined}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Phase C: Voting */}
        {activePhase === 'C' && grupo?.statusGrupo !== 'FECHADO' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Vote className="text-emerald-600" />
                Votação
              </h2>
              {isOrganizer && (
                <button
                  onClick={handleFinalizarVotacao}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={18} />
                  Encerrar Votação
                </button>
              )}
            </div>

            {!canVote && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <p className="text-yellow-800">
                  Apenas participantes confirmados podem votar. Seu status atual não permite votação.
                </p>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(grupo?.imoveisEmVotacao ?? []).map((iv) => (
                <VotingCard
                  key={iv?.id}
                  id={iv?.imovel?.id ?? ''}
                  nome={iv?.imovel?.nome ?? ''}
                  imagemUrl={iv?.imovel?.imagemUrl ?? ''}
                  precoTotalDiaria={iv?.imovel?.precoTotalDiaria ?? 0}
                  capacidadeMaxima={iv?.imovel?.capacidadeMaxima ?? 0}
                  numConfirmados={numConfirmados}
                  votosCount={voteCounts[iv?.imovelId ?? ''] ?? 0}
                  hasVoted={!!myVote}
                  isMyVote={myVote?.imovelId === iv?.imovelId}
                  disabled={!canVote || actionLoading}
                  onVote={() => handleVote(iv?.imovelId ?? '')}
                />
              ))}
            </div>

            <div className="mt-6 bg-white rounded-xl p-4">
              <h3 className="font-medium text-gray-800 mb-2">Status dos votos:</h3>
              <p className="text-gray-600">
                {grupo?.votos?.length ?? 0} de {numConfirmados} participantes votaram
              </p>
            </div>
          </motion.div>
        )}

        {/* Phase D: Final Results */}
        {(activePhase === 'D' || grupo?.statusGrupo === 'FECHADO') && grupo?.imovelEscolhido && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 mb-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Trophy size={32} />
                <h2 className="text-2xl font-bold">Imóvel Escolhido!</h2>
              </div>
              <p className="text-white/80">A votação foi encerrada. Confira o resultado abaixo.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Property Card */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="relative aspect-video bg-gray-200">
                  {grupo.imovelEscolhido?.imagemUrl && (
                    <Image
                      src={grupo.imovelEscolhido.imagemUrl}
                      alt={grupo.imovelEscolhido?.nome ?? ''}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {grupo.imovelEscolhido?.nome}
                  </h3>
                  {grupo.imovelEscolhido?.localizacao && (
                    <p className="text-emerald-700 font-medium mb-3">
                      {grupo.imovelEscolhido.localizacao}
                    </p>
                  )}
                  <p className="text-gray-600 mb-4">{grupo.imovelEscolhido?.descricao}</p>

                  <div className="flex items-center gap-4 mb-4 text-gray-700">
                    <div className="flex items-center gap-1">
                      <Users size={18} className="text-emerald-600" />
                      <span>Até {grupo.imovelEscolhido?.capacidadeMaxima ?? 0} pessoas</span>
                    </div>
                    {grupo.imovelEscolhido?.quartos !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-emerald-600">{grupo.imovelEscolhido.quartos}</span>
                        <span>quartos</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {(parsedComodidades ?? []).map((c, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  {grupo.imovelEscolhido?.linkReserva && (
                    <a
                      href={grupo.imovelEscolhido.linkReserva}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                    >
                      <ExternalLink size={18} />
                      Acessar Link de Reserva
                    </a>
                  )}
                </div>
              </div>

              {/* Cost Division */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="text-emerald-600" />
                  Divisão de Custos
                </h3>

                <div className="bg-emerald-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-emerald-700">Total do Imóvel</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    R$ {(grupo.imovelEscolhido?.precoTotalDiaria ?? 0)?.toFixed?.(2)}
                  </p>
                </div>

                <div className="space-y-3">
                  {confirmados.map((p) => (
                    <div
                      key={p?.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Users size={18} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{p?.nomeParticipante}</p>
                          {p?.telefoneParticipante ? (
                            <p className="text-sm text-gray-500">{p.telefoneParticipante}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">
                          R$ {(p?.valorIndividual ?? 0)?.toFixed?.(2)}
                        </p>
                        {(p?.valorPago ?? 0) > 0 && (
                          <p className={`text-xs font-medium ${(p?.valorPago ?? 0) >= (p?.valorIndividual ?? 0) ? 'text-emerald-600' : 'text-orange-500'}`}>
                            {(p?.valorPago ?? 0) >= (p?.valorIndividual ?? 0) ? '✓ Pago' : `Pago: R$ ${(p?.valorPago ?? 0).toFixed(2)}`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">Total</span>
                    <span className="text-2xl font-bold text-gray-800">
                      R$ {(grupo.imovelEscolhido?.precoTotalDiaria ?? 0)?.toFixed?.(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <AddParticipantModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddParticipant}
      />

      <EditParticipantModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingParticipant(null);
        }}
        onSave={handleEditParticipant}
        participant={editingParticipant}
      />

      <EditGroupModal
        isOpen={showEditGroupModal}
        onClose={() => setShowEditGroupModal(false)}
        onSave={handleEditGroup}
        group={grupo ? {
          nome: grupo.nome,
          dataEvento: grupo.dataEvento,
          dataTermino: grupo.dataTermino,
          orcamentoMaximoPorPessoa: grupo.orcamentoMaximoPorPessoa,
        } : null}
      />

      <GuestAccessModal
        isOpen={showGuestModal}
        grupoId={grupoId}
        onSuccess={(phone) => {
          setGuestPhone(phone);
          setShowGuestModal(false);
          fetchGrupo(phone);
        }}
      />

      <EditPropertyModal
        isOpen={showEditPropertyModal}
        onClose={() => {
          setShowEditPropertyModal(false);
          setEditingProperty(null);
        }}
        onSave={handleEditProperty}
        onDelete={handleDeleteProperty}
        property={editingProperty}
      />
    </div>
  );
}
