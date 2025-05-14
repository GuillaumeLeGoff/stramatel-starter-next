import createNextIntlPlugin from 'next-intl/plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Régler le problème de Konva avec le module 'canvas'
    if (!isServer) {
      // Ne pas essayer de charger 'canvas' côté client
      config.resolve.alias = {
        ...config.resolve.alias,
        'canvas': false,
      };
    }

    return config;
  }
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig); 