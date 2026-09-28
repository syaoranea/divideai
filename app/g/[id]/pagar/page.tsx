'use client';

import { Wallet } from 'lucide-react';
import { EmBreve } from '@/components/em-breve';

export default function PagarPage() {
  return (
    <EmBreve
      icon={Wallet}
      titulo="Minha parte"
      descricao="Aqui você vai ver quanto falta pagar, seu histórico e o Pix pronto para copiar."
    />
  );
}
