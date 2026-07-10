import { useCallback, useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShell, type ViewId } from '@/components/AppShell'
import { Dashboard } from '@/views/Dashboard'
import { Production } from '@/views/Production'
import { Structure } from '@/views/Structure'
import { type ProfileTarget } from '@/views/Profiles'
import { Settings } from '@/views/Settings'
import { Data, type DataSection, type EditTarget } from '@/views/Data'
import { loadDb, saveDb } from '@/lib/db'
import { loadPrefs, savePrefs } from '@/lib/prefs'
import type { Db } from '@/lib/types'

function Placeholder({ label }: { label: string }) {
  return (
    <div className="rounded-xl border bg-card p-8 text-center text-card-foreground">
      <h1 className="text-xl font-semibold">{label}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Este ecrã está a ser reconstruído na nova versão. Chega em breve.
      </p>
    </div>
  )
}

/** Um sítio na app (para o botão Voltar percorrer o caminho todo para trás). */
interface Loc {
  view: ViewId
  profile: ProfileTarget
  dataSection: DataSection | null
}

function App() {
  const [db, setDb] = useState<Db>(loadDb)
  const [assistantOn, setAssistantOn] = useState(() => loadPrefs().assistantEnabled)
  // Localização atual + histórico de navegação (para o Voltar).
  const [loc, setLoc] = useState<Loc>({ view: 'dashboard', profile: null, dataSection: null })
  const [history, setHistory] = useState<Loc[]>([])
  // Pedido de edição pendente para o ecrã Dados (vindo do botão "Editar" de uma ficha).
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)

  const updateDb = useCallback((next: Db) => {
    saveDb(next)
    setDb({ ...next })
  }, [])

  const setAssistant = useCallback((on: boolean) => {
    savePrefs({ assistantEnabled: on })
    setAssistantOn(on)
  }, [])

  // Navegar guardando o sítio atual no histórico (máx. 30 passos).
  const navTo = useCallback((next: Loc) => {
    setHistory((h) => [...h.slice(-29), loc])
    setLoc(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc])

  const goBack = useCallback(() => {
    setHistory((h) => {
      const prev = h[h.length - 1]
      if (!prev) return h
      setLoc(prev)
      return h.slice(0, -1)
    })
  }, [])

  // Ir para um ecrã do menu (raiz, sem ficha/secção aberta).
  const goView = useCallback((view: ViewId) => navTo({ view, profile: null, dataSection: null }), [navTo])
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
      <AppShell view={loc.view} onNavigate={goView} onBack={history.length ? goBack : null}>
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
        {loc.view === 'ai' && <Placeholder label="Assistente IA" />}
        {loc.view === 'settings' && (
          <Settings db={db} onChange={updateDb} assistantOn={assistantOn} onAssistantChange={setAssistant} />
        )}
      </AppShell>
    </TooltipProvider>
  )
}

export default App
