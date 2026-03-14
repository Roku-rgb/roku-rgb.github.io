<script setup lang="ts">
import { useRetirementInputs } from "../composables/useRetirementInputs";
import { useRetirementCalc } from "../composables/useRetirementCalc";
import { fmtMoney } from "../utils/format";
import ResultBanner from "./ResultBanner.vue";
import InfoCards from "./InfoCards.vue";
import RetirementChart from "./RetirementChart.vue";
import BreakdownTable from "./BreakdownTable.vue";
import SliderInput from "./SliderInput.vue";
import SliderGroup from "./SliderGroup.vue";

const inputs = useRetirementInputs();
const result = useRetirementCalc(inputs);
</script>

<template>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-tag">LMP + RP(+ABW) Strategy</div>
      <h1 class="header-title">退休年齡計算器</h1>
      <div class="header-sub">調整下方參數，計算最早可退休年齡</div>
    </div>

    <!-- Result Banner -->
    <ResultBanner
      :retire-age="result.retireAge"
      :retire-details="result.retireDetails" />

    <!-- Info Cards -->
    <InfoCards v-if="result.retireDetails" :details="result.retireDetails" />

    <!-- Chart -->
    <RetirementChart
      :data="result.data"
      :retire-age="result.retireAge"
      :inflation="inputs.inflation.value"
      :current-age="inputs.currentAge.value" />

    <!-- Sliders: top row -->
    <div class="grid-2">
      <SliderGroup title="個人 / 儲蓄" color="#60a5fa">
        <SliderInput
          v-model="inputs.currentAge.value"
          label="目前年齡"
          :min="20"
          :max="65"
          :step="1"
          unit=" 歲" />
        <SliderInput
          v-model="inputs.currentCash.value"
          label="當前現金"
          :min="0"
          :max="3000"
          :step="10"
          unit=" 萬"
          :format="fmtMoney" />
        <SliderInput
          v-model="inputs.monthlySave.value"
          label="每月存款（名目）"
          :min="0"
          :max="20"
          :step="0.5"
          unit=" 萬" />
        <SliderInput
          v-model="inputs.rSave.value"
          label="儲蓄期實質報酬率"
          :min="0"
          :max="16"
          :step="0.5"
          unit="%" />
      </SliderGroup>

      <SliderGroup title="退休 / 支出" color="#f59e0b">
        <SliderInput
          v-model="inputs.endAge.value"
          label="規劃活到"
          :min="70"
          :max="100"
          :step="1"
          unit=" 歲" />
        <SliderInput
          v-model="inputs.eBase.value"
          label="每年基本開支（實質購買力）"
          :min="12"
          :max="120"
          :step="2"
          unit=" 萬" />
        <SliderInput
          v-model="inputs.eExtra.value"
          label="每年額外花費（實質購買力）"
          :min="0"
          :max="60"
          :step="2"
          unit=" 萬" />
        <SliderInput
          v-model="inputs.pension.value"
          label="年金收入（實質購買力）"
          :min="0"
          :max="60"
          :step="2"
          unit=" 萬/年" />
      </SliderGroup>
    </div>

    <!-- Sliders: bottom row -->
    <div class="grid-3">
      <SliderGroup title="利率假設" color="#a78bfa">
        <SliderInput
          v-model="inputs.pensionAge.value"
          label="年金起領年齡"
          :min="55"
          :max="70"
          :step="1"
          unit=" 歲" />
        <SliderInput
          v-model="inputs.inflation.value"
          label="預估通膨率"
          :min="0"
          :max="6"
          :step="0.5"
          unit="%" />
      </SliderGroup>
      <SliderGroup title="&nbsp;" color="#a78bfa">
        <SliderInput
          v-model="inputs.rLmp.value"
          label="TIPS 實質殖利率（LMP）"
          :min="0"
          :max="4"
          :step="0.1"
          unit="%" />
      </SliderGroup>
      <SliderGroup title="&nbsp;" color="#a78bfa">
        <SliderInput
          v-model="inputs.rRp.value"
          label="股市實質報酬率（RP）"
          :min="2"
          :max="16"
          :step="0.5"
          unit="%" />
      </SliderGroup>
    </div>

    <!-- Breakdown Table -->
    <BreakdownTable
      v-if="result.retireDetails"
      :details="result.retireDetails"
      :e-base="inputs.eBase.value"
      :e-extra="inputs.eExtra.value"
      :pension="inputs.pension.value"
      :pension-age="inputs.pensionAge.value"
      :end-age="inputs.endAge.value"
      :current-age="inputs.currentAge.value"
      :inflation="inputs.inflation.value"
      :r-lmp="inputs.rLmp.value"
      :r-rp="inputs.rRp.value" />

    <!-- Footer -->
    <div class="footer">本工具僅供參考，不構成投資建議</div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(160deg, #0a0f1c 0%, #0f172a 40%, #111827 100%);
  color: #e8eaed;
  font-family: "DM Sans", sans-serif;
  padding: 24px 20px;
}
.header {
  text-align: center;
  margin-bottom: 28px;
}
.header-tag {
  font-size: 11px;
  letter-spacing: 4px;
  color: #60a5fa;
  text-transform: uppercase;
  margin-bottom: 6px;
  font-family: "Space Mono", monospace;
}
.header-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #e8eaed, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.header-sub {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 24px;
}
.grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0 24px;
  margin-top: 8px;
}
.footer {
  text-align: center;
  margin-top: 28px;
  padding: 16px 0;
  border-top: 1px solid #1e293b;
  font-size: 11px;
  color: #4b5563;
}
</style>
