'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  AnimatePresence, animate, motion, useMotionValue, useTransform, type PanInfo,
} from 'framer-motion';
import { Heart, X, Users, ExternalLink, Home, RotateCcw, Check } from 'lucide-react';
import { brl, type ImovelEmVotacao } from '@/lib/grupo-context';

interface VotacaoDeckProps {
  opcoes: ImovelEmVotacao[];
  numConfirmados: number;
  voteCounts: Record<string, number>;
  totalVotos: number;
  meuVotoId?: string;
  podeVotar: boolean;
  onVotar: (imovelId: string) => Promise<void>;
}

const LIMITE_ARRASTE = 110;

function Foto({ url, nome }: { url: string; nome: string }) {
  const [erro, setErro] = useState(false);
  return url && !erro ? (
    <Image src={url} alt={nome} fill className="object-cover pointer-events-none" draggable={false} onError={() => setErro(true)} />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200">
      <Home size={56} className="text-brand-400" />
    </div>
  );
}

function comodidadesDe(valor: string) {
  try {
    const lista = JSON.parse(valor ?? '[]');
    return Array.isArray(lista) ? (lista as string[]) : [];
  } catch {
    return [];
  }
}

function Carta({
  opcao,
  numConfirmados,
  topo,
  onDecidir,
}: {
  opcao: ImovelEmVotacao;
  numConfirmados: number;
  topo: boolean;
  onDecidir: (direcao: 'quero' | 'proximo') => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-14, 14]);
  const opacQuero = useTransform(x, [30, LIMITE_ARRASTE], [0, 1]);
  const opacProximo = useTransform(x, [-LIMITE_ARRASTE, -30], [1, 0]);
  const imovel = opcao.imovel;
  const porPessoa = numConfirmados > 0 ? imovel.precoTotalDiaria / numConfirmados : imovel.precoTotalDiaria;

  const soltar = (_: unknown, info: PanInfo) => {
    const alcance = info.offset.x + info.velocity.x * 0.2;
    if (Math.abs(alcance) > LIMITE_ARRASTE) {
      const direita = alcance > 0;
      animate(x, direita ? 600 : -600, { duration: 0.25 }).then(() =>
        onDecidir(direita ? 'quero' : 'proximo')
      );
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
    }
  };

  return (
    <motion.div
      className="absolute inset-0 rounded-3xl bg-white shadow-xl overflow-hidden touch-none select-none"
      style={{ x, rotate }}
      drag={topo ? 'x' : false}
      dragSnapToOrigin={false}
      onDragEnd={soltar}
      initial={topo ? { scale: 0.95, opacity: 0 } : false}
      animate={topo ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.94, y: 14, opacity: 1 }}
      exit={{ x: 0, opacity: 0 }}
      whileDrag={{ cursor: 'grabbing' }}
    >
      <div className="relative h-[55%] bg-gray-200">
        <Foto url={imovel.imagemUrl} nome={imovel.nome} />
        <motion.span
          style={{ opacity: opacQuero }}
          className="absolute top-5 left-5 -rotate-12 rounded-xl border-4 border-green-500 px-3 py-1 text-2xl font-black text-green-500 bg-white/80"
        >
          QUERO!
        </motion.span>
        <motion.span
          style={{ opacity: opacProximo }}
          className="absolute top-5 right-5 rotate-12 rounded-xl border-4 border-gray-500 px-3 py-1 text-2xl font-black text-gray-600 bg-white/80"
        >
          PRÓXIMO
        </motion.span>
      </div>
      <div className="p-5 flex flex-col h-[45%]">
        <h3 className="text-xl font-extrabold text-gray-800 leading-tight">{imovel.nome}</h3>
        {imovel.localizacao && <p className="text-sm text-brand-700 font-semibold">{imovel.localizacao}</p>}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-brand-600">{brl(porPessoa)}</span>
          <span className="text-sm text-gray-500">por pessoa</span>
        </div>
        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
          <Users size={14} /> Até {imovel.capacidadeMaxima} pessoas · total {brl(imovel.precoTotalDiaria)}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5 overflow-hidden max-h-14">
          {comodidadesDe(imovel.comodidades).slice(0, 5).map((c) => (
            <span key={c} className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
              {c}
            </span>
          ))}
        </div>
        {imovel.linkReserva && (
          <a
            href={imovel.linkReserva}
            target="_blank"
            rel="noopener noreferrer"
            onPointerDown={(e) => e.stopPropagation()}
            className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"
          >
            <ExternalLink size={14} /> Ver fotos e detalhes
          </a>
        )}
      </div>
    </motion.div>
  );
}

