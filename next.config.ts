
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  
  webpack: (config, { isServer, dev, webpack }) => {
    // Prevent processing of pptxgenjs during build
    config.module.rules.push({
      test: /pptxgenjs[\\/].*\.(js|mjs|jsx|ts|tsx)$/,
      use: 'null-loader'
    });
    
    // Add handlebars rule
    config.module.rules.push({
      test: /handlebars/,
      use: 'null-loader'
    });

    // Exclude pptxgenjs from being parsed
    config.module.noParse = /pptxgenjs/;

    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        https: false,
        http: false,
        stream: false,
        crypto: false,
        path: false,
        os: false,
        zlib: false,
        net: false,
        tls: false,
        child_process: false,
        dns: false,
        module: false,
        dgram: false,
      };
    }

    // Ignore node: protocol imports
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^node:/,
      })
    );

    return config;
  },
};

const isDev = process.env.NODE_ENV === 'development';

export default isDev ? nextConfig : withPWA(nextConfig);
