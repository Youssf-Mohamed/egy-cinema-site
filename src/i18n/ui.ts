export const defaultLocale = 'en' as const;
export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const localeDir: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ar: 'rtl',
};

export const localeName: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
};

import en from './en.json';
import ar from './ar.json';

export const ui = { en, ar } as const;

export type UiKey = keyof typeof en;

export type FeatureKey = '01' | '02' | '03' | '04' | '05' | '06';

export function t(locale: Locale, key: UiKey): string {
  const dict = ui[locale] as unknown as Record<string, string>;
  const fallback = ui[defaultLocale] as unknown as Record<string, string>;
  return dict[key] ?? fallback[key] ?? key;
}

export function featureT(locale: Locale, n: FeatureKey, slot: 'title' | 'body'): string {
  const key = `features.${n}.${slot}`;
  const dict = ui[locale] as unknown as Record<string, string>;
  const fallback = ui[defaultLocale] as unknown as Record<string, string>;
  return dict[key] ?? fallback[key] ?? key;
}
