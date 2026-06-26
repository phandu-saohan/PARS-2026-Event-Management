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

function isLikelyVietnamese(): boolean {
  try {
    // 1. Check local timezone (Vietnam is Asia/Ho_Chi_Minh or Asia/Saigon)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'Asia/Ho_Chi_Minh' || tz === 'Asia/Saigon') {
      return true;
    }
  } catch { /* ignore */ }

  try {
    // 2. Check browser language preferences
    const languages = navigator.languages || [navigator.language];
    for (const lang of languages) {
      if (lang.toLowerCase().startsWith('vi')) {
        return true;
      }
    }
  } catch { /* ignore */ }

  return false;
}

async function detectCountryFromIP(): Promise<'VN' | 'other' | 'failed'> {
  try {
    // Use ipapi.co - free, no key needed, 1000 req/day
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data.country_code === 'VN') return 'VN';
      if (data.country_code) return 'other';
    }
  } catch { /* network error or ad-blocker blocking the request */ }
  return 'failed';
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
    // 1. Fast local checks (skips network requests entirely if user is likely in VN)
    if (isLikelyVietnamese()) {
      setLangState('vi');
      setIsLoading(false);
      return;
    }
    // 2. Detect via IP for non-VN browser configurations
    setIsLoading(true);
    detectCountryFromIP().then(result => {
      if (result === 'other') {
        setLangState('en');
      } else if (result === 'VN') {
        setLangState('vi');
      } // If 'failed', keep the default state ('vi')
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
