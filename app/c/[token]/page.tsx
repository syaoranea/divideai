'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogoIcon } from '@/components/logo';
import { salvarTokenConvidado } from '@/lib/grupo-context';

/** Link pessoal enviado no WhatsApp: guarda o token e abre o grupo */
export default function LinkPessoalPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const [nome, setNome] = useState<string | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const res = await fetch(`/api/acesso/${encodeURIComponent(token)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (cancelado) return;
        setNome(data.nomeParticipante?.split(' ')[0] ?? null);
        salvarTokenConvidado(data.grupoId, token);
        setTimeout(() => router.replace(`/g/${data.grupoId}`), 900);
      } catch {
        if (!cancelado) setErro(true);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [token, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        animate={erro ? {} : { scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 1.4 }}
      >
        <LogoIcon size={88} className="drop-shadow-lg" />
      </motion.div>
      {erro ? (
        <>
          <h1 className="mt-6 text-2xl font-extrabold text-brand-800">Link inválido</h1>
          <p className="mt-2 text-gray-600 max-w-xs">
            Esse link não funciona mais. Peça um novo para quem está organizando.
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-6 text-2xl font-extrabold text-brand-800">
            {nome ? `Oi, ${nome}!` : 'Abrindo a Casa Cheia…'}
          </h1>
          <p className="mt-2 text-gray-600">Preparando tudo para você.</p>
        </>
      )}
    </div>
  );
}
