'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, UtensilsCrossed, X, Sparkles, Loader2 } from 'lucide-react';
import { useGrupo } from '@/lib/grupo-context';
import type { CategoriaCeia, ItemCeia } from '@/lib/services/ceiaService';

const CATEGORIAS: { id: CategoriaCeia; nome: string; emoji: string }[] = [
  { id: 'prato', nome: 'Pratos principais', emoji: '🍗' },
  { id: 'acompanhamento', nome: 'Acompanhamentos', emoji: '🥗' },
  { id: 'sobremesa', nome: 'Sobremesas', emoji: '🍰' },
  { id: 'bebida', nome: 'Bebidas', emoji: '🥤' },
  { id: 'outro', nome: 'Outros', emoji: '🧺' },
];

const SUGESTOES_NATAL: { nome: string; categoria: CategoriaCeia }[] = [
  { nome: 'Peru ou chester', categoria: 'prato' },
  { nome: 'Pernil', categoria: 'prato' },
  { nome: 'Bacalhoada', categoria: 'prato' },
  { nome: 'Arroz à grega', categoria: 'acompanhamento' },
  { nome: 'Farofa', categoria: 'acompanhamento' },
  { nome: 'Salpicão', categoria: 'acompanhamento' },
  { nome: 'Maionese', categoria: 'acompanhamento' },
  { nome: 'Salada', categoria: 'acompanhamento' },
  { nome: 'Rabanada', categoria: 'sobremesa' },
  { nome: 'Pavê', categoria: 'sobremesa' },
  { nome: 'Panetone', categoria: 'sobremesa' },
  { nome: 'Frutas', categoria: 'sobremesa' },
  { nome: 'Refrigerante', categoria: 'bebida' },
  { nome: 'Suco', categoria: 'bebida' },
  { nome: 'Cerveja', categoria: 'bebida' },
  { nome: 'Vinho', categoria: 'bebida' },
  { nome: 'Gelo', categoria: 'outro' },
  { nome: 'Descartáveis (pratos, copos, talheres)', categoria: 'outro' },
];

const SUGESTOES_FESTA: { nome: string; categoria: CategoriaCeia }[] = [
  { nome: 'Carnes para churrasco', categoria: 'prato' },
  { nome: 'Arroz', categoria: 'acompanhamento' },
  { nome: 'Farofa', categoria: 'acompanhamento' },
  { nome: 'Vinagrete', categoria: 'acompanhamento' },
  { nome: 'Pão de alho', categoria: 'acompanhamento' },
  { nome: 'Bolo', categoria: 'sobremesa' },
  { nome: 'Docinhos', categoria: 'sobremesa' },
  { nome: 'Refrigerante', categoria: 'bebida' },
  { nome: 'Cerveja', categoria: 'bebida' },
  { nome: 'Água', categoria: 'bebida' },
  { nome: 'Gelo', categoria: 'outro' },
  { nome: 'Carvão', categoria: 'outro' },
  { nome: 'Descartáveis (pratos, copos, talheres)', categoria: 'outro' },
];

const primeiroNome = (nome?: string) => (nome ?? '').split(' ')[0] || 'Alguém';

