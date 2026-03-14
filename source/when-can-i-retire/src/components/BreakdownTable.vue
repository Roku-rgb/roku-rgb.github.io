<script setup lang="ts">
import { computed } from "vue";
import type { RetireDetails, ChartDataPoint } from "../types/retirement";

const props = defineProps<{
  details: RetireDetails;
  chartData: ChartDataPoint[];
  eBase: number;
  eExtra: number;
  pension: number;
  pensionAge: number;
  endAge: number;
  currentAge: number;
  inflation: number;
  rLmp: number;
  rRp: number;
  isNominal: boolean;
}>();

const emit = defineEmits<{
  "update:isNominal": [value: boolean];
}>();

/** 將實質金額換算為名目金額（從現在起 yearsFromNow 年後） */
function nominal(realAmount: number, yearsFromNow: number): string {
  const inf = props.inflation / 100;
  return Math.round(
    realAmount * Math.pow(1 + inf, yearsFromNow),
  ).toLocaleString();
}

/** 退休當年距離現在的年數（用於名目換算） */
const yearsToRetire = computed(
  () => props.details.age - props.currentAge,
);

/** 組成明細表：依 isNominal 顯示實質或退休當年的名目金額 */
const summaryDisplay = computed(() => {
  const y = yearsToRetire.value;
  if (!props.isNominal) {
    return {
      lmp: Math.round(props.details.lmp).toLocaleString(),
      rp: Math.round(props.details.rp).toLocaleString(),
      target: Math.round(props.details.target).toLocaleString(),
      eBase: props.eBase,
      eExtra: props.eExtra,
      pension: props.pension,
      totalSpend: props.eBase + props.eExtra,
    };
  }
  return {
    lmp: nominal(props.details.lmp, y),
    rp: nominal(props.details.rp, y),
    target: nominal(props.details.target, y),
    eBase: Math.round(
      props.eBase * Math.pow(1 + props.inflation / 100, y),
    ),
    eExtra: Math.round(
      props.eExtra * Math.pow(1 + props.inflation / 100, y),
    ),
    pension: Math.round(
      props.pension * Math.pow(1 + props.inflation / 100, y),
    ),
    totalSpend: Math.round(
      (props.eBase + props.eExtra) * Math.pow(1 + props.inflation / 100, y),
    ),
  };
});

/** 逐年提領明細：從退休歲數到 endAge，每年一筆（實質或名目） */
const yearlyRows = computed(() => {
  const inf = props.inflation / 100;
  const rows: {
    age: number;
    lmp: number;
    rp: number;
    pension: number;
    total: number;
  }[] = [];
  for (let age = props.details.age; age <= props.endAge; age++) {
    const hasPension = age >= props.pensionAge && props.pension > 0;
    const lmpReal = hasPension
      ? Math.max(0, props.eBase - props.pension)
      : props.eBase;
    const rpReal = props.eExtra;
    const pensionReal = hasPension ? props.pension : 0;
    const yearsFromNow = age - props.currentAge;
    const f = props.isNominal ? Math.pow(1 + inf, yearsFromNow) : 1;
    rows.push({
      age,
      lmp: Math.round(lmpReal * f),
      rp: Math.round(rpReal * f),
      pension: Math.round(pensionReal * f),
      total: Math.round((lmpReal + rpReal + pensionReal) * f),
    });
  }
  return rows;
});
</script>

