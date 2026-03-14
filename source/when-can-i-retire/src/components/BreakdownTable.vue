<script setup lang="ts">
import type { RetireDetails } from '../types/retirement'

defineProps<{
  details: RetireDetails
  eBase: number
  eExtra: number
  pension: number
  pensionAge: number
  rLmp: number
  rRp: number
}>()
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
</style>
