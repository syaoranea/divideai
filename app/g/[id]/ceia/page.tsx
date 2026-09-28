'use client';

import { UtensilsCrossed } from 'lucide-react';
import { EmBreve } from '@/components/em-breve';

export default function CeiaPage() {
  return (
    <EmBreve
      icon={UtensilsCrossed}
      titulo="Quem leva o quê"
      descricao="A lista de pratos, bebidas e sobremesas. Cada um reserva o seu."
    />
  );
}
