'use client';

import { Check } from 'lucide-react';
import { TEMAS, type Tema } from '@/lib/temas';

interface TemaPickerProps {
  value: Tema;
  onChange: (tema: Tema) => void;
}

/** Cada opção se pinta com o próprio tema (data-tema), então a prévia é real */
export function TemaPicker({ value, onChange }: TemaPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {TEMAS.map((t) => {
        const ativo = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            data-tema={t.id}
            onClick={() => onChange(t.id)}
            aria-pressed={ativo}
            className={`relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
              ativo
                ? 'border-brand-500 bg-brand-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-brand-300'
            }`}
          >
            <span className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-xl">
              {t.emoji}
            </span>
            <span className="min-w-0">
              <span className="block font-bold text-gray-800 leading-tight">{t.nome}</span>
              <span className="block text-xs text-gray-500 truncate">{t.descricao}</span>
            </span>
            {ativo && (
              <Check size={16} className="absolute top-2 right-2 text-brand-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}
