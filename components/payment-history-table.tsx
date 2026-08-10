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
  /** Ano exibido por padrão nas colunas de janeiro a dezembro */
  anoReferencia?: number;
  onAddPayment?: () => void;
  onDeletePayment?: (pagamentoId: string) => Promise<void>;
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** Janeiro a dezembro, sempre as 12 colunas */
const MESES_DO_ANO = Array.from({ length: 12 }, (_, i) => i + 1);

const parseCompetencia = (competencia: string) => {
  const [ano, mes] = (competencia ?? '').split('-').map(Number);
  if (!ano || !mes || mes < 1 || mes > 12) return null;
  return { ano, mes };
};

const formatCompetencia = (competencia: string) => {
  const parsed = parseCompetencia(competencia);
  if (!parsed) return competencia;
  return `${MESES[parsed.mes - 1]}/${String(parsed.ano).slice(2)}`;
};

const formatData = (iso: string) => {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date);
};

const num = (valor: number) => (valor ?? 0).toFixed(2);
const brl = (valor: number) => `R$ ${num(valor)}`;

export function PaymentHistoryTable({
  participantes,
  pagamentos,
  isOrganizer,
  anoReferencia,
  onAddPayment,
  onDeletePayment,
}: PaymentHistoryTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const anosComPagamento = useMemo(() => {
    const set = new Set<number>();
    for (const p of pagamentos ?? []) {
      const parsed = parseCompetencia(p?.competencia);
      if (parsed) set.add(parsed.ano);
    }
    return Array.from(set).sort();
  }, [pagamentos]);

  const anoPadrao =
    anoReferencia ?? anosComPagamento[anosComPagamento.length - 1] ?? new Date().getFullYear();

  const [ano, setAno] = useState(anoPadrao);

  const anosDisponiveis = useMemo(() => {
    const set = new Set<number>([anoPadrao, ano, ...anosComPagamento]);
    return Array.from(set).sort();
  }, [anoPadrao, ano, anosComPagamento]);

  const linhas = useMemo(() => {
    const porParticipante: Record<
      string,
      { meses: Record<number, number>; anosAnteriores: number; anosSeguintes: number }
    > = {};

    for (const p of pagamentos ?? []) {
      if (!p?.participanteId) continue;
      const parsed = parseCompetencia(p?.competencia);
      if (!parsed) continue;

      porParticipante[p.participanteId] = porParticipante[p.participanteId] ?? {
        meses: {},
        anosAnteriores: 0,
        anosSeguintes: 0,
      };
      const alvo = porParticipante[p.participanteId];

      if (parsed.ano === ano) {
        alvo.meses[parsed.mes] = (alvo.meses[parsed.mes] ?? 0) + (p.valor ?? 0);
      } else if (parsed.ano < ano) {
        alvo.anosAnteriores += p.valor ?? 0;
      } else {
        alvo.anosSeguintes += p.valor ?? 0;
      }
    }

    return (participantes ?? []).map((p) => {
      const dados = porParticipante[p.id] ?? { meses: {}, anosAnteriores: 0, anosSeguintes: 0 };
      const totalDoAno = Object.values(dados.meses).reduce((s, v) => s + v, 0);
      const totalLancado = totalDoAno + dados.anosAnteriores + dados.anosSeguintes;
      // Valores registrados direto no cadastro, sem mês de competência
      const semCompetencia = Math.max((p.valorPago ?? 0) - totalLancado, 0);
      const saldoInicial = semCompetencia + dados.anosAnteriores;

      // Cada mês mostra o total pago até ali, partindo do saldo inicial
      const acumulado: Record<number, number> = {};
      let corrente = saldoInicial;
      for (const mes of MESES_DO_ANO) {
        corrente += dados.meses[mes] ?? 0;
        acumulado[mes] = corrente;
      }

      const totalPago = corrente + dados.anosSeguintes;
      const devido = p.valorIndividual ?? 0;

      return {
        ...p,
        meses: dados.meses,
        acumulado,
        saldoInicial,
        anosSeguintes: dados.anosSeguintes,
        totalDoAno,
        totalPago,
        devido,
        saldo: devido - totalPago,
      };
    });
  }, [participantes, pagamentos, ano]);

  const temSaldoInicial = linhas.some((l) => l.saldoInicial > 0);
  const temAnosSeguintes = linhas.some((l) => l.anosSeguintes > 0);

  const totalSaldoInicial = linhas.reduce((s, l) => s + l.saldoInicial, 0);
  const totalAnosSeguintes = linhas.reduce((s, l) => s + l.anosSeguintes, 0);
  const totalPagoGeral = linhas.reduce((s, l) => s + l.totalPago, 0);
  const totalDevidoGeral = linhas.reduce((s, l) => s + l.devido, 0);
  const totalAnoSelecionado = linhas.reduce((s, l) => s + l.totalDoAno, 0);

  /** Rodapé: acumulado do grupo mês a mês e quanto entrou em cada mês */
  const totaisPorMes = useMemo(() => {
    const noMes: Record<number, number> = {};
    const acumulado: Record<number, number> = {};
    let corrente = totalSaldoInicial;
    for (const mes of MESES_DO_ANO) {
      noMes[mes] = linhas.reduce((s, l) => s + (l.meses[mes] ?? 0), 0);
      corrente += noMes[mes];
      acumulado[mes] = corrente;
    }
    return { noMes, acumulado };
  }, [linhas, totalSaldoInicial]);

  const nomePorParticipante = useMemo(() => {
    const mapa: Record<string, string> = {};
    for (const p of participantes ?? []) mapa[p.id] = p.nomeParticipante;
    return mapa;
  }, [participantes]);

  const lancamentos = useMemo(
    () =>
      [...(pagamentos ?? [])].sort((a, b) =>
        (b.dataPagamento ?? '').localeCompare(a.dataPagamento ?? '')
      ),
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

  const celulaMes = 'px-3 py-3 text-right whitespace-nowrap';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <History className="text-emerald-600" />
          Histórico de Pagamentos
        </h2>
        <div className="flex items-center gap-3">
          {anosDisponiveis.length > 1 && (
            <select
              value={ano}
              onChange={(e) => setAno(Number(e.target?.value) || anoPadrao)}
              className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              aria-label="Ano do histórico"
            >
              {anosDisponiveis.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          )}
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
                    <th className="text-left font-semibold px-4 py-3 whitespace-nowrap sticky left-0 bg-gray-50 border-r border-gray-200">
                      Participante
                    </th>
                    {temSaldoInicial && (
                      <th className={`${celulaMes} font-semibold`}>Saldo inicial</th>
                    )}
                    {MESES_DO_ANO.map((mes) => (
                      <th key={mes} className={`${celulaMes} font-semibold`}>
                        {MESES[mes - 1]}
                      </th>
                    ))}
                    {temAnosSeguintes && (
                      <th className={`${celulaMes} font-semibold`}>Anos seguintes</th>
                    )}
                    <th className="text-right font-semibold px-4 py-3 whitespace-nowrap border-l border-gray-200">
                      Total pago
                    </th>
                    <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">
                      Valor devido
                    </th>
                    <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((linha) => (
                    <tr key={linha.id} className="border-t border-gray-100 hover:bg-emerald-50/40">
                      <td className="px-4 py-3 sticky left-0 bg-white border-r border-gray-200">
                        <span className="font-medium text-gray-800">{linha.nomeParticipante}</span>
                        {linha.statusParticipacao !== 'CONFIRMADO' && (
                          <span className="ml-2 text-xs text-gray-400">
                            ({linha.statusParticipacao === 'PENDENTE' ? 'pendente' : 'recusado'})
                          </span>
                        )}
                      </td>
                      {temSaldoInicial && (
                        <td className={`${celulaMes} text-gray-500`}>
                          {linha.saldoInicial > 0 ? num(linha.saldoInicial) : '—'}
                        </td>
                      )}
                      {MESES_DO_ANO.map((mes) => {
                        const noMes = linha.meses[mes] ?? 0;
                        const acumulado = linha.acumulado[mes] ?? 0;
                        return (
                          <td
                            key={mes}
                            title={
                              noMes > 0
                                ? `Pagou ${brl(noMes)} em ${MESES[mes - 1]}/${ano}`
                                : `Nada pago em ${MESES[mes - 1]}/${ano}`
                            }
                            className={`${celulaMes} ${
                              acumulado <= 0
                                ? 'text-gray-300'
                                : noMes > 0
                                ? 'text-emerald-600 font-semibold'
                                : 'text-gray-400'
                            }`}
                          >
                            {acumulado > 0 ? num(acumulado) : '—'}
                          </td>
                        );
                      })}
                      {temAnosSeguintes && (
                        <td className={`${celulaMes} text-gray-500`}>
                          {linha.anosSeguintes > 0 ? num(linha.anosSeguintes) : '—'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 whitespace-nowrap border-l border-gray-200">
                        {brl(linha.totalPago)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                        {linha.valorIndividual != null ? brl(linha.devido) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
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
                    <td className="px-4 py-3 sticky left-0 bg-gray-50 border-r border-gray-200">
                      Total
                    </td>
                    {temSaldoInicial && <td className={celulaMes}>{num(totalSaldoInicial)}</td>}
                    {MESES_DO_ANO.map((mes) => {
                      const acumulado = totaisPorMes.acumulado[mes] ?? 0;
                      const noMes = totaisPorMes.noMes[mes] ?? 0;
                      return (
                        <td
                          key={mes}
                          title={`Entrou ${brl(noMes)} em ${MESES[mes - 1]}/${ano}`}
                          className={`${celulaMes} ${
                            acumulado <= 0 ? 'text-gray-300' : noMes > 0 ? '' : 'text-gray-400'
                          }`}
                        >
                          {acumulado > 0 ? num(acumulado) : '—'}
                        </td>
                      );
                    })}
                    {temAnosSeguintes && <td className={celulaMes}>{num(totalAnosSeguintes)}</td>}
                    <td className="px-4 py-3 text-right text-emerald-700 whitespace-nowrap border-l border-gray-200">
                      {brl(totalPagoGeral)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {brl(totalDevidoGeral)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {totalDevidoGeral - totalPagoGeral <= 0
                        ? 'Quitado ✓'
                        : brl(totalDevidoGeral - totalPagoGeral)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
              <p className="flex items-center gap-1">
                <Info size={13} className="flex-shrink-0" />
                Cada mês mostra o <strong className="font-medium">total acumulado</strong> pago até
                ali, em R$. Em <span className="text-emerald-600 font-semibold">verde</span> os meses
                com pagamento; em cinza o valor apenas se repete. Arrecadado em {ano}:{' '}
                <strong className="font-medium text-gray-700">{brl(totalAnoSelecionado)}</strong>
              </p>
              {temSaldoInicial && (
                <p>
                  <strong className="font-medium">Saldo inicial</strong>: o que já estava pago antes
                  de janeiro de {ano} — valores informados direto no cadastro do participante e
                  pagamentos de anos anteriores. Já está somado nas colunas dos meses.
                </p>
              )}
            </div>
          </div>

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
