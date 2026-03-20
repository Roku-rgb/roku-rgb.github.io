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

const chartData = computed(() => {
  const labels = props.rows.map(r => r.age)

  const idle = props.rows.map(r => Math.round(r.idleAssets * inflationFactor(r.age)))
  const lmpTotal = props.rows.map(r =>
    Math.round(r.lmpDetails.reduce((s, d) => s + d.balanceEnd, 0) * inflationFactor(r.age)))
  const rpTotal = props.rows.map(r =>
    Math.round(r.rpDetails.reduce((s, d) => s + d.balanceEnd, 0) * inflationFactor(r.age)))
  const invTotal = props.rows.map(r =>
    Math.round(r.investDetails.reduce((s, d) => s + d.value, 0) * inflationFactor(r.age)))
  const total = props.rows.map((_, i) => idle[i] + lmpTotal[i] + rpTotal[i] + invTotal[i])

  return {
    labels,
    datasets: [
      {
        label: '總資產',
        data: total,
        borderColor: '#e8eaed',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: 0,
        pointHitRadius: 8,
        tension: 0,
        order: 0,
      },
      {
        label: '閒置資產',
        data: idle,
        borderColor: '#34d399',
        backgroundColor: 'rgba(52, 211, 153, 0.15)',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHitRadius: 8,
        tension: 0,
        fill: 'origin',
        order: 4,
      },
      {
        label: 'LMP 合計',
        data: lmpTotal,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHitRadius: 8,
        tension: 0,
        fill: 'origin',
        order: 3,
      },
      {
        label: 'RP 合計',
        data: rpTotal,
        borderColor: '#a78bfa',
        backgroundColor: 'rgba(167, 139, 250, 0.15)',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHitRadius: 8,
        tension: 0,
        fill: 'origin',
        order: 2,
      },
      {
        label: '投資合計',
        data: invTotal,
        borderColor: '#60a5fa',
        backgroundColor: 'rgba(96, 165, 250, 0.15)',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHitRadius: 8,
        tension: 0,
        fill: 'origin',
        order: 1,
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
      title: { display: true, text: '年齡', color: '#555d6a', font: { size: 11 } },
      ticks: { color: '#555d6a', font: { size: 11 } },
      grid: { color: '#1e293b' },
    },
    y: {
      stacked: false,
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
        label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) => {
          const label = ctx.dataset.label ?? ''
          const val = ctx.parsed.y
          return ` ${label}：${val.toLocaleString()} 萬`
        },
      },
    },
  },
}))

const legendItems = [
  { color: '#e8eaed', label: '總資產', dashed: false },
  { color: '#34d399', label: '閒置資產', dashed: false },
  { color: '#f59e0b', label: 'LMP 合計', dashed: false },
  { color: '#a78bfa', label: 'RP 合計', dashed: false },
  { color: '#60a5fa', label: '投資合計', dashed: false },
]
</script>

<template>
  <div v-if="rows.length" class="chart-container">
    <div class="chart-header">
      <div class="chart-title">
        總資產走勢
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
        <span class="legend-line" :style="{ background: item.color }"></span>
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
