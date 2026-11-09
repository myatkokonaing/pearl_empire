import { en } from "../locales/en";
import { hi } from "../locales/hi";
import { my } from "../locales/my";
import { ru } from "../locales/ru";

export const languageOptions = [
  { code: "en", name: "English", locale: "en-US" },
  { code: "ru", name: "Русский", locale: "ru-RU" },
  { code: "my", name: "မြန်မာ", locale: "my-MM" },
  { code: "hi", name: "हिन्दी", locale: "hi-IN" },
] as const;

export type Language = (typeof languageOptions)[number]["code"];
export type TranslationKey = keyof typeof en;

const localeByLanguage: Record<Language, string> = {
  en: "en-US",
  ru: "ru-RU",
  my: "my-MM",
  hi: "hi-IN",
};

const messages: Record<Language, Partial<Record<TranslationKey, string>>> = {
  en,
  ru,
  my,
  hi,
};

export function localeFor(language: Language): string {
  return localeByLanguage[language];
}

export function parseLanguageCode(value: string | undefined | null): Language | null {
  if (!value) return null;
  const baseCode = value.trim().toLowerCase().split(/[-_]/)[0];
  return languageOptions.some((option) => option.code === baseCode)
    ? (baseCode as Language)
    : null;
}

export function readSavedLanguage(): Language | null {
  try {
    return parseLanguageCode(window.localStorage.getItem("pearl-empire-language"));
  } catch {
    return null;
  }
}

function telegramLanguage(): Language | null {
  try {
    return parseLanguageCode(window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code);
  } catch {
    return null;
  }
}

function browserLanguage(): Language | null {
  const candidates = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const candidate of candidates) {
    const match = parseLanguageCode(candidate);
    if (match) return match;
  }
  return null;
}

export function detectInitialLanguage(): Language {
  return readSavedLanguage() ?? telegramLanguage() ?? browserLanguage() ?? "en";
}

export function saveLanguage(language: Language): void {
  try {
    window.localStorage.setItem("pearl-empire-language", language);
  } catch {
    // The current session still uses the selected language if storage is unavailable.
  }
}

export function translate(
  language: Language,
  key: TranslationKey,
  values: Record<string, string | number> = {},
): string {
  const template = messages[language][key] ?? en[key];
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : match,
  );
}

export function pluralMessage(
  language: Language,
  group: "missions" | "friends" | "days",
  count: number,
  values: Record<string, string | number> = {},
): string {
  const category = new Intl.PluralRules(localeFor(language)).select(count);
  const preferred = `plural.${group}.${category}` as TranslationKey;
  const other = `plural.${group}.other` as TranslationKey;
  const key = messages[language][preferred] ? preferred : other;
  return translate(language, key, { count: formatNumber(count, language), ...values });
}

export function formatNumber(
  value: number,
  language: Language,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(localeFor(language), options).format(value);
}

export function formatDecimal(value: number, language: Language): string {
  return formatNumber(value, language, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function formatLocalDate(
  value: Date,
  language: Language,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat(localeFor(language), {
    dateStyle: "medium",
    timeZone,
  }).format(value);
}

export function formatLocalTime(
  value: Date,
  language: Language,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat(localeFor(language), {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone,
  }).format(value);
}

export function formatLocalDateTime(
  value: Date,
  language: Language,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat(localeFor(language), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(value);
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: {
            language_code?: string;
          };
        };
        viewportHeight?: number;
        viewportStableHeight?: number;
        onEvent?: (eventType: string, eventHandler: () => void) => void;
        offEvent?: (eventType: string, eventHandler: () => void) => void;
      };
    };
  }
}
