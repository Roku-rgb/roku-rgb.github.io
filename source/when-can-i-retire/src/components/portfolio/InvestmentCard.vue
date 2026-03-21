<script setup lang="ts">
import { computed } from 'vue'
import type { Investment, ValueBasis } from '../../types/portfolio'
import SliderInput from '../common/SliderInput.vue'

const model = defineModel<Investment>({ required: true })
const props = withDefaults(defineProps<{ endValue: number; inflation: number; currentAge: number; tag?: string; tagColor?: string; enabled?: boolean }>(), { tag: '', tagColor: '', enabled: true })
defineEmits<{ delete: []; 'toggle-enabled': [] }>()

function set<K extends keyof Investment>(key: K, value: Investment[K]) {
  model.value = { ...model.value, [key]: value }
}

const rate = computed({ get: () => model.value.rate, set: v => set('rate', v) })
const initialValue = computed({ get: () => model.value.initialValue, set: v => set('initialValue', v) })
const monthlyContribution = computed({ get: () => model.value.monthlyContribution, set: v => set('monthlyContribution', v) })
const fromAge = computed({ get: () => model.value.fromAge, set: v => set('fromAge', v) })
const toAge = computed({ get: () => model.value.toAge, set: v => set('toAge', v) })

const nominalEndValue = computed(() => {
  const inf = props.inflation / 100
  return props.endValue * Math.pow(1 + inf, model.value.toAge - props.currentAge)
})
</script>

<template>
  <div class="card" :class="{ 'card-disabled': !props.enabled }">
    <div class="card-header">
      <button class="eye-btn" :class="{ off: !props.enabled }" @click="$emit('toggle-enabled')" :title="props.enabled ? '點擊停用' : '點擊啟用'">
        <svg v-if="props.enabled" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      </button>
      <span v-if="props.tag" class="type-tag" :style="{ color: props.tagColor, borderColor: props.tagColor }">{{ props.tag }}</span>
      <input
        class="card-label"
        :value="model.label"
        @input="set('label', ($event.target as HTMLInputElement).value)" />
      <button class="card-delete" @click="$emit('delete')">×</button>
    </div>
    <div class="card-body">
      <SliderInput v-model="rate" label="報酬率" :min="0" :max="20" :step="0.1" unit="%">
        <div class="basis-toggle">
          <button :class="{ active: model.rateBasis === 'nominal' }" @click="set('rateBasis', 'nominal' as ValueBasis)">名目</button>
          <button :class="{ active: model.rateBasis === 'real' }" @click="set('rateBasis', 'real' as ValueBasis)">實質</button>
        </div>
      </SliderInput>
      <SliderInput v-model="initialValue" label="初始金額" :min="0" :max="2000" :step="1" unit=" 萬">
        <div class="basis-toggle">
          <button :class="{ active: (model.initialValueBasis ?? 'real') === 'nominal' }" @click="set('initialValueBasis', 'nominal' as ValueBasis)">名目</button>
          <button :class="{ active: (model.initialValueBasis ?? 'real') === 'real' }" @click="set('initialValueBasis', 'real' as ValueBasis)">實質</button>
        </div>
      </SliderInput>
      <SliderInput v-model="monthlyContribution" label="每月投資" :min="0" :max="15" :step="0.05" unit=" 萬">
        <div class="basis-toggle">
          <button :class="{ active: (model.monthlyContributionBasis ?? 'real') === 'nominal' }" @click="set('monthlyContributionBasis', 'nominal' as ValueBasis)">名目</button>
          <button :class="{ active: (model.monthlyContributionBasis ?? 'real') === 'real' }" @click="set('monthlyContributionBasis', 'real' as ValueBasis)">實質</button>
        </div>
      </SliderInput>
      <div class="age-sliders">
        <SliderInput v-model="fromAge" label="起始年齡" :min="20" :max="100" :step="1" unit=" 歲" />
        <SliderInput v-model="toAge" label="結束年齡" :min="20" :max="100" :step="1" unit=" 歲" />
      </div>
    </div>
    <div class="card-footer">
      到期金額：<span class="computed-value">{{ Math.round(nominalEndValue).toLocaleString() }} 萬<span class="basis-label">(名目)</span></span>
      <span class="separator">/</span>
      <span class="computed-value">{{ Math.round(props.endValue).toLocaleString() }} 萬<span class="basis-label">(實質)</span></span>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #1e293b;
  border-left: 3px solid #60a5fa;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.card-label {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 1px solid #334155;
  color: #e8eaed;
  font-size: 14px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  padding: 2px 0;
  outline: none;
}
.card-label:focus {
  border-bottom-color: #60a5fa;
}
.card-delete {
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  transition: color 0.2s;
}
.card-delete:hover {
  color: #f87171;
}
.eye-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 4px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}
.eye-btn:hover {
  background: rgba(148, 163, 184, 0.1);
  border-color: rgba(148, 163, 184, 0.4);
  color: #e2e8f0;
}
.eye-btn.off {
  color: #4b5563;
  border-color: rgba(75, 85, 99, 0.3);
}
.eye-btn.off:hover {
  color: #6b7280;
  background: rgba(75, 85, 99, 0.15);
}
.card-disabled {
  opacity: 0.45;
}
.card-disabled .card-body,
.card-disabled .card-footer {
  pointer-events: none;
}
.type-tag {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  font-family: 'Space Mono', monospace;
  border: 1px solid;
  border-radius: 4px;
  padding: 2px 6px;
  white-space: nowrap;
  flex-shrink: 0;
  opacity: 0.85;
}
.card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.basis-toggle {
  display: flex;
  background: #1e293b;
  border-radius: 6px;
  padding: 1px;
  gap: 1px;
}
.basis-toggle button {
  padding: 3px 8px;
  font-size: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  color: #6b7280;
  background: transparent;
  transition: all 0.2s;
  font-family: inherit;
}
.basis-toggle button.active {
  background: #334155;
  color: #e8eaed;
}
.field-row {
  display: flex;
  gap: 16px;
}
.field-row > * {
  flex: 1;
}
.age-sliders {
  display: flex;
  gap: 16px;
}
.age-sliders > * {
  flex: 1;
}
.card-footer {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #1e293b;
  font-size: 12px;
  color: #8a919e;
}
.computed-value {
  font-family: 'Space Mono', monospace;
  font-weight: 600;
  color: #60a5fa;
}
.basis-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 10px;
  font-weight: 400;
  color: #6b7280;
  margin-left: 2px;
}
.separator {
  color: #4b5563;
  margin: 0 4px;
}
</style>
