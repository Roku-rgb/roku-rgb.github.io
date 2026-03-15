<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  useRetirementCalc,
  defaultInputs,
} from "../composables/useRetirementCalc";
import { useWithdrawSchedule } from "../composables/useWithdrawSchedule";
import { fmtMoney } from "../utils/format";
import ResultBanner from "./ResultBanner.vue";
import InfoCards from "./InfoCards.vue";
import RetirementChart from "./RetirementChart.vue";
import WithdrawChart from "./WithdrawChart.vue";
import WithdrawTable from "./WithdrawTable.vue";
import PmtCalculator from "./PmtCalculator.vue";
import SliderInput from "./SliderInput.vue";
import SliderGroup from "./SliderGroup.vue";

const inputs = defaultInputs();
const result = useRetirementCalc(inputs);
const isNominal = ref(true);

const withdrawRows = useWithdrawSchedule({
  retireAge: computed(() => result.value.retireAge),
  endAge: inputs.endAge,
  eBase: inputs.eBase,
  eExtra: inputs.eExtra,
  pension: inputs.pension,
  pensionAge: inputs.pensionAge,
  rLmp: inputs.rLmp,
  rRp: inputs.rRp,
  lmpAtRetire: computed(() => result.value.retireDetails?.lmp ?? 0),
  rpAtRetire: computed(() => result.value.retireDetails?.rp ?? 0),
});

// 目前年齡超過規劃活到時，強制將規劃活到設成目前年齡+1
watch(
  () => inputs.currentAge.value,
  (age) => {
    if (age >= inputs.endAge.value) {
      inputs.endAge.value = age + 1;
    }
  },
);
</script>

<template>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-tag">LMP + RP(+ABW) Strategy</div>
      <h1 class="header-title">退休年齡計算機</h1>
      <div class="header-sub">調整下方參數，計算最早可退休年齡</div>
    </div>

    <!-- Result Banner -->
    <ResultBanner
      :retire-age="result.retireAge"
      :retire-details="result.retireDetails" />

    <!-- Info Cards -->
    <InfoCards
      :details="result.retireDetails"
      :inflation="inputs.inflation.value"
      :current-age="inputs.currentAge.value"
      v-model:is-nominal="isNominal" />

    <!-- Chart -->
    <RetirementChart
      :data="result.data"
      :retire-age="result.retireAge"
      :inflation="inputs.inflation.value"
      :current-age="inputs.currentAge.value"
      v-model:is-nominal="isNominal" />

    <!-- Sliders: top row -->
    <div class="grid-2">
      <SliderGroup title="個人 / 儲蓄" color="#60a5fa">
        <SliderInput
          v-model="inputs.currentAge.value"
          label="目前年齡"
          :min="20"
          :max="99"
          :step="1"
          unit=" 歲" />
        <SliderInput
          v-model="inputs.currentCash.value"
          label="當前現金"
          :min="0"
          :max="1500"
          :step="10"
          unit=" 萬"
          :format="fmtMoney" />
        <SliderInput
          v-model="inputs.monthlySave.value"
          label="每月存款（名目）"
          :min="0"
          :max="10"
          :step="0.1"
          unit=" 萬" />
        <SliderInput
          v-model="inputs.rSave.value"
          label="儲蓄期報酬率（名目）"
          :min="0"
          :max="16"
          :step="0.1"
          unit="%" />
      </SliderGroup>

      <SliderGroup title="退休 / 支出" color="#f59e0b">
        <SliderInput
          v-model="inputs.endAge.value"
          label="規劃活到"
          :min="Math.max(70, inputs.currentAge.value + 1)"
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
          :max="120"
          :step="2"
          unit=" 萬" />
        <SliderInput
          v-model="inputs.pension.value"
          label="年金收入（實質購買力）"
          :min="0"
          :max="60"
          :step="2"
          unit=" 萬/年" />
        <SliderInput
          v-model="inputs.pensionAge.value"
          label="年金起領年齡"
          :min="55"
          :max="70"
          :step="1"
          unit=" 歲" />
      </SliderGroup>
    </div>

    <!-- Sliders: bottom row -->
    <div class="slider-row-bottom">
      <SliderGroup title="利率假設" color="#a78bfa">
        <div class="rate-sliders">
          <SliderInput
            v-model="inputs.inflation.value"
            label="預估通膨率"
            :min="0"
            :max="6"
            :step="0.1"
            unit="%" />
          <SliderInput
            v-model="inputs.rLmp.value"
            label="TIPS 實質殖利率（LMP）"
            :min="0"
            :max="4"
            :step="0.1"
            unit="%" />
          <SliderInput
            v-model="inputs.rRp.value"
            label="股市實質報酬率（RP）"
            :min="2"
            :max="16"
            :step="0.1"
            unit="%" />
        </div>
      </SliderGroup>
    </div>

    <!-- Withdraw Chart -->
    <WithdrawChart
      :rows="withdrawRows"
      :inflation="inputs.inflation.value"
      :current-age="inputs.currentAge.value"
      :retire-age="result.retireAge"
      v-model:is-nominal="isNominal" />

    <!-- Withdraw Table -->
    <WithdrawTable
      :rows="withdrawRows"
      :inflation="inputs.inflation.value"
      :current-age="inputs.currentAge.value"
      v-model:is-nominal="isNominal" />

    <!-- PMT Calculator -->
    <PmtCalculator />

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
@media (max-width: 640px) {
  .grid-2 {
    grid-template-columns: 1fr;
    gap: 16px 0;
  }
}
.slider-row-bottom {
  margin-top: 8px;
}
.rate-sliders {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.rate-sliders > * {
  flex: 1;
  min-width: 0;
}
@media (max-width: 640px) {
  .rate-sliders {
    flex-direction: column;
    gap: 16px;
  }
  .rate-sliders > * {
    flex: none;
  }
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
