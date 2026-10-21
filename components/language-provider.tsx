"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { UI_COPY, type Language, type UiCopy } from "@/lib/i18n";

const LanguageContext = createContext<Language>("en");

export function LanguageProvider({
  language,
  children,
}: {
  language: Language;
  children: ReactNode;
}) {
  return (
    <LanguageContext.Provider value={language}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): Language {
  return useContext(LanguageContext);
}

export function useUiCopy(): UiCopy {
  return UI_COPY[useLanguage()];
}
