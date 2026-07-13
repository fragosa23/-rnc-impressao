import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { InfoTip } from '@/components/InfoTip'
import { Mascot } from '@/components/ObaniA'
import type { Db, Machine } from '@/lib/types'
import { aggregate, fmt, fmtOfRnc, MONTHS, recordsFor, sectionName } from '@/lib/db'
import { healthIndex } from '@/lib/health'
import { taxaTone, toneVar, type Tone } from '@/lib/severity'

/* ------------------------------------------------------------------------ */
/* Pesquisa tolerante a erros de escrita                                     */
/* ------------------------------------------------------------------------ */

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levDist(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    prev = cur
  }
  return prev[n]
}

/** "flexografia" ≈ "flexografia", "maqina" ≈ "maquina", mas "if1" ≠ "ir1". */
function fuzzyEq(word: string, target: string): boolean {
  if (word === target) return true
  if (target.startsWith(word) && word.length >= 3) return true
  if (Math.abs(word.length - target.length) > 2) return false
  const maxD = target.length >= 6 ? 2 : target.length >= 4 ? 1 : 0
  return maxD > 0 && levDist(word, target) <= maxD
}

/* ------------------------------------------------------------------------ */
/* Catálogo de perguntas e respostas                                         */
/* ------------------------------------------------------------------------ */

interface Answer {
  title: string
  lines: string[]
  tone: Tone
}

interface Question {
  id: string
  label: string
  /** Palavras que a pesquisa compara (normalizadas). */
  keywords: string[]
  /** Grupo mostrado quando não há pesquisa. */
  group: string
  answer: () => Answer
}

interface MachineAgg {
  m: Machine
  of: number
  rnc: number
  taxa: number | null
}

