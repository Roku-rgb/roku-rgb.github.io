<script setup lang="ts">
import { computed } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import type { ChartDataPoint } from "../../types/retirement";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  annotationPlugin,
);

const props = defineProps<{
  data: ChartDataPoint[];
  retireAge: number | null;
  inflation: number;
  currentAge: number;
  isNominal: boolean;
}>();

const emit = defineEmits<{
  "update:isNominal": [value: boolean];
}>();

const displayData = computed(() => {
  const inf = props.inflation / 100;
  return props.data.map((d) => {
    if (!props.isNominal) {
      // 實質：assets 和 target 都已是實質值，直接顯示
      return {
        ...d,
        assets: Math.round(d.assets),
        target: Math.round(d.target),
        lmp: Math.round(d.lmp),
        rp: Math.round(d.rp),
        surplus: Math.round(d.surplus),
      };
    }
    // 名目：兩邊都乘以 (1+inf)^k
    const k = d.age - props.currentAge;
    const factor = Math.pow(1 + inf, k);
    return {
      ...d,
      assets: Math.round(d.assets * factor),
      target: Math.round(d.target * factor),
      lmp: Math.round(d.lmp * factor),
      rp: Math.round(d.rp * factor),
      surplus: Math.round(d.surplus * factor),
    };
  });
});

const chartData = computed(() => ({
  labels: displayData.value.map((d) => d.age),
  datasets: [
    {
      label: "累積資產",
      data: displayData.value.map((d) => d.assets),
      borderColor: "#34d399",
      backgroundColor: "rgba(52, 211, 153, 0.08)",
      borderWidth: 2.5,
      fill: true,
      pointRadius: 0,
      pointHitRadius: 8,
      tension: 0.3,
    },
    {
      label: "目標金額",
      data: displayData.value.map((d) => d.target),
      borderColor: "#f87171",
      backgroundColor: "rgba(248, 113, 113, 0.05)",
      borderWidth: 2,
      borderDash: [6, 3],
      fill: true,
      pointRadius: 0,
      pointHitRadius: 8,
      tension: 0.3,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index" as const,
    intersect: false,
  },
  scales: {
    x: {
      title: {
        display: true,
        text: "年齡",
        color: "#555d6a",
        font: { size: 11 },
      },
      ticks: { color: "#555d6a", font: { size: 11 } },
      grid: { color: "#1e293b" },
    },
    y: {
      ticks: {
        color: "#555d6a",
        font: { size: 11 },
        callback: (v: number | string) => {
          const n = Number(v);
          return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : v;
        },
      },
      grid: { color: "#1e293b" },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(15,23,42,0.95)",
      borderColor: "#334155",
      borderWidth: 1,
      cornerRadius: 8,
      titleFont: { size: 14, weight: "bold" as const },
      bodyFont: { size: 12 },
      padding: 12,
      callbacks: {
        title: (items: { dataIndex: number }[]) => {
          const idx = items[0]?.dataIndex;
          if (idx === undefined) return "";
          return `${displayData.value[idx].age} 歲 (年末)`;
        },
        label: (item: { datasetIndex: number; dataIndex: number }) => {
          const d = displayData.value[item.dataIndex];
          if (item.datasetIndex === 0)
            return `累積資產：${d.assets.toLocaleString()} 萬`;
          return `目標金額：${d.target.toLocaleString()} 萬`;
        },
        afterBody: (items: { dataIndex: number }[]) => {
          const idx = items[0]?.dataIndex;
          if (idx === undefined) return [];
          const d = displayData.value[idx];
          const lines = [
            `　LMP：${d.lmp.toLocaleString()} 萬`,
            `　RP：${d.rp.toLocaleString()} 萬`,
            d.surplus >= 0
              ? "✓ 可退休"
              : `差距：${Math.abs(d.surplus).toLocaleString()} 萬`,
          ];
          return lines;
        },
      },
    },
    annotation: props.retireAge
      ? (() => {
          const retireIndex = displayData.value.findIndex(
            (d) => d.age === props.retireAge,
          );
          if (retireIndex < 0) return {};
          return {
            annotations: {
              retireLine: {
                type: "line" as const,
                xMin: retireIndex,
                xMax: retireIndex,
                borderColor: "#60a5fa",
                borderWidth: 1.5,
                borderDash: [4, 4],
                label: {
                  display: true,
                  content: `${props.retireAge}歲`,
                  position: "start" as const,
                  color: "#60a5fa",
                  font: { size: 12, weight: "bold" as const },
                  backgroundColor: "transparent",
                },
              },
            },
          };
        })()
      : {},
  },
}));
</script>

<template>
  <div class="chart-container">
    <div class="chart-header">
      <div class="chart-title">
        資產累積 vs 退休目標金額
        <span class="chart-unit"
          >（單位：萬元，{{ isNominal ? "名目" : "實質購買力" }}）</span
        >
      </div>
      <div class="toggle-group">
        <button
          class="toggle-btn"
          :class="{ active: isNominal }"
          @click="emit('update:isNominal', true)">
          名目
        </button>
        <button
          class="toggle-btn"
          :class="{ active: !isNominal }"
          @click="emit('update:isNominal', false)">
          實質購買力
        </button>
      </div>
    </div>
    <div class="chart-wrapper">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <div class="chart-legend">
      <span><span class="legend-line legend-assets"></span>累積資產</span>
      <span><span class="legend-line legend-target"></span>目標金額</span>
      <span v-if="retireAge"
        ><span class="legend-line legend-retire"></span>可退休</span
      >
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
