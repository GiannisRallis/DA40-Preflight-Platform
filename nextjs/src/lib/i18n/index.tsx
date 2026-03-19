"use client"
import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { el } from "./el"
import { en } from "./en"
import type { I18n } from "./el"

export type Lang = "el" | "en"
const TRANSLATIONS: Record<Lang, I18n> = { el, en }

interface LangCtx { lang: Lang; t: I18n; setLang: (l: Lang) => void }
const Ctx = createContext<LangCtx>({ lang: "el", t: el, setLang: () => {} })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("da40_lang") as Lang) || "el"
    }
    return "el"
  })

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    if (typeof window !== "undefined") localStorage.setItem("da40_lang", l)
  }, [])

  return (
    <Ctx.Provider value={{ lang, t: TRANSLATIONS[lang], setLang }}>
      {children}
    </Ctx.Provider>
  )
}

export const useLang = () => useContext(Ctx)
