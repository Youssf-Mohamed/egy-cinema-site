// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

import { defaultLocale, locales } from './src/i18n/ui.ts';

export default defineConfig({
  site: 'https://egy-cinema.vercel.app',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  i18n: {
    defaultLocale,
    locales: [...locales],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: true,
    },
    fallback: {},
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale,
        locales: {
          en: 'en-US',
          ar: 'ar-EG',
        },
      },
    }),
  ],
  adapter: vercel({
    webAnalytics: { enabled: false },
    imageService: false,
  }),
  vite: {
    ssr: {
      noExternal: ['@supabase/supabase-js'],
    },
  },
});
