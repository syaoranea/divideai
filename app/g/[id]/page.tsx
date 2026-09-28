'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, MapPin, Users } from 'lucide-react';
import { CollectionChart } from '@/components/collection-chart';
import { ContagemRegressiva } from '@/components/contagem-regressiva';
import { ParticulasTema } from '@/components/particulas-tema';
import { ConfirmarPresenca } from '@/components/confirmar-presenca';
import { useGrupo, brl, formatarDataEvento } from '@/lib/grupo-context';
import { emojiDoTema } from '@/lib/temas';

const iniciais = (nome: string) =>
  nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export default function InicioPage() {
  const { grupoId, grupo, tema, myParticipant, confirmados, apiFetch, refresh } = useGrupo();
  if (!grupo) return null;

  const totalDevido = confirmados.reduce((s, p) => s + (p.valorIndividual ?? 0), 0);
  const totalArrecadado = confirmados.reduce((s, p) => s + (p.valorPago ?? 0), 0);
  const minhaParte = myParticipant?.valorIndividual ?? 0;
  const meuPago = myParticipant?.valorPago ?? 0;
  const falta = Math.max(minhaParte - meuPago, 0);
  const pessoasNaCasa = confirmados.reduce(
    (s, p) => s + 1 + (p.acompanhantesAdultos ?? 0) + (p.acompanhantesCriancas ?? 0),
    0
  );
  const emVotacao = grupo.statusGrupo !== 'FECHADO' && (grupo.imoveisEmVotacao?.length ?? 0) > 0;
  const jaVotei = (grupo.votos ?? []).some((v) => v.participanteId === myParticipant?.id);

  const enviarPresenca = async (dados: Record<string, unknown>) => {
    const res = await apiFetch(`/api/grupos/${grupoId}/presenca`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Erro ao salvar');
    await refresh();
  };

  return (
    <div className="space-y-5">
      {/* Evento + contagem */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-800 p-6 text-white shadow-xl"
      >
        <ParticulasTema tema={tema} />
        <span className="absolute -right-4 -top-6 text-[120px] opacity-20 select-none" aria-hidden>
          {emojiDoTema(tema)}
        </span>
        <div className="relative">
          <p className="text-white/80 font-semibold">
            {myParticipant ? `Oi, ${myParticipant.nomeParticipante.split(' ')[0]}!` : 'Bem-vindo!'}
          </p>
          <h1 className="text-3xl font-extrabold leading-tight mt-1">{grupo.nome}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-white/90">
            <span className="flex items-center gap-1">
              <Calendar size={16} />
              {formatarDataEvento(grupo.dataEvento, grupo.dataTermino)}
            </span>
            {grupo.imovelEscolhido && (
              <span className="flex items-center gap-1">
                <MapPin size={16} />
                {grupo.imovelEscolhido.nome}
              </span>
            )}
          </div>
          {grupo.dataEvento && (
            <div className="mt-5">
              <ContagemRegressiva dataEvento={grupo.dataEvento} dataTermino={grupo.dataTermino} />
            </div>
          )}
        </div>
      </motion.section>

      {/* Presença */}
      {myParticipant && <ConfirmarPresenca participante={myParticipant} enviar={enviarPresenca} />}

      {/* Chamada para votar */}
      {emVotacao && myParticipant?.statusParticipacao === 'CONFIRMADO' && !jaVotei && (
        <Link href={`/g/${grupoId}/local`}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 rounded-2xl bg-festa/10 border border-festa/30 p-4"
          >
            <span className="text-2xl">🗳️</span>
            <div className="flex-1">
              <p className="font-extrabold text-gray-800">A votação do local está aberta</p>
              <p className="text-sm text-gray-600">Seu voto ainda não foi. Leva 10 segundos!</p>
            </div>
            <ChevronRight className="text-gray-500" />
          </motion.div>
        </Link>
      )}

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
            <span className="flex items-center gap-1 text-sm font-bold text-brand-600">
              {falta > 0 && 'Pagar'} <ChevronRight size={18} />
            </span>
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

      {/* Quem vem */}
      {confirmados.length > 0 && (
        <section className="bg-white rounded-2xl p-5 shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="font-extrabold text-gray-800 flex items-center gap-2">
              <Users size={18} className="text-brand-600" />
              Quem vem
            </p>
            <span className="text-sm font-semibold text-brand-700">
              {pessoasNaCasa} {pessoasNaCasa === 1 ? 'pessoa' : 'pessoas'} na casa
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {confirmados.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 20 }}
                title={p.nomeParticipante}
                className={`relative w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${
                  p.id === myParticipant?.id
                    ? 'bg-brand-600 text-white ring-2 ring-brand-300'
                    : 'bg-brand-100 text-brand-800'
                }`}
              >
                {iniciais(p.nomeParticipante)}
                {(p.acompanhantesAdultos ?? 0) + (p.acompanhantesCriancas ?? 0) > 0 && (
                  <span className="absolute -bottom-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-festa text-white text-[10px] flex items-center justify-center">
                    +{(p.acompanhantesAdultos ?? 0) + (p.acompanhantesCriancas ?? 0)}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </section>
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
