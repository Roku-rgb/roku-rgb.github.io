<script setup lang="ts">
import { computed } from "vue";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import type { WithdrawRow } from "../composables/useWithdrawSchedule";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const props = defineProps<{
  rows: WithdrawRow[];
  inflation: number;
  currentAge: number;
  retireAge: number | null;
  isNominal: boolean;
}>();

const emit = defineEmits<{
  "update:isNominal": [value: boolean];
}>();

const displayRows = computed(() => {
  const inf = props.inflation / 100;
  return props.rows.map((r) => {
    if (!props.isNominal) return r;
    const k = r.age - props.currentAge;
    const f = Math.pow(1 + inf, k);
    return {
      ...r,
      lmpWithdraw: r.lmpWithdraw * f,
      pension: r.pension * f,
      rpWithdraw: r.rpWithdraw * f,
      totalWithdraw: r.totalWithdraw * f,
      totalSpend: r.totalSpend * f,
    };
  });
});

const chartData = computed(() => ({
  labels: displayRows.value.map((r) => r.age),
  datasets: [
    {
      label: "LMP 提領",
      data: displayRows.value.map((r) => Math.round(r.lmpWithdraw)),
      backgroundColor: "#f59e0b",
      borderRadius: 2,
    },
    {
      label: "年金收入",
      data: displayRows.value.map((r) => Math.round(r.pension)),
      backgroundColor: "#60a5fa",
      borderRadius: 2,
    },
    {
      label: "RP 提領",
      data: displayRows.value.map((r) => Math.round(r.rpWithdraw)),
      backgroundColor: "#a78bfa",
      borderRadius: 2,
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
      stacked: true,
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
      stacked: true,
      ticks: {
        color: "#555d6a",
        font: { size: 11 },
        callback: (v: number | string) => `${v} 萬`,
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
          return `${displayRows.value[idx].age} 歲`;
        },
        afterBody: (items: { dataIndex: number }[]) => {
          const idx = items[0]?.dataIndex;
          if (idx === undefined) return [];
          const r = displayRows.value[idx];
          return [
            `總金額：${Math.round(r.totalSpend).toLocaleString()} 萬`,
          ];
        },
      },
    },
  },
}));
</script>

<template>
  <div v-if="rows.length" class="chart-container">
    <div class="chart-header">
      <div class="chart-title">
        每年提領金額
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
      <Bar :data="chartData" :options="chartOptions" />
    </div>
    <div class="chart-legend">
      <span><span class="legend-dot" style="background: #f59e0b"></span>LMP 提領</span>
      <span><span class="legend-dot" style="background: #60a5fa"></span>年金收入</span>
      <span><span class="legend-dot" style="background: #a78bfa"></span>RP 提領</span>
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
.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 6px;
  vertical-align: middle;
}
</style>
