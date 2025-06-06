import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Régler le problème de Konva avec le module 'canvas'
    if (!isServer) {
      // Ne pas essayer de charger 'canvas' côté client
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }

    return config;
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
