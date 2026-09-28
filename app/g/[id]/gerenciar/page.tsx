'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Plus, Pencil, Building2, Settings } from 'lucide-react';
import { ParticipantCard } from '@/components/participant-card';
import { AddParticipantModal } from '@/components/add-participant-modal';
import { EditParticipantModal } from '@/components/edit-participant-modal';
import { EditGroupModal } from '@/components/edit-group-modal';
import { AddPaymentModal } from '@/components/add-payment-modal';
import { PaymentHistoryTable } from '@/components/payment-history-table';
import { LinkPessoal } from '@/components/link-pessoal';
import { useGrupo, formatarDataEvento, brl, type Participante } from '@/lib/grupo-context';

export default function GerenciarPage() {
  const router = useRouter();
  const { grupoId, grupo, pagamentos, isOrganizer, refresh, refreshPagamentos } = useGrupo();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participante | null>(null);

  useEffect(() => {
    if (grupo && !isOrganizer) router.replace(`/g/${grupoId}`);
  }, [grupo, isOrganizer, grupoId, router]);

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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
        <Settings className="text-brand-600" />
        Gerenciar
      </h1>

      {/* Evento */}
      <section className="bg-white rounded-2xl p-5 shadow flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Evento</p>
          <p className="text-lg font-bold text-gray-800">{grupo.nome}</p>
          <p className="text-sm text-gray-600">
            {formatarDataEvento(grupo.dataEvento, grupo.dataTermino)} · Orçamento{' '}
            {brl(grupo.orcamentoMaximoPorPessoa)}
          </p>
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
      </section>

      {/* Participantes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-brand-600" />
            Participantes ({participantes.length})
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-semibold"
          >
            <Plus size={18} />
            Adicionar
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {participantes.map((p) => (
            <ParticipantCard
              key={p.id}
              id={p.id}
              nome={p.nomeParticipante ?? ''}
              telefone={p.telefoneParticipante ?? ''}
              status={p.statusParticipacao ?? 'PENDENTE'}
              valorIndividual={p.valorIndividual}
              valorPago={p.valorPago ?? 0}
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
      </section>

      {/* Pagamentos */}
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

      <Link
        href="/imoveis/cadastrar"
        className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-brand-200 text-brand-700 font-semibold hover:bg-brand-50 transition-colors"
      >
        <Building2 size={18} />
        Cadastrar novo local
      </Link>

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
        group={{
          nome: grupo.nome,
          dataEvento: grupo.dataEvento,
          dataTermino: grupo.dataTermino,
          orcamentoMaximoPorPessoa: grupo.orcamentoMaximoPorPessoa,
          tema: grupo.tema,
        }}
      />
    </div>
  );
}
