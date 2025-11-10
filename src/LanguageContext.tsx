import React, { createContext, useState, useContext, ReactNode } from 'react';
import { translations } from './i18n';

type Locale = 'de' | 'en' | 'fr' | 'es' | 'pt' | 'it' | 'ru' | 'is' | 'sv' |'zh' | 'ja' | 'tr' | 'ar' | 'ko' | 'hi' | 'bn' | 'pl' | 'da' | 'cs' | 'fi' | 'no' | 'hu' | 'nl' | 'ro' | 'he' | 'emoji';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>('de');

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    let translation = translations[locale]?.[key] || translations['de']?.[key] || key;
    if (replacements) {
        Object.entries(replacements).forEach(([keyToReplace, value]) => {
            translation = translation.replace(`{${keyToReplace}}`, String(value));
        });
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};