'use client';

import Image from 'next/image';
import { Users, Wifi, UtensilsCrossed, Car, Waves, Plus, Check, X, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface PropertyCardProps {
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
  numConfirmados?: number;
  isSelected?: boolean;
  onAddToVoting?: () => void;
  onRemoveFromVoting?: () => void;
  showVotingButtons?: boolean;
  onClick?: () => void;
}

const iconMap: Record<string, any> = {
  'Wi-Fi': Wifi,
  'Wifi': Wifi,
  'Churrasqueira': UtensilsCrossed,
  'Estacionamento': Car,
  'Piscina': Waves,
  'Garagem': Car,
};

export function PropertyCard({
  id,
  nome,
  descricao,
  precoTotalDiaria,
  capacidadeMaxima,
  quartos,
  localizacao,
  comodidades,
  imagemUrl,
  linkReserva,
  numConfirmados = 1,
  isSelected = false,
  onAddToVoting,
  onRemoveFromVoting,
  showVotingButtons = false,
  onClick,
}: PropertyCardProps) {
  const [imgError, setImgError] = useState(false);
  
  let parsedComodidades: string[] = [];
  try {
    parsedComodidades = JSON.parse(comodidades ?? '[]');
  } catch {
    parsedComodidades = [];
  }

  const precoIndividual = (precoTotalDiaria ?? 0) / Math.max(numConfirmados, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-lg overflow-hidden card-hover ${onClick ? 'cursor-pointer' : ''} ${isSelected ? 'ring-4 ring-emerald-500' : ''}`}
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
        {isSelected && (
          <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <Check size={16} />
            Selecionado
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-800">{nome ?? 'Imóvel'}</h3>
          {linkReserva && (
            <a
              href={linkReserva}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
              title="Ver no Airbnb"
            >
              <ExternalLink size={18} />
            </a>
          )}
        </div>
        {localizacao && <p className="text-emerald-700 font-medium text-sm mb-1">{localizacao}</p>}

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{descricao ?? ''}</p>

        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users size={16} className="text-emerald-600" />
            <span>Até {capacidadeMaxima ?? 0} pessoas</span>
          </div>
          {quartos !== undefined && (
            <div className="flex items-center gap-1">
              <span className="font-medium text-emerald-600">{quartos}</span>
              <span>quartos</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {(parsedComodidades ?? []).slice(0, 4).map((comodidade, idx) => {
            const Icon = iconMap[comodidade] ?? Wifi;
            return (
              <span
                key={idx}
                className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs"
              >
                <Icon size={12} />
                {comodidade}
              </span>
            );
          })}
          {(parsedComodidades?.length ?? 0) > 4 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
              +{(parsedComodidades?.length ?? 0) - 4}
            </span>
          )}
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 mb-4">
          <p className="text-3xl font-bold text-emerald-600">
            R$ {precoIndividual?.toFixed?.(2) ?? '0.00'}
            <span className="text-sm font-normal text-gray-500">/pessoa</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Total: R$ {(precoTotalDiaria ?? 0)?.toFixed?.(2)}
          </p>
        </div>

        {showVotingButtons && (
          <div className="flex gap-2">
            {isSelected ? (
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveFromVoting?.(); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors font-medium"
              >
                <X size={18} />
                Remover da Votação
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onAddToVoting?.(); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
              >
                <Plus size={18} />
                Adicionar à Votação
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
