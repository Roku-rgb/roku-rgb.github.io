<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import type { PortfolioYearRow } from '../../types/portfolio'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

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

const LMP_COLORS = ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f']
const RP_COLORS = ['#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6']
const INVEST_COLORS = ['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af']

const allLmpIds = computed(() => {
  const ids = new Set<string>()
  props.rows.forEach(r => r.lmpDetails.forEach(d => ids.add(d.id)))
  return [...ids]
})
const allRpIds = computed(() => {
  const ids = new Set<string>()
  props.rows.forEach(r => r.rpDetails.forEach(d => ids.add(d.id)))
  return [...ids]
})
const allInvIds = computed(() => {
  const ids = new Set<string>()
  props.rows.forEach(r => r.investDetails.forEach(d => ids.add(d.id)))
  return [...ids]
})

function findLabel(type: 'lmp' | 'rp' | 'invest', id: string): string {
  for (const r of props.rows) {
    const list = type === 'lmp' ? r.lmpDetails : type === 'rp' ? r.rpDetails : r.investDetails
    const item = list.find(x => x.id === id)
    if (item) return item.label
  }
  return id
}

const IDLE_COLOR = '#34d399'

const chartData = computed(() => {
  const labels = props.rows.map(r => r.age)

  const idleDataset = {
    label: '閒置資產',
    data: props.rows.map(r => Math.round(r.idleAssets * inflationFactor(r.age))),
    borderColor: IDLE_COLOR,
    backgroundColor: 'transparent',
    borderWidth: 2,
    pointRadius: 0,
    pointHitRadius: 8,
    tension: 0,
  }

  const lmpDatasets = allLmpIds.value.map((id, i) => ({
    label: `LMP: ${findLabel('lmp', id)}`,
    data: props.rows.map(r => {
      const d = r.lmpDetails.find(x => x.id === id)
      return d ? Math.round(d.balanceEnd * inflationFactor(r.age)) : 0
    }),
    borderColor: LMP_COLORS[i % LMP_COLORS.length],
    backgroundColor: 'transparent',
    borderWidth: 2,
    pointRadius: 0,
    pointHitRadius: 8,
    tension: 0,
  }))

  const rpDatasets = allRpIds.value.map((id, i) => ({
    label: `RP: ${findLabel('rp', id)}`,
    data: props.rows.map(r => {
      const d = r.rpDetails.find(x => x.id === id)
      return d ? Math.round(d.balanceEnd * inflationFactor(r.age)) : 0
    }),
    borderColor: RP_COLORS[i % RP_COLORS.length],
    backgroundColor: 'transparent',
    borderWidth: 2,
    pointRadius: 0,
    pointHitRadius: 8,
    tension: 0,
  }))

  const invDatasets = allInvIds.value.map((id, i) => ({
    label: `投資: ${findLabel('invest', id)}`,
    data: props.rows.map(r => {
      const d = r.investDetails.find(x => x.id === id)
      return d ? Math.round(d.value * inflationFactor(r.age)) : 0
    }),
    borderColor: INVEST_COLORS[i % INVEST_COLORS.length],
    backgroundColor: 'transparent',
    borderWidth: 2,
    pointRadius: 0,
    pointHitRadius: 8,
    tension: 0,
    borderDash: [6, 3],
  }))

  return { labels, datasets: [idleDataset, ...lmpDatasets, ...rpDatasets, ...invDatasets] }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  scales: {
    x: {
      title: { display: true, text: '年齡', color: '#555d6a', font: { size: 11 } },
      ticks: { color: '#555d6a', font: { size: 11 } },
      grid: { color: '#1e293b' },
    },
    y: {
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
      },
    },
  },
}))

const legendItems = computed(() => {
  const items: { color: string; label: string; dashed?: boolean }[] = []
  items.push({ color: IDLE_COLOR, label: '閒置資產' })
  allLmpIds.value.forEach((id, i) =>
    items.push({ color: LMP_COLORS[i % LMP_COLORS.length], label: `LMP: ${findLabel('lmp', id)}` }))
  allRpIds.value.forEach((id, i) =>
    items.push({ color: RP_COLORS[i % RP_COLORS.length], label: `RP: ${findLabel('rp', id)}` }))
  allInvIds.value.forEach((id, i) =>
    items.push({ color: INVEST_COLORS[i % INVEST_COLORS.length], label: `投資: ${findLabel('invest', id)}`, dashed: true }))
  return items
})
</script>

<template>
  <div v-if="rows.length" class="chart-container">
    <div class="chart-header">
      <div class="chart-title">
        各群組餘額走勢
        <span class="chart-unit">（單位：萬元，{{ isNominal ? '名目' : '實質購買力' }}）</span>
      </div>
      <div class="toggle-group">
        <button class="toggle-btn" :class="{ active: !isNominal }" @click="emit('update:isNominal', false)">實質購買力</button>
        <button class="toggle-btn" :class="{ active: isNominal }" @click="emit('update:isNominal', true)">名目</button>
      </div>
    </div>
    <div class="chart-wrapper">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <div class="chart-legend">
      <span v-for="item in legendItems" :key="item.label">
        <span
          class="legend-line"
          :style="{ background: item.color, ...(item.dashed ? { backgroundImage: `repeating-linear-gradient(90deg, ${item.color} 0 6px, transparent 6px 9px)`, background: 'none' } : {}) }">
        </span>
        {{ item.label }}
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
.chart-wrapper {
  height: 300px;
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
.legend-line {
  display: inline-block;
  width: 16px;
  height: 3px;
  border-radius: 1px;
  margin-right: 4px;
  vertical-align: middle;
}
</style>
