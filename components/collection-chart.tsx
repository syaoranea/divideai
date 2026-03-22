'use client';

import { DollarSign, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface CollectionChartProps {
  totalDevido: number;
  totalArrecadado: number;
  participantes: {
    nomeParticipante: string;
    valorIndividual: number | null;
    valorPago: number;
    statusParticipacao: string;
  }[];
}

export function CollectionChart({ totalDevido, totalArrecadado, participantes }: CollectionChartProps) {
  const porcentagem = totalDevido > 0 ? Math.min((totalArrecadado / totalDevido) * 100, 100) : 0;
  const restante = Math.max(totalDevido - totalArrecadado, 0);

  const confirmados = participantes.filter(p => p.statusParticipacao === 'CONFIRMADO');

  // Colors for the donut segments
  const segments = confirmados.map((p, i) => {
    const pago = p.valorPago ?? 0;
    const devido = p.valorIndividual ?? 0;
    return {
      nome: p.nomeParticipante,
      pago,
      devido,
      porcentagemPaga: devido > 0 ? Math.min((pago / devido) * 100, 100) : 0,
    };
  });

  // SVG donut chart
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 16;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-lg"
    >
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <TrendingUp className="text-emerald-600" size={20} />
        Valor Arrecadado
      </h3>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Donut Chart */}
        <div className="relative flex-shrink-0">
          <svg width="180" height="180" viewBox="0 0 180 180">
            {/* Background circle */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={porcentagem >= 100 ? '#10b981' : porcentagem >= 50 ? '#f59e0b' : '#ef4444'}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * porcentagem) / 100}
              transform="rotate(-90 90 90)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-800">{porcentagem.toFixed(0)}%</span>
            <span className="text-xs text-gray-500">arrecadado</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 w-full space-y-3">
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-700">Arrecadado</span>
            </div>
            <span className="font-bold text-emerald-600">R$ {totalArrecadado.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="text-sm text-gray-700">Restante</span>
            </div>
            <span className="font-bold text-gray-600">R$ {restante.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-blue-500" />
              <span className="text-sm text-gray-700">Total necessário</span>
            </div>
            <span className="font-bold text-blue-600">R$ {totalDevido.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Per-person breakdown */}
      {segments.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-semibold text-gray-600 mb-3">Pagamento por participante</h4>
          <div className="space-y-2">
            {segments.map((seg, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-24 truncate" title={seg.nome}>{seg.nome}</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      seg.porcentagemPaga >= 100 ? 'bg-emerald-500' : seg.porcentagemPaga > 0 ? 'bg-amber-400' : 'bg-gray-200'
                    }`}
                    style={{ width: `${seg.porcentagemPaga}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-500 w-16 text-right">
                  {seg.porcentagemPaga >= 100 ? 'Pago ✓' : `${seg.porcentagemPaga.toFixed(0)}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
