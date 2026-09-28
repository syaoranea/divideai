'use client';

import { useParams } from 'next/navigation';
import { GrupoProvider } from '@/lib/grupo-context';
import { GrupoShell } from '@/components/grupo-shell';

export default function GrupoLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const grupoId = params?.id as string;

  return (
    <GrupoProvider grupoId={grupoId}>
      <GrupoShell>{children}</GrupoShell>
    </GrupoProvider>
  );
}
