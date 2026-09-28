'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Tema } from '@/lib/temas';

const ESTILO: Record<Tema, { simbolos: string[]; quantidade: number } | null> = {
  casa: null,
  natal: { simbolos: ['❄', '❅', '•'], quantidade: 18 },
  reveillon: { simbolos: ['✦', '✧', '·'], quantidade: 16 },
  aniversario: { simbolos: ['●', '■', '▲'], quantidade: 16 },
};

const CORES_CONFETE = ['#fde68a', '#f9a8d4', '#a5b4fc', '#6ee7b7', '#ffffff'];

/** Neve, brilhos ou confete caindo atrás do conteúdo do card, conforme o tema */
export function ParticulasTema({ tema }: { tema: Tema }) {
  const reduzir = useReducedMotion();
  const estilo = ESTILO[tema];

  const particulas = useMemo(() => {
    if (!estilo) return [];
    return Array.from({ length: estilo.quantidade }, (_, i) => ({
      id: i,
      simbolo: estilo.simbolos[i % estilo.simbolos.length],
      esquerda: (i * 37) % 100,
      tamanho: 8 + ((i * 7) % 10),
      duracao: 6 + ((i * 13) % 7),
      atraso: -((i * 11) % 9),
      deriva: ((i % 5) - 2) * 12,
      cor: tema === 'aniversario' ? CORES_CONFETE[i % CORES_CONFETE.length] : 'rgba(255,255,255,0.85)',
    }));
  }, [estilo, tema]);

  if (!estilo || reduzir) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particulas.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 select-none"
          style={{ left: `${p.esquerda}%`, fontSize: p.tamanho, color: p.cor }}
          initial={{ y: '-10%' }}
          animate={{ y: ['-10%', '110%'], x: [0, p.deriva, 0], rotate: tema === 'natal' ? 0 : [0, 360] }}
          transition={{ duration: p.duracao, delay: p.atraso, repeat: Infinity, ease: 'linear' }}
        >
          {p.simbolo}
        </motion.span>
      ))}
    </div>
  );
}
