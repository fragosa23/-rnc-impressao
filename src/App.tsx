import { useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShell, type ViewId } from '@/components/AppShell'
import { Dashboard } from '@/views/Dashboard'
import { Production } from '@/views/Production'
import { loadDb } from '@/lib/db'

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
  const db = loadDb()

  return (
    <TooltipProvider delayDuration={150}>
      <AppShell view={view} onNavigate={setView}>
        {view === 'dashboard' && <Dashboard db={db} />}
        {view === 'production' && <Production db={db} />}
        {view === 'structure' && <Placeholder label="Estrutura operacional" />}
        {view === 'profiles' && <Placeholder label="Fichas" />}
        {view === 'data' && <Placeholder label="Dados" />}
        {view === 'ai' && <Placeholder label="Assistente IA" />}
      </AppShell>
    </TooltipProvider>
  )
}

export default App
