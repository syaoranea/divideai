'use client';

import { useMemo, useState } from 'react';
import { History, Plus, Trash2, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export interface Pagamento {
  id: string;
  participanteId: string;
  valor: number;
  /** YYYY-MM */
  competencia: string;
  dataPagamento: string;
  observacao?: string;
}

interface ParticipanteResumo {
  id: string;
  nomeParticipante: string;
  statusParticipacao: 'CONFIRMADO' | 'PENDENTE' | 'RECUSADO';
  valorIndividual: number | null;
  valorPago: number;
}

interface PaymentHistoryTableProps {
  participantes: ParticipanteResumo[];
  pagamentos: Pagamento[];
  isOrganizer: boolean;
  onAddPayment?: () => void;
  onDeletePayment?: (pagamentoId: string) => Promise<void>;
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const formatCompetencia = (competencia: string) => {
  const [ano, mes] = (competencia ?? '').split('-').map(Number);
  if (!ano || !mes || mes < 1 || mes > 12) return competencia;
  return `${MESES[mes - 1]}/${String(ano).slice(2)}`;
};

const formatData = (iso: string) => {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date);
};

const brl = (valor: number) => `R$ ${(valor ?? 0).toFixed(2)}`;

export function PaymentHistoryTable({
  participantes,
  pagamentos,
  isOrganizer,
  onAddPayment,
  onDeletePayment,
}: PaymentHistoryTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const competencias = useMemo(() => {
    const set = new Set<string>();
    for (const p of pagamentos ?? []) {
      if (p?.competencia) set.add(p.competencia);
    }
    return Array.from(set).sort();
  }, [pagamentos]);

  // valores[participanteId][competencia] = total pago no mês
  const valores = useMemo(() => {
    const mapa: Record<string, Record<string, number>> = {};
    for (const p of pagamentos ?? []) {
      if (!p?.participanteId || !p?.competencia) continue;
      mapa[p.participanteId] = mapa[p.participanteId] ?? {};
      mapa[p.participanteId][p.competencia] =
        (mapa[p.participanteId][p.competencia] ?? 0) + (p.valor ?? 0);
    }
    return mapa;
  }, [pagamentos]);

  const linhas = useMemo(() => {
    return (participantes ?? []).map((p) => {
      const porMes = valores[p.id] ?? {};
      const totalLancado = Object.values(porMes).reduce((s, v) => s + v, 0);
      // Valores registrados direto no cadastro, sem mês de competência
      const anterior = Math.max((p.valorPago ?? 0) - totalLancado, 0);
      const totalPago = totalLancado + anterior;
      const devido = p.valorIndividual ?? 0;

      return {
        ...p,
        porMes,
        anterior,
        totalPago,
        devido,
        saldo: devido - totalPago,
      };
    });
  }, [participantes, valores]);

  const temAnterior = linhas.some((l) => l.anterior > 0);

  const totaisPorMes = useMemo(() => {
    const totais: Record<string, number> = {};
    for (const comp of competencias) {
      totais[comp] = linhas.reduce((s, l) => s + (l.porMes[comp] ?? 0), 0);
    }
    return totais;
  }, [competencias, linhas]);

  const totalAnterior = linhas.reduce((s, l) => s + l.anterior, 0);
  const totalPagoGeral = linhas.reduce((s, l) => s + l.totalPago, 0);
  const totalDevidoGeral = linhas.reduce((s, l) => s + l.devido, 0);

  const nomePorParticipante = useMemo(() => {
    const mapa: Record<string, string> = {};
    for (const p of participantes ?? []) mapa[p.id] = p.nomeParticipante;
    return mapa;
  }, [participantes]);

  const lancamentos = useMemo(
    () => [...(pagamentos ?? [])].sort((a, b) => (b.dataPagamento ?? '').localeCompare(a.dataPagamento ?? '')),
    [pagamentos]
  );

  const handleDelete = async (id: string) => {
    if (!onDeletePayment) return;
    if (!confirm('Excluir este lançamento? O valor será descontado do total pago.')) return;
    setDeletingId(id);
    try {
      await onDeletePayment(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <History className="text-emerald-600" />
          Histórico de Pagamentos
        </h2>
        {isOrganizer && (
          <button
            onClick={() => onAddPayment?.()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <Plus size={18} />
            Registrar pagamento
          </button>
        )}
      </div>

      {(participantes?.length ?? 0) === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
          <p className="text-gray-600">Nenhum participante cadastrado ainda.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="text-left font-semibold px-4 py-3 whitespace-nowrap sticky left-0 bg-gray-50">
                      Participante
                    </th>
                    {temAnterior && (
                      <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">Anterior</th>
                    )}
                    {competencias.map((comp) => (
                      <th key={comp} className="text-right font-semibold px-4 py-3 whitespace-nowrap">
                        {formatCompetencia(comp)}
                      </th>
                    ))}
                    <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">Total pago</th>
                    <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">Valor devido</th>
                    <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((linha) => (
                    <tr key={linha.id} className="border-t border-gray-100 hover:bg-emerald-50/40">
                      <td className="px-4 py-3 sticky left-0 bg-white">
                        <span className="font-medium text-gray-800">{linha.nomeParticipante}</span>
                        {linha.statusParticipacao !== 'CONFIRMADO' && (
                          <span className="ml-2 text-xs text-gray-400">
                            ({linha.statusParticipacao === 'PENDENTE' ? 'pendente' : 'recusado'})
                          </span>
                        )}
                      </td>
                      {temAnterior && (
                        <td className="px-4 py-3 text-right text-gray-500">
                          {linha.anterior > 0 ? brl(linha.anterior) : '—'}
                        </td>
                      )}
                      {competencias.map((comp) => {
                        const valor = linha.porMes[comp] ?? 0;
                        return (
                          <td
                            key={comp}
                            className={`px-4 py-3 text-right ${
                              valor > 0 ? 'text-emerald-600 font-medium' : 'text-gray-300'
                            }`}
                          >
                            {valor > 0 ? brl(valor) : '—'}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        {brl(linha.totalPago)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {linha.valorIndividual != null ? brl(linha.devido) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {linha.valorIndividual == null ? (
                          <span className="text-gray-300">—</span>
                        ) : linha.saldo <= 0 ? (
                          <span className="font-medium text-emerald-600">Quitado ✓</span>
                        ) : (
                          <span className="font-medium text-red-600">{brl(linha.saldo)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-gray-700">
                    <td className="px-4 py-3 sticky left-0 bg-gray-50">Total</td>
                    {temAnterior && (
                      <td className="px-4 py-3 text-right">{brl(totalAnterior)}</td>
                    )}
                    {competencias.map((comp) => (
                      <td key={comp} className="px-4 py-3 text-right">
                        {brl(totaisPorMes[comp] ?? 0)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right text-emerald-700">{brl(totalPagoGeral)}</td>
                    <td className="px-4 py-3 text-right">{brl(totalDevidoGeral)}</td>
                    <td className="px-4 py-3 text-right">
                      {totalDevidoGeral - totalPagoGeral <= 0
                        ? 'Quitado ✓'
                        : brl(totalDevidoGeral - totalPagoGeral)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {competencias.length === 0 && (
              <div className="px-4 py-6 text-center text-gray-500 border-t border-gray-100">
                Nenhum pagamento lançado por mês ainda.
                {isOrganizer && ' Use "Registrar pagamento" para começar o histórico mensal.'}
              </div>
            )}
          </div>

          {temAnterior && (
            <p className="mt-3 text-xs text-gray-500 flex items-start gap-2">
              <Info size={14} className="flex-shrink-0 mt-0.5" />
              A coluna <strong className="font-medium">Anterior</strong> mostra valores informados direto
              no cadastro do participante, sem mês de competência.
            </p>
          )}

          {lancamentos.length > 0 && (
            <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-800 mb-4">Lançamentos ({lancamentos.length})</h3>
              <div className="space-y-2">
                {lancamentos.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {nomePorParticipante[p.participanteId] ?? 'Participante removido'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatData(p.dataPagamento)} · {formatCompetencia(p.competencia)}
                        {p.observacao ? ` · ${p.observacao}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-bold text-emerald-600">{brl(p.valor)}</span>
                      {isOrganizer && (
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Excluir lançamento"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
