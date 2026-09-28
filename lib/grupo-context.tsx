'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { Pagamento } from '@/components/payment-history-table';
import { normalizarTema, type Tema } from '@/lib/temas';

export interface Participante {
  id: string;
  nomeParticipante: string;
  emailParticipante: string;
  telefoneParticipante: string;
  statusParticipacao: 'CONFIRMADO' | 'PENDENTE' | 'RECUSADO';
  valorIndividual: number | null;
  valorPago: number;
}

export interface Imovel {
  id: string;
  nome: string;
  descricao: string;
  precoTotalDiaria: number;
  capacidadeMaxima: number;
  quartos?: number;
  localizacao?: string;
  comodidades: string;
  imagemUrl: string;
  linkReserva: string;
}

export interface ImovelEmVotacao {
  id: string;
  imovelId: string;
  imovel: Imovel;
}

export interface Grupo {
  id: string;
  nome: string;
  dataEvento: string;
  dataTermino?: string;
  orcamentoMaximoPorPessoa: number;
  statusGrupo: 'ABERTO' | 'FECHADO';
  tema?: string;
  organizador: { id: string; nome: string; email: string };
  participantes: Participante[];
  imovelEscolhido: Imovel | null;
  imoveisEmVotacao: ImovelEmVotacao[];
  votos: { participanteId: string; imovelId: string }[];
}

type Acesso = 'carregando' | 'liberado' | 'precisa-identificar' | 'nao-encontrado';

interface GrupoContextValue {
  grupoId: string;
  grupo: Grupo | null;
  pagamentos: Pagamento[];
  acesso: Acesso;
  tema: Tema;
  isOrganizer: boolean;
  myParticipant: Participante | undefined;
  confirmados: Participante[];
  /** fetch que já manda a identificação do convidado */
  apiFetch: (url: string, init?: RequestInit) => Promise<Response>;
  refresh: () => Promise<void>;
  refreshPagamentos: () => Promise<void>;
  entrarComTelefone: (phone: string) => void;
}

const GrupoContext = createContext<GrupoContextValue | null>(null);

export function useGrupo() {
  const ctx = useContext(GrupoContext);
  if (!ctx) throw new Error('useGrupo precisa estar dentro de <GrupoProvider>');
  return ctx;
}

const phoneKey = (grupoId: string) => `guest_phone_${grupoId}`;
const soDigitos = (v?: string | null) => (v ?? '').replace(/\D/g, '');

export function GrupoProvider({ grupoId, children }: { grupoId: string; children: React.ReactNode }) {
  const { data: session, status: authStatus } = useSession() || {};
  const [guestPhone, setGuestPhone] = useState<string | null>(null);
  const [phoneLido, setPhoneLido] = useState(false);
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [acesso, setAcesso] = useState<Acesso>('carregando');

  useEffect(() => {
    setGuestPhone(localStorage.getItem(phoneKey(grupoId)));
    setPhoneLido(true);
  }, [grupoId]);

  const apiFetch = useCallback(
    (url: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (guestPhone) headers.set('x-guest-phone', guestPhone);
      return fetch(url, { ...init, headers });
    },
    [guestPhone]
  );

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/grupos/${grupoId}`);
      if (res.status === 401 || res.status === 403) {
        if (guestPhone) localStorage.removeItem(phoneKey(grupoId));
        setAcesso('precisa-identificar');
        return;
      }
      if (!res.ok) {
        setAcesso('nao-encontrado');
        return;
      }
      setGrupo(await res.json());
      setAcesso('liberado');
    } catch (error) {
      console.error('Error fetching grupo:', error);
      setAcesso('nao-encontrado');
    }
  }, [apiFetch, grupoId, guestPhone]);

  const refreshPagamentos = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/grupos/${grupoId}/pagamentos`);
      if (!res.ok) return;
      const data = await res.json();
      setPagamentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching pagamentos:', error);
    }
  }, [apiFetch, grupoId]);

  const identificado = authStatus === 'authenticated' || !!guestPhone;

  useEffect(() => {
    if (authStatus === 'loading' || !phoneLido) return;
    if (!identificado) {
      setAcesso('precisa-identificar');
      return;
    }
    refresh();
    refreshPagamentos();
  }, [authStatus, phoneLido, identificado, refresh, refreshPagamentos]);

  const entrarComTelefone = useCallback(
    (phone: string) => {
      localStorage.setItem(phoneKey(grupoId), phone);
      setGuestPhone(phone);
    },
    [grupoId]
  );

  const tema = normalizarTema(grupo?.tema);

  // O tema vai no <html> para valer também em modais e portais
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.tema = tema;
    return () => {
      delete html.dataset.tema;
    };
  }, [tema]);

  const value = useMemo<GrupoContextValue>(() => {
    const userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email;
    const participantes = grupo?.participantes ?? [];
    return {
      grupoId,
      grupo,
      pagamentos,
      acesso,
      tema,
      isOrganizer: !!userId && grupo?.organizador?.id === userId,
      myParticipant: participantes.find(
        (p) =>
          (userEmail && p.emailParticipante === userEmail) ||
          (guestPhone && soDigitos(p.telefoneParticipante) === soDigitos(guestPhone))
      ),
      confirmados: participantes.filter((p) => p.statusParticipacao === 'CONFIRMADO'),
      apiFetch,
      refresh,
      refreshPagamentos,
      entrarComTelefone,
    };
  }, [
    session,
    grupo,
    grupoId,
    pagamentos,
    acesso,
    tema,
    guestPhone,
    apiFetch,
    refresh,
    refreshPagamentos,
    entrarComTelefone,
  ]);

  return <GrupoContext.Provider value={value}>{children}</GrupoContext.Provider>;
}

export const brl = (valor: number | null | undefined) =>
  (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatarDataEvento(dateStr: string, endDateStr?: string) {
  try {
    if (!dateStr) return '';
    const start = new Date(dateStr);
    const fmt = (d: Date, options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: 'UTC' }).format(d);

    if (endDateStr) {
      const end = new Date(endDateStr);
      if (
        start.getUTCMonth() === end.getUTCMonth() &&
        start.getUTCFullYear() === end.getUTCFullYear()
      ) {
        const startDay = start.getUTCDate().toString().padStart(2, '0');
        return `${startDay} - ${fmt(end, { day: '2-digit', month: 'long', year: 'numeric' })}`;
      }
      return `${fmt(start, { day: '2-digit', month: 'short' })} - ${fmt(end, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`;
    }

    return fmt(start, { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
