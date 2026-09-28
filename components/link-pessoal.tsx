'use client';

import { useState } from 'react';
import { Check, Copy, Loader2, MessageCircle } from 'lucide-react';

interface LinkPessoalProps {
  grupoId: string;
  grupoNome: string;
  participanteId: string;
  nome: string;
  telefone: string;
}

/** Número no formato do wa.me: só dígitos, com 55 na frente se for número brasileiro sem DDI */
function numeroWhatsApp(telefone: string) {
  const digitos = telefone.replace(/\D/g, '');
  if (!digitos) return '';
  return digitos.length <= 11 ? `55${digitos}` : digitos;
}

export function LinkPessoal({ grupoId, grupoNome, participanteId, nome, telefone }: LinkPessoalProps) {
  const [carregando, setCarregando] = useState<'whats' | 'copiar' | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState('');

  const pegarLink = async () => {
    const res = await fetch(`/api/grupos/${grupoId}/participantes/${participanteId}/link`, {
      method: 'POST',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.token) throw new Error(data?.error ?? 'Erro ao gerar link');
    return `${window.location.origin}/c/${data.token}`;
  };

  const mensagem = (url: string) =>
    `Oi, ${nome.split(' ')[0]}! 🏠 Esse é o seu link da Casa Cheia para "${grupoNome}". ` +
    `Por ele você vê sua parte, vota no local e acompanha tudo: ${url}\n\n` +
    `É só seu, não precisa de senha. Não repasse para ninguém 😉`;

  const enviarWhatsApp = async () => {
    setErro('');
    setCarregando('whats');
    // Abre a janela antes do await para o navegador do celular não bloquear o popup
    const janela = window.open('', '_blank');
    try {
      const url = await pegarLink();
      const numero = numeroWhatsApp(telefone);
      const destino = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem(url))}`;
      if (janela) janela.location.href = destino;
      else window.location.href = destino;
    } catch (e: any) {
      janela?.close();
      setErro(e?.message ?? 'Erro ao gerar link');
    } finally {
      setCarregando(null);
    }
  };

  const copiar = async () => {
    setErro('');
    setCarregando('copiar');
    try {
      const url = await pegarLink();
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível copiar');
    } finally {
      setCarregando(null);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()} className="mt-3 pt-3 border-t border-gray-200/70">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={enviarWhatsApp}
          disabled={!!carregando}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#25D366] text-white text-sm font-bold hover:brightness-95 disabled:opacity-60 transition"
        >
          {carregando === 'whats' ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
          Enviar link
        </button>
        <button
          type="button"
          onClick={copiar}
          disabled={!!carregando}
          aria-label="Copiar link pessoal"
          className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60 transition"
        >
          {carregando === 'copiar' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : copiado ? (
            <Check size={16} className="text-green-600" />
          ) : (
            <Copy size={16} />
          )}
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}
    </div>
  );
}