<template>
  <div class="breakdown">
    <div class="breakdown-header">
      <div class="breakdown-title">
        退休金組成明細（{{ details.age }} 歲退休）<span class="block-unit"
          >（{{ isNominal ? "名目" : "實質購買力" }}）</span
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
    <table>
      <thead>
        <tr>
          <th>項目</th>
          <th>金額</th>
          <th>用途</th>
          <th>報酬假設</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="tag tag-lmp">🛡 LMP</span></td>
          <td class="mono" style="color: #f59e0b">
            {{ summaryDisplay.lmp }} 萬
          </td>
          <td class="muted">
            每年基本開支 {{ summaryDisplay.eBase }} 萬
            <span v-if="pension > 0"
              >（{{ pensionAge }}歲起年金補 {{ summaryDisplay.pension }} 萬）</span
            >
          </td>
          <td class="muted">{{ rLmp }}%</td>
        </tr>
        <tr>
          <td><span class="tag tag-rp">📈 RP</span></td>
          <td class="mono" style="color: #a78bfa">
            {{ summaryDisplay.rp }} 萬
          </td>
          <td class="muted"
            >每年額外花費 {{ summaryDisplay.eExtra }} 萬（ABW 彈性提領）</td
          >
          <td class="muted">{{ rRp }}%</td>
        </tr>
        <tr class="total-row">
          <td><span class="tag tag-total">💰 合計</span></td>
          <td class="mono total-value">
            {{ summaryDisplay.target }} 萬
          </td>
          <td class="muted">每年花費共 {{ summaryDisplay.totalSpend }} 萬</td>
          <td class="muted">—</td>
        </tr>
      </tbody>
    </table>
    <div class="breakdown-title" style="margin-top: 20px">
      退休金提領明細（{{ details.age }} 歲退休）<span class="block-unit"
        >（{{ isNominal ? "名目" : "實質購買力" }}）</span
      >
    </div>
    <!-- 實質 -->
    <table v-if="!isNominal">
      <thead>
        <tr>
          <th>期間</th>
          <th>LMP 提領</th>
          <th>RP 提領（ABW）</th>
          <th>年金收入</th>
          <th>合計</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="details.age < pensionAge">
          <td class="muted">{{ details.age }}–{{ pensionAge - 1 }} 歲</td>
          <td class="mono" style="color: #f59e0b">{{ eBase }} 萬</td>
          <td class="mono" style="color: #a78bfa">{{ eExtra }} 萬</td>
          <td class="muted">—</td>
          <td class="mono total-value">{{ eBase + eExtra }} 萬</td>
        </tr>
        <tr v-if="pension > 0 && details.age < pensionAge">
          <td class="muted">{{ pensionAge }}–{{ endAge }} 歲</td>
          <td class="mono" style="color: #f59e0b">
            {{ Math.max(0, eBase - pension) }} 萬
          </td>
          <td class="mono" style="color: #a78bfa">{{ eExtra }} 萬</td>
          <td class="mono" style="color: #34d399">{{ pension }} 萬</td>
          <td class="mono total-value">
            {{ Math.max(0, eBase - pension) + eExtra + pension }} 萬
          </td>
        </tr>
        <tr v-if="details.age >= pensionAge">
          <td class="muted">{{ details.age }}–{{ endAge }} 歲</td>
          <td class="mono" style="color: #f59e0b">
            {{ Math.max(0, eBase - pension) }} 萬
          </td>
          <td class="mono" style="color: #a78bfa">{{ eExtra }} 萬</td>
          <td class="mono" style="color: #34d399">
            {{ pension > 0 ? pension + " 萬" : "—" }}
          </td>
          <td class="mono total-value">
            {{ Math.max(0, eBase - pension) + eExtra + pension }} 萬
          </td>
        </tr>
      </tbody>
    </table>
    <!-- 名目（經通膨換算） -->
    <table v-else>
      <thead>
        <tr>
          <th>期間</th>
          <th>LMP 提領</th>
          <th>RP 提領（ABW）</th>
          <th>年金收入</th>
          <th>合計</th>
        </tr>
      </thead>
      <tbody>
        <!-- 退休～年金起領前 -->
        <tr v-if="details.age < pensionAge">
          <td class="muted">
            {{ details.age }} 歲<br />
            <span class="range-sep">↓</span><br />
            {{ pensionAge - 1 }} 歲
          </td>
          <td class="mono" style="color: #f59e0b">
            {{ nominal(eBase, details.age - currentAge) }}<br />
            <span class="range-sep">～</span><br />
            {{ nominal(eBase, pensionAge - 1 - currentAge) }} 萬
          </td>
          <td class="mono" style="color: #a78bfa">
            {{ nominal(eExtra, details.age - currentAge) }}<br />
            <span class="range-sep">～</span><br />
            {{ nominal(eExtra, pensionAge - 1 - currentAge) }} 萬
          </td>
          <td class="muted">—</td>
          <td class="mono total-value">
            {{ nominal(eBase + eExtra, details.age - currentAge) }}<br />
            <span class="range-sep">～</span><br />
            {{ nominal(eBase + eExtra, pensionAge - 1 - currentAge) }} 萬
          </td>
        </tr>
        <!-- 年金起領後 -->
        <tr v-if="pension > 0 && details.age < pensionAge">
          <td class="muted">
            {{ pensionAge }} 歲<br />
            <span class="range-sep">↓</span><br />
            {{ endAge }} 歲
          </td>
          <td class="mono" style="color: #f59e0b">
            {{ nominal(Math.max(0, eBase - pension), pensionAge - currentAge)
            }}<br />
            <span class="range-sep">～</span><br />
            {{ nominal(Math.max(0, eBase - pension), endAge - currentAge) }} 萬
          </td>
          <td class="mono" style="color: #a78bfa">
            {{ nominal(eExtra, pensionAge - currentAge) }}<br />
            <span class="range-sep">～</span><br />
            {{ nominal(eExtra, endAge - currentAge) }} 萬
          </td>
          <td class="mono" style="color: #34d399">
            {{ nominal(pension, pensionAge - currentAge) }}<br />
            <span class="range-sep">～</span><br />
            {{ nominal(pension, endAge - currentAge) }} 萬
          </td>
          <td class="mono total-value">
            {{
              nominal(
                Math.max(0, eBase - pension) + eExtra + pension,
                pensionAge - currentAge,
              )
            }}<br />
            <span class="range-sep">～</span><br />
            {{
              nominal(
                Math.max(0, eBase - pension) + eExtra + pension,
                endAge - currentAge,
              )
            }}
            萬
          </td>
        </tr>
        <!-- 退休時已過年金起領年齡 -->
        <tr v-if="details.age >= pensionAge">
          <td class="muted">
            {{ details.age }} 歲<br />
            <span class="range-sep">↓</span><br />
            {{ endAge }} 歲
          </td>
          <td class="mono" style="color: #f59e0b">
            {{ nominal(Math.max(0, eBase - pension), details.age - currentAge)
            }}<br />
            <span class="range-sep">～</span><br />
            {{ nominal(Math.max(0, eBase - pension), endAge - currentAge) }} 萬
          </td>
          <td class="mono" style="color: #a78bfa">
            {{ nominal(eExtra, details.age - currentAge) }}<br />
            <span class="range-sep">～</span><br />
            {{ nominal(eExtra, endAge - currentAge) }} 萬
          </td>
          <td class="mono" style="color: #34d399">
            <template v-if="pension > 0">
              {{ nominal(pension, details.age - currentAge) }}<br />
              <span class="range-sep">～</span><br />
              {{ nominal(pension, endAge - currentAge) }} 萬
            </template>
            <template v-else>—</template>
          </td>
          <td class="mono total-value">
            {{
              nominal(
                Math.max(0, eBase - pension) + eExtra + pension,
                details.age - currentAge,
              )
            }}<br />
            <span class="range-sep">～</span><br />
            {{
              nominal(
                Math.max(0, eBase - pension) + eExtra + pension,
                endAge - currentAge,
              )
            }}
            萬
          </td>
        </tr>
      </tbody>
    </table>
    <!-- 逐年提領明細 -->
    <div class="withdrawal-title">逐年提領明細</div>
    <div class="yearly-scroll">
      <table class="yearly-table">
        <thead>
          <tr>
            <th>歲數</th>
            <th>LMP 提領</th>
            <th>RP 提領（ABW）</th>
            <th>年金收入</th>
            <th>合計</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in yearlyRows" :key="row.age">
            <td class="muted">{{ row.age }}</td>
            <td class="mono" style="color: #f59e0b">
              {{ row.lmp.toLocaleString() }} 萬
            </td>
            <td class="mono" style="color: #a78bfa">
              {{ row.rp.toLocaleString() }} 萬
            </td>
            <td class="mono" style="color: #34d399">
              {{ row.pension > 0 ? row.pension.toLocaleString() + " 萬" : "—" }}
            </td>
            <td class="mono total-value">
              {{ row.total.toLocaleString() }} 萬
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.breakdown {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 20px;
  margin-top: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}
.breakdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.breakdown-title {
  font-size: 13px;
  color: #8a919e;
  font-weight: 500;
}
.block-unit {
  font-size: 11px;
  color: #555d6a;
  font-weight: 400;
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
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
thead tr {
  border-bottom: 1px solid #1e293b;
}
th {
  text-align: left;
  padding: 8px 12px;
  color: #6b7280;
  font-weight: 500;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
td {
  padding: 10px 12px;
}
tbody tr {
  border-bottom: 1px solid rgba(30, 41, 59, 0.07);
}
.total-row {
  border-top: 1px solid #334155;
  border-bottom: none;
}
.mono {
  font-family: "Space Mono", monospace;
  font-weight: 700;
}
.total-value {
  color: #34d399;
  font-size: 15px;
}
.muted {
  color: #8a919e;
}
.tag {
  font-weight: 700;
}
.tag-lmp {
  color: #f59e0b;
}
.tag-rp {
  color: #a78bfa;
}
.tag-total {
  color: #34d399;
}
.range-sep {
  color: #4b5563;
  font-size: 11px;
  font-weight: 400;
}
.yearly-scroll {
  max-height: 280px;
  overflow-y: auto;
  margin-top: 8px;
  border: 1px solid #1e293b;
  border-radius: 8px;
}
.yearly-table {
  margin-top: 0;
}
.yearly-table td,
.yearly-table th {
  padding: 6px 10px;
  font-size: 12px;
}
.yearly-scroll .yearly-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #0f172a;
  box-shadow: 0 1px 0 0 #1e293b;
}
.withdrawal-title {
  font-size: 13px;
  color: #8a919e;
  margin-top: 20px;
  margin-bottom: 12px;
  padding-top: 16px;
  border-top: 1px solid #1e293b;
  font-weight: 500;
}
</style>
