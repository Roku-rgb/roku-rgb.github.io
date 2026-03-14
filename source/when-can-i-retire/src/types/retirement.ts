export interface ChartDataPoint {
  age: number
  assets: number
  lmp: number
  rp: number
  target: number
  surplus: number
}

export interface RetireDetails {
  age: number
  assets: number
  lmp: number
  rp: number
  target: number
  yearsToRetire: number
  totalAnnualSpend: number
}

export interface CalcResult {
  data: ChartDataPoint[]
  retireAge: number | null
  retireDetails: RetireDetails | null
}

export interface SliderConfig {
  label: string
  min: number
  max: number
  step: number
  unit?: string
  format?: (v: number) => string
}
