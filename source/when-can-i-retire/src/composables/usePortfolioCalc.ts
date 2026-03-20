import { computed, type Ref } from 'vue'
import { annuityDuePV, nominalToReal } from '../utils/finance'
import type {
  IncomeSource,
  ExpenseSource,
  Investment,
  LmpGroup,
  RpGroup,
  PortfolioYearRow,
  GroupRequired,
  InvestmentResult,
  PortfolioResult,
} from '../types/portfolio'
import type { ValueBasis } from '../types/portfolio'

function toReal(rate: number, rateBasis: ValueBasis, inflation: number): number {
  return rateBasis === 'nominal' ? nominalToReal(rate / 100, inflation / 100) : rate / 100
}

/**
 * Required capital at fromAge for a withdraw group (LMP or RP).
 * Annuity-due: withdraw at the start of each year, balance grows at end.
 *
 * withdrawBasis 'real'    → constant purchasing power → PV with real rate
 * withdrawBasis 'nominal' → constant nominal dollars  → PV with nominal rate
 *   (nominal PV in real terms = annuityDuePV(W, nomRate, n) because
 *    real PV = Σ W/(1+inf)^k / (1+rReal)^k = Σ W / (1+rNom)^k)
 */
function calcGroupRequired(
  annualWithdraw: number,
  withdrawBasis: ValueBasis,
  rate: number,
  rateBasis: ValueBasis,
  fromAge: number,
  toAge: number,
  inflation: number,
): number {
  const n = toAge - fromAge + 1
  if (n <= 0) return 0

  const realRate = toReal(rate, rateBasis, inflation)

  if (withdrawBasis === 'real') {
    return annuityDuePV(annualWithdraw, realRate, n)
  }
  const nominalRate = (1 + realRate) * (1 + inflation / 100) - 1
  return annuityDuePV(annualWithdraw, nominalRate, n)
}

function calcInvestEnd(
  inv: Investment,
  inflation: number,
): number {
  const realRate = toReal(inv.rate, inv.rateBasis, inflation)
  const n = inv.toAge - inv.fromAge
  if (n <= 0) return inv.initialValue

  const annual = inv.monthlyContribution * 12
  let bal = inv.initialValue
  for (let i = 0; i < n; i++) {
    bal = bal * (1 + realRate) + annual
  }
  return bal
}

