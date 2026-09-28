'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, ImagePlus, Loader2, Send, Trash2, X } from 'lucide-react';
import { useGrupo } from '@/lib/grupo-context';
import { emojiDoTema } from '@/lib/temas';
import { prepararFoto, type FotoPronta } from '@/lib/imagem';
import type { PostMural, Reacao } from '@/lib/services/muralService';

const INTERVALO_ATUALIZACAO = 30_000;

function quandoFoi(data: string | Date) {
  const seg = Math.max(0, Math.floor((Date.now() - new Date(data).getTime()) / 1000));
  if (seg < 60) return 'agora';
  if (seg < 3600) return `há ${Math.floor(seg / 60)} min`;
  if (seg < 86400) return `há ${Math.floor(seg / 3600)} h`;
  if (seg < 7 * 86400) return `há ${Math.floor(seg / 86400)} d`;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(data));
}

const iniciais = (nome: string) =>
  nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

/** Busca a foto com o token no header e mostra via object URL */
function FotoPost({
  post,
  apiFetch,
  onAbrir,
}: {
  post: PostMural;
  apiFetch: (url: string, init?: RequestInit) => Promise<Response>;
  onAbrir: (url: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let cancelado = false;
    let objeto: string | null = null;
    (async () => {
      try {
        const res = await apiFetch(`/api/grupos/${post.grupoId}/mural/${post.id}/foto`);
        if (!res.ok) throw new Error();
        objeto = URL.createObjectURL(await res.blob());
        if (!cancelado) setUrl(objeto);
      } catch {
        if (!cancelado) setFalhou(true);
      }
    })();
    return () => {
      cancelado = true;
      if (objeto) URL.revokeObjectURL(objeto);
    };
  }, [apiFetch, post.grupoId, post.id]);

  const proporcao = post.fotoLargura && post.fotoAltura ? `${post.fotoLargura} / ${post.fotoAltura}` : '4 / 3';

  return (
    <div className="relative w-full bg-gray-100 overflow-hidden" style={{ aspectRatio: proporcao, maxHeight: '70vh' }}>
      {url ? (
        <button type="button" onClick={() => onAbrir(url)} className="block w-full h-full" aria-label="Ver foto inteira">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`Foto de ${post.autorNome}`} className="w-full h-full object-cover" />
        </button>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
          {falhou ? 'Não foi possível carregar a foto' : <Loader2 className="animate-spin" />}
        </div>
      )}
    </div>
  );
}

