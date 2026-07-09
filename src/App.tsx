import { useCallback, useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShell, type ViewId } from '@/components/AppShell'
import { Dashboard } from '@/views/Dashboard'
import { Production } from '@/views/Production'
import { Structure } from '@/views/Structure'
import { loadDb, saveDb } from '@/lib/db'
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

function App() {
  const [view, setView] = useState<ViewId>('dashboard')
  const [db, setDb] = useState<Db>(loadDb)

  // Grava no localStorage (com arquivo automático) e atualiza o ecrã.
  const updateDb = useCallback((next: Db) => {
    saveDb(next)
    setDb({ ...next })
  }, [])

  return (
    <TooltipProvider delayDuration={150}>
      <AppShell view={view} onNavigate={setView}>
        {view === 'dashboard' && <Dashboard db={db} />}
        {view === 'production' && <Production db={db} />}
        {view === 'structure' && <Structure db={db} onChange={updateDb} />}
        {view === 'profiles' && <Placeholder label="Fichas" />}
        {view === 'data' && <Placeholder label="Dados" />}
        {view === 'ai' && <Placeholder label="Assistente IA" />}
      </AppShell>
    </TooltipProvider>
  )
}

export default App
