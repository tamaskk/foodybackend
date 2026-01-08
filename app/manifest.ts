import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://palapia.com'

  return {
    name: 'Palapia - AI-Powered Recipe Management',
    short_name: 'Palapia',
    description: 'Save, create, and share recipes effortlessly. AI-powered recipe import from social media, photo analysis, and smart meal planning.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFF8F3',
    theme_color: '#FF6B35',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/favicon1.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/favicon2.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
    categories: ['food', 'lifestyle', 'productivity'],
    lang: 'en-US',
    orientation: 'portrait',
  }
}
