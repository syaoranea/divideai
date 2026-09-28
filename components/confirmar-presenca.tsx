'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Minus, PartyPopper, Plus, X } from 'lucide-react';
import type { Participante } from '@/lib/grupo-context';

interface ConfirmarPresencaProps {
  participante: Participante;
  enviar: (dados: Record<string, unknown>) => Promise<void>;
}

function Contador({
  rotulo,
  valor,
  onChange,
  disabled,
}: {
  rotulo: string;
  valor: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-gray-700">{rotulo}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(valor - 1, 0))}
          disabled={disabled || valor === 0}
          aria-label={`Menos ${rotulo.toLowerCase()}`}
          className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center disabled:opacity-40"
        >
          <Minus size={16} />
        </button>
        <motion.span key={valor} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="w-5 text-center font-extrabold tabular-nums">
          {valor}
        </motion.span>
        <button
          type="button"
          onClick={() => onChange(Math.min(valor + 1, 20))}
          disabled={disabled}
          aria-label={`Mais ${rotulo.toLowerCase()}`}
          className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center disabled:opacity-40"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

export function ConfirmarPresenca({ participante, enviar }: ConfirmarPresencaProps) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const status = participante.statusParticipacao;
  // Estado local para os contadores responderem na hora; salva 600ms depois do último toque
  const [adultos, setAdultos] = useState(participante.acompanhantesAdultos ?? 0);
  const [criancas, setCriancas] = useState(participante.acompanhantesCriancas ?? 0);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setAdultos(participante.acompanhantesAdultos ?? 0);
    setCriancas(participante.acompanhantesCriancas ?? 0);
  }, [participante.acompanhantesAdultos, participante.acompanhantesCriancas]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const mudarAcompanhantes = (novoAdultos: number, novoCriancas: number) => {
    setAdultos(novoAdultos);
    setCriancas(novoCriancas);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setErro('');
      try {
        await enviar({ acompanhantesAdultos: novoAdultos, acompanhantesCriancas: novoCriancas });
      } catch (e: any) {
        setErro(e?.message ?? 'Não foi possível salvar');
      }
    }, 600);
  };

  const salvar = async (dados: Record<string, unknown>) => {
    setErro('');
    setSalvando(true);
    try {
      await enviar(dados);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível salvar');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl p-5 shadow">
      <AnimatePresence mode="wait" initial={false}>
        {status === 'PENDENTE' ? (
          <motion.div key="pergunta" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <p className="text-lg font-extrabold text-gray-800">Você vem? 🥰</p>
            <p className="text-sm text-gray-500">Responda para a gente se organizar.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => salvar({ statusParticipacao: 'CONFIRMADO' })}
                disabled={salvando}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white font-bold shadow-md disabled:opacity-60"
              >
                <Check size={18} /> Vou!
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (confirm('Tem certeza que não vai? Depois só quem organiza consegue mudar.')) {
                    salvar({ statusParticipacao: 'RECUSADO' });
                  }
                }}
                disabled={salvando}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold disabled:opacity-60"
              >
                <X size={18} /> Não vou
              </motion.button>
            </div>
          </motion.div>
        ) : status === 'CONFIRMADO' ? (
          <motion.div key="confirmado" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="flex items-center gap-3">
              <motion.span
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                className="w-11 h-11 rounded-full bg-green-100 text-green-600 flex items-center justify-center"
              >
                <PartyPopper size={22} />
              </motion.span>
              <div>
                <p className="font-extrabold text-gray-800">Presença confirmada!</p>
                <p className="text-sm text-gray-500">Quem vem com você?</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <Contador
                rotulo="Adultos"
                valor={adultos}
                onChange={(v) => mudarAcompanhantes(v, criancas)}
              />
              <Contador
                rotulo="Crianças"
                valor={criancas}
                onChange={(v) => mudarAcompanhantes(adultos, v)}
              />
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Acompanhantes ajudam no planejamento e não mudam o valor da sua parte.
            </p>
          </motion.div>
        ) : (
          <motion.div key="recusado" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="font-extrabold text-gray-800">Que pena que você não vem 💛</p>
            <p className="text-sm text-gray-500">Mudou de ideia? Fale com quem está organizando.</p>
          </motion.div>
        )}
      </AnimatePresence>
      {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}
    </section>
  );
}
