<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import type { ChartDataPoint } from '../types/retirement'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend, annotationPlugin)

const props = defineProps<{
  data: ChartDataPoint[]
  retireAge: number | null
}>()

const chartData = computed(() => ({
  labels: props.data.map(d => d.age),
  datasets: [
    {
      label: '累積資產',
      data: props.data.map(d => d.assets),
      borderColor: '#34d399',
      backgroundColor: 'rgba(52, 211, 153, 0.08)',
      borderWidth: 2.5,
      fill: true,
      pointRadius: 0,
      pointHitRadius: 8,
      tension: 0.3,
    },
    {
      label: '目標金額',
      data: props.data.map(d => d.target),
      borderColor: '#f87171',
      backgroundColor: 'rgba(248, 113, 113, 0.05)',
      borderWidth: 2,
      borderDash: [6, 3],
      fill: true,
      pointRadius: 0,
      pointHitRadius: 8,
      tension: 0.3,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
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
        callback: (v: number | string) => {
          const n = Number(v)
          return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : v
        },
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
          return `${props.data[idx].age} 歲`
        },
        label: (item: { datasetIndex: number; dataIndex: number }) => {
          const d = props.data[item.dataIndex]
          if (item.datasetIndex === 0) return `累積資產：${d.assets.toLocaleString()} 萬`
          return `目標金額：${d.target.toLocaleString()} 萬`
        },
        afterBody: (items: { dataIndex: number }[]) => {
          const idx = items[0]?.dataIndex
          if (idx === undefined) return []
          const d = props.data[idx]
          const lines = [
            `　LMP：${d.lmp.toLocaleString()} 萬`,
            `　RP：${d.rp.toLocaleString()} 萬`,
            d.surplus >= 0 ? '✓ 可退休' : `差距：${Math.abs(d.surplus).toLocaleString()} 萬`,
          ]
          return lines
        },
      },
    },
    annotation: props.retireAge
      ? (() => {
          // CategoryScale 的 x 為類別索引，不是年齡數值；需用「年齡 === retireAge」的索引
          const retireIndex = props.data.findIndex((d) => d.age === props.retireAge)
          if (retireIndex < 0) return {}
          return {
            annotations: {
              retireLine: {
                type: 'line' as const,
                xMin: retireIndex,
                xMax: retireIndex,
              borderColor: '#60a5fa',
              borderWidth: 1.5,
              borderDash: [4, 4],
              label: {
                display: true,
                content: `${props.retireAge}歲`,
                position: 'start' as const,
                color: '#60a5fa',
                font: { size: 12, weight: 'bold' as const },
                backgroundColor: 'transparent',
              },
            },
          },
        }
          })()
      : {},
  },
}))
</script>

<template>
  <div class="chart-container">
    <div class="chart-title">
      資產累積 vs 退休目標金額 <span class="chart-unit">（單位：萬元）</span>
    </div>
    <div class="chart-wrapper">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <div class="chart-legend">
      <span><span class="legend-line legend-assets"></span>累積資產</span>
      <span><span class="legend-line legend-target"></span>目標金額</span>
      <span v-if="retireAge"><span class="legend-line legend-retire"></span>可退休</span>
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
.chart-title {
  font-size: 13px;
  color: #8a919e;
  margin-bottom: 12px;
  padding-left: 20px;
  font-weight: 500;
}
.chart-unit {
  font-size: 11px;
  color: #555d6a;
}
.chart-wrapper {
  height: 300px;
  padding: 0 12px;
}
.chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 8px 0 4px;
  font-size: 11px;
  color: #8a919e;
}
.legend-line {
  display: inline-block;
  width: 20px;
  height: 3px;
  border-radius: 2px;
  margin-right: 6px;
  vertical-align: middle;
}
.legend-assets {
  background: #34d399;
}
.legend-target {
  background: #f87171;
}
.legend-retire {
  background: #60a5fa;
}
</style>
