/**
 * useLanguage - IP-based bilingual hook for public pages.
 *
 * Logic:
 * 1. Check ?lang=en or ?lang=vi URL param → override immediately
 * 2. Detect IP geolocation via ipapi.co (free, no API key needed)
 * 3. Default: Vietnamese for VN IPs, English for all others
 * 4. User can override with a toggle button (stored in sessionStorage)
 */

import { useState, useEffect, useCallback } from 'react';

export type Lang = 'vi' | 'en';

export interface LanguageHelper {
  lang: Lang;
  setLang: (lang: Lang) => void;
  isLoading: boolean;
  /** Translate: returns Vietnamese or English string based on current lang */
  t: (vi: string, en: string) => string;
  /** Translate returning ReactNode (for JSX usage) */
  tr: (vi: React.ReactNode, en: React.ReactNode) => React.ReactNode;
}

const SESSION_KEY = 'pars_lang_override';

function getUrlParamLang(): Lang | null {
  try {
    const param = new URLSearchParams(window.location.search).get('lang')?.toLowerCase();
    if (param === 'en' || param === 'english') return 'en';
    if (param === 'vi' || param === 'vn' || param === 'vietnamese') return 'vi';
  } catch { /* ignore */ }
  return null;
}

function getSessionLang(): Lang | null {
  try {
    const v = sessionStorage.getItem(SESSION_KEY);
    if (v === 'en' || v === 'vi') return v as Lang;
  } catch { /* ignore */ }
  return null;
}

async function detectCountryFromIP(): Promise<'VN' | 'other'> {
  try {
    // Use ipapi.co - free, no key needed, 1000 req/day
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data.country_code === 'VN') return 'VN';
    }
  } catch { /* network error - fallback */ }
  return 'other';
}

import React from 'react';

export function useLanguage(): LanguageHelper {
  // Initial lang: URL param > session > placeholder (will be updated by IP)
  const urlLang = getUrlParamLang();
  const sessionLang = getSessionLang();
  const [lang, setLangState] = useState<Lang>(urlLang || sessionLang || 'vi');
  const [isLoading, setIsLoading] = useState(!urlLang && !sessionLang);

  useEffect(() => {
    // URL param takes priority — no IP detection needed
    if (urlLang) {
      setIsLoading(false);
      return;
    }
    // Session override — no IP detection needed
    if (sessionLang) {
      setIsLoading(false);
      return;
    }
    // Detect via IP
    setIsLoading(true);
    detectCountryFromIP().then(country => {
      const detected: Lang = country === 'VN' ? 'vi' : 'en';
      setLangState(detected);
      setIsLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    try {
      sessionStorage.setItem(SESSION_KEY, newLang);
    } catch { /* ignore */ }
  }, []);

  const t = useCallback((vi: string, en: string): string => {
    return lang === 'en' ? en : vi;
  }, [lang]);

  const tr = useCallback((vi: React.ReactNode, en: React.ReactNode): React.ReactNode => {
    return lang === 'en' ? en : vi;
  }, [lang]);

  return { lang, setLang, isLoading, t, tr };
}
