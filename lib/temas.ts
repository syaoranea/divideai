export type Tema = 'casa' | 'natal' | 'reveillon' | 'aniversario';

export const TEMA_PADRAO: Tema = 'casa';

export const TEMAS: { id: Tema; nome: string; emoji: string; descricao: string }[] = [
  { id: 'casa', nome: 'Neutro', emoji: '🏠', descricao: 'Tons quentes de casa' },
  { id: 'natal', nome: 'Natal', emoji: '🎄', descricao: 'Vermelho, verde e neve' },
  { id: 'reveillon', nome: 'Réveillon', emoji: '🎆', descricao: 'Dourado e noite' },
  { id: 'aniversario', nome: 'Aniversário', emoji: '🎂', descricao: 'Rosa e festa' },
];

export function normalizarTema(valor: unknown): Tema {
  return TEMAS.some((t) => t.id === valor) ? (valor as Tema) : TEMA_PADRAO;
}

export function emojiDoTema(tema: unknown): string {
  return TEMAS.find((t) => t.id === normalizarTema(tema))?.emoji ?? '🏠';
}
