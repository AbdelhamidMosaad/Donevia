import type { NextConfig } from 'next';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from local.env
try {
  const envPath = resolve(process.cwd(), 'local.env');
  const envFileContent = readFileSync(envPath, { encoding: 'utf-8' });
  envFileContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=').trim().replace(/^['"]|['"]$/g, '');
        if (key && value) {
            const trimmedKey = key.trim();
            if (!process.env[trimmedKey]) {
                process.env[trimmedKey] = value;
            }
        }
    }
  });
} catch (e) {
  // It's okay if the file doesn't exist
}


const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

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
};

export default withPWA(nextConfig);
