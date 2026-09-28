import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface EmBreveProps {
  icon: LucideIcon;
  titulo: string;
  descricao: string;
}

export function EmBreve({ icon: Icon, titulo, descricao }: EmBreveProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-10 text-center shadow"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-100 flex items-center justify-center">
        <Icon size={32} className="text-brand-600" />
      </div>
      <h1 className="text-2xl font-extrabold text-gray-800">{titulo}</h1>
      <p className="text-gray-600 mt-2 max-w-sm mx-auto">{descricao}</p>
      <span className="inline-block mt-4 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-sm font-semibold">
        Em breve
      </span>
    </motion.div>
  );
}
