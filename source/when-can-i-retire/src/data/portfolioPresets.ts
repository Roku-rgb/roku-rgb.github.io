import type { IncomeSource, ExpenseSource, Investment, LmpGroup, RpGroup, PortfolioItem, GroupTab } from '../types/portfolio'

type TemplateItem =
  | { type: 'income'; data: Omit<IncomeSource, 'id'> }
  | { type: 'expense'; data: Omit<ExpenseSource, 'id'> }
  | { type: 'invest'; data: Omit<Investment, 'id'> }
  | { type: 'lmp'; data: Omit<LmpGroup, 'id'> }
  | { type: 'rp'; data: Omit<RpGroup, 'id'> }

export interface PortfolioPreset {
  label: string
  description: string
  currentAge: number
  totalAssets: number
  inflation: number
  groupTemplates: Array<{
    label: string
    items: TemplateItem[]
  }>
}

/** Hydrate a preset into live state with unique IDs. */
export function hydratePreset(
  preset: PortfolioPreset,
  uid: () => string,
): { currentAge: number; totalAssets: number; inflation: number; groupTabs: GroupTab[] } {
  return {
    currentAge: preset.currentAge,
    totalAssets: preset.totalAssets,
    inflation: preset.inflation,
    groupTabs: preset.groupTemplates.map(g => ({
      id: uid(),
      label: g.label,
      items: g.items.map(item => ({
        type: item.type,
        data: { ...item.data, id: uid() },
      })) as PortfolioItem[],
    })),
  }
}

