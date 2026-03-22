'use client';

import Image from 'next/image';
import { Vote, Check, Users, Waves } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface VotingCardProps {
  id: string;
  nome: string;
  imagemUrl: string;
  precoTotalDiaria: number;
  capacidadeMaxima: number;
  numConfirmados: number;
  votosCount: number;
  hasVoted: boolean;
  isMyVote: boolean;
  onVote?: () => void;
  disabled?: boolean;
}

export function VotingCard({
  id,
  nome,
  imagemUrl,
  precoTotalDiaria,
  capacidadeMaxima,
  numConfirmados,
  votosCount,
  hasVoted,
  isMyVote,
  onVote,
  disabled = false,
}: VotingCardProps) {
  const [imgError, setImgError] = useState(false);
  const precoIndividual = (precoTotalDiaria ?? 0) / Math.max(numConfirmados, 1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all ${
        isMyVote ? 'ring-4 ring-emerald-500' : ''
      }`}
    >
      <div className="relative aspect-video bg-gray-200">
        {imagemUrl && !imgError ? (
          <Image
            src={imagemUrl}
            alt={nome ?? 'Imóvel'}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100">
            <Waves size={48} className="text-emerald-400" />
          </div>
        )}
        
        {/* Vote counter badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-md flex items-center gap-2">
          <Vote size={16} className="text-emerald-600" />
          <span className="font-bold text-emerald-700">{votosCount ?? 0}</span>
          <span className="text-sm text-gray-500">votos</span>
        </div>

        {isMyVote && (
          <div className="absolute top-3 left-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <Check size={14} />
            Meu voto
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-800 mb-3">{nome ?? 'Imóvel'}</h3>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Users size={16} />
            <span className="text-sm">Até {capacidadeMaxima ?? 0}</span>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-emerald-600">
              R$ {precoIndividual?.toFixed?.(2) ?? '0.00'}
            </p>
            <p className="text-xs text-gray-500">por pessoa</p>
          </div>
        </div>

        <button
          onClick={() => onVote?.()}
          disabled={disabled || isMyVote}
          className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
            isMyVote
              ? 'bg-emerald-100 text-emerald-700 cursor-default'
              : disabled
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {isMyVote ? (
            <>
              <Check size={18} />
              Votado
            </>
          ) : (
            <>
              <Vote size={18} />
              Votar
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