export default function MuralPage() {
  const { grupoId, grupo, tema, isOrganizer, myParticipant, apiFetch } = useGrupo();
  const [posts, setPosts] = useState<PostMural[] | null>(null);
  const [texto, setTexto] = useState('');
  const [foto, setFoto] = useState<FotoPronta | null>(null);
  const [preparando, setPreparando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [erro, setErro] = useState('');
  const [fotoAberta, setFotoAberta] = useState<string | null>(null);
  const inputFoto = useRef<HTMLInputElement>(null);

  const eu = myParticipant?.id ?? (isOrganizer ? 'organizador' : null);
  const REACOES: { id: Reacao; emoji: string }[] = [
    { id: 'amor', emoji: '❤️' },
    { id: 'risada', emoji: '😂' },
    { id: 'festa', emoji: emojiDoTema(tema) },
    { id: 'palmas', emoji: '👏' },
  ];

  const carregar = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/grupos/${grupoId}/mural`);
      if (res.ok) setPosts(await res.json());
    } catch (e) {
      console.error('Error loading mural:', e);
    }
  }, [apiFetch, grupoId]);

  // Atualiza sozinho de tempos em tempos enquanto a tela está aberta
  useEffect(() => {
    carregar();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') carregar();
    }, INTERVALO_ATUALIZACAO);
    return () => clearInterval(id);
  }, [carregar]);

  useEffect(() => () => {
    if (foto) URL.revokeObjectURL(foto.previewUrl);
  }, [foto]);

  const escolherFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    setErro('');
    setPreparando(true);
    try {
      setFoto(await prepararFoto(arquivo));
    } catch (err: any) {
      setErro(err?.message ?? 'Não foi possível usar essa foto');
    } finally {
      setPreparando(false);
    }
  };

  const publicar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim() && !foto) return;
    setErro('');
    setPublicando(true);
    try {
      const res = await apiFetch(`/api/grupos/${grupoId}/mural`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto,
          ...(foto ? { foto: foto.base64, largura: foto.largura, altura: foto.altura } : {}),
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Erro ao publicar');
      setTexto('');
      setFoto(null);
      await carregar();
    } catch (err: any) {
      setErro(err?.message ?? 'Erro ao publicar');
    } finally {
      setPublicando(false);
    }
  };

  const reagir = async (post: PostMural, reacao: Reacao) => {
    if (!eu) return;
    const ligar = !post.reacoes[reacao].includes(eu);
    // Otimista: muda na hora, confirma com o servidor depois
    setPosts((atual) =>
      (atual ?? []).map((p) =>
        p.id !== post.id
          ? p
          : {
              ...p,
              reacoes: {
                ...p.reacoes,
                [reacao]: ligar ? [...p.reacoes[reacao], eu] : p.reacoes[reacao].filter((x) => x !== eu),
              },
            }
      )
    );
    try {
      const res = await apiFetch(`/api/grupos/${grupoId}/mural/${post.id}/reacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reacao, ligar }),
      });
      if (!res.ok) throw new Error();
    } catch {
      carregar();
    }
  };

  const apagar = async (post: PostMural) => {
    if (!confirm('Apagar esta publicação?')) return;
    const res = await apiFetch(`/api/grupos/${grupoId}/mural/${post.id}`, { method: 'DELETE' });
    if (!res.ok) {
      setErro((await res.json().catch(() => null))?.error ?? 'Erro ao apagar');
      return;
    }
    setPosts((atual) => (atual ?? []).filter((p) => p.id !== post.id));
  };

  if (!grupo) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
          <Camera className="text-brand-600" /> Mural da família
        </h1>
        <p className="text-sm text-gray-500">Recados e fotos para todo mundo ver.</p>
      </div>

      {eu && (
        <form onSubmit={publicar} className="bg-white rounded-2xl p-4 shadow space-y-3">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`Deixe um recado${myParticipant ? `, ${myParticipant.nomeParticipante.split(' ')[0]}` : ''}…`}
            maxLength={500}
            rows={2}
            className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
          />

          {foto && (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto.previewUrl} alt="Foto escolhida" className="max-h-48 rounded-xl" />
              <button
                type="button"
                onClick={() => setFoto(null)}
                aria-label="Tirar foto"
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gray-800 text-white flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <input ref={inputFoto} type="file" accept="image/*" onChange={escolherFoto} className="hidden" />
            <button
              type="button"
              onClick={() => inputFoto.current?.click()}
              disabled={preparando || publicando}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 text-brand-700 font-semibold text-sm disabled:opacity-60"
            >
              {preparando ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
              {foto ? 'Trocar foto' : 'Foto'}
            </button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={publicando || preparando || (!texto.trim() && !foto)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 text-white font-bold disabled:opacity-50"
            >
              {publicando ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Publicar
            </motion.button>
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
        </form>
      )}

      {posts === null ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-brand-500" size={32} />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow">
          <p className="text-4xl mb-2">📸</p>
          <p className="font-bold text-gray-800">O mural ainda está vazio</p>
          <p className="text-sm text-gray-500 mt-1">Que tal ser o primeiro a deixar um recado?</p>
        </div>
      ) : (
        <ul className="space-y-4">
          <AnimatePresence initial={false}>
            {posts.map((post) => {
              const podeApagar = isOrganizer || post.autorId === eu;
              return (
                <motion.li
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl shadow overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 pt-4">
                    <span
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        post.autorId === eu ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-800'
                      }`}
                    >
                      {iniciais(post.autorNome)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 truncate">{post.autorNome}</p>
                      <p className="text-xs text-gray-500">{quandoFoi(post.createdAt)}</p>
                    </div>
                    {podeApagar && (
                      <button
                        onClick={() => apagar(post)}
                        aria-label="Apagar publicação"
                        className="p-1.5 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {post.texto && <p className="px-4 pt-3 text-gray-800 whitespace-pre-line break-words">{post.texto}</p>}

                  {post.temFoto && (
                    <div className="mt-3">
                      <FotoPost post={post} apiFetch={apiFetch} onAbrir={setFotoAberta} />
                    </div>
                  )}

                  <div className="flex gap-2 px-4 py-3">
                    {REACOES.map((r) => {
                      const quem = post.reacoes[r.id] ?? [];
                      const minha = !!eu && quem.includes(eu);
                      return (
                        <motion.button
                          key={r.id}
                          whileTap={{ scale: 1.3 }}
                          onClick={() => reagir(post, r.id)}
                          disabled={!eu}
                          aria-pressed={minha}
                          aria-label={`Reagir com ${r.emoji}`}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-sm transition-colors ${
                            minha ? 'bg-brand-50 border-brand-300 text-brand-800' : 'bg-white border-gray-200 text-gray-600'
                          }`}
                        >
                          <span>{r.emoji}</span>
                          {quem.length > 0 && <span className="font-bold tabular-nums">{quem.length}</span>}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <AnimatePresence>
        {fotoAberta && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFotoAberta(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoAberta} alt="Foto em tela cheia" className="max-w-full max-h-full rounded-lg" />
            <button aria-label="Fechar" className="absolute top-4 right-4 text-white">
              <X size={28} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
