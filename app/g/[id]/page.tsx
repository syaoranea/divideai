'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Users, ChevronRight } from 'lucide-react';
import { CollectionChart } from '@/components/collection-chart';
import { useGrupo, brl, formatarDataEvento } from '@/lib/grupo-context';
import { emojiDoTema } from '@/lib/temas';

function diasAte(dataIso: string) {
  const alvo = new Date(dataIso);
  const hoje = new Date();
  const alvoUTC = Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth(), alvo.getUTCDate());
  const hojeUTC = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((alvoUTC - hojeUTC) / 86_400_000);
}

export default function InicioPage() {
  const { grupoId, grupo, tema, myParticipant, confirmados } = useGrupo();
  if (!grupo) return null;

  const dias = grupo.dataEvento ? diasAte(grupo.dataEvento) : null;
  const totalDevido = confirmados.reduce((s, p) => s + (p.valorIndividual ?? 0), 0);
  const totalArrecadado = confirmados.reduce((s, p) => s + (p.valorPago ?? 0), 0);
  const minhaParte = myParticipant?.valorIndividual ?? 0;
  const meuPago = myParticipant?.valorPago ?? 0;
  const falta = Math.max(minhaParte - meuPago, 0);

  return (
    <div className="space-y-6">
      {/* Evento */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-800 p-6 text-white shadow-xl"
      >
        <span className="absolute -right-4 -top-6 text-[120px] opacity-20 select-none" aria-hidden>
          {emojiDoTema(tema)}
        </span>
        <p className="text-white/80 font-semibold">
          {myParticipant ? `Oi, ${myParticipant.nomeParticipante.split(' ')[0]}!` : 'Bem-vindo!'}
        </p>
        <h1 className="text-3xl font-extrabold leading-tight mt-1">{grupo.nome}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-white/90">
          <span className="flex items-center gap-1">
            <Calendar size={16} />
            {formatarDataEvento(grupo.dataEvento, grupo.dataTermino)}
          </span>
          <span className="flex items-center gap-1">
            <Users size={16} />
            {confirmados.length} confirmados
          </span>
        </div>
        {dias !== null && dias >= 0 && (
          <div className="mt-5 inline-flex items-baseline gap-2 rounded-2xl bg-white/15 px-4 py-2 backdrop-blur">
            <span className="text-4xl font-extrabold tabular-nums">{dias}</span>
            <span className="font-semibold">{dias === 1 ? 'dia para a festa' : dias === 0 ? 'É hoje!' : 'dias para a festa'}</span>
          </div>
        )}
      </motion.section>

      {/* Minha parte */}
      {myParticipant && minhaParte > 0 && (
        <Link
          href={`/g/${grupoId}/pagar`}
          className="block bg-white rounded-2xl p-5 shadow hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Minha parte</p>
              <p className="text-2xl font-extrabold text-gray-800">
                {falta === 0 ? 'Tudo pago ✓' : `Faltam ${brl(falta)}`}
              </p>
            </div>
            <ChevronRight className="text-brand-500" />
          </div>
          <div className="mt-3 h-3 rounded-full bg-brand-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((meuPago / minhaParte) * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-brand-500"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {brl(meuPago)} de {brl(minhaParte)}
          </p>
        </Link>
      )}

      {/* Arrecadação da família */}
      {confirmados.length > 0 && totalDevido > 0 && (
        <CollectionChart
          totalDevido={totalDevido}
          totalArrecadado={totalArrecadado}
          participantes={(grupo.participantes ?? []).map((p) => ({
            nomeParticipante: p.nomeParticipante,
            valorIndividual: p.valorIndividual,
            valorPago: p.valorPago ?? 0,
            statusParticipacao: p.statusParticipacao,
          }))}
        />
      )}
    </div>
  );
}
