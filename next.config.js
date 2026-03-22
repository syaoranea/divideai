/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Permite finalizar o build mesmo se houver avisos de lint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Mantemos a verificação de tipos ativa para segurança
    ignoreBuildErrors: false,
  },
  images: { 
    unoptimized: true 
  },
};

module.exports = nextConfig;