function simulate(
  currentAge: number,
  totalAssets: number,
  inflation: number,
  incomeSources: IncomeSource[],
  expenseSources: ExpenseSource[],
  investments: Investment[],
  lmpGroups: LmpGroup[],
  rpGroups: RpGroup[],
  lmpRequired: GroupRequired[],
  rpRequired: GroupRequired[],
): PortfolioYearRow[] {
  const allAges = [
    ...lmpGroups.flatMap(g => [g.fromAge, g.toAge]),
    ...rpGroups.flatMap(g => [g.fromAge, g.toAge]),
    ...incomeSources.flatMap(s => s.isOneTime ? [s.occurAge] : [s.fromAge, s.toAge]),
    ...expenseSources.flatMap(s => s.isOneTime ? [s.occurAge] : [s.fromAge, s.toAge]),
    ...investments.flatMap(i => [i.fromAge, i.toAge]),
  ]
  if (allAges.length === 0) return []

  const minAge = Math.min(currentAge, ...allAges)
  const maxAge = Math.max(...allAges)
  const inf = inflation / 100

  let idleAssets = totalAssets

  const lmpBal = new Map<string, number>()
  const rpBal = new Map<string, number>()
  const invBal = new Map<string, number>()

  for (const g of lmpGroups) lmpBal.set(g.id, 0)
  for (const g of rpGroups) rpBal.set(g.id, 0)
  for (const inv of investments) invBal.set(inv.id, 0)

  const rows: PortfolioYearRow[] = []

  for (let age = minAge; age <= maxAge; age++) {
    // Idle cash earns 0% nominal → loses purchasing power in real terms
    if (age > minAge) {
      idleAssets /= (1 + inf)
    }

    // Investment start: fund initial value from idle assets
    for (const inv of investments) {
      if (age === inv.fromAge) {
        idleAssets -= inv.initialValue
        invBal.set(inv.id, inv.initialValue)
      }
    }

    // Investment maturity: transfer accumulated value to idle assets
    for (const inv of investments) {
      if (age === inv.toAge) {
        const bal = invBal.get(inv.id) ?? 0
        idleAssets += bal
        invBal.set(inv.id, 0)
      }
    }

    // Seed group balances from idle assets at fromAge
    for (const g of lmpGroups) {
      if (age === g.fromAge) {
        const req = lmpRequired.find(r => r.id === g.id)
        const val = req ? req.requiredValue : 0
        idleAssets -= val
        lmpBal.set(g.id, val)
      }
    }
    for (const g of rpGroups) {
      if (age === g.fromAge) {
        const req = rpRequired.find(r => r.id === g.id)
        const val = req ? req.requiredValue : 0
        idleAssets -= val
        rpBal.set(g.id, val)
      }
    }

    // Income flows into idle assets
    const incomes = incomeSources.map(s => {
      if (s.isOneTime) {
        if (age !== s.occurAge) return { id: s.id, label: s.label, amount: 0, isOneTime: true }
        const realAmount = s.amountBasis === 'nominal'
          ? s.annualAmount / Math.pow(1 + inf, s.occurAge - currentAge)
          : s.annualAmount
        return { id: s.id, label: s.label, amount: realAmount, isOneTime: true }
      }
      if (age < s.fromAge || age > s.toAge)
        return { id: s.id, label: s.label, amount: 0, isOneTime: false }
      const k = age - s.fromAge
      const baseReal = s.amountBasis === 'nominal'
        ? s.annualAmount / Math.pow(1 + inf, s.fromAge - currentAge)
        : s.annualAmount
      const realGrowth =
        s.growthBasis === 'nominal'
          ? (1 + s.growthRate / 100) / (1 + inf) - 1
          : s.growthRate / 100
      const amount = baseReal * Math.pow(1 + realGrowth, k)
      return { id: s.id, label: s.label, amount, isOneTime: false }
    })
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
    idleAssets += totalIncome

    // Expense flows out of idle assets
    const expenses = expenseSources.map(s => {
      if (s.isOneTime) {
        if (age !== s.occurAge) return { id: s.id, label: s.label, amount: 0, isOneTime: true }
        const realAmount = s.amountBasis === 'nominal'
          ? s.annualAmount / Math.pow(1 + inf, s.occurAge - currentAge)
          : s.annualAmount
        return { id: s.id, label: s.label, amount: realAmount, isOneTime: true }
      }
      if (age < s.fromAge || age > s.toAge)
        return { id: s.id, label: s.label, amount: 0, isOneTime: false }
      const k = age - s.fromAge
      const baseReal = s.amountBasis === 'nominal'
        ? s.annualAmount / Math.pow(1 + inf, s.fromAge - currentAge)
        : s.annualAmount
      const realGrowth =
        s.growthBasis === 'nominal'
          ? (1 + s.growthRate / 100) / (1 + inf) - 1
          : s.growthRate / 100
      const amount = baseReal * Math.pow(1 + realGrowth, k)
      return { id: s.id, label: s.label, amount, isOneTime: false }
    })
    const totalExpenseFlow = expenses.reduce((s, e) => s + e.amount, 0)
    idleAssets -= totalExpenseFlow

    // LMP withdrawals (annuity-due: withdraw at start of year, then grow)
    const lmpDetails = lmpGroups.map(g => {
      const bal = lmpBal.get(g.id) ?? 0
      if (age < g.fromAge || age > g.toAge)
        return { id: g.id, label: g.label, withdraw: 0, balanceEnd: bal }
      const realW = g.withdrawBasis === 'nominal'
        ? g.annualWithdraw / Math.pow(1 + inf, age - currentAge)
        : g.annualWithdraw
      const w = Math.min(realW, bal)
      const rr = toReal(g.rate, g.rateBasis, inflation)
      const newBal = Math.max(0, (bal - w) * (1 + rr))
      lmpBal.set(g.id, newBal)
      return { id: g.id, label: g.label, withdraw: w, balanceEnd: newBal }
    })

    // RP withdrawals
    const rpDetails = rpGroups.map(g => {
      const bal = rpBal.get(g.id) ?? 0
      if (age < g.fromAge || age > g.toAge)
        return { id: g.id, label: g.label, withdraw: 0, balanceEnd: bal }
      const realW = g.withdrawBasis === 'nominal'
        ? g.annualWithdraw / Math.pow(1 + inf, age - currentAge)
        : g.annualWithdraw
      const w = Math.min(realW, bal)
      const rr = toReal(g.rate, g.rateBasis, inflation)
      const newBal = Math.max(0, (bal - w) * (1 + rr))
      rpBal.set(g.id, newBal)
      return { id: g.id, label: g.label, withdraw: w, balanceEnd: newBal }
    })

    // Investment growth + monthly contributions from idle assets
    const investContributions: { id: string; label: string; amount: number }[] = []
    const investDetails = investments.map(inv => {
      let bal = invBal.get(inv.id) ?? 0
      if (age >= inv.fromAge && age < inv.toAge) {
        const annual = inv.monthlyContribution * 12
        idleAssets -= annual
        const rr = toReal(inv.rate, inv.rateBasis, inflation)
        bal = bal * (1 + rr) + annual
        invBal.set(inv.id, bal)
        investContributions.push({ id: inv.id, label: inv.label, amount: annual })
      } else {
        investContributions.push({ id: inv.id, label: inv.label, amount: 0 })
      }
      return { id: inv.id, label: inv.label, value: bal }
    })
    const totalInvestContrib = investContributions.reduce((s, c) => s + c.amount, 0)

    const totalLmpW = lmpDetails.reduce((s, d) => s + d.withdraw, 0)
    const totalRpW = rpDetails.reduce((s, d) => s + d.withdraw, 0)
    const totalExpense = totalLmpW + totalRpW
    idleAssets += totalExpense

    rows.push({
      age,
      idleAssets,
      incomes,
      totalIncome,
      expenses,
      totalExpenseFlow,
      lmpDetails,
      totalLmpWithdraw: totalLmpW,
      rpDetails,
      totalRpWithdraw: totalRpW,
      investDetails,
      investContributions,
      totalInvestContribution: totalInvestContrib,
      totalInvestValue: investDetails.reduce((s, d) => s + d.value, 0),
      totalExpense,
      netFlow: totalIncome + totalLmpW + totalRpW - totalExpenseFlow - totalInvestContrib,
    })
  }

  return rows
}

