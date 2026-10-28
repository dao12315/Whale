import React, { createContext, useContext, useState, useEffect } from 'react';

// Import Vietnamese JSON dictionaries
import viCommon from './vi/common.json';
import viHeader from './vi/header.json';
import viHero from './vi/hero.json';
import viCourses from './vi/courses.json';
import viForum from './vi/forum.json';
import viAuth from './vi/auth.json';
import viAdmin from './vi/admin.json';
import viUserCenter from './vi/userCenter.json';
import viFaq from './vi/faq.json';
import viFooter from './vi/footer.json';

// Import English JSON dictionaries
import enCommon from './en/common.json';
import enHeader from './en/header.json';
import enHero from './en/hero.json';
import enCourses from './en/courses.json';
import enForum from './en/forum.json';
import enAuth from './en/auth.json';
import enAdmin from './en/admin.json';
import enUserCenter from './en/userCenter.json';
import enFaq from './en/faq.json';
import enFooter from './en/footer.json';

export type SupportedLanguage = 'vi' | 'en';

export const translations = {
  vi: {
    common: viCommon,
    header: viHeader,
    hero: viHero,
    courses: viCourses,
    forum: viForum,
    auth: viAuth,
    admin: viAdmin,
    userCenter: viUserCenter,
    faq: viFaq,
    footer: viFooter,
  },
  en: {
    common: enCommon,
    header: enHeader,
    hero: enHero,
    courses: enCourses,
    forum: enForum,
    auth: enAuth,
    admin: enAdmin,
    userCenter: enUserCenter,
    faq: enFaq,
    footer: enFooter,
  },
} as const;

export interface I18nContextType {
  currentLang: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function resolveKey(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr && typeof curr === 'object' && part in curr) {
      curr = curr[part];
    } else {
      return undefined;
    }
  }
  return typeof curr === 'string' ? curr : undefined;
}

export function translate(
  lang: SupportedLanguage,
  key: string,
  params?: Record<string, string | number>
): string {
  // 1. Tìm trong ngôn ngữ hiện tại
  let text = resolveKey(translations[lang], key);

  // 2. Nếu không thấy và key không có namespace, thử tìm trong common
  if (!text && !key.includes('.')) {
    text = (translations[lang].common as any)?.[key];
  }

  // 3. Fallback sang tiếng Việt nếu ngôn ngữ hiện tại là en và thiếu key
  if (!text && lang !== 'vi') {
    text = resolveKey(translations.vi, key);
    if (!text && !key.includes('.')) {
      text = (translations.vi.common as any)?.[key];
    }
  }

  // 4. Nếu hoàn toàn không có, trả về chính key
  if (!text) {
    return key;
  }

  // 5. Nội suy tham số ví dụ: {query}, {count}
  if (params) {
    return Object.entries(params).reduce((acc, [k, v]) => {
      return acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }, text);
  }

  return text;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLangState] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ggc_language') as SupportedLanguage;
      if (saved === 'vi' || saved === 'en') return saved;
    }
    return 'vi';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setCurrentLangState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ggc_language', lang);
    }
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(currentLang, key, params);
  };

  return React.createElement(
    I18nContext.Provider,
    { value: { currentLang, setLanguage, t } },
    children
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// Alias thuận tiện cho dev quen useTranslation()
export const useTranslation = useI18n;
