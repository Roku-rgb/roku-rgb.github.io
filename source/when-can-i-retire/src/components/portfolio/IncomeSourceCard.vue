<script setup lang="ts">
import { computed } from 'vue'
import type { IncomeSource, ValueBasis } from '../../types/portfolio'
import SliderInput from '../common/SliderInput.vue'

const props = withDefaults(defineProps<{ color?: string; tag?: string; tagColor?: string; enabled?: boolean }>(), { color: '#34d399', tag: '', tagColor: '', enabled: true })
const model = defineModel<IncomeSource>({ required: true })
defineEmits<{ delete: []; 'toggle-enabled': [] }>()

function set<K extends keyof IncomeSource>(key: K, value: IncomeSource[K]) {
  model.value = { ...model.value, [key]: value }
}
function setBasis(field: 'amountBasis' | 'growthBasis', value: ValueBasis) {
  set(field, value)
}
function toggleOneTime() {
  set('isOneTime', !model.value.isOneTime)
}

const annualAmount = computed({ get: () => model.value.annualAmount, set: v => set('annualAmount', v) })
const growthRate = computed({ get: () => model.value.growthRate, set: v => set('growthRate', v) })
const fromAge = computed({ get: () => model.value.fromAge, set: v => set('fromAge', v) })
const toAge = computed({ get: () => model.value.toAge, set: v => set('toAge', v) })
const occurAge = computed({ get: () => model.value.occurAge, set: v => set('occurAge', v) })
</script>

<template>
  <div class="card" :class="{ 'card-disabled': !props.enabled }" :style="{ borderLeftColor: props.color }">
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
      <button
        class="onetime-btn"
        :class="{ active: model.isOneTime }"
        :style="model.isOneTime ? { borderColor: props.color, color: props.color } : {}"
        @click="toggleOneTime">一次性</button>
      <button class="card-delete" @click="$emit('delete')">×</button>
    </div>
    <div class="card-body">
      <SliderInput v-model="annualAmount" :label="model.isOneTime ? '金額' : '金額/年'" :min="0" :max="model.isOneTime ? 2000 : 300" :step="0.1" unit=" 萬">
        <div class="basis-toggle">
          <button :class="{ active: model.amountBasis === 'nominal' }" @click="setBasis('amountBasis', 'nominal')">名目</button>
          <button :class="{ active: model.amountBasis === 'real' }" @click="setBasis('amountBasis', 'real')">實質</button>
        </div>
      </SliderInput>
      <template v-if="!model.isOneTime">
        <SliderInput v-model="growthRate" label="年成長率" :min="0" :max="20" :step="0.1" unit="%">
          <div class="basis-toggle">
            <button :class="{ active: model.growthBasis === 'nominal' }" @click="setBasis('growthBasis', 'nominal')">名目</button>
            <button :class="{ active: model.growthBasis === 'real' }" @click="setBasis('growthBasis', 'real')">實質</button>
          </div>
        </SliderInput>
        <div class="age-sliders">
          <SliderInput v-model="fromAge" label="起始年齡" :min="20" :max="100" :step="1" unit=" 歲" />
          <SliderInput v-model="toAge" label="結束年齡" :min="20" :max="100" :step="1" unit=" 歲" />
        </div>
      </template>
      <template v-else>
        <SliderInput v-model="occurAge" label="發生時間" :min="20" :max="100" :step="1" unit=" 歲" />
      </template>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #1e293b;
  border-left: 3px solid;
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
  border-bottom-color: #34d399;
}
.onetime-btn {
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  border: 1px solid #334155;
  border-radius: 5px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  white-space: nowrap;
}
.onetime-btn.active {
  background: rgba(255, 255, 255, 0.05);
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
.age-sliders {
  display: flex;
  gap: 16px;
}
.age-sliders > * {
  flex: 1;
}
</style>
