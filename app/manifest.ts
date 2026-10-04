import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ubuntu',
    short_name: 'Ubuntu',
    description: 'Apprends le kirundi et le swahili',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF7F2',
    theme_color: '#C2410C',
    icons: [
      { src: '/favicon.ico', sizes: 'any' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
