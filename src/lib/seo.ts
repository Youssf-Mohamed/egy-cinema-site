import type { Locale } from '../i18n/ui';
import { t } from '../i18n/ui';

export const SITE_URL = 'https://egy-cinema-site.vercel.app';

export interface SeoConfig {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  jsonLd?: Record<string, unknown>[];
}

export function absoluteUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

export function buildHreflang(locale: Locale, path: string): string {
  return absoluteUrl(`/${locale}${path === '/' ? '' : path}`);
}

export function buildOrganizationLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'EGY CINEMA',
    url: SITE_URL,
    logo: absoluteUrl('/logo.png'),
    sameAs: ['https://github.com/Youssf-Mohamed/movie_app'],
  };
}

export function buildSoftwareAppLd(
  locale: Locale,
  version: string,
  releaseDate: string,
  downloadUrl: string | null,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'EGY CINEMA',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Windows, Android',
    description: t(locale, 'site.description'),
    url: SITE_URL,
    downloadUrl: downloadUrl ?? absoluteUrl('/'),
    softwareVersion: version,
    datePublished: releaseDate,
    inLanguage: ['en', 'ar'],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: 'EGY CINEMA',
    },
  };
}

export function buildFaqLd(items: { q: string; a: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.a,
      },
    })),
  };
}

export function buildBreadcrumbLd(
  locale: Locale,
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: buildHreflang(locale, it.path),
    })),
  };
}
