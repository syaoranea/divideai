/**
 * Pix copia-e-cola (BR Code estático, padrão EMV do Banco Central).
 * Gera o texto que o app do banco entende, já com o valor preenchido.
 */

export type TipoChavePix = 'cpf' | 'cnpj' | 'telefone' | 'email' | 'aleatoria';

export const TIPOS_CHAVE_PIX: { id: TipoChavePix; nome: string; exemplo: string }[] = [
  { id: 'telefone', nome: 'Telefone', exemplo: '(11) 99999-9999' },
  { id: 'cpf', nome: 'CPF', exemplo: '000.000.000-00' },
  { id: 'email', nome: 'E-mail', exemplo: 'voce@email.com' },
  { id: 'aleatoria', nome: 'Aleatória', exemplo: '123e4567-e89b-12d3-a456-426614174000' },
  { id: 'cnpj', nome: 'CNPJ', exemplo: '00.000.000/0000-00' },
];

export interface ConfigPix {
  tipo: TipoChavePix;
  chave: string;
  nome: string;
  cidade: string;
}

/** Deixa a chave no formato que o Pix exige para cada tipo */
export function normalizarChavePix(tipo: TipoChavePix, chave: string) {
  const bruta = (chave ?? '').trim();
  const digitos = bruta.replace(/\D/g, '');
  switch (tipo) {
    case 'cpf':
    case 'cnpj':
      return digitos;
    case 'telefone':
      return `+${digitos.length <= 11 ? `55${digitos}` : digitos}`;
    case 'email':
      return bruta.toLowerCase();
    default:
      return bruta.toLowerCase();
  }
}

/** Nome e cidade: sem acento, maiúsculas, no tamanho máximo do padrão */
function textoPix(valor: string, max: number) {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .toUpperCase()
    .slice(0, max);
}

function campo(id: string, valor: string) {
  return `${id}${valor.length.toString().padStart(2, '0')}${valor}`;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function pixConfigurado(config?: Partial<ConfigPix> | null): config is ConfigPix {
  return !!(config?.tipo && config.chave?.trim() && config.nome?.trim() && config.cidade?.trim());
}

export function gerarPixCopiaECola(config: ConfigPix, valor: number, descricao?: string) {
  const chave = normalizarChavePix(config.tipo, config.chave);
  const conta =
    campo('00', 'br.gov.bcb.pix') +
    campo('01', chave) +
    (descricao ? campo('02', textoPix(descricao, 40)) : '');

  const semCrc =
    campo('00', '01') +
    campo('26', conta) +
    campo('52', '0000') +
    campo('53', '986') +
    (valor > 0 ? campo('54', valor.toFixed(2)) : '') +
    campo('58', 'BR') +
    campo('59', textoPix(config.nome, 25)) +
    campo('60', textoPix(config.cidade, 15)) +
    campo('62', campo('05', '***')) +
    '6304';

  return semCrc + crc16(semCrc);
}
