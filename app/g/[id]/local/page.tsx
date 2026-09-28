'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Building2, Vote, CheckCircle, ExternalLink, Trophy, Users, DollarSign, Plus, Hourglass,
} from 'lucide-react';
import { PropertyCard } from '@/components/property-card';
import { VotacaoDeck } from '@/components/votacao-deck';
import { EditPropertyModal } from '@/components/edit-property-modal';
import { useGrupo, brl, type Imovel } from '@/lib/grupo-context';

export default function LocalPage() {
  const { grupoId, grupo, isOrganizer, myParticipant, confirmados, apiFetch, refresh } = useGrupo();
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Imovel | null>(null);

  const numConfirmados = confirmados.length;
  const orcamentoTotal = grupo?.orcamentoMaximoPorPessoa ?? 0;
  const fechado = grupo?.statusGrupo === 'FECHADO';
  const emVotacao = grupo?.imoveisEmVotacao ?? [];
  const selectedImovelIds = emVotacao.map((iv) => iv.imovelId);
  const canVote = myParticipant?.statusParticipacao === 'CONFIRMADO';
  const myVote = (grupo?.votos ?? []).find((v) => v.participanteId === myParticipant?.id);

  const voteCounts: Record<string, number> = {};
  for (const voto of grupo?.votos ?? []) {
    voteCounts[voto.imovelId] = (voteCounts[voto.imovelId] ?? 0) + 1;
  }

  const fetchImoveis = useCallback(async () => {
    if (numConfirmados < 2) return;
    try {
      const res = await fetch(
        `/api/imoveis?orcamentoTotal=${orcamentoTotal}&capacidadeMinima=${numConfirmados}`
      );
      setImoveis((await res.json()) ?? []);
    } catch (error) {
      console.error('Error fetching imoveis:', error);
    }
  }, [orcamentoTotal, numConfirmados]);

  useEffect(() => {
    if (isOrganizer && !fechado) fetchImoveis();
  }, [isOrganizer, fechado, fetchImoveis]);

  const comLoading = async (acao: () => Promise<unknown>) => {
    setActionLoading(true);
    try {
      await acao();
      await refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddToVoting = (imovelId: string) =>
    comLoading(async () => {
      const res = await fetch(`/api/grupos/${grupoId}/imoveis-votacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imovelId }),
      });
      if (!res.ok) alert((await res.json())?.error ?? 'Erro ao adicionar');
    });

  const handleRemoveFromVoting = (imovelId: string) =>
    comLoading(() =>
      fetch(`/api/grupos/${grupoId}/imoveis-votacao?imovelId=${imovelId}`, { method: 'DELETE' })
    );

  const handleVote = async (imovelId: string) => {
    if (!myParticipant) return;
    const res = await apiFetch(`/api/grupos/${grupoId}/votos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participanteId: myParticipant.id, imovelId }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Erro ao votar');
    await refresh();
  };

  const handleFinalizarVotacao = () => {
    if (!confirm('Tem certeza que deseja finalizar a votação? Esta ação não pode ser desfeita.')) return;
    comLoading(() => fetch(`/api/grupos/${grupoId}/finalizar-votacao`, { method: 'POST' }));
  };

  const handleEditProperty = async (data: any) => {
    if (!editingProperty) return;
    const res = await fetch(`/api/imoveis/${editingProperty.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json())?.error ?? 'Erro ao salvar imóvel');
    await Promise.all([fetchImoveis(), refresh()]);
  };

  const handleDeleteProperty = async (id: string) => {
    const res = await fetch(`/api/imoveis/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json())?.error ?? 'Erro ao excluir imóvel');
    await Promise.all([fetchImoveis(), refresh()]);
  };

  if (!grupo) return null;

  // Resultado final
  if (fechado && grupo.imovelEscolhido) {
    const escolhido = grupo.imovelEscolhido;
    let comodidades: string[] = [];
    try {
      comodidades = JSON.parse(escolhido.comodidades ?? '[]');
    } catch {
      comodidades = [];
    }

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="bg-gradient-to-r from-brand-500 to-brand-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-1">
            <Trophy size={28} />
            <h1 className="text-2xl font-extrabold">Local escolhido!</h1>
          </div>
          <p className="text-white/80">A votação foi encerrada. É aqui que a casa vai encher.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="relative aspect-video bg-gray-200">
            {escolhido.imagemUrl && (
              <Image src={escolhido.imagemUrl} alt={escolhido.nome ?? ''} fill className="object-cover" />
            )}
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{escolhido.nome}</h2>
            {escolhido.localizacao && (
              <p className="text-brand-700 font-semibold mb-3">{escolhido.localizacao}</p>
            )}
            <p className="text-gray-600 mb-4">{escolhido.descricao}</p>
            <div className="flex items-center gap-4 mb-4 text-gray-700">
              <span className="flex items-center gap-1">
                <Users size={18} className="text-brand-600" />
                Até {escolhido.capacidadeMaxima ?? 0} pessoas
              </span>
              {escolhido.quartos !== undefined && (
                <span>
                  <strong className="text-brand-600">{escolhido.quartos}</strong> quartos
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {comodidades.map((c, i) => (
                <span key={i} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm">
                  {c}
                </span>
              ))}
            </div>
            {escolhido.linkReserva && (
              <a
                href={escolhido.linkReserva}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors"
              >
                <ExternalLink size={18} />
                Ver o local
              </a>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign className="text-brand-600" />
            Divisão de custos
          </h3>
          <div className="bg-brand-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-brand-700">Total do local</p>
            <p className="text-3xl font-extrabold text-brand-600">{brl(escolhido.precoTotalDiaria)}</p>
          </div>
          <ul className="space-y-2">
            {confirmados.map((p) => (
              <li key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="font-medium text-gray-800">{p.nomeParticipante}</span>
                <span className="font-bold text-brand-600">{brl(p.valorIndividual)}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Votação */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
            <Vote className="text-brand-600" />
            Onde vai ser?
          </h1>
          {isOrganizer && emVotacao.length > 0 && (
            <button
              onClick={handleFinalizarVotacao}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-semibold"
            >
              <CheckCircle size={18} />
              Encerrar votação
            </button>
          )}
        </div>

        {emVotacao.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow">
            <Hourglass className="mx-auto text-brand-400 mb-3" size={36} />
            <p className="font-semibold text-gray-800">A votação ainda não começou</p>
            <p className="text-sm text-gray-500 mt-1">
              {isOrganizer
                ? 'Escolha até 3 opções abaixo para a família votar.'
                : 'Assim que as opções estiverem prontas, você vota por aqui.'}
            </p>
          </div>
        ) : (
          <>
            {!canVote && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-yellow-800 text-sm">
                {myParticipant
                  ? 'Só quem confirmou presença pode votar. Confirme no Início!'
                  : 'Você está vendo a votação como organizador.'}
              </div>
            )}
            <VotacaoDeck
              opcoes={emVotacao}
              numConfirmados={numConfirmados}
              voteCounts={voteCounts}
              totalVotos={grupo.votos?.length ?? 0}
              meuVotoId={myVote?.imovelId}
              podeVotar={canVote}
              onVotar={handleVote}
            />
          </>
        )}
      </section>

      {/* Seleção de opções (organizador) */}
      {isOrganizer && (
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Building2 className="text-brand-600" />
            Opções disponíveis
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Orçamento total de {brl(orcamentoTotal)} ({numConfirmados > 0 ? brl(orcamentoTotal / numConfirmados) : brl(0)} por pessoa).
            Selecionados: {selectedImovelIds.length}/3.
          </p>

          {numConfirmados < 2 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
              Confirme pelo menos 2 participantes para ver as opções de local.
            </div>
          ) : imoveis.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow">
              <p className="text-gray-600">Nenhum local dentro do orçamento.</p>
              <Link
                href="/imoveis/cadastrar"
                className="inline-flex items-center gap-2 mt-3 text-brand-600 hover:underline"
              >
                <Plus size={18} />
                Cadastrar novo local
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {imoveis.map((imovel) => (
                <PropertyCard
                  key={imovel.id}
                  {...imovel}
                  numConfirmados={numConfirmados}
                  isSelected={selectedImovelIds.includes(imovel.id)}
                  showVotingButtons
                  onAddToVoting={() => handleAddToVoting(imovel.id)}
                  onRemoveFromVoting={() => handleRemoveFromVoting(imovel.id)}
                  onClick={() => setEditingProperty(imovel)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <EditPropertyModal
        isOpen={!!editingProperty}
        onClose={() => setEditingProperty(null)}
        onSave={handleEditProperty}
        onDelete={handleDeleteProperty}
        property={editingProperty}
      />
    </div>
  );
}
