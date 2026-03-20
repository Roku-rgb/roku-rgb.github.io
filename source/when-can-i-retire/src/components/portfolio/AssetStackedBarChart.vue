<script setup lang="ts">
import { computed } from 'vue'
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

/** Check if any asset component is negative for a given row */
function hasNegative(r: PortfolioYearRow): boolean {
  if (r.idleAssets < 0) return true
  if (r.lmpDetails.some(d => d.balanceEnd < 0)) return true
  if (r.rpDetails.some(d => d.balanceEnd < 0)) return true
  if (r.investDetails.some(d => d.value < 0)) return true
  return false
}

/** First age where negative assets appear (for the warning banner) */
const firstNegativeAge = computed(() => {
  const r = props.rows.find(hasNegative)
  return r ? r.age : null
})

const chartData = computed(() => {
  const labels = props.rows.map(r => r.age)

  const idle = props.rows.map(r => Math.round(r.idleAssets * inflationFactor(r.age)))
  const lmpTotal = props.rows.map(r =>
    Math.round(r.lmpDetails.reduce((s, d) => s + d.balanceEnd, 0) * inflationFactor(r.age)))
  const rpTotal = props.rows.map(r =>
    Math.round(r.rpDetails.reduce((s, d) => s + d.balanceEnd, 0) * inflationFactor(r.age)))
  const invTotal = props.rows.map(r =>
    Math.round(r.investDetails.reduce((s, d) => s + d.value, 0) * inflationFactor(r.age)))

  // Sum of all negative components per year (goes from 0 downward)
  const negSum = props.rows.map((_, i) => {
    let sum = 0
    if (idle[i] < 0) sum += idle[i]
    if (lmpTotal[i] < 0) sum += lmpTotal[i]
    if (rpTotal[i] < 0) sum += rpTotal[i]
    if (invTotal[i] < 0) sum += invTotal[i]
    return sum
  })

  const pos = (v: number) => Math.max(v, 0)

  return {
    labels,
    datasets: [
      // Negative stack: red bar from 0 downward
      {
        label: '負值',
        data: negSum,
        backgroundColor: 'rgba(248, 113, 113, 0.6)',
        borderColor: '#f87171',
        borderWidth: 1,
        borderRadius: 2,
        stack: 'neg',
      },
      // Positive stack: invisible base (= negSum) so bars start from negative end
      {
        label: '_base',
        data: negSum,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0,
        stack: 'pos',
        tooltip: { callbacks: { label: () => '' } },
      },
      {
        label: '閒置資產',
        data: idle.map(pos),
        backgroundColor: 'rgba(52, 211, 153, 0.7)',
        borderColor: '#34d399',
        borderWidth: 1,
        borderRadius: 2,
        stack: 'pos',
      },
      {
        label: 'LMP 合計',
        data: lmpTotal.map(pos),
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderColor: '#f59e0b',
        borderWidth: 1,
        borderRadius: 2,
        stack: 'pos',
      },
      {
        label: 'RP 合計',
        data: rpTotal.map(pos),
        backgroundColor: 'rgba(167, 139, 250, 0.7)',
        borderColor: '#a78bfa',
        borderWidth: 1,
        borderRadius: 2,
        stack: 'pos',
      },
      {
        label: '投資合計',
        data: invTotal.map(pos),
        backgroundColor: 'rgba(96, 165, 250, 0.7)',
        borderColor: '#60a5fa',
        borderWidth: 1,
        borderRadius: 2,
        stack: 'pos',
      },
    ],
  }
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
      stacked: true,
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
      callbacks: {
        title: (items: { dataIndex: number }[]) => {
          const idx = items[0]?.dataIndex
          if (idx === undefined) return ''
          return `${props.rows[idx].age} 歲(年末)`
        },
        label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) => {
          const label = ctx.dataset.label ?? ''
          if (label === '_base') return ''
          const val = ctx.parsed.y
          if (val === 0) return ''
          return ` ${label}：${val.toLocaleString()} 萬`
        },
        afterBody: (items: { dataIndex: number }[]) => {
          const idx = items[0]?.dataIndex
          if (idx === undefined) return ''
          const r = props.rows[idx]
          const f = inflationFactor(r.age)
          const total = Math.round(
            (r.idleAssets +
            r.lmpDetails.reduce((s, d) => s + d.balanceEnd, 0) +
            r.rpDetails.reduce((s, d) => s + d.balanceEnd, 0) +
            r.investDetails.reduce((s, d) => s + d.value, 0)) * f
          )
          return `\n 總資產淨值：${total.toLocaleString()} 萬`
        },
      },
    },
  },
}))

const legendItems = [
  { color: '#34d399', label: '閒置資產' },
  { color: '#f59e0b', label: 'LMP 合計' },
  { color: '#a78bfa', label: 'RP 合計' },
  { color: '#60a5fa', label: '投資合計' },
  { color: '#f87171', label: '負值' },
]
</script>

<template>
  <div v-if="rows.length" class="chart-container">
    <div class="chart-header">
      <div class="chart-title">
        總資產組成
        <span class="chart-unit">（單位：萬元，{{ isNominal ? '名目' : '實質購買力' }}）</span>
      </div>
      <div class="toggle-group">
        <button class="toggle-btn" :class="{ active: !isNominal }" @click="emit('update:isNominal', false)">實質購買力</button>
        <button class="toggle-btn" :class="{ active: isNominal }" @click="emit('update:isNominal', true)">名目</button>
      </div>
    </div>
    <div class="chart-wrapper">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
    <div class="chart-legend">
      <span v-for="item in legendItems" :key="item.label">
        <span class="legend-swatch" :style="{ background: item.color }"></span>
        {{ item.label }}
      </span>
    </div>
    <div v-if="firstNegativeAge !== null" class="error-banner">
      ⚠ 自 {{ firstNegativeAge }} 歲起資產出現負值，請調整收支或投資配置
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
.legend-swatch {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 4px;
  vertical-align: middle;
}
.error-banner {
  margin: 8px 16px 4px;
  padding: 8px 12px;
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 8px;
  color: #f87171;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}
</style>
