<script setup lang="ts">
import { computed, ref } from 'vue'
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

const expanded = ref(false)
const displayRows = computed(() =>
  expanded.value ? props.rows : props.rows.slice(0, 10),
)

const incomeIds = computed(() => {
  const ids = new Set<string>()
  props.rows.forEach(r => r.incomes.forEach(i => { if (i.amount) ids.add(i.id) }))
  return [...ids]
})
const lmpIds = computed(() => {
  const ids = new Set<string>()
  props.rows.forEach(r => r.lmpDetails.forEach(d => { if (d.withdraw) ids.add(d.id) }))
  return [...ids]
})
const rpIds = computed(() => {
  const ids = new Set<string>()
  props.rows.forEach(r => r.rpDetails.forEach(d => { if (d.withdraw) ids.add(d.id) }))
  return [...ids]
})

function findLabel(rows: PortfolioYearRow[], type: 'income' | 'lmp' | 'rp', id: string): string {
  for (const r of rows) {
    const list = type === 'income' ? r.incomes : type === 'lmp' ? r.lmpDetails : r.rpDetails
    const item = list.find(x => x.id === id)
    if (item) return item.label
  }
  return id
}

const fmtRaw = (v: number) => Math.round(v).toLocaleString()
const fmt = (v: number, age: number) => fmtRaw(v * inflationFactor(age))
</script>

<template>
  <div v-if="rows.length" class="table-container">
    <div class="table-header">
      <div class="table-title">詳細現金流表格<span class="table-unit">（單位：萬元，{{ isNominal ? '名目' : '實質購買力' }}）</span></div>
      <div class="toggle-group">
        <button class="toggle-btn" :class="{ active: !isNominal }" @click="emit('update:isNominal', false)">實質購買力</button>
        <button class="toggle-btn" :class="{ active: isNominal }" @click="emit('update:isNominal', true)">名目</button>
      </div>
    </div>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th class="sticky-col">年齡</th>
            <th v-for="id in incomeIds" :key="'i-' + id" class="col-income">
              {{ findLabel(rows, 'income', id) }}
            </th>
            <th v-for="id in lmpIds" :key="'l-' + id" class="col-lmp">
              {{ findLabel(rows, 'lmp', id) }}
            </th>
            <th v-for="id in lmpIds" :key="'lb-' + id" class="col-lmp-bal">
              {{ findLabel(rows, 'lmp', id) }} 餘額
            </th>
            <th v-for="id in rpIds" :key="'r-' + id" class="col-rp">
              {{ findLabel(rows, 'rp', id) }}
            </th>
            <th v-for="id in rpIds" :key="'rb-' + id" class="col-rp-bal">
              {{ findLabel(rows, 'rp', id) }} 餘額
            </th>
            <th class="col-idle">閒置資產</th>
            <th class="col-net">淨額</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in displayRows" :key="r.age">
            <td class="sticky-col">{{ r.age }}</td>
            <td v-for="id in incomeIds" :key="'i-' + id" class="col-income">
              {{ fmt(r.incomes.find(x => x.id === id)?.amount ?? 0, r.age) }}
            </td>
            <td v-for="id in lmpIds" :key="'l-' + id" class="col-lmp">
              {{ fmt(r.lmpDetails.find(x => x.id === id)?.withdraw ?? 0, r.age) }}
            </td>
            <td v-for="id in lmpIds" :key="'lb-' + id" class="col-lmp-bal">
              {{ fmt(r.lmpDetails.find(x => x.id === id)?.balanceEnd ?? 0, r.age) }}
            </td>
            <td v-for="id in rpIds" :key="'r-' + id" class="col-rp">
              {{ fmt(r.rpDetails.find(x => x.id === id)?.withdraw ?? 0, r.age) }}
            </td>
            <td v-for="id in rpIds" :key="'rb-' + id" class="col-rp-bal">
              {{ fmt(r.rpDetails.find(x => x.id === id)?.balanceEnd ?? 0, r.age) }}
            </td>
            <td class="col-idle" :class="{ positive: r.idleAssets >= 0, negative: r.idleAssets < 0 }">
              {{ fmt(r.idleAssets, r.age) }}
            </td>
            <td class="col-net" :class="{ positive: r.netFlow >= 0, negative: r.netFlow < 0 }">
              {{ fmt(r.netFlow, r.age) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <button v-if="rows.length > 10" class="expand-btn" @click="expanded = !expanded">
      {{ expanded ? '收起' : `顯示全部 ${rows.length} 年` }}
    </button>
  </div>
</template>

<style scoped>
.table-container {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}
.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.table-scroll {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  font-family: 'Space Mono', monospace;
  white-space: nowrap;
}
thead th {
  position: sticky;
  top: 0;
  background: #0f172a;
  color: #8a919e;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 6px 10px;
  border-bottom: 1px solid #334155;
  text-align: right;
}
tbody td {
  padding: 5px 10px;
  border-bottom: 1px solid #1e293b;
  color: #cbd5e1;
  text-align: right;
}
.sticky-col {
  position: sticky;
  left: 0;
  background: rgba(15, 23, 42, 0.95);
  z-index: 1;
  text-align: center !important;
  font-weight: 600;
  color: #e8eaed;
}
thead .sticky-col {
  z-index: 2;
}
.col-income { color: #34d399; }
.col-lmp { color: #f59e0b; }
.col-lmp-bal { color: #d4a050; }
.col-rp { color: #a78bfa; }
.col-rp-bal { color: #8b7acc; }
.col-idle { color: #34d399; }
.col-idle.negative { color: #f87171; }
.col-net.positive { color: #34d399; }
.col-net.negative { color: #f87171; }
.expand-btn {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 8px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #94a3b8;
  font-size: 12px;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
}
.expand-btn:hover {
  background: #334155;
  color: #e8eaed;
}
</style>