function buildQuestions(db: Db): { questions: Question[]; year: number } {
  const all = db.productionRecords
  const year = all.length ? Math.max(...all.map((r) => r.year)) : new Date().getFullYear()
  const yearRecords = recordsFor(db, { year })

  const machineAggs = (): MachineAgg[] =>
    db.machines
      .map((m) => {
        const a = aggregate(yearRecords.filter((r) => r.machineId === m.id))
        return { m, of: a.of, rnc: a.rnc, taxa: a.taxa }
      })
      .filter((x) => x.of > 0 || x.rnc > 0)

  const active = () => machineAggs().filter((x) => x.m.status !== 'discontinued' && x.of > 0)

  const monthAggs = () => {
    const keys = [...new Set(yearRecords.map((r) => r.month))].sort((a, b) => a - b)
    return keys.map((mo) => ({ mo, a: aggregate(yearRecords.filter((r) => r.month === mo)) }))
  }

  const questions: Question[] = []
  const add = (q: Question) => questions.push(q)

  add({
    id: 'worst-machine',
    label: 'Qual é a pior máquina?',
    keywords: ['pior', 'maquina', 'problema', 'mais rnc'],
    group: 'Comparações',
    answer: () => {
      const rated = active().sort((a, b) => (b.taxa ?? 0) - (a.taxa ?? 0))
      if (!rated.length)
        return { title: 'Pior máquina', lines: ['Sem dados de máquinas ativas em ' + year + '.'], tone: 'neutral' }
      const x = rated[0]
      return {
        title: `Pior máquina ativa em ${year}`,
        lines: [
          `${x.m.name}, com taxa de ${fmt(x.taxa)} (${x.of} OF, ${x.rnc} RNC).`,
          'As máquinas descontinuadas ficam fora desta comparação por já não estarem em produção.',
        ],
        tone: taxaTone(x.taxa),
      }
    },
  })

  add({
    id: 'best-machine',
    label: 'Qual é a melhor máquina?',
    keywords: ['melhor', 'maquina', 'menos rnc'],
    group: 'Comparações',
    answer: () => {
      const rated = active().sort((a, b) => (a.taxa ?? Infinity) - (b.taxa ?? Infinity))
      if (!rated.length)
        return { title: 'Melhor máquina', lines: ['Sem dados de máquinas ativas em ' + year + '.'], tone: 'neutral' }
      const x = rated[0]
      return {
        title: `Melhor máquina em ${year}`,
        lines: [`${x.m.name}, com taxa de ${fmt(x.taxa)} (${x.of} OF, ${x.rnc} RNC). Quanto menor a taxa, melhor.`],
        tone: 'success',
      }
    },
  })

  add({
    id: 'most-work',
    label: 'Que máquina tem mais trabalho?',
    keywords: ['mais', 'trabalho', 'of', 'producao', 'maquina'],
    group: 'Comparações',
    answer: () => {
      const rated = machineAggs().sort((a, b) => b.of - a.of)
      if (!rated.length) return { title: 'Mais trabalho', lines: ['Sem dados em ' + year + '.'], tone: 'neutral' }
      const x = rated[0]
      return {
        title: `Máquina com mais trabalho em ${year}`,
        lines: [`${x.m.name}, com ${x.of} OF (${x.rnc} RNC, taxa ${fmt(x.taxa)}).`],
        tone: 'neutral',
      }
    },
  })

  add({
    id: 'compare-sections',
    label: 'Compara Flexografia e Rotogravura',
    keywords: ['compara', 'flexografia', 'rotogravura', 'flexo', 'roto', 'seccao', 'seccoes'],
    group: 'Comparações',
    answer: () => {
      const flex = aggregate(yearRecords.filter((r) => r.sectionId === 'flexo'))
      const roto = aggregate(yearRecords.filter((r) => r.sectionId === 'roto'))
      if (!flex.of && !roto.of)
        return { title: 'Comparação de secções', lines: ['Sem dados suficientes em ' + year + '.'], tone: 'neutral' }
      const melhor = (flex.taxa ?? Infinity) < (roto.taxa ?? Infinity) ? 'Flexografia' : 'Rotogravura'
      return {
        title: `Flexografia vs Rotogravura — ${year}`,
        lines: [
          `Flexografia: ${flex.of} OF, ${flex.rnc} RNC, taxa ${fmt(flex.taxa)}.`,
          `Rotogravura: ${roto.of} OF, ${roto.rnc} RNC, taxa ${fmt(roto.taxa)}.`,
          `Melhor taxa (menor): ${melhor}. Mais OF: ${flex.of >= roto.of ? 'Flexografia' : 'Rotogravura'}.`,
        ],
        tone: 'neutral',
      }
    },
  })

  add({
    id: 'totals',
    label: `Quantas RNC e OF em ${year}?`,
    keywords: ['quantas', 'rnc', 'of', 'total', 'trabalhos', 'defeitos', String(year)],
    group: 'Totais',
    answer: () => {
      const a = aggregate(yearRecords)
      return {
        title: `Totais de ${year}`,
        lines: [
          `${a.of} OF e ${a.rnc} RNC registados (taxa ${fmt(a.taxa)}).`,
          `OF por RNC: ${fmtOfRnc(a)} — quanto maior, melhor.`,
        ],
        tone: taxaTone(a.taxa),
      }
    },
  })

  add({
    id: 'health',
    label: 'Qual é o índice de saúde?',
    keywords: ['indice', 'saude', 'estado', 'nota'],
    group: 'Totais',
    answer: () => {
      const h = healthIndex(db, yearRecords, all)
      return {
        title: 'Índice de Saúde da Produção',
        lines: [
          `${h.score}/100 — ${h.label} (período: ${year}).`,
          'Calculado a partir da taxa de RNC, alertas de máquinas ativas, equilíbrio entre secções e evolução recente.',
        ],
        tone: h.score >= 80 ? 'success' : h.score >= 70 ? 'warning' : 'danger',
      }
    },
  })

  add({
    id: 'worst-month',
    label: 'Qual foi o pior mês?',
    keywords: ['pior', 'mes', 'mau'],
    group: 'Totais',
    answer: () => {
      const rows = monthAggs().filter((x) => x.a.of > 0)
      if (!rows.length) return { title: 'Pior mês', lines: ['Sem meses com dados em ' + year + '.'], tone: 'neutral' }
      const worst = rows.reduce((w, x) => ((x.a.taxa ?? 0) > (w.a.taxa ?? 0) ? x : w))
      return {
        title: `Pior mês de ${year} (por taxa)`,
        lines: [`${MONTHS[worst.mo]}: ${worst.a.of} OF, ${worst.a.rnc} RNC, taxa ${fmt(worst.a.taxa)}.`],
        tone: taxaTone(worst.a.taxa),
      }
    },
  })

  add({
    id: 'coverage',
    label: 'Que dados existem na app?',
    keywords: ['dados', 'meses', 'periodo', 'existem', 'registados'],
    group: 'Totais',
    answer: () => {
      if (!all.length) return { title: 'Dados registados', lines: ['Ainda não há registos.'], tone: 'neutral' }
      const keys = [...new Set(all.map((r) => `${r.year}-${r.month}`))].sort()
      const meses = keys.map((k) => {
        const [y, m] = k.split('-')
        return `${MONTHS[Number(m)]} ${y}`
      })
      return {
        title: 'Dados registados',
        lines: [
          `${all.length} registos de produção, cobrindo: ${meses.join(', ')}.`,
          `${db.machines.length} máquinas, ${db.teams.length} equipas e ${db.workers.length} trabalhadores.`,
        ],
        tone: 'neutral',
      }
    },
  })

  // Perguntas por máquina — é aqui que escrever "IF3" mostra logo o que interessa.
  db.machines.forEach((m) => {
    const mid = norm(m.name)
    const machineYear = () => aggregate(yearRecords.filter((r) => r.machineId === m.id))
    const machineAll = () => aggregate(all.filter((r) => r.machineId === m.id))

    add({
      id: `m-${m.id}-status`,
      label: `Como está a ${m.name}?`,
      keywords: [mid, 'como', 'esta', 'estado', 'resumo'],
      group: `Máquina ${m.name}`,
      answer: () => {
        const a = machineYear()
        const t = machineAll()
        const rated = active().sort((x, y) => (x.taxa ?? Infinity) - (y.taxa ?? Infinity))
        const pos = rated.findIndex((x) => x.m.id === m.id)
        const lines = [
          `${year}: ${a.of} OF, ${a.rnc} RNC, taxa ${fmt(a.taxa)}.`,
          `Total registado: ${t.of} OF, ${t.rnc} RNC (${fmt(t.taxa)}).`,
        ]
        if (pos >= 0) lines.push(`É a ${pos + 1}ª melhor taxa entre as ${rated.length} máquinas ativas em ${year}.`)
        if (m.status === 'discontinued') lines.push(`Atenção: ${m.statusNote || 'máquina descontinuada'}.`)
        return { title: `${m.name} — ${sectionName(db, m.sectionId)}`, lines, tone: taxaTone(a.taxa) }
      },
    })

    add({
      id: `m-${m.id}-rnc`,
      label: `Quantas RNC teve a ${m.name}?`,
      keywords: [mid, 'rnc', 'quantas', 'defeitos'],
      group: `Máquina ${m.name}`,
      answer: () => {
        const a = machineYear()
        return {
          title: `RNC da ${m.name} em ${year}`,
          lines: [`${a.rnc} RNC em ${a.of} OF (taxa ${fmt(a.taxa)}).`],
          tone: taxaTone(a.taxa),
        }
      },
    })

    add({
      id: `m-${m.id}-worst-month`,
      label: `Em que mês a ${m.name} teve mais RNC?`,
      keywords: [mid, 'mes', 'pior', 'mais rnc'],
      group: `Máquina ${m.name}`,
      answer: () => {
        const recs = yearRecords.filter((r) => r.machineId === m.id)
        if (!recs.length)
          return { title: `${m.name} por mês`, lines: [`Sem registos da ${m.name} em ${year}.`], tone: 'neutral' }
        const byMonth = [...new Set(recs.map((r) => r.month))].map((mo) => ({
          mo,
          a: aggregate(recs.filter((r) => r.month === mo)),
        }))
        const worst = byMonth.reduce((w, x) => (x.a.rnc > w.a.rnc ? x : w))
        return {
          title: `${m.name} — mês com mais RNC em ${year}`,
          lines: [`${MONTHS[worst.mo]}: ${worst.a.rnc} RNC em ${worst.a.of} OF (${fmt(worst.a.taxa)}).`],
          tone: taxaTone(worst.a.taxa),
        }
      },
    })
  })

  // Perguntas por secção.
  db.sections.forEach((s) => {
    const sid = norm(s.name)
    add({
      id: `s-${s.id}`,
      label: `Resumo da ${s.name}`,
      keywords: [sid, s.id, 'resumo', 'seccao'],
      group: 'Secções',
      answer: () => {
        const recs = yearRecords.filter((r) => r.sectionId === s.id)
        const a = aggregate(recs)
        if (!a.of && !a.rnc)
          return { title: s.name, lines: [`Sem registos da ${s.name} em ${year}.`], tone: 'neutral' }
        const best = active()
          .filter((x) => x.m.sectionId === s.id)
          .sort((x, y) => (x.taxa ?? Infinity) - (y.taxa ?? Infinity))[0]
        const lines = [`${year}: ${a.of} OF, ${a.rnc} RNC, taxa ${fmt(a.taxa)}. OF por RNC: ${fmtOfRnc(a)}.`]
        if (best) lines.push(`Melhor máquina da secção: ${best.m.name} (${fmt(best.taxa)}).`)
        return { title: `${s.name} — ${year}`, lines, tone: taxaTone(a.taxa) }
      },
    })
  })

  return { questions, year }
}

