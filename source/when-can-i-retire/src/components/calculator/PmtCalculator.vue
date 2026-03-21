<script setup lang="ts">
import { ref, computed, watch } from "vue";
import SliderInput from "../common/SliderInput.vue";
import SliderGroup from "../common/SliderGroup.vue";
import { fmtMoney } from "../../utils/format";

const pv = ref(470);
const r = ref(8); // 名目報酬率
const inflation = ref(2);
const rReal = ref(6); // 實質報酬率（切換到實質模式時使用）
const n = ref(33);

const isNominal = ref(true);

// 從名目+通膨算出實質
function nominalToReal(nominal: number, inf: number) {
  return ((1 + nominal / 100) / (1 + inf / 100) - 1) * 100;
}
// 從實質+通膨算出名目
function realToNominal(real: number, inf: number) {
  return ((1 + real / 100) * (1 + inf / 100) - 1) * 100;
}

watch(isNominal, (nominal) => {
  if (nominal) {
    r.value = Math.round(realToNominal(rReal.value, inflation.value) * 10) / 10;
  } else {
    rReal.value = Math.round(nominalToReal(r.value, inflation.value) * 10) / 10;
  }
});

const rateForPmt = computed(() => {
  if (isNominal.value) {
    return nominalToReal(r.value, inflation.value) / 100;
  }
  return rReal.value / 100;
});

const pmt = computed(() => {
  const rate = rateForPmt.value;
  if (rate === 0) return pv.value / n.value;
  const ordinary = (pv.value * rate) / (1 - Math.pow(1 + rate, -n.value));
  return ordinary / (1 + rate); // 期初年金
});
</script>

<template>
  <div class="pmt-block">
    <div class="grid-3">
      <SliderGroup title="RP 提領計算機" color="#34d399">
        <template #title-extra>
          <span class="block-sub">PMT = PV × r / (1 − (1+r)<sup>−n</sup>)</span>
        </template>
        <template #title-right>
          <div class="toggle-group">
            <button
              type="button"
              class="toggle-btn"
              :class="{ active: isNominal }"
              @click="isNominal = true">
              名目
            </button>
            <button
              type="button"
              class="toggle-btn"
              :class="{ active: !isNominal }"
              @click="isNominal = false">
              實質購買力
            </button>
          </div>
        </template>
        <SliderInput
          v-model="pv"
          label="目前 RP 帳戶餘額（名目）"
          :min="0"
          :max="2000"
          :step="1"
          unit=" 萬"
          :format="fmtMoney" />
        <SliderInput
          v-model="n"
          label="還要領幾年"
          :min="1"
          :max="80"
          :step="1"
          unit=" 年" />
        <SliderInput
          v-if="isNominal"
          v-model="r"
          label="股市報酬率（名目）"
          :min="0"
          :max="20"
          :step="0.1"
          unit="%" />
        <SliderInput
          v-else
          v-model="rReal"
          label="股市報酬率（實質）"
          :min="0"
          :max="16"
          :step="0.1"
          unit="%" />
        <SliderInput
          v-if="isNominal"
          v-model="inflation"
          label="預估通膨率"
          :min="0"
          :max="6"
          :step="0.1"
          unit="%" />
      </SliderGroup>
    </div>

    <div class="result-row">
      <span class="result-label">今年可領金額</span>
      <span class="result-value">{{ pmt.toFixed(2) }}</span>
      <span class="result-unit">萬（名目）</span>
    </div>
  </div>
</template>

<style scoped>
.pmt-block {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}
.block-sub {
  display: block;
  font-size: 11px;
  color: #555d6a;
  margin-bottom: 10px;
  font-family: "Space Mono", monospace;
}
.grid-3 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0 24px;
  margin-bottom: 16px;
  width: 100%;
}
.grid-3 > * {
  min-width: 0;
}
.result-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(
    135deg,
    rgba(30, 41, 59, 0.9),
    rgba(15, 23, 42, 0.95)
  );
  border: 1px solid color-mix(in srgb, #34d399 20%, transparent);
  border-radius: 12px;
  box-shadow: 0 4px 24px color-mix(in srgb, #34d399 7%, transparent);
}
.result-label {
  font-size: 13px;
  color: #8a919e;
}
.result-value {
  font-size: 28px;
  font-weight: 800;
  color: #34d399;
  font-family: "Space Mono", monospace;
  line-height: 1.1;
}
.result-unit {
  font-size: 12px;
  color: #6b7280;
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
</style>
