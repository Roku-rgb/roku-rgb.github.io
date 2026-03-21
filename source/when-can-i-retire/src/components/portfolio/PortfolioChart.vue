<script setup lang="ts">
import { computed, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import type { PortfolioYearRow } from '../../types/portfolio'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps<{
  rows: PortfolioYearRow[]
  inflation: number
  currentAge: number
  isNominal: boolean
}>()

const emit = defineEmits<{ 'update:isNominal': [value: boolean] }>()

function inflationFactor(age: number): number {
  if (!props.isNominal) return 1
  return Math.pow(1 + props.inflation / 100, age - props.currentAge)
}

function inf(v: number, age: number): number {
  return Math.round(v * inflationFactor(age))
}

type ViewMode = 'net' | 'diverging' | 'grouped'
const viewMode = ref<ViewMode>('grouped')
/** 圖表與淨額是否納入一次性收入／支出；關閉時兩者皆排除 */
const includeOneTimeFlow = ref(true)

const INCOME_COLORS = ['#34d399', '#10b981', '#059669', '#047857', '#065f46']
const LMP_COLORS = ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f']
const RP_COLORS = ['#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6']
const EXPENSE_COLORS = ['#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b']
const INVEST_CONTRIB_COLORS = ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985']

const labels = computed(() => props.rows.map(r => r.age))

const allIncomeIds = computed(() => {
  const ids = new Set<string>()
  props.rows.forEach(r => r.incomes.forEach(i => { if (i.amount) ids.add(i.id) }))
  return [...ids]
})
const posIncomeIds = computed(() =>
  allIncomeIds.value.filter(id =>
    props.rows.some(r => (r.incomes.find(x => x.id === id)?.amount ?? 0) > 0),
  ),
)
const negIncomeIds = computed(() =>
  allIncomeIds.value.filter(id => !posIncomeIds.value.includes(id)),
)
const allExpenseIds = computed(() => {
  const ids = new Set<string>()
  props.rows.forEach(r => r.expenses.forEach(e => { if (e.amount) ids.add(e.id) }))
  return [...ids]
})
const allInvestContribIds = computed(() => {
  const ids = new Set<string>()
  props.rows.forEach(r => r.investContributions.forEach(c => { if (c.amount) ids.add(c.id) }))
  return [...ids]
})
const allLmpIds = computed(() => {
  const ids = new Set<string>()
  props.rows.forEach(r => r.lmpDetails.forEach(d => { if (d.withdraw) ids.add(d.id) }))
  return [...ids]
})
const allRpIds = computed(() => {
  const ids = new Set<string>()
  props.rows.forEach(r => r.rpDetails.forEach(d => { if (d.withdraw) ids.add(d.id) }))
  return [...ids]
})

function findLabel(rows: PortfolioYearRow[], type: 'income' | 'expense' | 'investContrib' | 'lmp' | 'rp', id: string): string {
  for (const r of rows) {
    const list = type === 'income' ? r.incomes
      : type === 'expense' ? r.expenses
      : type === 'investContrib' ? r.investContributions
      : type === 'lmp' ? r.lmpDetails
      : r.rpDetails
    const item = list.find(x => x.id === id)
    if (item) return item.label
  }
  return id
}

function isOneTimeItem(type: 'income' | 'expense', id: string): boolean {
  for (const r of props.rows) {
    const list = type === 'income' ? r.incomes : r.expenses
    const item = list.find(x => x.id === id)
    if (item) return item.isOneTime
  }
  return false
}

function labelFor(type: 'income' | 'expense' | 'investContrib' | 'lmp' | 'rp', id: string): string {
  const base = findLabel(props.rows, type, id)
  if ((type === 'income' || type === 'expense') && isOneTimeItem(type, id)) return `${base} (一次性)`
  return base
}

const filteredExpenseIds = computed(() => {
  if (includeOneTimeFlow.value) return allExpenseIds.value
  return allExpenseIds.value.filter(id => !isOneTimeItem('expense', id))
})

const filteredPosIncomeIds = computed(() => {
  if (includeOneTimeFlow.value) return posIncomeIds.value
  return posIncomeIds.value.filter(id => !isOneTimeItem('income', id))
})

const filteredNegIncomeIds = computed(() => {
  if (includeOneTimeFlow.value) return negIncomeIds.value
  return negIncomeIds.value.filter(id => !isOneTimeItem('income', id))
})

function oneTimeExpenseSum(r: PortfolioYearRow): number {
  return r.expenses
    .filter(e => e.isOneTime)
    .reduce((s, e) => s + e.amount, 0)
}

function oneTimeIncomeSum(r: PortfolioYearRow): number {
  return r.incomes
    .filter(i => i.isOneTime)
    .reduce((s, i) => s + i.amount, 0)
}

const chartDataDiverging = computed(() => {
  const incomeDatasets = filteredPosIncomeIds.value.map((id, i) => ({
    label: labelFor('income', id),
    data: props.rows.map(r => inf(r.incomes.find(x => x.id === id)?.amount ?? 0, r.age)),
    backgroundColor: INCOME_COLORS[i % INCOME_COLORS.length],
    borderRadius: 2,
    stack: 'income',
  }))

  const lmpDatasets = allLmpIds.value.map((id, i) => ({
    label: labelFor('lmp', id),
    data: props.rows.map(r => inf(r.lmpDetails.find(x => x.id === id)?.withdraw ?? 0, r.age)),
    backgroundColor: LMP_COLORS[i % LMP_COLORS.length],
    borderRadius: 2,
    stack: 'income',
  }))

  const rpDatasets = allRpIds.value.map((id, i) => ({
    label: labelFor('rp', id),
    data: props.rows.map(r => inf(r.rpDetails.find(x => x.id === id)?.withdraw ?? 0, r.age)),
    backgroundColor: RP_COLORS[i % RP_COLORS.length],
    borderRadius: 2,
    stack: 'income',
  }))

  const negIncomeDatasets = filteredNegIncomeIds.value.map((id, i) => ({
    label: labelFor('income', id),
    data: props.rows.map(r => inf(r.incomes.find(x => x.id === id)?.amount ?? 0, r.age)),
    backgroundColor: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
    borderRadius: 2,
    stack: 'expense',
  }))

  const expenseDatasets = filteredExpenseIds.value.map((id, i) => ({
    label: labelFor('expense', id),
    data: props.rows.map(r => -inf(r.expenses.find(x => x.id === id)?.amount ?? 0, r.age)),
    backgroundColor: EXPENSE_COLORS[(filteredNegIncomeIds.value.length + i) % EXPENSE_COLORS.length],
    borderRadius: 2,
    stack: 'expense',
  }))

  const investContribDatasets = allInvestContribIds.value.map((id, i) => ({
    label: labelFor('investContrib', id),
    data: props.rows.map(r => -inf(r.investContributions.find(x => x.id === id)?.amount ?? 0, r.age)),
    backgroundColor: INVEST_CONTRIB_COLORS[i % INVEST_CONTRIB_COLORS.length],
    borderRadius: 2,
    stack: 'expense',
  }))

  return { labels: labels.value, datasets: [...incomeDatasets, ...lmpDatasets, ...rpDatasets, ...negIncomeDatasets, ...expenseDatasets, ...investContribDatasets] }
})

const chartDataNet = computed(() => {
  const data = props.rows.map(r => {
    const adjusted = includeOneTimeFlow.value
      ? r.netFlow
      : r.netFlow + oneTimeExpenseSum(r) - oneTimeIncomeSum(r)
    return inf(adjusted, r.age)
  })
  const colors = props.rows.map((_, i) => data[i] >= 0 ? '#34d399' : '#f87171')
  return {
    labels: labels.value,
    datasets: [{ label: '淨現金流', data, backgroundColor: colors, borderRadius: 2 }],
  }
})

const chartDataGrouped = computed(() => {
  const incomeDatasets = filteredPosIncomeIds.value.map((id, i) => ({
    label: labelFor('income', id),
    data: props.rows.map(r => inf(r.incomes.find(x => x.id === id)?.amount ?? 0, r.age)),
    backgroundColor: INCOME_COLORS[i % INCOME_COLORS.length],
    borderRadius: 2,
    stack: 'income',
  }))

  const lmpDatasets = allLmpIds.value.map((id, i) => ({
    label: labelFor('lmp', id),
    data: props.rows.map(r => inf(r.lmpDetails.find(x => x.id === id)?.withdraw ?? 0, r.age)),
    backgroundColor: LMP_COLORS[i % LMP_COLORS.length],
    borderRadius: 2,
    stack: 'income',
  }))

  const rpDatasets = allRpIds.value.map((id, i) => ({
    label: labelFor('rp', id),
    data: props.rows.map(r => inf(r.rpDetails.find(x => x.id === id)?.withdraw ?? 0, r.age)),
    backgroundColor: RP_COLORS[i % RP_COLORS.length],
    borderRadius: 2,
    stack: 'income',
  }))

  const negIncomeDatasets = filteredNegIncomeIds.value.map((id, i) => ({
    label: labelFor('income', id),
    data: props.rows.map(r => -inf(r.incomes.find(x => x.id === id)?.amount ?? 0, r.age)),
    backgroundColor: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
    borderRadius: 2,
    stack: 'expense',
  }))

  const expenseDatasets = filteredExpenseIds.value.map((id, i) => ({
    label: labelFor('expense', id),
    data: props.rows.map(r => inf(r.expenses.find(x => x.id === id)?.amount ?? 0, r.age)),
    backgroundColor: EXPENSE_COLORS[(filteredNegIncomeIds.value.length + i) % EXPENSE_COLORS.length],
    borderRadius: 2,
    stack: 'expense',
  }))

  const investContribDatasets = allInvestContribIds.value.map((id, i) => ({
    label: labelFor('investContrib', id),
    data: props.rows.map(r => inf(r.investContributions.find(x => x.id === id)?.amount ?? 0, r.age)),
    backgroundColor: INVEST_CONTRIB_COLORS[i % INVEST_CONTRIB_COLORS.length],
    borderRadius: 2,
    stack: 'expense',
  }))

  return { labels: labels.value, datasets: [...incomeDatasets, ...lmpDatasets, ...rpDatasets, ...negIncomeDatasets, ...expenseDatasets, ...investContribDatasets] }
})

const chartData = computed(() => {
  if (viewMode.value === 'net') return chartDataNet.value
  if (viewMode.value === 'grouped') return chartDataGrouped.value
  return chartDataDiverging.value
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  scales: {
    x: {
      stacked: true,
      title: { display: true, text: '年齡', color: '#555d6a', font: { size: 11 } },
      ticks: { color: '#555d6a', font: { size: 11 } },
      grid: { color: '#1e293b' },
    },
    y: {
      stacked: viewMode.value !== 'net',
      ticks: {
        color: '#555d6a',
        font: { size: 11 },
        callback: (v: number | string) => `${v} 萬`,
      },
      grid: { color: '#1e293b' },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15,23,42,0.95)',
      borderColor: '#334155',
      borderWidth: 1,
      cornerRadius: 8,
      titleFont: { size: 14, weight: 'bold' as const },
      bodyFont: { size: 12 },
      padding: 12,
      filter: (item: { raw: unknown }) => item.raw !== 0,
      callbacks: {
        title: (items: { dataIndex: number }[]) => {
          const idx = items[0]?.dataIndex
          if (idx === undefined) return ''
          return `${props.rows[idx].age} 歲(年末)`
        },
        afterBody: (items: { dataIndex: number }[]) => {
          const idx = items[0]?.dataIndex
          if (idx === undefined) return []
          const r = props.rows[idx]
          const f = inflationFactor(r.age)
          const incRows = includeOneTimeFlow.value
            ? r.incomes
            : r.incomes.filter(i => !i.isOneTime)
          const posIncome = incRows.reduce((s, i) => s + Math.max(0, i.amount), 0)
          const negIncome = -incRows.reduce((s, i) => s + Math.min(0, i.amount), 0)
          const totalExp = includeOneTimeFlow.value
            ? r.expenses.reduce((s, e) => s + e.amount, 0)
            : r.expenses.filter(e => !e.isOneTime).reduce((s, e) => s + e.amount, 0)
          const chartIncome = (posIncome + r.totalLmpWithdraw + r.totalRpWithdraw) * f
          const chartExpense = (negIncome + totalExp + r.totalInvestContribution) * f
          return [
            `收入合計：${Math.round(chartIncome).toLocaleString()} 萬`,
            `支出合計：${Math.round(chartExpense).toLocaleString()} 萬`,
            `淨額：${Math.round(chartIncome - chartExpense).toLocaleString()} 萬`,
          ]
        },
      },
    },
  },
}))

