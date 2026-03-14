<script setup lang="ts">
import { computed, ref } from "vue";
import type { WithdrawRow } from "../composables/useWithdrawSchedule";

const props = defineProps<{
  rows: WithdrawRow[];
  inflation: number;
  currentAge: number;
  isNominal: boolean;
}>();

const emit = defineEmits<{
  "update:isNominal": [value: boolean];
}>();

const expanded = ref(false);
const PREVIEW_COUNT = 10;

const displayRows = computed(() => {
  const inf = props.inflation / 100;
  return props.rows.map((r) => {
    if (!props.isNominal) {
      return {
        ...r,
        lmpWithdraw: Math.round(r.lmpWithdraw),
        pension: Math.round(r.pension),
        rpWithdraw: Math.round(r.rpWithdraw),
        totalSpend: Math.round(r.totalSpend),
        lmpBalanceStart: Math.round(r.lmpBalanceStart),
        lmpBalanceEnd: Math.round(r.lmpBalanceEnd),
        rpBalanceStart: Math.round(r.rpBalanceStart),
        rpBalanceEnd: Math.round(r.rpBalanceEnd),
      };
    }
    const k = r.age - props.currentAge - 1; // 計算年初時的實質購買力，所以需要減去 1 年
    const f = Math.pow(1 + inf, k);
    return {
      ...r,
      lmpWithdraw: Math.round(r.lmpWithdraw * f),
      pension: Math.round(r.pension * f),
      rpWithdraw: Math.round(r.rpWithdraw * f),
      totalSpend: Math.round(r.totalSpend * f),
      lmpBalanceStart: Math.round(r.lmpBalanceStart * f),
      lmpBalanceEnd: Math.round(r.lmpBalanceEnd * f),
      rpBalanceStart: Math.round(r.rpBalanceStart * f),
      rpBalanceEnd: Math.round(r.rpBalanceEnd * f),
    };
  });
});

const visibleRows = computed(() =>
  expanded.value
    ? displayRows.value
    : displayRows.value.slice(0, PREVIEW_COUNT),
);

const hasMore = computed(() => displayRows.value.length > PREVIEW_COUNT);
</script>

<template>
  <div v-if="rows.length" class="table-container">
    <div class="table-header">
      <div class="table-title">
        提領明細
        <span class="table-unit"
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
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>年齡</th>
            <th>LMP 提領</th>
            <th>年金</th>
            <th>RP 提領</th>
            <th>總金額</th>
            <th>LMP 餘額(年初/年末)</th>
            <th>RP 餘額(年初/年末)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in visibleRows" :key="r.age">
            <td class="cell-age">{{ r.age }}</td>
            <td>{{ r.lmpWithdraw.toLocaleString() }}</td>
            <td>{{ r.pension > 0 ? r.pension.toLocaleString() : "-" }}</td>
            <td>{{ r.rpWithdraw.toLocaleString() }}</td>
            <td class="cell-total">{{ r.totalSpend.toLocaleString() }}</td>
            <td>
              {{ r.lmpBalanceStart.toLocaleString() }}/{{
                r.lmpBalanceEnd.toLocaleString()
              }}
            </td>
            <td>
              {{ r.rpBalanceStart.toLocaleString() }}/{{
                r.rpBalanceEnd.toLocaleString()
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <button v-if="hasMore" class="expand-btn" @click="expanded = !expanded">
      {{ expanded ? "收合" : `展開全部（共 ${displayRows.length} 年）` }}
    </button>
  </div>
</template>

<style scoped>
.table-container {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 20px;
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
  font-family: "Space Mono", monospace;
}
thead th {
  position: sticky;
  top: 0;
  background: rgba(15, 23, 42, 0.95);
  color: #6b7280;
  font-size: 11px;
  font-weight: 500;
  text-align: right;
  padding: 8px 10px;
  border-bottom: 1px solid #1e293b;
  white-space: nowrap;
}
thead th:first-child {
  text-align: center;
}
tbody td {
  text-align: right;
  padding: 6px 10px;
  color: #94a3b8;
  border-bottom: 1px solid rgba(30, 41, 59, 0.5);
  white-space: nowrap;
}
tbody tr:hover td {
  background: rgba(30, 41, 59, 0.4);
}
.cell-age {
  text-align: center;
  color: #8a919e;
  font-weight: 600;
}
.cell-total {
  color: #e8eaed;
  font-weight: 600;
}
.expand-btn {
  display: block;
  margin: 12px auto 0;
  padding: 6px 20px;
  font-size: 12px;
  color: #60a5fa;
  background: transparent;
  border: 1px solid #334155;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.expand-btn:hover {
  background: rgba(96, 165, 250, 0.1);
  border-color: #60a5fa;
}
</style>
