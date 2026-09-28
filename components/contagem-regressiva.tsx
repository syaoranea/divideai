'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/** A data do evento vem como meia-noite UTC; a festa começa à meia-noite local daquele dia */
function inicioLocal(dataIso: string) {
  const d = new Date(dataIso);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).getTime();
}

function partes(ms: number) {
  const s = Math.max(Math.floor(ms / 1000), 0);
  return {
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
  };
}

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  const texto = valor.toString().padStart(2, '0');
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-12 w-14 overflow-hidden rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={texto}
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute text-2xl font-extrabold tabular-nums"
          >
            {texto}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/80">
        {rotulo}
      </span>
    </div>
  );
}

export function ContagemRegressiva({ dataEvento, dataTermino }: { dataEvento: string; dataTermino?: string }) {
  const [agora, setAgora] = useState<number | null>(null);

  useEffect(() => {
    setAgora(Date.now());
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (agora === null) return <div className="h-[68px]" />;

  const inicio = inicioLocal(dataEvento);
  const fim = dataTermino ? inicioLocal(dataTermino) + 86_400_000 : inicio + 86_400_000;

  if (agora >= fim) {
    return <p className="text-lg font-bold">Foi lindo! Obrigado por encher a casa 💛</p>;
  }
  if (agora >= inicio) {
    return (
      <motion.p
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ repeat: Infinity, duration: 1.6 }}
        className="text-2xl font-extrabold"
      >
        É hoje! A casa está cheia 🎉
      </motion.p>
    );
  }

  const { dias, horas, minutos, segundos } = partes(inicio - agora);
  return (
    <div className="flex items-end gap-2" aria-label={`Faltam ${dias} dias`}>
      <Numero valor={dias} rotulo={dias === 1 ? 'dia' : 'dias'} />
      <Numero valor={horas} rotulo="horas" />
      <Numero valor={minutos} rotulo="min" />
      <Numero valor={segundos} rotulo="seg" />
    </div>
  );
}
