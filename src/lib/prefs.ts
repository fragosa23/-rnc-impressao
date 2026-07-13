// Preferências de interface deste dispositivo (não viajam com a exportação de dados).

const KEY = 'omp_ui_prefs'

export type ThemePref = 'dark' | 'light'

export interface UiPrefs {
  /** Assistente ObaniA visível? Desligável na cruz do balão; religável em Configurações. */
  assistantEnabled: boolean
  /** Tema da app. Escuro é o padrão; o claro liga-se em Configurações. */
  theme: ThemePref
}

const DEFAULTS: UiPrefs = { assistantEnabled: true, theme: 'dark' }

export function loadPrefs(): UiPrefs {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { ...DEFAULTS }
  }
}

/** Grava alterações parciais sem perder as restantes preferências. */
export function savePrefs(patch: Partial<UiPrefs>): void {
  localStorage.setItem(KEY, JSON.stringify({ ...loadPrefs(), ...patch }))
}

/** Aplica o tema ao documento (classe no <html>). */
export function applyTheme(theme: ThemePref): void {
  const el = document.documentElement
  el.classList.toggle('dark', theme === 'dark')
  el.classList.toggle('light', theme === 'light')
}
