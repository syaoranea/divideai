'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Receipt, Wallet, Eye } from 'lucide-react';
import { useGrupo, brl, type Participante } from '@/lib/grupo-context';
import { gerarPixCopiaECola, pixConfigurado, TIPOS_CHAVE_PIX } from '@/lib/pix';

/** Quantos pagamentos mensais ainda cabem até o mês do evento (inclui o mês atual) */
function mesesAteEvento(dataIso: string) {
  const evento = new Date(dataIso);
  const hoje = new Date();
  const meses =
    (evento.getUTCFullYear() - hoje.getFullYear()) * 12 + (evento.getUTCMonth() - hoje.getMonth());
  return Math.max(meses, 1);
}

const dataCurta = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(iso)
  );

function Anel({ progresso }: { progresso: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90" aria-hidden>
      <circle cx="60" cy="60" r={r} strokeWidth="12" className="fill-none stroke-brand-100" />
      <motion.circle
        cx="60"
        cy="60"
        r={r}
        strokeWidth="12"
        strokeLinecap="round"
        className="fill-none stroke-brand-500"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - progresso) }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  );
}

export default function PagarPage() {
  const { grupo, pagamentos, myParticipant, isOrganizer, confirmados } = useGrupo();
  const [visualizandoId, setVisualizandoId] = useState('');
  const [opcao, setOpcao] = useState<'tudo' | 'mes' | 'outro'>('mes');
  const [outroValor, setOutroValor] = useState('');
  const [copiado, setCopiado] = useState(false);

  // Organizador que não está na lista pode ver a tela como qualquer participante
  const participante: Participante | undefined =
    myParticipant ?? confirmados.find((p) => p.id === visualizandoId);

  const meusPagamentos = useMemo(
    () =>
      pagamentos
        .filter((p) => p.participanteId === participante?.id)
        .sort((a, b) => (a.dataPagamento < b.dataPagamento ? 1 : -1)),
    [pagamentos, participante?.id]
  );

  if (!grupo) return null;

  const titulo = (
    <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
      <Wallet className="text-brand-600" /> Minha parte
    </h1>
  );

  if (!participante) {
    return (
      <div className="space-y-4">
        {titulo}
        <div className="bg-white rounded-2xl p-6 shadow">
          {isOrganizer ? (
            <>
              <p className="font-semibold text-gray-800 flex items-center gap-2">
                <Eye size={18} className="text-brand-600" /> Ver como um participante
              </p>
              <p className="text-sm text-gray-500 mt-1 mb-3">
                Você não está na lista. Escolha alguém para ver esta tela como essa pessoa vê.
              </p>
              <select
                value={visualizandoId}
                onChange={(e) => setVisualizandoId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white"
              >
                <option value="">Escolha um participante…</option>
                {confirmados.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nomeParticipante}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <p className="text-gray-600">Não encontramos você na lista deste grupo.</p>
          )}
        </div>
      </div>
    );
  }

  if (participante.statusParticipacao !== 'CONFIRMADO' || participante.valorIndividual == null) {
    return (
      <div className="space-y-4">
        {titulo}
        <div className="bg-white rounded-2xl p-6 shadow text-center">
          <p className="font-semibold text-gray-800">
            {participante.statusParticipacao === 'RECUSADO'
              ? 'Você não está participando deste evento.'
              : 'Confirme sua presença no Início para ver quanto é a sua parte.'}
          </p>
        </div>
      </div>
    );
  }

  const parte = participante.valorIndividual ?? 0;
  const pago = participante.valorPago ?? 0;
  const falta = Math.max(Math.round((parte - pago) * 100) / 100, 0);
  const progresso = parte > 0 ? Math.min(pago / parte, 1) : 0;
  const meses = grupo.dataEvento ? mesesAteEvento(grupo.dataEvento) : 1;
  const porMes = Math.min(Math.ceil((falta / meses) * 100) / 100, falta);
  const somaRegistrada = meusPagamentos.reduce((s, p) => s + (p.valor ?? 0), 0);
  const semRegistro = Math.round((pago - somaRegistrada) * 100) / 100;

  const valorPix =
    opcao === 'tudo' ? falta : opcao === 'mes' ? porMes : Math.max(parseFloat(outroValor.replace(',', '.')) || 0, 0);
  const pix = pixConfigurado(grupo.pix)
    ? gerarPixCopiaECola(grupo.pix, valorPix, grupo.nome)
    : null;

  const copiar = async () => {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix);
    } catch {
      // navegadores antigos: seleciona o texto para copiar na mão
      const area = document.getElementById('pix-codigo') as HTMLTextAreaElement | null;
      area?.select();
      document.execCommand('copy');
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="space-y-5">
      {titulo}

      {!myParticipant && (
        <p className="text-sm bg-brand-50 text-brand-800 rounded-xl px-4 py-2">
          Vendo como <strong>{participante.nomeParticipante}</strong>.{' '}
          <button onClick={() => setVisualizandoId('')} className="underline">
            Trocar
          </button>
        </p>
      )}

      {/* Saldo */}
      <section className="bg-white rounded-2xl p-5 shadow flex items-center gap-5">
        <div className="relative shrink-0">
          <Anel progresso={progresso} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-gray-800">{Math.round(progresso * 100)}%</span>
            <span className="text-[11px] text-gray-500">pago</span>
          </div>
        </div>
        <div className="min-w-0">
          {falta === 0 ? (
            <motion.p
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-2xl font-extrabold text-green-600"
            >
              Tudo pago! 🎉
            </motion.p>
          ) : (
            <>
              <p className="text-sm text-gray-500">Falta pagar</p>
              <p className="text-3xl font-extrabold text-gray-800">{brl(falta)}</p>
            </>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {brl(pago)} de {brl(parte)}
          </p>
          {falta > 0 && meses > 1 && (
            <p className="text-xs text-brand-700 font-semibold mt-2">
              Dá {meses}x de {brl(porMes)} até o evento
            </p>
          )}
        </div>
      </section>

      {/* Pix */}
      {falta > 0 && (
        <section className="bg-white rounded-2xl p-5 shadow">
          <p className="font-extrabold text-gray-800 mb-3">Pagar com Pix</p>

          {!pix ? (
            <p className="text-sm text-gray-600">
              Quem organiza ainda não cadastrou a chave Pix. Enquanto isso, combine direto com essa pessoa.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {(
                  [
                    ['mes', meses > 1 ? 'Parcela' : 'Tudo', porMes],
                    ['tudo', 'Tudo', falta],
                    ['outro', 'Outro', null],
                  ] as const
                )
                  .filter(([id]) => meses > 1 || id !== 'tudo')
                  .map(([id, rotulo, valor]) => (
                    <button
                      key={id}
                      onClick={() => setOpcao(id)}
                      className={`rounded-xl border-2 px-2 py-2 text-center transition-colors ${
                        opcao === id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                      }`}
                    >
                      <span className="block text-xs text-gray-500">{rotulo}</span>
                      <span className="block font-bold text-gray-800 text-sm">
                        {valor === null ? 'R$ …' : brl(valor)}
                      </span>
                    </button>
                  ))}
              </div>

              <AnimatePresence>
                {opcao === 'outro' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <input
                      inputMode="decimal"
                      value={outroValor}
                      onChange={(e) => setOutroValor(e.target.value)}
                      placeholder="Quanto você quer pagar? Ex.: 100"
                      className="w-full mb-3 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <textarea
                id="pix-codigo"
                readOnly
                value={pix}
                rows={3}
                className="w-full text-xs font-mono text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-3 resize-none"
              />

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={copiar}
                disabled={valorPix <= 0}
                className={`mt-3 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white shadow-md transition-colors disabled:opacity-50 ${
                  copiado ? 'bg-green-600' : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                {copiado ? <Check size={20} /> : <Copy size={20} />}
                {copiado ? 'Copiado!' : `Copiar Pix de ${brl(valorPix)}`}
              </motion.button>

              <AnimatePresence>
                {copiado && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-sm text-center text-gray-600">
                    Agora abra o app do banco → Pix → <strong>Pix Copia e Cola</strong> e cole.
                  </motion.p>
                )}
              </AnimatePresence>

              <p className="mt-3 text-xs text-gray-400 text-center">
                Para {grupo.pix!.nome} · chave {TIPOS_CHAVE_PIX.find((t) => t.id === grupo.pix!.tipo)?.nome.toLowerCase()}{' '}
                {grupo.pix!.chave}
                <br />
                Depois de pagar, avise quem organiza para registrar.
              </p>
            </>
          )}
        </section>
      )}

      {/* Histórico */}
      <section className="bg-white rounded-2xl p-5 shadow">
        <p className="font-extrabold text-gray-800 mb-3 flex items-center gap-2">
          <Receipt size={18} className="text-brand-600" /> Meus pagamentos
        </p>
        {meusPagamentos.length === 0 && semRegistro <= 0 ? (
          <p className="text-sm text-gray-500">Nenhum pagamento registrado ainda.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {meusPagamentos.map((p, i) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">{dataCurta(p.dataPagamento)}</p>
                  {p.observacao && <p className="text-xs text-gray-500">{p.observacao}</p>}
                </div>
                <span className="font-bold text-green-600">+ {brl(p.valor)}</span>
              </motion.li>
            ))}
            {semRegistro > 0 && (
              <li className="flex items-center justify-between py-2.5">
                <p className="text-sm text-gray-500">Pago antes (sem data registrada)</p>
                <span className="font-bold text-green-600">+ {brl(semRegistro)}</span>
              </li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
