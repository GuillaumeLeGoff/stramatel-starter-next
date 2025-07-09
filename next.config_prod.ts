/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mode de sortie pour le déploiement
  output: 'export', // Pour un déploiement statique (recommandé pour le kiosk)
  // output: 'standalone', // Pour un déploiement server si nécessaire

  // Configuration du chemin de base
  basePath: '',
  assetPrefix: '',

  // Désactiver la télémétrie
  telemetry: false,

  // Configuration des images pour le mode export
  images: {
    unoptimized: true,
  },

  // Configuration du trailing slash
  trailingSlash: true,

  // Optimisations pour le kiosk
  compress: true,

  // Configuration des headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
    ];
  },

  // Redirections pour le kiosk
  async redirects() {
    return [
      {
        source: '/',
        destination: '/fr/live',
        permanent: false,
      },
      // Redirection d'urgence vers la page principale
      {
        source: '/emergency',
        destination: '/fr/live',
        permanent: false,
      },
    ];
  },

  // Configuration des rewrites pour nginx
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },

  // Configuration webpack pour l'optimisation
  webpack: (config, { isServer }) => {
    // Optimisations pour le build
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Configuration pour le kiosk (réduire la taille du bundle)
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    };

    return config;
  },

  // Configuration des variables d'environnement
  env: {
    KIOSK_MODE: 'true',
    DEPLOY_MODE: process.env.NODE_ENV,
  },

  // Configuration expérimentale
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
  },

  // Configuration du serveur de développement
  devIndicators: {
    buildActivity: false,
  },

  // Configuration de la génération statique
  generateEtags: false,

  // Configuration du cache
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Configuration des pages d'erreur personnalisées
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // Configuration pour le déploiement
  distDir: '.next',

  // Configuration des domaines autorisés (pour les images)
  images: {
    domains: ['localhost'],
    unoptimized: true, // Nécessaire pour le mode export
  },

  // Configuration de l'internationalisation (si nécessaire)
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    localeDetection: false, // Désactivé pour le kiosk
  },
};

module.exports = nextConfig;