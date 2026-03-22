'use client';

import { Check, Clock, X, User, Phone, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface ParticipantCardProps {
  id: string;
  nome: string;
  telefone: string;
  status: 'CONFIRMADO' | 'PENDENTE' | 'RECUSADO';
  valorIndividual?: number | null;
  valorPago?: number;
  onClick?: () => void;
  showValue?: boolean;
}

export function ParticipantCard({
  id,
  nome,
  telefone,
  status,
  valorIndividual,
  valorPago = 0,
  onClick,
  showValue = true,
}: ParticipantCardProps) {
  const statusConfig = {
    CONFIRMADO: {
      icon: Check,
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      label: 'Confirmado',
    },
    PENDENTE: {
      icon: Clock,
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-300',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      label: 'Pendente',
    },
    RECUSADO: {
      icon: X,
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      label: 'Recusado',
    },
  };

  const config = statusConfig[status] ?? statusConfig.PENDENTE;
  const StatusIcon = config.icon;
  const saldoRestante = (valorIndividual ?? 0) - valorPago;
  const quitado = status === 'CONFIRMADO' && valorIndividual != null && saldoRestante <= 0 && valorPago > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onClick?.()}
      className={`p-4 rounded-xl border ${config.bgColor} ${config.borderColor} shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center`}>
            <User size={20} className={config.iconColor} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">{nome ?? 'Participante'}</h4>
            {telefone ? (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Phone size={12} />
                {telefone}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
            <StatusIcon size={14} />
            {config.label}
          </span>
        </div>
      </div>

      {showValue && status === 'CONFIRMADO' && valorIndividual != null && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Valor a pagar:</p>
            <span className="font-bold text-emerald-600">R$ {valorIndividual?.toFixed?.(2) ?? '0.00'}</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <DollarSign size={14} className="text-emerald-500" />
              Valor já pago:
            </p>
            <span className={`font-semibold text-sm ${quitado ? 'text-emerald-600' : valorPago > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
              R$ {valorPago.toFixed(2)}
            </span>
          </div>
          {valorPago > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Saldo restante:</p>
              <span className={`text-xs font-bold ${quitado ? 'text-emerald-600' : 'text-orange-600'}`}>
                {quitado ? '✓ Quitado' : `R$ ${saldoRestante.toFixed(2)}`}
              </span>
            </div>
          )}
        </div>
      )}

      {onClick && (
        <div className="mt-2 pt-2 border-t border-gray-200/50 text-center">
          <span className="text-xs text-gray-400">Toque para editar</span>
        </div>
      )}
    </motion.div>
  );
}
