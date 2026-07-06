// Modelo de dados v3 — mantém compatibilidade total com a app antiga (legacy/).

export type Shift = 'Manhã' | 'Tarde' | 'Noite'
export type MachineStatus = 'active' | 'discontinued'

export interface Section {
  id: string
  name: string
}

export interface Machine {
  id: string
  name: string
  sectionId: string
  manufacturer?: string
  year?: string
  colors?: string
  width?: string
  status: MachineStatus
  statusNote?: string
  notes?: string
}

export interface Team {
  id: string
  name: string
  sectionId: string
  machineId: string
  shift: string
  members: string[]
}

export interface Worker {
  id: string
  number?: string
  name: string
  teamId?: string
  shift?: string
  nationality?: string
  birthDate?: string
  yearsCompany?: number
  yearsPrinting?: number
  role?: string
  notes?: string
}

export interface ProductionRecord {
  id: string
  year: number
  month: number
  sectionId: string
  machineId: string
  teamId?: string
  shift?: string
  workerIds: string[]
  jobs: number
  rnc: number
  cause?: string
  notes?: string
}

export interface Db {
  app: string
  version: number
  dataRevision: number
  updatedAt: string
  sections: Section[]
  machines: Machine[]
  teams: Team[]
  workers: Worker[]
  productionRecords: ProductionRecord[]
  rncCauses: unknown[]
  trainingRecords: unknown[]
  archives: Archive[]
}

export interface Archive {
  id: string
  createdAt: string
  reason: string
  db: Db
}

/** Resultado agregado de um conjunto de registos. */
export interface Aggregate {
  of: number
  rnc: number
  /** Taxa RNC por 100 OF; null quando não há OF. */
  taxa: number | null
  /** OF por RNC; null quando não há RNC. */
  ofRnc: number | null
}
