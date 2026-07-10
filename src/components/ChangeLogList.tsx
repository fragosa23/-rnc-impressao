import { CircleMinus, CirclePlus, Download, History, Pencil, RotateCcw } from 'lucide-react'
import type { ChangeAction, ChangeEntry } from '@/lib/types'
import { fmtDateTime } from '@/lib/db'

const ACTION_LABEL: Record<ChangeAction, string> = {
  create: 'Criado',
  edit: 'Editado',
  delete: 'Apagado',
  import: 'Importado',
  restore: 'Restaurado',
}
const ACTION_ICON: Record<ChangeAction, typeof Pencil> = {
  create: CirclePlus,
  edit: Pencil,
  delete: CircleMinus,
  import: Download,
  restore: RotateCcw,
}
const ACTION_COLOR: Record<ChangeAction, string> = {
  create: 'var(--success)',
  edit: 'var(--primary)',
  delete: 'var(--destructive)',
  import: 'var(--warning)',
  restore: 'var(--warning)',
}
const ENTITY_LABEL: Record<ChangeEntry['entity'], string> = {
  machine: 'Máquina',
  team: 'Equipa',
  worker: 'Trabalhador',
  area: 'Área',
  record: 'Registo de produção',
  data: 'Dados',
}

/** Lista de entradas do histórico de alterações (o que mudou, campo a campo). */
export function ChangeLogList({
  entries,
  limit = 30,
  showEntity = true,
}: {
  entries: ChangeEntry[]
  limit?: number
  showEntity?: boolean
}) {
  const shown = entries.slice(0, limit)
  if (shown.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <History className="size-4" /> Ainda sem alterações registadas.
      </p>
    )
  }
  return (
    <ol className="space-y-2">
      {shown.map((e) => {
        const Icon = ACTION_ICON[e.action]
        return (
          <li key={e.id} className="rounded-lg border p-2.5 text-sm">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Icon className="size-3.5 shrink-0" style={{ color: ACTION_COLOR[e.action] }} />
              <span className="font-medium">{ACTION_LABEL[e.action]}</span>
              {showEntity && (
                <span className="text-xs text-muted-foreground">{ENTITY_LABEL[e.entity]}</span>
              )}
              <span className="font-medium">{e.entityLabel}</span>
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">{fmtDateTime(e.at)}</span>
            </div>
            {e.changes && e.changes.length > 0 && (
              <ul className="mt-1.5 space-y-0.5 border-l-2 border-border pl-3 text-xs text-muted-foreground">
                {e.changes.map((c, i) => (
                  <li key={i}>
                    <span className="font-medium text-foreground">{c.field}:</span> {c.from} →{' '}
                    <span className="text-foreground">{c.to}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ol>
  )
}
