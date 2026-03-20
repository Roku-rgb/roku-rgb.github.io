export type ValueBasis = 'nominal' | 'real'

export interface IncomeSource {
  id: string
  label: string
  annualAmount: number
  amountBasis: ValueBasis
  growthRate: number
  growthBasis: ValueBasis
  fromAge: number
  toAge: number
  isOneTime: boolean
  occurAge: number
}

export type ExpenseSource = IncomeSource

export interface LmpGroup {
  id: string
  label: string
  rate: number
  rateBasis: ValueBasis
  annualWithdraw: number
  withdrawBasis: ValueBasis
  fromAge: number
  toAge: number
}

export interface RpGroup {
  id: string
  label: string
  rate: number
  rateBasis: ValueBasis
  annualWithdraw: number
  withdrawBasis: ValueBasis
  fromAge: number
  toAge: number
}

export interface Investment {
  id: string
  label: string
  rate: number
  rateBasis: ValueBasis
  initialValue: number
  initialValueBasis: ValueBasis
  monthlyContribution: number
  monthlyContributionBasis: ValueBasis
  fromAge: number
  toAge: number
}

export type PortfolioItem =
  | { type: 'income'; data: IncomeSource }
  | { type: 'expense'; data: ExpenseSource }
  | { type: 'invest'; data: Investment }
  | { type: 'lmp'; data: LmpGroup }
  | { type: 'rp'; data: RpGroup }

export interface GroupTab {
  id: string
  label: string
  items: PortfolioItem[]
}

export interface PortfolioInputs {
  currentAge: number
  totalAssets: number
  inflation: number
  incomeSources: IncomeSource[]
  expenseSources: ExpenseSource[]
  investments: Investment[]
  lmpGroups: LmpGroup[]
  rpGroups: RpGroup[]
}

export interface PortfolioYearRow {
  age: number
  idleAssets: number
  incomes: { id: string; label: string; amount: number; isOneTime: boolean }[]
  totalIncome: number
  expenses: { id: string; label: string; amount: number; isOneTime: boolean }[]
  totalExpenseFlow: number
  lmpDetails: { id: string; label: string; withdraw: number; balanceEnd: number }[]
  totalLmpWithdraw: number
  rpDetails: { id: string; label: string; withdraw: number; balanceEnd: number }[]
  totalRpWithdraw: number
  investDetails: { id: string; label: string; value: number }[]
  investContributions: { id: string; label: string; amount: number }[]
  totalInvestContribution: number
  totalInvestValue: number
  totalExpense: number
  netFlow: number
}

export interface GroupRequired {
  id: string
  label: string
  requiredValue: number
}

export interface InvestmentResult {
  id: string
  label: string
  endValue: number
}

export interface PortfolioResult {
  lmpRequired: GroupRequired[]
  rpRequired: GroupRequired[]
  investmentResults: InvestmentResult[]
  totalLmpRequired: number
  totalRpRequired: number
  totalRequired: number
  totalInvestEnd: number
  totalFunded: number
  gap: number
  rows: PortfolioYearRow[]
}
