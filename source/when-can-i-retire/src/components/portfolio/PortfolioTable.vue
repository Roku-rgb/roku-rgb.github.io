<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { PortfolioYearRow } from '../../types/portfolio'

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

function findLabel(type: 'income' | 'expense' | 'invest' | 'lmp' | 'rp', id: string): string {
  for (const r of props.rows) {
    const list = type === 'income' ? r.incomes
      : type === 'expense' ? r.expenses
      : type === 'invest' ? r.investDetails
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

const rowByAge = computed(() => {
  const map = new Map<number, PortfolioYearRow>()
  props.rows.forEach(r => map.set(r.age, r))
  return map
})

function yearStart(age: number, getter: (r: PortfolioYearRow) => number): number {
  const prev = rowByAge.value.get(age - 1)
  return prev ? getter(prev) : 0
}

function rowTotalRevenue(r: PortfolioYearRow): number {
  return r.totalIncome + r.totalLmpWithdraw + r.totalRpWithdraw
}
function rowTotalExpense(r: PortfolioYearRow): number {
  return r.totalExpenseFlow + r.totalInvestContribution
}

/* ── Per-band data ── */
interface BandTable {
  key: string
  label: string
  rows: PortfolioYearRow[]
  incomeIds: string[]
  lmpWithdrawIds: string[]
  rpWithdrawIds: string[]
  revenueColCount: number
  expenseIds: string[]
  investContribIds: string[]
  expenseColCount: number
  investBalIds: string[]
  lmpBalIds: string[]
  rpBalIds: string[]
  balanceColCount: number
}

const bandTables = computed<BandTable[]>(() => {
  if (!props.rows.length) return []
  const minAge = props.rows[0].age
  const maxAge = props.rows[props.rows.length - 1].age
  const bandStart = Math.floor(minAge / 5) * 5

  const tables: BandTable[] = []
  for (let s = bandStart; s <= maxAge; s += 5) {
    const e = s + 4
    const bandRows = props.rows.filter(r => r.age >= s && r.age <= e)
    if (!bandRows.length) continue

    const seenInc = new Set<string>(), incomeIds: string[] = []
    const seenLmpW = new Set<string>(), lmpWithdrawIds: string[] = []
    const seenRpW = new Set<string>(), rpWithdrawIds: string[] = []
    const seenExp = new Set<string>(), expenseIds: string[] = []
    const seenInvC = new Set<string>(), investContribIds: string[] = []
    const seenInvB = new Set<string>(), investBalIds: string[] = []
    const seenLmpB = new Set<string>(), lmpBalIds: string[] = []
    const seenRpB = new Set<string>(), rpBalIds: string[] = []

    const nz = (v: number) => Math.round(v) !== 0

    for (const r of bandRows) {
      for (const i of r.incomes) {
        if (nz(i.amount) && !seenInc.has(i.id)) { seenInc.add(i.id); incomeIds.push(i.id) }
      }
      for (const d of r.lmpDetails) {
        if (nz(d.withdraw) && !seenLmpW.has(d.id)) { seenLmpW.add(d.id); lmpWithdrawIds.push(d.id) }
      }
      for (const d of r.rpDetails) {
        if (nz(d.withdraw) && !seenRpW.has(d.id)) { seenRpW.add(d.id); rpWithdrawIds.push(d.id) }
      }
      for (const ex of r.expenses) {
        if (nz(ex.amount) && !seenExp.has(ex.id)) { seenExp.add(ex.id); expenseIds.push(ex.id) }
      }
      for (const c of r.investContributions) {
        if (nz(c.amount) && !seenInvC.has(c.id)) { seenInvC.add(c.id); investContribIds.push(c.id) }
      }
      for (const d of r.investDetails) {
        if (nz(d.value) && !seenInvB.has(d.id)) { seenInvB.add(d.id); investBalIds.push(d.id) }
      }
      for (const d of r.lmpDetails) {
        if (nz(d.balanceEnd) && !seenLmpB.has(d.id)) { seenLmpB.add(d.id); lmpBalIds.push(d.id) }
      }
      for (const d of r.rpDetails) {
        if (nz(d.balanceEnd) && !seenRpB.has(d.id)) { seenRpB.add(d.id); rpBalIds.push(d.id) }
      }
    }

    const prevRow = rowByAge.value.get(bandRows[0].age - 1)
    if (prevRow) {
      for (const d of prevRow.investDetails) {
        if (nz(d.value) && !seenInvB.has(d.id)) { seenInvB.add(d.id); investBalIds.push(d.id) }
      }
      for (const d of prevRow.lmpDetails) {
        if (nz(d.balanceEnd) && !seenLmpB.has(d.id)) { seenLmpB.add(d.id); lmpBalIds.push(d.id) }
      }
      for (const d of prevRow.rpDetails) {
        if (nz(d.balanceEnd) && !seenRpB.has(d.id)) { seenRpB.add(d.id); rpBalIds.push(d.id) }
      }
    }

    const revenueColCount = incomeIds.length + lmpWithdrawIds.length + rpWithdrawIds.length
    const expenseColCount = expenseIds.length + investContribIds.length
    const balanceColCount = investBalIds.length + lmpBalIds.length + rpBalIds.length + 1

    tables.push({
      key: `${s}~${e}`,
      label: `${s} ~ ${e} 歲`,
      rows: bandRows,
      incomeIds, lmpWithdrawIds, rpWithdrawIds, revenueColCount,
      expenseIds, investContribIds, expenseColCount,
      investBalIds, lmpBalIds, rpBalIds, balanceColCount,
    })
  }
  return tables
})

const expandedBands = reactive(new Set<string>())

function toggleBand(key: string) {
  expandedBands.has(key) ? expandedBands.delete(key) : expandedBands.add(key)
}
function expandAll() { bandTables.value.forEach(b => expandedBands.add(b.key)) }
function collapseAll() { expandedBands.clear() }

/* ── Summary helpers ── */
function sumFlow(rows: PortfolioYearRow[], fn: (r: PortfolioYearRow) => number): number {
  return rows.reduce((s, r) => s + fn(r) * inflationFactor(r.age), 0)
}
function bandStartBal(band: BandTable, getter: (r: PortfolioYearRow) => number): number {
  const first = band.rows[0]
  return yearStart(first.age, getter) * inflationFactor(first.age - 1)
}
function bandEndBal(band: BandTable, getter: (r: PortfolioYearRow) => number): number {
  const last = band.rows[band.rows.length - 1]
  return getter(last) * inflationFactor(last.age)
}

/* ── Formatting ── */
function fmtCell(v: number, age: number): string {
  const d = Math.round(v * inflationFactor(age))
  return d === 0 ? '–' : d.toLocaleString()
}
function fmtSum(v: number): string {
  const d = Math.round(v)
  return d === 0 ? '–' : d.toLocaleString()
}
</script>

<template>
  <div v-if="rows.length" class="tables-wrapper">
    <div class="tables-header">
      <div class="table-title">
        詳細現金流表格
        <span class="table-unit">（萬元，{{ isNominal ? '名目' : '實質購買力' }}）</span>
      </div>
      <div class="table-controls">
        <button class="ctrl-btn" @click="expandAll">全部展開</button>
        <button class="ctrl-btn" @click="collapseAll">全部收合</button>
        <div class="toggle-group">
          <button class="toggle-btn" :class="{ active: !isNominal }" @click="emit('update:isNominal', false)">實質購買力</button>
          <button class="toggle-btn" :class="{ active: isNominal }" @click="emit('update:isNominal', true)">名目</button>
        </div>
      </div>
    </div>

    <!-- One card per 5-year band -->
    <div v-for="band in bandTables" :key="band.key" class="band-card">
      <div class="table-scroll">
        <table>
          <thead>
            <!-- Section group row -->
            <tr class="section-row">
              <th rowspan="2" class="sticky-col th-age">年齡</th>
              <th v-if="band.revenueColCount" :colspan="band.revenueColCount" class="sec-th sec-income">收入</th>
              <th rowspan="2" class="th-total th-total-in">總收入</th>
              <th v-if="band.expenseColCount" :colspan="band.expenseColCount" class="sec-th sec-expense">支出</th>
              <th rowspan="2" class="th-total th-total-out">總支出</th>
              <th :colspan="band.balanceColCount" class="sec-th sec-balance">帳戶餘額(年初/年末)</th>
            </tr>
            <!-- Sub-column row -->
            <tr class="sub-col-row">
              <th v-for="(id, idx) in band.incomeIds" :key="'ih'+id" :class="['col-income', { 'sec-start': idx === 0 }]">{{ findLabel('income', id) }}<span v-if="isOneTimeItem('income', id)" class="one-time-tag">一次</span></th>
              <th v-for="(id, idx) in band.lmpWithdrawIds" :key="'lwh'+id" :class="['col-lmp', { 'sec-start': idx === 0 && !band.incomeIds.length }]">{{ findLabel('lmp', id) }}</th>
              <th v-for="(id, idx) in band.rpWithdrawIds" :key="'rwh'+id" :class="['col-rp', { 'sec-start': idx === 0 && !band.incomeIds.length && !band.lmpWithdrawIds.length }]">{{ findLabel('rp', id) }}</th>
              <th v-for="(id, idx) in band.expenseIds" :key="'eh'+id" :class="['col-expense', { 'sec-start': idx === 0 }]">{{ findLabel('expense', id) }}<span v-if="isOneTimeItem('expense', id)" class="one-time-tag">一次</span></th>
              <th v-for="(id, idx) in band.investContribIds" :key="'ich'+id" :class="['col-invest', { 'sec-start': idx === 0 && !band.expenseIds.length }]">{{ findLabel('invest', id) }}</th>
              <th v-for="(id, idx) in band.investBalIds" :key="'ibh'+id" :class="['col-invest-bal', { 'sec-start': idx === 0 }]">{{ findLabel('invest', id) }}</th>
              <th v-for="(id, idx) in band.lmpBalIds" :key="'lbh'+id" :class="['col-lmp-bal', { 'sec-start': idx === 0 && !band.investBalIds.length }]">{{ findLabel('lmp', id) }}</th>
              <th v-for="(id, idx) in band.rpBalIds" :key="'rbh'+id" :class="['col-rp-bal', { 'sec-start': idx === 0 && !band.investBalIds.length && !band.lmpBalIds.length }]">{{ findLabel('rp', id) }}</th>
              <th :class="['col-idle', { 'sec-start': !band.investBalIds.length && !band.lmpBalIds.length && !band.rpBalIds.length }]">閒置</th>
            </tr>
          </thead>

          <tbody>
            <!-- Summary row (click to expand/collapse) -->
            <tr class="summary-row" @click="toggleBand(band.key)">
              <td class="sticky-col summary-age">
                <span class="expand-icon">{{ expandedBands.has(band.key) ? '▼' : '▶' }}</span>
                {{ band.label }}
              </td>
              <!-- Revenue -->
              <td v-for="(id, idx) in band.incomeIds" :key="'si'+id" :class="['col-income', { 'sec-start': idx === 0 }]">
                {{ fmtSum(sumFlow(band.rows, r => r.incomes.find(x => x.id === id)?.amount ?? 0)) }}
              </td>
              <td v-for="(id, idx) in band.lmpWithdrawIds" :key="'slw'+id" :class="['col-lmp', { 'sec-start': idx === 0 && !band.incomeIds.length }]">
                {{ fmtSum(sumFlow(band.rows, r => r.lmpDetails.find(x => x.id === id)?.withdraw ?? 0)) }}
              </td>
              <td v-for="(id, idx) in band.rpWithdrawIds" :key="'srw'+id" :class="['col-rp', { 'sec-start': idx === 0 && !band.incomeIds.length && !band.lmpWithdrawIds.length }]">
                {{ fmtSum(sumFlow(band.rows, r => r.rpDetails.find(x => x.id === id)?.withdraw ?? 0)) }}
              </td>
              <td class="td-total td-total-in">{{ fmtSum(sumFlow(band.rows, rowTotalRevenue)) }}</td>
              <!-- Expense -->
              <td v-for="(id, idx) in band.expenseIds" :key="'se'+id" :class="['col-expense', { 'sec-start': idx === 0 }]">
                {{ fmtSum(sumFlow(band.rows, r => r.expenses.find(x => x.id === id)?.amount ?? 0)) }}
              </td>
              <td v-for="(id, idx) in band.investContribIds" :key="'sic'+id" :class="['col-invest', { 'sec-start': idx === 0 && !band.expenseIds.length }]">
                {{ fmtSum(sumFlow(band.rows, r => r.investContributions.find(x => x.id === id)?.amount ?? 0)) }}
              </td>
              <td class="td-total td-total-out">{{ fmtSum(sumFlow(band.rows, rowTotalExpense)) }}</td>
              <!-- Balance: 年初 / 年末 -->
              <td v-for="(id, idx) in band.investBalIds" :key="'sib'+id" :class="['col-invest-bal', 'col-bal-pair', { 'sec-start': idx === 0 }]">
                <span class="bal-start">{{ fmtSum(bandStartBal(band, r => r.investDetails.find(x => x.id === id)?.value ?? 0)) }}</span>
                <span class="bal-sep">/</span>
                <span class="bal-end">{{ fmtSum(bandEndBal(band, r => r.investDetails.find(x => x.id === id)?.value ?? 0)) }}</span>
              </td>
              <td v-for="(id, idx) in band.lmpBalIds" :key="'slb'+id" :class="['col-lmp-bal', 'col-bal-pair', { 'sec-start': idx === 0 && !band.investBalIds.length }]">
                <span class="bal-start">{{ fmtSum(bandStartBal(band, r => r.lmpDetails.find(x => x.id === id)?.balanceEnd ?? 0)) }}</span>
                <span class="bal-sep">/</span>
                <span class="bal-end">{{ fmtSum(bandEndBal(band, r => r.lmpDetails.find(x => x.id === id)?.balanceEnd ?? 0)) }}</span>
              </td>
              <td v-for="(id, idx) in band.rpBalIds" :key="'srb'+id" :class="['col-rp-bal', 'col-bal-pair', { 'sec-start': idx === 0 && !band.investBalIds.length && !band.lmpBalIds.length }]">
                <span class="bal-start">{{ fmtSum(bandStartBal(band, r => r.rpDetails.find(x => x.id === id)?.balanceEnd ?? 0)) }}</span>
                <span class="bal-sep">/</span>
                <span class="bal-end">{{ fmtSum(bandEndBal(band, r => r.rpDetails.find(x => x.id === id)?.balanceEnd ?? 0)) }}</span>
              </td>
              <td :class="['col-idle', 'col-bal-pair', { negative: bandStartBal(band, r => r.idleAssets) < 0 || bandEndBal(band, r => r.idleAssets) < 0, 'sec-start': !band.investBalIds.length && !band.lmpBalIds.length && !band.rpBalIds.length }]">
                <span class="bal-start">{{ fmtSum(bandStartBal(band, r => r.idleAssets)) }}</span>
                <span class="bal-sep">/</span>
                <span class="bal-end">{{ fmtSum(bandEndBal(band, r => r.idleAssets)) }}</span>
              </td>
            </tr>

            <!-- Detail rows -->
            <template v-if="expandedBands.has(band.key)">
              <tr v-for="r in band.rows" :key="r.age" class="detail-row">
                <td class="sticky-col detail-age">{{ r.age }}</td>
                <!-- Revenue -->
                <td v-for="(id, idx) in band.incomeIds" :key="'di'+id" :class="['col-income', { 'sec-start': idx === 0 }]">
                  {{ fmtCell(r.incomes.find(x => x.id === id)?.amount ?? 0, r.age) }}
                </td>
                <td v-for="(id, idx) in band.lmpWithdrawIds" :key="'dlw'+id" :class="['col-lmp', { 'sec-start': idx === 0 && !band.incomeIds.length }]">
                  {{ fmtCell(r.lmpDetails.find(x => x.id === id)?.withdraw ?? 0, r.age) }}
                </td>
                <td v-for="(id, idx) in band.rpWithdrawIds" :key="'drw'+id" :class="['col-rp', { 'sec-start': idx === 0 && !band.incomeIds.length && !band.lmpWithdrawIds.length }]">
                  {{ fmtCell(r.rpDetails.find(x => x.id === id)?.withdraw ?? 0, r.age) }}
                </td>
                <td class="td-total td-total-in">{{ fmtCell(rowTotalRevenue(r), r.age) }}</td>
                <!-- Expense -->
                <td v-for="(id, idx) in band.expenseIds" :key="'de'+id" :class="['col-expense', { 'sec-start': idx === 0 }]">
                  {{ fmtCell(r.expenses.find(x => x.id === id)?.amount ?? 0, r.age) }}
                </td>
                <td v-for="(id, idx) in band.investContribIds" :key="'dic'+id" :class="['col-invest', { 'sec-start': idx === 0 && !band.expenseIds.length }]">
                  {{ fmtCell(r.investContributions.find(x => x.id === id)?.amount ?? 0, r.age) }}
                </td>
                <td class="td-total td-total-out">{{ fmtCell(rowTotalExpense(r), r.age) }}</td>
                <!-- Balance 年初 / 年末 -->
                <td v-for="(id, idx) in band.investBalIds" :key="'dib'+id" :class="['col-invest-bal', 'col-bal-pair', { 'sec-start': idx === 0 }]">
                  <span class="bal-start">{{ fmtCell(yearStart(r.age, x => x.investDetails.find(d => d.id === id)?.value ?? 0), r.age - 1) }}</span>
                  <span class="bal-sep">/</span>
                  <span class="bal-end">{{ fmtCell(r.investDetails.find(x => x.id === id)?.value ?? 0, r.age) }}</span>
                </td>
                <td v-for="(id, idx) in band.lmpBalIds" :key="'dlb'+id" :class="['col-lmp-bal', 'col-bal-pair', { 'sec-start': idx === 0 && !band.investBalIds.length }]">
                  <span class="bal-start">{{ fmtCell(yearStart(r.age, x => x.lmpDetails.find(d => d.id === id)?.balanceEnd ?? 0), r.age - 1) }}</span>
                  <span class="bal-sep">/</span>
                  <span class="bal-end">{{ fmtCell(r.lmpDetails.find(x => x.id === id)?.balanceEnd ?? 0, r.age) }}</span>
                </td>
                <td v-for="(id, idx) in band.rpBalIds" :key="'drb'+id" :class="['col-rp-bal', 'col-bal-pair', { 'sec-start': idx === 0 && !band.investBalIds.length && !band.lmpBalIds.length }]">
                  <span class="bal-start">{{ fmtCell(yearStart(r.age, x => x.rpDetails.find(d => d.id === id)?.balanceEnd ?? 0), r.age - 1) }}</span>
                  <span class="bal-sep">/</span>
                  <span class="bal-end">{{ fmtCell(r.rpDetails.find(x => x.id === id)?.balanceEnd ?? 0, r.age) }}</span>
                </td>
                <td :class="['col-idle', 'col-bal-pair', { negative: yearStart(r.age, x => x.idleAssets) < 0 || r.idleAssets < 0, 'sec-start': !band.investBalIds.length && !band.lmpBalIds.length && !band.rpBalIds.length }]">
                  <span class="bal-start">{{ fmtCell(yearStart(r.age, x => x.idleAssets), r.age - 1) }}</span>
                  <span class="bal-sep">/</span>
                  <span class="bal-end">{{ fmtCell(r.idleAssets, r.age) }}</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tables-wrapper {
  margin-bottom: 24px;
}
.tables-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.table-title {
  font-size: 13px;
  color: #8a919e;
  font-weight: 500;
}
.table-unit {
  font-size: 11px;
  color: #555d6a;
}
.table-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.ctrl-btn {
  padding: 4px 10px;
  font-size: 11px;
  border: 1px solid #334155;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.ctrl-btn:hover {
  background: #334155;
  color: #94a3b8;
}
.toggle-group {
  display: flex;
  background: #1e293b;
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
  flex-shrink: 0;
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

/* ── Band card ── */
.band-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #1e293b;
  border-radius: 12px;
  margin-bottom: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}
.expand-icon {
  font-size: 9px;
  color: #60a5fa;
  margin-right: 6px;
}

/* ── Table ── */
.table-scroll {
  overflow-x: auto;
}
table {
  min-width: 100%;
  width: max-content;
  border-collapse: collapse;
  font-size: 12px;
  font-family: 'Space Mono', monospace;
  white-space: nowrap;
}

/* ── Section header row ── */
.section-row th {
  background: #0f172a;
  padding: 5px 10px;
  border-bottom: 1px solid #334155;
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.sec-th {
  border-left: 2px solid #334155;
  border-right: 2px solid #334155;
}
.sec-start {
  border-left: 2px solid #334155 !important;
}
.sec-income { color: #34d399; background: rgba(52, 211, 153, 0.06) !important; }
.sec-expense { color: #fb923c; background: rgba(251, 146, 60, 0.06) !important; }
.sec-balance { color: #60a5fa; background: rgba(96, 165, 250, 0.06) !important; }

.th-age {
  width: 120px;
  background: #0f172a !important;
  text-align: center !important;
  color: #8a919e;
  font-size: 10px;
  font-weight: 600;
}

.th-total {
  width: 90px;
  background: #0f172a !important;
  font-size: 10px;
  font-weight: 700;
  text-align: right !important;
  padding: 5px 10px;
  border-bottom: 1px solid #334155;
}
.th-total-in {
  color: #34d399;
  border-left: 2px solid #334155;
}
.th-total-out {
  color: #fb923c;
  border-left: 2px solid #334155;
}

/* ── Sub-column header row ── */
.sub-col-row th {
  background: #0f172a;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.3px;
  padding: 5px 10px;
  border-bottom: 2px solid #334155;
  text-align: right;
}

/* ── Sticky age column ── */
.sticky-col {
  position: sticky;
  left: 0;
  z-index: 1;
  text-align: center !important;
  font-weight: 600;
  color: #e8eaed;
}
thead .sticky-col {
  z-index: 2;
}

/* ── Data cells ── */
tbody td {
  padding: 5px 10px;
  text-align: right;
  border-bottom: 1px solid #1e293b;
  color: #cbd5e1;
}

/* ── Total columns ── */
.td-total {
  font-weight: 600;
  border-left: 2px solid #334155;
}
.td-total-in { color: #34d399; }
.td-total-out { color: #fb923c; }

/* ── Summary row ── */
.summary-row {
  cursor: pointer;
  user-select: none;
}
.summary-row:hover td {
  background: rgba(30, 41, 59, 0.9);
}
.summary-row td {
  background: rgba(30, 41, 59, 0.7);
  border-bottom: 1px solid #334155;
  font-weight: 600;
}
.summary-age {
  background: rgba(30, 41, 59, 0.9) !important;
  white-space: nowrap;
  font-size: 11px;
  text-align: left !important;
}

/* ── Detail rows ── */
.detail-row td {
  background: transparent;
}
.detail-age {
  background: rgba(15, 23, 42, 0.95) !important;
  color: #8a919e !important;
}
.detail-row:hover td {
  background: rgba(255, 255, 255, 0.02);
}

/* ── Column colors ── */
.col-income { color: #34d399; }
.col-expense { color: #fb923c; }
.col-invest { color: #60a5fa; }
.col-invest-bal { color: #3b82c8; }
.col-lmp { color: #f59e0b; }
.col-lmp-bal { color: #d4a050; }
.col-rp { color: #a78bfa; }
.col-rp-bal { color: #8b7acc; }
.col-idle { color: #94a3b8; border-right: 2px solid #334155; }
.one-time-tag {
  display: inline-block;
  font-size: 8px;
  padding: 1px 3px;
  margin-left: 3px;
  border-radius: 3px;
  background: rgba(251, 146, 60, 0.15);
  color: #fb923c;
  vertical-align: middle;
  letter-spacing: 0;
  font-weight: 400;
}
.col-idle.negative { color: #f87171; }

/* ── Balance pair (年初/年末) styling ── */
.col-bal-pair {
  white-space: nowrap;
}
.bal-start {
  opacity: 0.7;
}
.bal-sep {
  opacity: 0.4;
  margin: 0 2px;
}
.bal-end {
  font-weight: 600;
}

@media (max-width: 640px) {
  .tables-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .table-controls {
    flex-wrap: wrap;
  }
}
</style>
