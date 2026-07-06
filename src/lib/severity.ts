// Cores por severidade da taxa de RNC.
// Regra de leitura: verde só representa 0 RNC; âmbar até 5%; vermelho acima de 5%.

export type Tone = 'success' | 'warning' | 'danger' | 'neutral'

export function taxaTone(taxa: number | null): Tone {
  if (taxa === null) return 'neutral'
  if (taxa === 0) return 'success'
  if (taxa <= 5) return 'warning'
  return 'danger'
}

/** Fundo + texto legível (usar em badges/pílulas). */
export const toneBadge: Record<Tone, string> = {
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  danger: 'bg-destructive text-white',
  neutral: 'bg-muted text-muted-foreground',
}

/** Cor sólida para barras de gráfico (via CSS var). */
export const toneVar: Record<Tone, string> = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--destructive)',
  neutral: 'var(--muted-foreground)',
}

export const toneLabel: Record<Tone, string> = {
  success: 'Sem RNC',
  warning: 'A vigiar',
  danger: 'Crítico',
  neutral: 'Sem dados',
}
