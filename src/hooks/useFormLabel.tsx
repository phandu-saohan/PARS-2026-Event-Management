/**
 * useFormLabel — helper để render label song ngữ Việt/Anh trong form public.
 *
 * Dùng: const L = useFormLabel(formCfg);
 *       L.section('personalInfo', 'THÔNG TIN ĐẠI BIỂU', 'DELEGATE INFO')
 *       L.t('Họ và Tên', 'Full Name')
 *       L.p('Nhập họ và tên...', 'Enter full name...')
 */

import { PublicFormConfig } from '../types';

export type LangMode = 'vi' | 'en' | 'both';

export interface FormLabelHelper {
  /** Render tên section: lấy từ sectionLabels config nếu có, fallback sang defaults */
  section: (key: string, defaultVi: string, defaultEn: string) => React.ReactNode;
  /** Render label field song ngữ */
  t: (vi: string, en: string) => React.ReactNode;
  /** Render label field song ngữ từ config fieldLabels */
  f: (key: string, defaultVi: string, defaultEn: string) => React.ReactNode;
  /** Render placeholder — trả về string */
  p: (vi: string, en: string) => string;
  /** Language mode */
  lang: LangMode;
  /** True nếu show tiếng Việt */
  showVi: boolean;
  /** True nếu show tiếng Anh */
  showEn: boolean;
}

import React from 'react';

export function useFormLabel(formCfg?: PublicFormConfig, overrideLang?: LangMode): FormLabelHelper {
  const lang: LangMode = overrideLang || (formCfg?.language as LangMode) || 'vi';
  const showVi = lang === 'vi' || lang === 'both';
  const showEn = lang === 'en' || lang === 'both';
  const isBoth = lang === 'both';

  const section = (key: string, defaultVi: string, defaultEn: string): React.ReactNode => {
    const customLabel = formCfg?.sectionLabels?.[key];
    const vi = customLabel?.vi || defaultVi;
    const en = customLabel?.en || defaultEn;

    if (!isBoth) return lang === 'en' ? en : vi;

    return (
      <span className="flex flex-col gap-0.5">
        <span>{vi}</span>
        <span className="text-[9px] font-normal tracking-wide opacity-60 normal-case">{en}</span>
      </span>
    );
  };

  const t = (vi: string, en: string): React.ReactNode => {
    if (!isBoth) return lang === 'en' ? en : vi;
    return (
      <span>
        {vi}
        <span className="ml-1.5 text-slate-400 font-normal text-[9px]">/ {en}</span>
      </span>
    );
  };

  const f = (key: string, defaultVi: string, defaultEn: string): React.ReactNode => {
    const custom = formCfg?.fieldLabels?.[key];
    const vi = custom?.vi || defaultVi;
    const en = custom?.en || defaultEn;
    if (!isBoth) return lang === 'en' ? en : vi;
    return (
      <span>
        {vi}
        <span className="ml-1.5 text-slate-400 font-normal text-[9px]">/ {en}</span>
      </span>
    );
  };

  const p = (vi: string, en: string): string => {
    if (lang === 'en') return en;
    if (lang === 'vi') return vi;
    return `${vi} / ${en}`;
  };

  return { section, t, f, p, lang, showVi, showEn };
}
