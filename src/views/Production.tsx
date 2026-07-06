import { useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InfoTip } from '@/components/InfoTip'
import type { Db, Machine } from '@/lib/types'
import { aggregate, fmt, MONTHS, recordsFor, sectionName } from '@/lib/db'
import { machineColor, machineDash, sectionColor } from '@/lib/colors'
import { taxaTone, toneVar } from '@/lib/severity'

function machineInfo(db: Db, m: Machine): string {
  const tipo = m.sectionId === 'flexo' ? 'Flexografia' : 'Rotogravura'
  const estado = m.status === 'discontinued' ? ` · ${m.statusNote || 'máquina descontinuada'}` : ''
  return `Máquina de ${tipo} (secção ${sectionName(db, m.sectionId)})${estado}`
}

const SECTION_ORDER: Record<string, number> = { flexo: 0, roto: 1 }
const BARS_HEIGHT = 240

/** Um gráfico de barras verticais com todas as máquinas: Flexografia primeiro, Rotogravura depois.
 *  Barra larga = OF (cor da secção). Barra estreita = RNC (cor por severidade).
 *  A melhor e a pior máquina (por taxa) ficam destacadas com animação. */
function MachinesChart({ db }: { db: Db }) {
  const all = recordsFor(db, {})
  const rows = [...db.machines]
    .sort((a, b) => (SECTION_ORDER[a.sectionId] ?? 9) - (SECTION_ORDER[b.sectionId] ?? 9))
    .map((m) => ({ m, a: aggregate(all.filter((r) => r.machineId === m.id)) }))

  const maxOf = Math.max(...rows.map((x) => x.a.of), 1)
  const maxRnc = Math.max(...rows.map((x) => x.a.rnc), 1)

  const rated = rows.filter((x) => x.a.of > 0 && x.a.taxa !== null)
  const sortedByTaxa = [...rated].sort((a, b) => (a.a.taxa || 0) - (b.a.taxa || 0))
  const bestId = sortedByTaxa[0]?.m.id
  const worstId = sortedByTaxa[sortedByTaxa.length - 1]?.m.id

  const pct = (v: number, max: number) => (max ? Math.max(v > 0 ? 3 : 0, (v / max) * 100) : 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          Trabalhos e defeitos por máquina
          <InfoTip text="Todas as máquinas juntas para comparar a secção de impressão e as suas duas sub-secções. Barra larga = OF (trabalhos), na cor da secção. Barra estreita = RNC (defeitos), com cor pela taxa. A melhor e a pior máquina estão destacadas." />
        </CardTitle>
        {/* legenda */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm" style={{ background: sectionColor('flexo') }} /> OF Flexografia
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm" style={{ background: sectionColor('roto') }} /> OF Rotogravura
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-1.5 rounded-sm bg-muted-foreground" /> RNC (barra estreita)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex size-3.5 items-center justify-center rounded-full text-[10px]" style={{ background: 'var(--success)', color: 'white' }}>★</span> melhor
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex size-3.5 items-center justify-center rounded-full text-[10px]" style={{ background: 'var(--destructive)', color: 'white' }}>!</span> pior
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1.5 overflow-x-auto pb-1 sm:gap-2">
          {rows.map((x, i) => {
            const prev = rows[i - 1]
            const newSection = !prev || prev.m.sectionId !== x.m.sectionId
            const isBest = x.m.id === bestId
            const isWorst = x.m.id === worstId
            const rncColor = toneVar[taxaTone(x.a.taxa)]
            return (
              <div key={x.m.id} className="flex items-end">
                {newSection && i > 0 && <div className="mx-1 h-[300px] w-px self-stretch bg-border" />}
                <div
                  className={`flex min-w-[52px] flex-1 flex-col items-center gap-1 rounded-lg px-1 pt-1 ${
                    isBest ? 'omp-best bg-success/10' : isWorst ? 'omp-worst bg-destructive/10' : ''
                  }`}
                >
                  <div className="flex h-5 items-center text-xs">
                    {isBest && (
                      <span className="omp-bob font-semibold" style={{ color: 'var(--success)' }}>★ melhor</span>
                    )}
                    {isWorst && (
                      <span className="omp-bob font-semibold" style={{ color: 'var(--destructive)' }}>! pior</span>
                    )}
                  </div>
                  <div className="text-[11px] font-medium tabular-nums">{x.a.of}</div>
                  <div className="flex w-full items-end justify-center gap-1" style={{ height: BARS_HEIGHT }}>
                    <div
                      className="w-4 rounded-t transition-all sm:w-5"
                      style={{ height: `${pct(x.a.of, maxOf)}%`, background: sectionColor(x.m.sectionId) }}
                      title={`${x.m.name} — ${x.a.of} OF`}
                    />
                    <div
                      className="w-2 rounded-t transition-all"
                      style={{ height: `${pct(x.a.rnc, maxRnc) * 0.7}%`, background: rncColor }}
                      title={`${x.m.name} — ${x.a.rnc} RNC (${fmt(x.a.taxa)})`}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium">
                    {x.m.name}
                    <InfoTip text={machineInfo(db, x.m)} label={`O que é ${x.m.name}`} />
                  </div>
                  <div className="text-[11px] tabular-nums" style={{ color: rncColor }}>
                    {x.a.rnc} RNC · {fmt(x.a.taxa)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: sectionColor('flexo') }} /> Flexografia (IF)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: sectionColor('roto') }} /> Rotogravura (IR)
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function TrendChart({ db }: { db: Db }) {
  const [metric, setMetric] = useState<'of' | 'rnc'>('of')
  const [sectionFilter, setSectionFilter] = useState<'all' | 'flexo' | 'roto'>('all')
  const all = recordsFor(db, {})

  const monthKeys = [...new Set(all.map((r) => r.year * 12 + r.month))].sort((a, b) => a - b)
  const machines = db.machines.filter(
    (m) =>
      (sectionFilter === 'all' || m.sectionId === sectionFilter) &&
      all.some((r) => r.machineId === m.id),
  )

  const data = monthKeys.map((k) => {
    const y = Math.floor(k / 12)
    const mo = ((k % 12) + 12) % 12
    const row: Record<string, number | string> = { label: `${MONTHS[mo].slice(0, 3)} ${String(y).slice(2)}` }
    machines.forEach((m) => {
      const a = aggregate(all.filter((r) => r.machineId === m.id && r.year === y && r.month === mo))
      row[m.name] = metric === 'of' ? a.of : a.rnc
    })
    return row
  })

  const metricBtn = (id: 'of' | 'rnc', label: string) => (
    <Button size="sm" variant={metric === id ? 'default' : 'outline'} onClick={() => setMetric(id)}>
      {label}
    </Button>
  )
  const sectionBtn = (id: 'all' | 'flexo' | 'roto', label: string) => (
    <Button
      size="sm"
      variant={sectionFilter === id ? 'default' : 'outline'}
      onClick={() => setSectionFilter(id)}
    >
      {label}
    </Button>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-1.5 text-base">
          Tendência ao longo dos meses
          <InfoTip text="Evolução mês a mês de cada máquina. Cada máquina tem uma cor e um traço próprios (contínuo, tracejado, pontilhado…) para se distinguirem mesmo com dificuldade em ver cores. Sobe = mais, desce = menos." />
        </CardTitle>
        <div className="flex flex-wrap gap-3 pt-2">
          <div className="flex gap-1.5">
            {metricBtn('of', 'OF / trabalhos')}
            {metricBtn('rnc', 'RNC / defeitos')}
          </div>
          <div className="flex gap-1.5">
            {sectionBtn('all', 'Todas')}
            {sectionBtn('flexo', 'Flexografia')}
            {sectionBtn('roto', 'Rotogravura')}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há meses com dados.</p>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} allowDecimals={false} width={36} />
              <RTooltip
                contentStyle={{
                  background: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--popover-foreground)',
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {machines.map((m) => (
                <Line
                  key={m.id}
                  type="monotone"
                  dataKey={m.name}
                  stroke={machineColor(db, m.id)}
                  strokeWidth={2.5}
                  strokeDasharray={machineDash(db, m.id) || undefined}
                  dot={{ r: 3, strokeWidth: 0, fill: machineColor(db, m.id) }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

export function Production({ db }: { db: Db }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Produção</h1>
        <p className="text-sm text-muted-foreground">
          Trabalhos (OF) e defeitos (RNC) por máquina, com todos os meses registados.
        </p>
      </div>

      <MachinesChart db={db} />
      <TrendChart db={db} />
    </div>
  )
}
