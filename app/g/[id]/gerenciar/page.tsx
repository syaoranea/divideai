'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Plus, Pencil, Building2, Settings, Search, BellRing, Wallet, CalendarDays, Palette,
} from 'lucide-react';
import { ParticipantCard } from '@/components/participant-card';
import { AddParticipantModal } from '@/components/add-participant-modal';
import { EditParticipantModal } from '@/components/edit-participant-modal';
import { EditGroupModal } from '@/components/edit-group-modal';
import { AddPaymentModal } from '@/components/add-payment-modal';
import { PaymentHistoryTable } from '@/components/payment-history-table';
import { LinkPessoal } from '@/components/link-pessoal';
import { pixConfigurado } from '@/lib/pix';
import { TEMAS } from '@/lib/temas';
import { useGrupo, formatarDataEvento, brl, type Participante } from '@/lib/grupo-context';

type Aba = 'participantes' | 'pagamentos' | 'evento';
type Filtro = 'todos' | Participante['statusParticipacao'];

const ABAS: { id: Aba; label: string }[] = [
  { id: 'participantes', label: 'Participantes' },
  { id: 'pagamentos', label: 'Pagamentos' },
  { id: 'evento', label: 'Evento' },
];

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'CONFIRMADO', label: 'Confirmados' },
  { id: 'PENDENTE', label: 'Pendentes' },
  { id: 'RECUSADO', label: 'Recusados' },
];

const semAcento = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const totalAcompanhantes = (p: Participante) =>
  (p.acompanhantesAdultos ?? 0) + (p.acompanhantesCriancas ?? 0);

function Resumo({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow">
      <p className="text-xs font-semibold text-gray-500">{rotulo}</p>
      <p className="text-xl font-extrabold text-gray-800 leading-tight mt-0.5">{valor}</p>
      {detalhe && <p className="text-xs text-gray-500 mt-0.5">{detalhe}</p>}
    </div>
  );
}