export const PORTFOLIO_PRESETS: PortfolioPreset[] = [
  {
    label: '【單身】28歲提早退休 FIRE 型',
    description: '高儲蓄率、積極投資，目標 45 歲達到財務自由',
    currentAge: 28,
    totalAssets: 50,
    inflation: 2,
    groupTemplates: [
      {
        label: 'FIRE 計畫',
        items: [
          { type: 'income', data: { label: '本業收入', annualAmount: 72, amountBasis: 'nominal', growthRate: 3, growthBasis: 'nominal', fromAge: 28, toAge: 44, isOneTime: false, occurAge: 28 } },
          { type: 'income', data: { label: '副業 / 被動收入', annualAmount: 6, amountBasis: 'real', growthRate: 3, growthBasis: 'real', fromAge: 30, toAge: 55, isOneTime: false, occurAge: 30 } },
          { type: 'expense', data: { label: '極簡生活費', annualAmount: 28, amountBasis: 'real', growthRate: 0, growthBasis: 'real', fromAge: 28, toAge: 85, isOneTime: false, occurAge: 28 } },
          { type: 'invest', data: { label: '全球股票 ETF - FIRE 財務自由', rate: 8, rateBasis: 'nominal', initialValue: 40, initialValueBasis: 'real', monthlyContribution: 2.5, monthlyContributionBasis: 'real', fromAge: 28, toAge: 45 } },
          { type: 'lmp', data: { label: '基本開銷 LMP', rate: 1.5, rateBasis: 'real', annualWithdraw: 28, withdrawBasis: 'real', fromAge: 45, toAge: 85 } },
          { type: 'rp', data: { label: '生活品質 RP', rate: 7, rateBasis: 'real', annualWithdraw: 12, withdrawBasis: 'real', fromAge: 45, toAge: 85 } },
        ],
      },
    ],
  },
  {
    label: '【單身】30歲上班族退休規劃',
    description: '年薪 60 萬、生活費 36 萬，52 歲退休後以 LMP + RP 提領',
    currentAge: 30,
    totalAssets: 50,
    inflation: 2,
    groupTemplates: [
      {
        label: '工作期',
        items: [
          { type: 'income', data: { label: '薪資收入', annualAmount: 60, amountBasis: 'nominal', growthRate: 2, growthBasis: 'nominal', fromAge: 30, toAge: 51, isOneTime: false, occurAge: 30 } },
          { type: 'expense', data: { label: '基本生活費', annualAmount: 36, amountBasis: 'real', growthRate: 0, growthBasis: 'real', fromAge: 30, toAge: 85, isOneTime: false, occurAge: 30 } },
          { type: 'invest', data: { label: '指數型 ETF - 退休金準備', rate: 8, rateBasis: 'nominal', initialValue: 30, initialValueBasis: 'real', monthlyContribution: 2, monthlyContributionBasis: 'real', fromAge: 30, toAge: 52 } },
        ],
      },
      {
        label: '退休期',
        items: [
          { type: 'lmp', data: { label: '退休 LMP', rate: 1.5, rateBasis: 'real', annualWithdraw: 36, withdrawBasis: 'real', fromAge: 52, toAge: 85 } },
          { type: 'rp', data: { label: '退休 RP', rate: 6, rateBasis: 'real', annualWithdraw: 10, withdrawBasis: 'real', fromAge: 52, toAge: 85 } },
        ],
      },
    ],
  },
  {
    label: '【家庭】30歲雙薪家庭穩健型',
    description: '夫妻合計年收 100 萬、家庭支出 70 萬，60 歲退休，保守配置',
    currentAge: 30,
    totalAssets: 150,
    inflation: 2,
    groupTemplates: [
      {
        label: '工作期',
        items: [
          { type: 'income', data: { label: '主要薪資', annualAmount: 60, amountBasis: 'nominal', growthRate: 2, growthBasis: 'nominal', fromAge: 30, toAge: 59, isOneTime: false, occurAge: 30 } },
          { type: 'income', data: { label: '配偶薪資', annualAmount: 40, amountBasis: 'nominal', growthRate: 2, growthBasis: 'nominal', fromAge: 30, toAge: 59, isOneTime: false, occurAge: 30 } },
          { type: 'expense', data: { label: '家庭生活費', annualAmount: 55, amountBasis: 'real', growthRate: 0, growthBasis: 'real', fromAge: 30, toAge: 85, isOneTime: false, occurAge: 30 } },
          { type: 'expense', data: { label: '子女教育費', annualAmount: 15, amountBasis: 'real', growthRate: 0, growthBasis: 'real', fromAge: 38, toAge: 55, isOneTime: false, occurAge: 38 } },
          { type: 'invest', data: { label: '穩健配置 ETF - 退休金準備', rate: 5, rateBasis: 'nominal', initialValue: 100, initialValueBasis: 'real', monthlyContribution: 1.5, monthlyContributionBasis: 'real', fromAge: 30, toAge: 60 } },
        ],
      },
      {
        label: '退休期',
        items: [
          { type: 'lmp', data: { label: '生活費 LMP', rate: 1.5, rateBasis: 'real', annualWithdraw: 50, withdrawBasis: 'real', fromAge: 60, toAge: 85 } },
          { type: 'rp', data: { label: '旅遊基金 RP', rate: 5, rateBasis: 'real', annualWithdraw: 15, withdrawBasis: 'real', fromAge: 60, toAge: 80 } },
        ],
      },
    ],
  },
  {
    label: '【家庭】35歲雙薪房貸家庭',
    description: '夫妻年收合計 130 萬、房貸 1200 萬（30 年），含子女教育，65 歲退休',
    currentAge: 35,
    totalAssets: 100,
    inflation: 2,
    groupTemplates: [
      {
        label: '還房貸期',
        items: [
          { type: 'income', data: { label: '主要薪資', annualAmount: 75, amountBasis: 'nominal', growthRate: 2, growthBasis: 'nominal', fromAge: 35, toAge: 64, isOneTime: false, occurAge: 35 } },
          { type: 'income', data: { label: '配偶薪資', annualAmount: 55, amountBasis: 'nominal', growthRate: 2, growthBasis: 'nominal', fromAge: 35, toAge: 59, isOneTime: false, occurAge: 35 } },
          { type: 'expense', data: { label: '房貸月付', annualAmount: 54, amountBasis: 'nominal', growthRate: 0, growthBasis: 'nominal', fromAge: 35, toAge: 64, isOneTime: false, occurAge: 35 } },
          { type: 'expense', data: { label: '家庭生活費', annualAmount: 48, amountBasis: 'real', growthRate: 0, growthBasis: 'real', fromAge: 35, toAge: 85, isOneTime: false, occurAge: 35 } },
          { type: 'expense', data: { label: '子女教育費', annualAmount: 20, amountBasis: 'real', growthRate: 0, growthBasis: 'real', fromAge: 38, toAge: 55, isOneTime: false, occurAge: 38 } },
          { type: 'invest', data: { label: '穩健配置 ETF - 退休金準備', rate: 6, rateBasis: 'nominal', initialValue: 80, initialValueBasis: 'real', monthlyContribution: 1.5, monthlyContributionBasis: 'real', fromAge: 35, toAge: 65 } },
        ],
      },
      {
        label: '退休期',
        items: [
          { type: 'lmp', data: { label: '退休 LMP', rate: 1.5, rateBasis: 'real', annualWithdraw: 48, withdrawBasis: 'real', fromAge: 65, toAge: 85 } },
          { type: 'rp', data: { label: '退休 RP', rate: 5, rateBasis: 'real', annualWithdraw: 15, withdrawBasis: 'real', fromAge: 65, toAge: 85 } },
        ],
      },
    ],
  },
  {
    label: '【家庭】40歲中年起步規劃',
    description: '40 歲才開始規劃，年薪 70 萬、資產 100 萬，65 歲退休加速追趕',
    currentAge: 40,
    totalAssets: 100,
    inflation: 2,
    groupTemplates: [
      {
        label: '工作期',
        items: [
          { type: 'income', data: { label: '薪資收入', annualAmount: 70, amountBasis: 'nominal', growthRate: 2, growthBasis: 'nominal', fromAge: 40, toAge: 64, isOneTime: false, occurAge: 40 } },
          { type: 'expense', data: { label: '生活費', annualAmount: 36, amountBasis: 'real', growthRate: 0, growthBasis: 'real', fromAge: 40, toAge: 85, isOneTime: false, occurAge: 40 } },
          { type: 'expense', data: { label: '子女教育費', annualAmount: 12, amountBasis: 'real', growthRate: 0, growthBasis: 'real', fromAge: 40, toAge: 55, isOneTime: false, occurAge: 40 } },
          { type: 'invest', data: { label: '全球股債配置 ETF - 退休金追趕', rate: 6, rateBasis: 'nominal', initialValue: 80, initialValueBasis: 'real', monthlyContribution: 1.5, monthlyContributionBasis: 'real', fromAge: 40, toAge: 65 } },
        ],
      },
      {
        label: '退休期',
        items: [
          { type: 'lmp', data: { label: '退休 LMP', rate: 1.5, rateBasis: 'real', annualWithdraw: 36, withdrawBasis: 'real', fromAge: 65, toAge: 85 } },
          { type: 'rp', data: { label: '退休 RP', rate: 5, rateBasis: 'real', annualWithdraw: 10, withdrawBasis: 'real', fromAge: 65, toAge: 85 } },
        ],
      },
    ],
  },
  {
    label: '【單身】50歲衝刺退休規劃',
    description: '50 歲開始認真規劃，年薪 80 萬、資產 300 萬，65 歲退休全力衝刺',
    currentAge: 50,
    totalAssets: 300,
    inflation: 2,
    groupTemplates: [
      {
        label: '工作期',
        items: [
          { type: 'income', data: { label: '薪資收入', annualAmount: 80, amountBasis: 'nominal', growthRate: 1.5, growthBasis: 'nominal', fromAge: 50, toAge: 64, isOneTime: false, occurAge: 50 } },
          { type: 'expense', data: { label: '生活費', annualAmount: 40, amountBasis: 'real', growthRate: 0, growthBasis: 'real', fromAge: 50, toAge: 85, isOneTime: false, occurAge: 50 } },
          { type: 'invest', data: { label: '穩健型 ETF - 退休金衝刺', rate: 5, rateBasis: 'nominal', initialValue: 250, initialValueBasis: 'real', monthlyContribution: 2, monthlyContributionBasis: 'real', fromAge: 50, toAge: 65 } },
        ],
      },
      {
        label: '退休期',
        items: [
          { type: 'lmp', data: { label: '退休 LMP', rate: 1.5, rateBasis: 'real', annualWithdraw: 40, withdrawBasis: 'real', fromAge: 65, toAge: 85 } },
          { type: 'rp', data: { label: '退休 RP', rate: 4, rateBasis: 'real', annualWithdraw: 8, withdrawBasis: 'real', fromAge: 65, toAge: 85 } },
        ],
      },
    ],
  },
]