function Resultado({
  opcoes,
  voteCounts,
  totalVotos,
  numConfirmados,
  meuVotoId,
}: Pick<VotacaoDeckProps, 'opcoes' | 'voteCounts' | 'totalVotos' | 'numConfirmados' | 'meuVotoId'>) {
  const ordenadas = [...opcoes].sort((a, b) => (voteCounts[b.imovelId] ?? 0) - (voteCounts[a.imovelId] ?? 0));
  return (
    <div className="space-y-3">
      {ordenadas.map((o, i) => {
        const votos = voteCounts[o.imovelId] ?? 0;
        const pct = totalVotos > 0 ? votos / totalVotos : 0;
        const meu = o.imovelId === meuVotoId;
        return (
          <div key={o.id} className={`bg-white rounded-2xl p-4 shadow ${meu ? 'ring-2 ring-brand-500' : ''}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-gray-800 truncate">
                {i === 0 && votos > 0 ? '🏆 ' : ''}
                {o.imovel.nome}
              </p>
              <span className="text-sm font-bold text-gray-700 shrink-0">
                {votos} {votos === 1 ? 'voto' : 'votos'}
              </span>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-brand-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct * 100}%` }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.08 }}
                className="h-full rounded-full bg-brand-500"
              />
            </div>
            {meu && (
              <p className="mt-2 text-xs font-bold text-brand-700 flex items-center gap-1">
                <Check size={14} /> Seu voto
              </p>
            )}
          </div>
        );
      })}
      <p className="text-sm text-gray-600 text-center">
        {totalVotos} de {numConfirmados} confirmados já votaram
      </p>
    </div>
  );
}

export function VotacaoDeck(props: VotacaoDeckProps) {
  const { opcoes, numConfirmados, meuVotoId, podeVotar, onVotar } = props;
  const [indice, setIndice] = useState(0);
  const [mudando, setMudando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [recemVotado, setRecemVotado] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [erro, setErro] = useState('');

  if (!podeVotar || (meuVotoId && !mudando)) {
    return (
      <div className="space-y-4">
        <AnimatePresence>
          {recemVotado && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-green-50 border border-green-200 p-4 text-center"
            >
              <p className="text-lg font-extrabold text-green-700">Voto registrado! 🎉</p>
              <p className="text-sm text-green-800">Agora é torcer.</p>
            </motion.div>
          )}
        </AnimatePresence>
        <Resultado {...props} />
        {podeVotar && meuVotoId && (
          <button
            onClick={() => {
              setMudando(true);
              setRecemVotado(false);
              setIndice(0);
            }}
            className="mx-auto flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline"
          >
            <RotateCcw size={16} /> Mudar meu voto
          </button>
        )}
      </div>
    );
  }

  const atual = opcoes[indice % opcoes.length];
  const proxima = opcoes.length > 1 ? opcoes[(indice + 1) % opcoes.length] : null;

  const decidir = async (direcao: 'quero' | 'proximo') => {
    if (enviando) return;
    if (direcao === 'proximo') {
      setIndice((i) => i + 1);
      return;
    }
    setEnviando(true);
    setErro('');
    try {
      await onVotar(atual.imovelId);
      setMudando(false);
      setRecemVotado(true);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível registrar o voto');
      setTentativa((t) => t + 1); // remonta o card para ele voltar ao centro
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-600 text-center mb-3">
        Arraste para a <strong>direita</strong> no que você quer, ou para a <strong>esquerda</strong> para ver o próximo.
        <span className="block text-xs text-gray-400 mt-0.5">
          Opção {(indice % opcoes.length) + 1} de {opcoes.length}
        </span>
      </p>

      <div className="relative mx-auto h-[clamp(340px,calc(100dvh_-_370px),460px)] max-w-sm">
        <AnimatePresence initial={false}>
          {proxima && (
            <Carta key={`${proxima.id}-${indice + 1}-fundo`} opcao={proxima} numConfirmados={numConfirmados} topo={false} onDecidir={() => {}} />
          )}
          <Carta key={`${atual.id}-${indice}-${tentativa}`} opcao={atual} numConfirmados={numConfirmados} topo onDecidir={decidir} />
        </AnimatePresence>
      </div>

      <div className="mt-5 flex items-center justify-center gap-8">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => decidir('proximo')}
          disabled={enviando || opcoes.length < 2}
          aria-label="Ver o próximo"
          className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-500 disabled:opacity-40"
        >
          <X size={30} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => decidir('quero')}
          disabled={enviando}
          aria-label="Quero esse"
          className="w-20 h-20 rounded-full bg-brand-600 shadow-xl flex items-center justify-center text-white disabled:opacity-60"
        >
          <Heart size={36} fill="currentColor" />
        </motion.button>
      </div>

      {erro && <p className="mt-3 text-center text-sm text-red-600">{erro}</p>}

      {mudando && (
        <button
          onClick={() => setMudando(false)}
          className="mt-4 mx-auto block text-sm text-gray-500 hover:underline"
        >
          Cancelar e manter meu voto
        </button>
      )}
    </div>
  );
}