/* ------------------------------------------------------------------------ */
/* Vista                                                                     */
/* ------------------------------------------------------------------------ */

interface Asked {
  key: number
  question: string
  answer: Answer
}

export function Assistant({ db }: { db: Db }) {
  const { questions } = useMemo(() => buildQuestions(db), [db])
  const [query, setQuery] = useState('')
  const [asked, setAsked] = useState<Asked[]>([])

  const nq = norm(query)
  const tokens = nq ? nq.split(' ') : []

  const filtered = useMemo(() => {
    if (!tokens.length) return questions
    return questions.filter((q) => {
      const words = [...q.keywords.map(norm), ...norm(q.label).split(' ')]
      return tokens.every((t) => words.some((w) => fuzzyEq(t, w)))
    })
  }, [questions, nq]) // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => {
    const map = new Map<string, Question[]>()
    filtered.forEach((q) => {
      const list = map.get(q.group) ?? []
      list.push(q)
      map.set(q.group, list)
    })
    return [...map.entries()]
  }, [filtered])

  const ask = (q: Question) => {
    setAsked((prev) => [{ key: Date.now(), question: q.label, answer: q.answer() }, ...prev].slice(0, 8))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Mascot />
        <div>
          <h1 className="text-2xl font-semibold">Assistente</h1>
          <p className="text-sm text-muted-foreground">
            Escolhe uma pergunta pronta — ou escreve uma palavra (ex.:{' '}
            <span className="font-medium text-foreground">IF3</span>,{' '}
            <span className="font-medium text-foreground">pior</span>,{' '}
            <span className="font-medium text-foreground">flexo</span>) para filtrar as perguntas
            associadas. As respostas usam apenas os dados registados.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrar perguntas… (aceita erros de escrita)"
          className="pl-9"
          aria-label="Filtrar perguntas do assistente"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Limpar a pesquisa"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Respostas (mais recente primeiro) */}
      {asked.map((a) => (
        <Card key={a.key} className="omp-panel-in" style={{ borderLeft: `3px solid ${toneVar[a.answer.tone]}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-start justify-between gap-2 text-base">
              <span className="flex items-center gap-2">
                <Mascot size="xs" />
                {a.answer.title}
              </span>
              <button
                type="button"
                aria-label="Fechar esta resposta"
                onClick={() => setAsked((prev) => prev.filter((x) => x.key !== a.key))}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </CardTitle>
            <p className="text-xs text-muted-foreground">Pergunta: {a.question}</p>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {a.answer.lines.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Catálogo de perguntas */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="px-6 py-5 text-sm text-muted-foreground">
            Nenhuma pergunta corresponde a "{query}". Experimenta o nome de uma máquina (IF1–IF4,
            IR1–IR5), "pior", "melhor", "flexo", "roto" ou "dados".
          </CardContent>
        </Card>
      ) : (
        groups.map(([group, qs]) => (
          <div key={group}>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              {group}
              {group.startsWith('Máquina') && (
                <InfoTip text={`Perguntas prontas sobre a ${group.replace('Máquina ', '')}. Escreve o nome de outra máquina na pesquisa para veres as dela.`} />
              )}
            </h2>
            <div className="flex flex-wrap gap-2">
              {qs.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => ask(q)}
                  className="rounded-full border bg-card px-3.5 py-2 text-sm font-medium text-card-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      <p className="text-xs text-muted-foreground">
        Baseado apenas nos dados registados na app — o assistente nunca inventa valores.
      </p>
    </div>
  )
}
