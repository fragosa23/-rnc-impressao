import { useCallback, useEffect, useRef, useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShell, VIEWS, type ViewId } from '@/components/AppShell'
import { Dashboard } from '@/views/Dashboard'
import { Production } from '@/views/Production'
import { Structure } from '@/views/Structure'
import { type ProfileTarget } from '@/views/Profiles'
import { Settings } from '@/views/Settings'
import { Assistant } from '@/views/Assistant'
import { Data, type DataSection, type EditTarget } from '@/views/Data'
import { loadDb, saveDb } from '@/lib/db'
import { applyTheme, loadPrefs, savePrefs, type ThemePref } from '@/lib/prefs'
import type { Db } from '@/lib/types'

/** Um sítio na app. Serializado no hash do URL para o botão voltar do browser
 *  funcionar e para se poderem partilhar links diretos (ex.: #/structure/machine/IF3). */
interface Loc {
  view: ViewId
  profile: ProfileTarget
  dataSection: DataSection | null
}

const PROFILE_KINDS = ['machine', 'team', 'worker'] as const
const DATA_SECTIONS = ['report', 'records', 'fichas', 'backup', 'history'] as const

function serializeLoc(l: Loc): string {
  if (l.view === 'structure' && l.profile)
    return `#/structure/${l.profile.kind}/${encodeURIComponent(l.profile.id)}`
  if (l.view === 'data' && l.dataSection) return `#/data/${l.dataSection}`
  return `#/${l.view}`
}

function parseLoc(hash: string): Loc {
  const p = hash.replace(/^#\/?/, '').split('/')
  const view = (VIEWS.some((v) => v.id === p[0]) ? p[0] : 'dashboard') as ViewId
  if (
    view === 'structure' &&
    PROFILE_KINDS.includes(p[1] as (typeof PROFILE_KINDS)[number]) &&
    p[2]
  )
    return {
      view,
      profile: { kind: p[1] as (typeof PROFILE_KINDS)[number], id: decodeURIComponent(p[2]) },
      dataSection: null,
    }
  if (view === 'data' && DATA_SECTIONS.includes(p[1] as DataSection))
    return { view, profile: null, dataSection: p[1] as DataSection }
  return { view, profile: null, dataSection: null }
}

function App() {
  const [db, setDb] = useState<Db>(loadDb)
  const [assistantOn, setAssistantOn] = useState(() => loadPrefs().assistantEnabled)
  const [theme, setThemeState] = useState<ThemePref>(() => loadPrefs().theme)
  const [loc, setLoc] = useState<Loc>(() => parseLoc(window.location.hash))
  // Pedido de edição pendente para o ecrã Dados (vindo do botão "Editar" de uma ficha).
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)

  // Pilha interna só para saber se o botão Voltar deve aparecer; quem manda é o browser.
  const stackRef = useRef<Loc[]>([])
  const intentRef = useRef(false)
  const [canBack, setCanBack] = useState(false)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const onHash = () => {
      const next = parseLoc(window.location.hash)
      setLoc((prev) => {
        if (intentRef.current) {
          intentRef.current = false
          stackRef.current = [...stackRef.current.slice(-29), prev]
        } else {
          // Navegação do browser (voltar/avançar): encolhe a pilha.
          stackRef.current = stackRef.current.slice(0, -1)
        }
        setCanBack(stackRef.current.length > 0)
        return next
      })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const updateDb = useCallback((next: Db) => {
    saveDb(next)
    setDb({ ...next })
  }, [])

  const setAssistant = useCallback((on: boolean) => {
    savePrefs({ assistantEnabled: on })
    setAssistantOn(on)
  }, [])

  const setTheme = useCallback((t: ThemePref) => {
    savePrefs({ theme: t })
    setThemeState(t)
  }, [])

  const navTo = useCallback((next: Loc) => {
    const h = serializeLoc(next)
    if (window.location.hash === h) {
      setLoc(next)
      return
    }
    intentRef.current = true
    window.location.hash = h
  }, [])

  const goBack = useCallback(() => window.history.back(), [])

  // Ir para um ecrã do menu (raiz, sem ficha/secção aberta).
  const goView = useCallback(
    (view: ViewId) => navTo({ view, profile: null, dataSection: null }),
    [navTo],
  )
  // Abrir a ficha de uma máquina/equipa/trabalhador (dentro da Estrutura).
  const openProfile = useCallback(
    (target: ProfileTarget) => navTo({ view: 'structure', profile: target, dataSection: null }),
    [navTo],
  )
  // Abrir uma sub-secção do menu Dados.
  const openDataSection = useCallback(
    (s: DataSection) => navTo({ view: 'data', profile: null, dataSection: s }),
    [navTo],
  )
  // Abrir a edição de uma entidade/registo no menu Dados (na secção certa).
  const openEditor = useCallback(
    (target: EditTarget) => {
      setEditTarget(target)
      navTo({ view: 'data', profile: null, dataSection: target.kind === 'record' ? 'records' : 'fichas' })
    },
    [navTo],
  )

  return (
    <TooltipProvider delayDuration={150}>
      <AppShell view={loc.view} onNavigate={goView} onBack={canBack ? goBack : null}>
        {loc.view === 'dashboard' && <Dashboard db={db} assistantOn={assistantOn} />}
        {loc.view === 'production' && <Production db={db} assistantOn={assistantOn} />}
        {loc.view === 'structure' && (
          <Structure
            db={db}
            sel={loc.profile}
            onOpenProfile={openProfile}
            onOpenEditor={openEditor}
            onGoProduction={() => goView('production')}
            assistantOn={assistantOn}
          />
        )}
        {loc.view === 'data' && (
          <Data
            db={db}
            onChange={updateDb}
            onReload={() => setDb(loadDb())}
            editTarget={editTarget}
            onConsumeEdit={() => setEditTarget(null)}
            section={loc.dataSection}
            onOpenSection={openDataSection}
          />
        )}
        {loc.view === 'ai' && <Assistant db={db} />}
        {loc.view === 'settings' && (
          <Settings
            db={db}
            onChange={updateDb}
            assistantOn={assistantOn}
            onAssistantChange={setAssistant}
            theme={theme}
            onThemeChange={setTheme}
          />
        )}
      </AppShell>
    </TooltipProvider>
  )
}

export default App