export function usePortfolioCalc(
  currentAge: Ref<number>,
  totalAssets: Ref<number>,
  inflation: Ref<number>,
  incomeSources: Ref<IncomeSource[]>,
  expenseSources: Ref<ExpenseSource[]>,
  investments: Ref<Investment[]>,
  lmpGroups: Ref<LmpGroup[]>,
  rpGroups: Ref<RpGroup[]>,
) {
  return computed<PortfolioResult>(() => {
    const inf = inflation.value

    const curAge = currentAge.value
    const infDec = inf / 100

    const lmpReq = lmpGroups.value.map(g => {
      const pv = calcGroupRequired(
        g.annualWithdraw, g.withdrawBasis, g.rate, g.rateBasis,
        g.fromAge, g.toAge, inf,
      )
      // Nominal PV is in fromAge-frame; deflate to currentAge-frame
      const deflator = g.withdrawBasis === 'nominal'
        ? Math.pow(1 + infDec, g.fromAge - curAge)
        : 1
      return { id: g.id, label: g.label, requiredValue: pv / deflator }
    })

    const rpReq = rpGroups.value.map(g => {
      const pv = calcGroupRequired(
        g.annualWithdraw, g.withdrawBasis, g.rate, g.rateBasis,
        g.fromAge, g.toAge, inf,
      )
      const deflator = g.withdrawBasis === 'nominal'
        ? Math.pow(1 + infDec, g.fromAge - curAge)
        : 1
      return { id: g.id, label: g.label, requiredValue: pv / deflator }
    })

    const investRes: InvestmentResult[] = investments.value.map(inv => ({
      id: inv.id,
      label: inv.label,
      endValue: calcInvestEnd(inv, inf),
    }))

    const totalLmpReq = lmpReq.reduce((s, g) => s + g.requiredValue, 0)
    const totalRpReq = rpReq.reduce((s, g) => s + g.requiredValue, 0)
    const totalReq = totalLmpReq + totalRpReq
    const totalInvEnd = investRes.reduce((s, i) => s + i.endValue, 0)
    const totalFunded = totalAssets.value + totalInvEnd
    const gap = totalFunded - totalReq

    const rows = simulate(
      currentAge.value, totalAssets.value, inf,
      incomeSources.value, expenseSources.value, investments.value,
      lmpGroups.value, rpGroups.value,
      lmpReq, rpReq,
    )

    return {
      lmpRequired: lmpReq,
      rpRequired: rpReq,
      investmentResults: investRes,
      totalLmpRequired: totalLmpReq,
      totalRpRequired: totalRpReq,
      totalRequired: totalReq,
      totalInvestEnd: totalInvEnd,
      totalFunded,
      gap,
      rows,
    }
  })
}
