<script setup lang="ts">
import type { RetireDetails } from '../types/retirement'

const props = defineProps<{
  details: RetireDetails
  eBase: number
  eExtra: number
  pension: number
  pensionAge: number
  endAge: number
  currentAge: number
  inflation: number
  rLmp: number
  rRp: number
}>()

/** 將實質金額換算為名目金額（從現在起 yearsFromNow 年後） */
function nominal(realAmount: number, yearsFromNow: number): string {
  const inf = props.inflation / 100
  return Math.round(realAmount * Math.pow(1 + inf, yearsFromNow)).toLocaleString()
}
</script>

<template>
  <div class="breakdown">
    <div class="breakdown-title">退休金組成明細（{{ details.age }} 歲退休）</div>
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
          <td class="mono" style="color: #f59e0b">{{ details.lmp.toLocaleString() }} 萬</td>
          <td class="muted">
            每年基本開支 {{ eBase }} 萬
            <span v-if="pension > 0">（{{ pensionAge }}歲起年金補 {{ pension }} 萬）</span>
          </td>
          <td class="muted">{{ rLmp }}%</td>
        </tr>
        <tr>
          <td><span class="tag tag-rp">📈 RP</span></td>
          <td class="mono" style="color: #a78bfa">{{ details.rp.toLocaleString() }} 萬</td>
          <td class="muted">每年額外花費 {{ eExtra }} 萬（ABW 彈性提領）</td>
          <td class="muted">{{ rRp }}%</td>
        </tr>
        <tr class="total-row">
          <td><span class="tag tag-total">💰 合計</span></td>
          <td class="mono total-value">{{ details.target.toLocaleString() }} 萬</td>
          <td class="muted">每年實質花費共 {{ eBase + eExtra }} 萬</td>
          <td class="muted">—</td>
        </tr>
      </tbody>
    </table>

    <!-- 每年可提領金額 -->
    <div class="withdrawal-title">每年可提領金額</div>
    <table>
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
          <td class="muted">{{ details.age }}–{{ pensionAge - 1 }} 歲</td>
          <td class="mono" style="color: #f59e0b">{{ eBase }} 萬</td>
          <td class="mono" style="color: #a78bfa">{{ eExtra }} 萬</td>
          <td class="muted">—</td>
          <td class="mono total-value">{{ eBase + eExtra }} 萬</td>
        </tr>
        <!-- 年金起領後（或退休即有年金） -->
        <tr v-if="pension > 0 && details.age < pensionAge">
          <td class="muted">{{ pensionAge }}–{{ endAge }} 歲</td>
          <td class="mono" style="color: #f59e0b">{{ Math.max(0, eBase - pension) }} 萬</td>
          <td class="mono" style="color: #a78bfa">{{ eExtra }} 萬</td>
          <td class="mono" style="color: #34d399">{{ pension }} 萬</td>
          <td class="mono total-value">{{ Math.max(0, eBase - pension) + eExtra + pension }} 萬</td>
        </tr>
        <!-- 退休時已過年金起領年齡 -->
        <tr v-if="details.age >= pensionAge">
          <td class="muted">{{ details.age }}–{{ endAge }} 歲</td>
          <td class="mono" style="color: #f59e0b">{{ Math.max(0, eBase - pension) }} 萬</td>
          <td class="mono" style="color: #a78bfa">{{ eExtra }} 萬</td>
          <td class="mono" style="color: #34d399">{{ pension > 0 ? pension + ' 萬' : '—' }}</td>
          <td class="mono total-value">{{ Math.max(0, eBase - pension) + eExtra + pension }} 萬</td>
        </tr>
      </tbody>
    </table>

    <!-- 每年可提領金額（經通膨換算） -->
    <div class="withdrawal-title">每年可提領金額（經通膨換算，{{ inflation }}%）</div>
    <table>
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
            {{ details.age }} 歲<br>
            <span class="range-sep">↓</span><br>
            {{ pensionAge - 1 }} 歲
          </td>
          <td class="mono" style="color: #f59e0b">
            {{ nominal(eBase, details.age - currentAge) }}<br>
            <span class="range-sep">～</span><br>
            {{ nominal(eBase, pensionAge - 1 - currentAge) }} 萬
          </td>
          <td class="mono" style="color: #a78bfa">
            {{ nominal(eExtra, details.age - currentAge) }}<br>
            <span class="range-sep">～</span><br>
            {{ nominal(eExtra, pensionAge - 1 - currentAge) }} 萬
          </td>
          <td class="muted">—</td>
          <td class="mono total-value">
            {{ nominal(eBase + eExtra, details.age - currentAge) }}<br>
            <span class="range-sep">～</span><br>
            {{ nominal(eBase + eExtra, pensionAge - 1 - currentAge) }} 萬
          </td>
        </tr>
        <!-- 年金起領後 -->
        <tr v-if="pension > 0 && details.age < pensionAge">
          <td class="muted">
            {{ pensionAge }} 歲<br>
            <span class="range-sep">↓</span><br>
            {{ endAge }} 歲
          </td>
          <td class="mono" style="color: #f59e0b">
            {{ nominal(Math.max(0, eBase - pension), pensionAge - currentAge) }}<br>
            <span class="range-sep">～</span><br>
            {{ nominal(Math.max(0, eBase - pension), endAge - currentAge) }} 萬
          </td>
          <td class="mono" style="color: #a78bfa">
            {{ nominal(eExtra, pensionAge - currentAge) }}<br>
            <span class="range-sep">～</span><br>
            {{ nominal(eExtra, endAge - currentAge) }} 萬
          </td>
          <td class="mono" style="color: #34d399">
            {{ nominal(pension, pensionAge - currentAge) }}<br>
            <span class="range-sep">～</span><br>
            {{ nominal(pension, endAge - currentAge) }} 萬
          </td>
          <td class="mono total-value">
            {{ nominal(Math.max(0, eBase - pension) + eExtra + pension, pensionAge - currentAge) }}<br>
            <span class="range-sep">～</span><br>
            {{ nominal(Math.max(0, eBase - pension) + eExtra + pension, endAge - currentAge) }} 萬
          </td>
        </tr>
        <!-- 退休時已過年金起領年齡 -->
        <tr v-if="details.age >= pensionAge">
          <td class="muted">
            {{ details.age }} 歲<br>
            <span class="range-sep">↓</span><br>
            {{ endAge }} 歲
          </td>
          <td class="mono" style="color: #f59e0b">
            {{ nominal(Math.max(0, eBase - pension), details.age - currentAge) }}<br>
            <span class="range-sep">～</span><br>
            {{ nominal(Math.max(0, eBase - pension), endAge - currentAge) }} 萬
          </td>
          <td class="mono" style="color: #a78bfa">
            {{ nominal(eExtra, details.age - currentAge) }}<br>
            <span class="range-sep">～</span><br>
            {{ nominal(eExtra, endAge - currentAge) }} 萬
          </td>
          <td class="mono" style="color: #34d399">
            <template v-if="pension > 0">
              {{ nominal(pension, details.age - currentAge) }}<br>
              <span class="range-sep">～</span><br>
              {{ nominal(pension, endAge - currentAge) }} 萬
            </template>
            <template v-else>—</template>
          </td>
          <td class="mono total-value">
            {{ nominal(Math.max(0, eBase - pension) + eExtra + pension, details.age - currentAge) }}<br>
            <span class="range-sep">～</span><br>
            {{ nominal(Math.max(0, eBase - pension) + eExtra + pension, endAge - currentAge) }} 萬
          </td>
        </tr>
      </tbody>
    </table>
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
.breakdown-title {
  font-size: 13px;
  color: #8a919e;
  margin-bottom: 12px;
  font-weight: 500;
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
  font-family: 'Space Mono', monospace;
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
.tag-lmp { color: #f59e0b; }
.tag-rp { color: #a78bfa; }
.tag-total { color: #34d399; }
.range-sep {
  color: #4b5563;
  font-size: 11px;
  font-weight: 400;
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
