'use client';

import { Camera } from 'lucide-react';
import { EmBreve } from '@/components/em-breve';

export default function MuralPage() {
  return (
    <EmBreve
      icon={Camera}
      titulo="Mural da família"
      descricao="Recados e fotos para todo mundo ver e reagir."
    />
  );
}