const legendItems = computed(() => {
  const items: { color: string; label: string }[] = []
  filteredPosIncomeIds.value.forEach((id, i) => {
    items.push({ color: INCOME_COLORS[i % INCOME_COLORS.length], label: labelFor('income', id) })
  })
  allLmpIds.value.forEach((id, i) => {
    items.push({ color: LMP_COLORS[i % LMP_COLORS.length], label: labelFor('lmp', id) })
  })
  allRpIds.value.forEach((id, i) => {
    items.push({ color: RP_COLORS[i % RP_COLORS.length], label: labelFor('rp', id) })
  })
  filteredNegIncomeIds.value.forEach((id, i) => {
    items.push({ color: EXPENSE_COLORS[i % EXPENSE_COLORS.length], label: labelFor('income', id) })
  })
  filteredExpenseIds.value.forEach((id, i) => {
    items.push({ color: EXPENSE_COLORS[(filteredNegIncomeIds.value.length + i) % EXPENSE_COLORS.length], label: labelFor('expense', id) })
  })
  allInvestContribIds.value.forEach((id, i) => {
    items.push({ color: INVEST_CONTRIB_COLORS[i % INVEST_CONTRIB_COLORS.length], label: labelFor('investContrib', id) })
  })
  return items
})
</script>

<template>
  <div v-if="rows.length" class="chart-container">
    <div class="chart-header">
      <div class="chart-title">
        合計現金流
        <span class="chart-unit">（單位：萬元，{{ isNominal ? '名目' : '實質購買力' }}）</span>
      </div>
      <div class="toggle-row">
        <div class="toggle-group">
          <button class="toggle-btn" :class="{ active: includeOneTimeFlow }" @click="includeOneTimeFlow = !includeOneTimeFlow">一次性收支</button>
        </div>
        <div class="toggle-group">
          <button class="toggle-btn" :class="{ active: viewMode === 'diverging' }" @click="viewMode = 'diverging'">收支分離</button>
          <button class="toggle-btn" :class="{ active: viewMode === 'grouped' }" @click="viewMode = 'grouped'">收支並排</button>
          <button class="toggle-btn" :class="{ active: viewMode === 'net' }" @click="viewMode = 'net'">淨額</button>
        </div>
        <div class="toggle-group">
          <button class="toggle-btn" :class="{ active: !isNominal }" @click="emit('update:isNominal', false)">實質購買力</button>
          <button class="toggle-btn" :class="{ active: isNominal }" @click="emit('update:isNominal', true)">名目</button>
        </div>
      </div>
    </div>
    <div class="chart-wrapper">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
    <div class="chart-legend" v-if="viewMode !== 'net'">
      <span v-for="item in legendItems" :key="item.label">
        <span class="legend-dot" :style="{ background: item.color }"></span>{{ item.label }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 20px 8px 8px 0;
  margin-bottom: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}
.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 20px;
  padding-right: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}
.chart-title {
  font-size: 13px;
  color: #8a919e;
  font-weight: 500;
}
.chart-unit {
  font-size: 11px;
  color: #555d6a;
}
.toggle-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.toggle-group {
  display: flex;
  background: #1e293b;
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}
.toggle-btn {
  padding: 4px 10px;
  font-size: 11px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  background: transparent;
  transition: all 0.2s;
  font-family: inherit;
}
.toggle-btn.active {
  background: #334155;
  color: #e8eaed;
}
.toggle-btn:hover:not(.active) {
  color: #94a3b8;
}
.chart-wrapper {
  height: 320px;
  padding: 0 12px;
}
.chart-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 8px 0 4px;
  font-size: 11px;
  color: #8a919e;
  flex-wrap: wrap;
}
.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 4px;
  vertical-align: middle;
}
</style>
