/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['@radix-ui/react-*', 'lucide-react'],
  },
}

export default nextConfig