export default function CeiaPage() {
  const { grupoId, grupo, tema, isOrganizer, myParticipant, apiFetch } = useGrupo();
  const [itens, setItens] = useState<ItemCeia[] | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [formAberto, setFormAberto] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novaQtd, setNovaQtd] = useState('');
  const [novaCategoria, setNovaCategoria] = useState<CategoriaCeia>('prato');

  const nomes = useMemo(
    () => Object.fromEntries((grupo?.participantes ?? []).map((p) => [p.id, p.nomeParticipante])),
    [grupo?.participantes]
  );
  const participantesAtivos = (grupo?.participantes ?? []).filter((p) => p.statusParticipacao !== 'RECUSADO');

  const carregar = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/grupos/${grupoId}/ceia`);
      if (res.ok) setItens(await res.json());
    } catch (e) {
      console.error('Error loading ceia:', e);
    }
  }, [apiFetch, grupoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const chamar = async (chave: string, url: string, method: string, body?: unknown) => {
    setErro('');
    setOcupado(chave);
    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Algo deu errado');
      await carregar();
      return true;
    } catch (e: any) {
      setErro(e?.message ?? 'Algo deu errado');
      await carregar();
      return false;
    } finally {
      setOcupado(null);
    }
  };

  const base = `/api/grupos/${grupoId}/ceia`;
  const reservar = (item: ItemCeia) => chamar(item.id, `${base}/${item.id}`, 'PATCH', { acao: 'reservar' });
  const liberar = (item: ItemCeia) => chamar(item.id, `${base}/${item.id}`, 'PATCH', { acao: 'liberar' });
  const atribuir = (item: ItemCeia, responsavelId: string) =>
    chamar(item.id, `${base}/${item.id}`, 'PATCH', { responsavelId: responsavelId || null });
  const apagar = (item: ItemCeia) => {
    if (confirm(`Apagar "${item.nome}" da lista?`)) chamar(item.id, `${base}/${item.id}`, 'DELETE');
  };
  const usarSugestoes = () =>
    chamar('sugestoes', base, 'POST', { sugestoes: tema === 'natal' ? SUGESTOES_NATAL : SUGESTOES_FESTA });

  const adicionar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;
    const ok = await chamar('novo', base, 'POST', {
      nome: novoNome,
      quantidade: novaQtd,
      categoria: novaCategoria,
    });
    if (ok) {
      setNovoNome('');
      setNovaQtd('');
      setFormAberto(false);
    }
  };

  if (!grupo) return null;

  const total = itens?.length ?? 0;
  const garantidos = itens?.filter((i) => i.responsavelId).length ?? 0;
  const meus = itens?.filter((i) => myParticipant && i.responsavelId === myParticipant.id) ?? [];
  const podeParticipar = !!myParticipant && myParticipant.statusParticipacao !== 'RECUSADO';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
          <UtensilsCrossed className="text-brand-600" /> Quem leva o quê
        </h1>
        <p className="text-sm text-gray-500">Toque em “Eu levo!” no que você vai trazer.</p>
      </div>

      {itens === null ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-brand-500" size={32} />
        </div>
      ) : (
        <>
          {total > 0 && (
            <section className="bg-white rounded-2xl p-5 shadow">
              <div className="flex items-baseline justify-between">
                <p className="font-extrabold text-gray-800">
                  {garantidos === total ? 'Tudo garantido! 🎉' : `${garantidos} de ${total} garantidos`}
                </p>
                <span className="text-sm font-bold text-brand-700">
                  {Math.round((garantidos / total) * 100)}%
                </span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-brand-100 overflow-hidden">
                <motion.div
                  animate={{ width: `${(garantidos / total) * 100}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full bg-brand-500"
                />
              </div>
              {meus.length > 0 && (
                <p className="mt-3 text-sm text-gray-600">
                  Você leva: <strong className="text-brand-700">{meus.map((i) => i.nome).join(', ')}</strong>
                </p>
              )}
            </section>
          )}

          {erro && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
              {erro}
              <button onClick={() => setErro('')} aria-label="Fechar aviso">
                <X size={16} />
              </button>
            </div>
          )}

          {total === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center shadow">
              <p className="text-4xl mb-2">🍽️</p>
              <p className="font-bold text-gray-800">A lista ainda está vazia</p>
              {isOrganizer ? (
                <>
                  <p className="text-sm text-gray-500 mt-1">Comece com uma lista pronta e ajuste depois.</p>
                  <button
                    onClick={usarSugestoes}
                    disabled={ocupado === 'sugestoes'}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 text-white font-bold shadow-md disabled:opacity-60"
                  >
                    {ocupado === 'sugestoes' ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    Usar lista sugerida {tema === 'natal' ? 'de Natal' : 'de festa'}
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-500 mt-1">Já sabe o que vai levar? Adicione abaixo.</p>
              )}
            </div>
          )}

          {CATEGORIAS.map((cat) => {
            const daCategoria = itens.filter((i) => i.categoria === cat.id);
            if (daCategoria.length === 0) return null;
            return (
              <section key={cat.id}>
                <h2 className="font-extrabold text-gray-700 mb-2">
                  {cat.emoji} {cat.nome}
                </h2>
                <ul className="bg-white rounded-2xl shadow divide-y divide-gray-100 overflow-hidden">
                  <AnimatePresence initial={false}>
                    {daCategoria.map((item) => {
                      const meu = !!myParticipant && item.responsavelId === myParticipant.id;
                      const carregando = ocupado === item.id;
                      return (
                        <motion.li
                          key={item.id}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`px-4 py-3 flex items-center gap-3 transition-colors ${meu ? 'bg-brand-50' : ''}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold truncate ${item.responsavelId && !meu ? 'text-gray-500' : 'text-gray-800'}`}>
                              {item.nome}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {item.quantidade && `${item.quantidade} · `}
                              {meu ? (
                                <span className="font-bold text-brand-700">Você leva ✓</span>
                              ) : item.responsavelId ? (
                                <>{primeiroNome(nomes[item.responsavelId])} leva</>
                              ) : (
                                <span className="text-amber-600 font-semibold">Ninguém ainda</span>
                              )}
                            </p>
                          </div>

                          {isOrganizer && (
                            <select
                              value={item.responsavelId ?? ''}
                              onChange={(e) => atribuir(item, e.target.value)}
                              disabled={carregando}
                              aria-label={`Quem leva ${item.nome}`}
                              className="max-w-[7.5rem] text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                            >
                              <option value="">Ninguém</option>
                              {participantesAtivos.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {primeiroNome(p.nomeParticipante)}
                                </option>
                              ))}
                            </select>
                          )}

                          {!isOrganizer && podeParticipar && !item.responsavelId && (
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => reservar(item)}
                              disabled={!!ocupado}
                              className="shrink-0 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-bold disabled:opacity-60"
                            >
                              {carregando ? <Loader2 size={16} className="animate-spin" /> : 'Eu levo!'}
                            </motion.button>
                          )}

                          {!isOrganizer && meu && (
                            <button
                              onClick={() => liberar(item)}
                              disabled={!!ocupado}
                              className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-sm font-semibold disabled:opacity-60"
                            >
                              {carregando ? <Loader2 size={16} className="animate-spin" /> : 'Desistir'}
                            </button>
                          )}

                          {(isOrganizer || item.criadoPor === myParticipant?.id) && (
                            <button
                              onClick={() => apagar(item)}
                              disabled={!!ocupado}
                              aria-label={`Apagar ${item.nome}`}
                              className="shrink-0 p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-40"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              </section>
            );
          })}

          {(isOrganizer || podeParticipar) && (
            <>
              {formAberto ? (
                <motion.form
                  onSubmit={adicionar}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-5 shadow space-y-3"
                >
                  <p className="font-extrabold text-gray-800">
                    {isOrganizer ? 'Adicionar item à lista' : 'O que você vai levar?'}
                  </p>
                  <input
                    autoFocus
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex.: Torta de limão"
                    maxLength={60}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                  <input
                    value={novaQtd}
                    onChange={(e) => setNovaQtd(e.target.value)}
                    placeholder="Quantidade (opcional). Ex.: 2 kg, 6 latas"
                    maxLength={40}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIAS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setNovaCategoria(c.id)}
                        className={`px-3 py-1 rounded-full text-sm font-semibold border transition-colors ${
                          novaCategoria === c.id
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        {c.emoji} {c.nome.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormAberto(false)}
                      className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!novoNome.trim() || ocupado === 'novo'}
                      className="flex-1 py-3 rounded-xl bg-brand-600 text-white font-bold disabled:opacity-60"
                    >
                      {ocupado === 'novo' ? 'Salvando…' : isOrganizer ? 'Adicionar' : 'Eu levo isso!'}
                    </button>
                  </div>
                </motion.form>
              ) : (
                <button
                  onClick={() => setFormAberto(true)}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-brand-200 text-brand-700 font-bold hover:bg-brand-50 transition-colors"
                >
                  <Plus size={18} />
                  {isOrganizer ? 'Adicionar item' : 'Vou levar outra coisa'}
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