export default function GerenciarPage() {
  const router = useRouter();
  const { grupoId, grupo, pagamentos, isOrganizer, confirmados, refresh, refreshPagamentos } = useGrupo();
  const [aba, setAba] = useState<Aba>('participantes');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [busca, setBusca] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participante | null>(null);

  useEffect(() => {
    if (grupo && !isOrganizer) router.replace(`/g/${grupoId}`);
  }, [grupo, isOrganizer, grupoId, router]);

  // Objeto estável: o modal reinicia o formulário quando esta referência muda
  const grupoParaEditar = useMemo(
    () =>
      grupo && {
        nome: grupo.nome,
        dataEvento: grupo.dataEvento,
        dataTermino: grupo.dataTermino,
        orcamentoMaximoPorPessoa: grupo.orcamentoMaximoPorPessoa,
        tema: grupo.tema,
        pix: grupo.pix,
      },
    [grupo]
  );

  if (!grupo || !isOrganizer) return null;

  const enviar = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error ?? 'Erro ao salvar');
    }
  };

  const handleAddParticipant = async (data: { nome: string; telefone: string; status: string }) => {
    await enviar(`/api/grupos/${grupoId}/participantes`, 'POST', {
      nomeParticipante: data.nome,
      telefoneParticipante: data.telefone,
      statusParticipacao: data.status,
    });
    await refresh();
  };

  const handleEditParticipant = async (data: {
    nomeParticipante: string;
    telefoneParticipante: string;
    statusParticipacao: string;
    valorPagoAdicional: number;
  }) => {
    if (!editingParticipant) return;
    await enviar(`/api/grupos/${grupoId}/participantes/${editingParticipant.id}`, 'PATCH', data);
    await refresh();
  };

  const handleEditGroup = async (data: unknown) => {
    await enviar(`/api/grupos/${grupoId}`, 'PATCH', data);
    await refresh();
  };

  const handleAddPayment = async (data: unknown) => {
    await enviar(`/api/grupos/${grupoId}/pagamentos`, 'POST', data);
    await Promise.all([refreshPagamentos(), refresh()]);
  };

  const handleDeletePayment = async (pagamentoId: string) => {
    try {
      await enviar(`/api/grupos/${grupoId}/pagamentos/${pagamentoId}`, 'DELETE');
      await Promise.all([refreshPagamentos(), refresh()]);
    } catch (err: any) {
      alert(err?.message ?? 'Erro ao excluir pagamento');
    }
  };

  const participantes = grupo.participantes ?? [];
  const contagem = (f: Filtro) =>
    f === 'todos' ? participantes.length : participantes.filter((p) => p.statusParticipacao === f).length;
  const pendentes = contagem('PENDENTE');
  const totalDevido = confirmados.reduce((s, p) => s + (p.valorIndividual ?? 0), 0);
  const totalArrecadado = confirmados.reduce((s, p) => s + (p.valorPago ?? 0), 0);
  const pessoasNaCasa = confirmados.reduce((s, p) => s + 1 + totalAcompanhantes(p), 0);
  const emVotacao = grupo.statusGrupo !== 'FECHADO' && (grupo.imoveisEmVotacao?.length ?? 0) > 0;

  const termo = semAcento(busca.trim());
  const visiveis = participantes
    .filter((p) => filtro === 'todos' || p.statusParticipacao === filtro)
    .filter(
      (p) =>
        !termo ||
        semAcento(p.nomeParticipante ?? '').includes(termo) ||
        (p.telefoneParticipante ?? '').replace(/\D/g, '').includes(termo.replace(/\D/g, '') || '§')
    )
    .sort((a, b) => a.nomeParticipante.localeCompare(b.nomeParticipante, 'pt-BR'));

  const temaAtual = TEMAS.find((t) => t.id === grupo.tema) ?? TEMAS[0];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
        <Settings className="text-brand-600" />
        Gerenciar
      </h1>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Resumo
          rotulo="Confirmados"
          valor={`${confirmados.length}`}
          detalhe={pendentes > 0 ? `${pendentes} sem responder` : 'Todos responderam'}
        />
        <Resumo rotulo="Pessoas na casa" valor={`${pessoasNaCasa}`} detalhe="com acompanhantes" />
        <Resumo
          rotulo="Arrecadado"
          valor={brl(totalArrecadado)}
          detalhe={totalDevido > 0 ? `${Math.round((totalArrecadado / totalDevido) * 100)}% de ${brl(totalDevido)}` : undefined}
        />
        <Resumo
          rotulo="Votação"
          valor={emVotacao ? `${grupo.votos?.length ?? 0}/${confirmados.length}` : grupo.imovelEscolhido ? 'Encerrada' : '—'}
          detalhe={emVotacao ? 'já votaram' : grupo.imovelEscolhido?.nome}
        />
      </div>

      {/* Sub-abas */}
      <div className="flex p-1 bg-white rounded-xl shadow">
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`relative flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
              aba === a.id ? 'text-white' : 'text-gray-600 hover:text-brand-700'
            }`}
          >
            {aba === a.id && (
              <motion.span
                layoutId="gerenciar-aba"
                className="absolute inset-0 rounded-lg bg-brand-600"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{a.label}</span>
          </button>
        ))}
      </div>

      {aba === 'participantes' && (
        <section className="space-y-4">
          {pendentes > 0 && (
            <button
              onClick={() => setFiltro('PENDENTE')}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left"
            >
              <BellRing className="text-amber-600 shrink-0" size={20} />
              <span className="text-sm text-amber-900">
                <strong>{pendentes} {pendentes === 1 ? 'parente ainda não respondeu' : 'parentes ainda não responderam'}.</strong>{' '}
                Mande o link pessoal pelo WhatsApp para confirmarem.
              </span>
            </button>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou telefone"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-semibold"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Adicionar</span>
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                  filtro === f.id
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                }`}
              >
                {f.label} <span className="opacity-70">{contagem(f.id)}</span>
              </button>
            ))}
          </div>

          {visiveis.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow text-gray-500">
              {participantes.length === 0 ? (
                <>
                  <Users className="mx-auto mb-2 text-brand-300" size={32} />
                  Ninguém na lista ainda. Toque em Adicionar para começar.
                </>
              ) : (
                'Ninguém encontrado com esse filtro.'
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visiveis.map((p) => (
                <ParticipantCard
                  key={p.id}
                  id={p.id}
                  nome={p.nomeParticipante ?? ''}
                  telefone={p.telefoneParticipante ?? ''}
                  status={p.statusParticipacao ?? 'PENDENTE'}
                  valorIndividual={p.valorIndividual}
                  valorPago={p.valorPago ?? 0}
                  acompanhantes={totalAcompanhantes(p)}
                  onClick={() => setEditingParticipant(p)}
                >
                  <LinkPessoal
                    grupoId={grupoId}
                    grupoNome={grupo.nome}
                    participanteId={p.id}
                    nome={p.nomeParticipante ?? ''}
                    telefone={p.telefoneParticipante ?? ''}
                  />
                </ParticipantCard>
              ))}
            </div>
          )}
        </section>
      )}

      {aba === 'pagamentos' && (
        <section>
          <PaymentHistoryTable
            participantes={participantes.map((p) => ({
              id: p.id,
              nomeParticipante: p.nomeParticipante,
              statusParticipacao: p.statusParticipacao,
              valorIndividual: p.valorIndividual,
              valorPago: p.valorPago ?? 0,
            }))}
            pagamentos={pagamentos}
            isOrganizer
            anoReferencia={grupo.dataEvento ? new Date(grupo.dataEvento).getUTCFullYear() : undefined}
            onAddPayment={() => setShowAddPaymentModal(true)}
            onDeletePayment={handleDeletePayment}
          />
        </section>
      )}

      {aba === 'evento' && (
        <section className="space-y-3">
          <div className="bg-white rounded-2xl p-5 shadow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Evento</p>
                <p className="text-lg font-bold text-gray-800">{grupo.nome}</p>
              </div>
              {grupo.statusGrupo !== 'FECHADO' && (
                <button
                  onClick={() => setShowEditGroupModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-brand-100 hover:bg-brand-200 text-brand-700 rounded-xl font-semibold text-sm transition-colors"
                >
                  <Pencil size={16} />
                  Editar
                </button>
              )}
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center gap-3 text-gray-700">
                <CalendarDays size={18} className="text-brand-600 shrink-0" />
                {formatarDataEvento(grupo.dataEvento, grupo.dataTermino)}
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <Wallet size={18} className="text-brand-600 shrink-0" />
                Orçamento total de {brl(grupo.orcamentoMaximoPorPessoa)}
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <Palette size={18} className="text-brand-600 shrink-0" />
                Tema {temaAtual.emoji} {temaAtual.nome}
              </li>
              <li
                className={`flex items-start gap-3 font-semibold ${
                  pixConfigurado(grupo.pix) ? 'text-green-700' : 'text-amber-700'
                }`}
              >
                <span className="shrink-0 w-[18px] text-center">⚡</span>
                {pixConfigurado(grupo.pix)
                  ? `Pix: ${grupo.pix.chave} (${grupo.pix.nome}) ✓`
                  : 'Pix não cadastrado: toque em Editar para a família poder pagar pelo app'}
              </li>
            </ul>
          </div>

          <Link
            href="/imoveis/cadastrar"
            className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-brand-200 text-brand-700 font-semibold hover:bg-brand-50 transition-colors"
          >
            <Building2 size={18} />
            Cadastrar novo local
          </Link>
        </section>
      )}

      <AddParticipantModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddParticipant}
      />
      <AddPaymentModal
        isOpen={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        onSave={handleAddPayment}
        participantes={participantes.map((p) => ({ id: p.id, nomeParticipante: p.nomeParticipante }))}
      />
      <EditParticipantModal
        isOpen={!!editingParticipant}
        onClose={() => setEditingParticipant(null)}
        onSave={handleEditParticipant}
        participant={editingParticipant}
      />
      <EditGroupModal
        isOpen={showEditGroupModal}
        onClose={() => setShowEditGroupModal(false)}
        onSave={handleEditGroup}
        group={grupoParaEditar}
      />
    </div>
  );
}
