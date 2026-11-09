import type { Language } from "./i18n";
import { localeFor } from "./i18n";

export type TimeZoneMode = "automatic" | "manual";

export interface TimeZonePreference {
  mode: TimeZoneMode;
  zone: string;
}

const storageKey = "pearl-empire-timezone";
const fallbackZones = [
  "UTC",
  "Asia/Yangon",
  "Asia/Kolkata",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Tokyo",
  "Asia/Singapore",
  "America/New_York",
  "America/Los_Angeles",
];

export function isValidTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone }).format();
    return true;
  } catch {
    return false;
  }
}

export function detectDeviceTimeZone(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone && isValidTimeZone(zone) ? zone : "UTC";
  } catch {
    return "UTC";
  }
}

export function readTimeZonePreference(): TimeZonePreference {
  const detected = detectDeviceTimeZone();
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return { mode: "automatic", zone: detected };
    const saved = JSON.parse(raw) as Partial<TimeZonePreference>;
    if (saved.mode === "manual" && typeof saved.zone === "string" && isValidTimeZone(saved.zone)) {
      return { mode: "manual", zone: saved.zone };
    }
    return { mode: "automatic", zone: detected };
  } catch {
    return { mode: "automatic", zone: detected };
  }
}

export function saveTimeZonePreference(preference: TimeZonePreference): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(preference));
  } catch {
    // The selected zone remains active for this session if storage is unavailable.
  }
}

export function listTimeZones(...include: string[]): string[] {
  const intlWithZones = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };
  let zones = fallbackZones;
  try {
    zones = intlWithZones.supportedValuesOf?.("timeZone") ?? fallbackZones;
  } catch {
    zones = fallbackZones;
  }
  return [...new Set(["UTC", ...zones, ...include].filter(isValidTimeZone))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function formatUtcOffset(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    }).formatToParts(date);
    const offset = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
    return offset === "GMT" ? "UTC+00:00" : offset.replace(/^GMT/, "UTC");
  } catch {
    return "UTC+00:00";
  }
}

export function formatCountdown(milliseconds: number, language: Language): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const locale = localeFor(language);
  const part = (value: number) =>
    new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }).format(value);
  return `${part(hours)}:${part(minutes)}:${part(seconds)}`;
}
