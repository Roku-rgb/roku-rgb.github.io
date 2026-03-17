<script setup lang="ts">
import type { LmpGroup, RpGroup, ValueBasis } from '../../types/portfolio'

type Group = LmpGroup | RpGroup

const model = defineModel<Group>({ required: true })
const props = defineProps<{
  type: 'lmp' | 'rp'
  requiredValue: number
}>()
defineEmits<{ delete: [] }>()

function set<K extends keyof Group>(key: K, value: Group[K]) {
  model.value = { ...model.value, [key]: value }
}

const borderColor = props.type === 'lmp' ? '#f59e0b' : '#a78bfa'
const rateLabel = props.type === 'lmp' ? 'TIPS 殖利率' : '報酬率'
</script>

<template>
  <div class="card" :style="{ borderLeftColor: borderColor }">
    <div class="card-header">
      <input
        class="card-label"
        :value="model.label"
        @input="set('label', ($event.target as HTMLInputElement).value)" />
      <button class="card-delete" @click="$emit('delete')">×</button>
    </div>
    <div class="card-body">
      <div class="field">
        <label>{{ rateLabel }}</label>
        <div class="input-row">
          <div class="input-unit">
            <input
              type="number"
              step="0.1"
              :value="model.rate"
              @input="set('rate', +($event.target as HTMLInputElement).value)" />
            <span class="unit">%</span>
          </div>
          <div class="basis-toggle">
            <button :class="{ active: model.rateBasis === 'nominal' }" @click="set('rateBasis', 'nominal' as ValueBasis)">名目</button>
            <button :class="{ active: model.rateBasis === 'real' }" @click="set('rateBasis', 'real' as ValueBasis)">實質</button>
          </div>
        </div>
      </div>
      <div class="field">
        <label>每年提領</label>
        <div class="input-row">
          <div class="input-unit">
            <input
              type="number"
              :value="model.annualWithdraw"
              @input="set('annualWithdraw', +($event.target as HTMLInputElement).value)" />
            <span class="unit">萬</span>
          </div>
          <div class="basis-toggle">
            <button :class="{ active: model.withdrawBasis === 'nominal' }" @click="set('withdrawBasis', 'nominal' as ValueBasis)">名目</button>
            <button :class="{ active: model.withdrawBasis === 'real' }" @click="set('withdrawBasis', 'real' as ValueBasis)">實質</button>
          </div>
        </div>
      </div>
      <div class="field">
        <label>提領期間</label>
        <div class="age-row">
          <input
            type="number"
            :value="model.fromAge"
            @input="set('fromAge', +($event.target as HTMLInputElement).value)" />
          <span class="age-sep">~</span>
          <input
            type="number"
            :value="model.toAge"
            @input="set('toAge', +($event.target as HTMLInputElement).value)" />
          <span class="unit">歲</span>
        </div>
      </div>
    </div>
    <div class="card-footer">
      所需金額：<span class="computed-value" :style="{ color: borderColor }">{{ Math.round(props.requiredValue).toLocaleString() }} 萬</span>
    </div>
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
.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.field label {
  display: block;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 3px;
}
.input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.input-unit {
  display: flex;
  align-items: center;
  gap: 4px;
}
.input-unit input {
  width: 80px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #e8eaed;
  font-size: 13px;
  font-family: 'Space Mono', monospace;
  padding: 4px 8px;
  outline: none;
}
.input-unit input:focus {
  border-color: #60a5fa;
}
.unit {
  font-size: 11px;
  color: #6b7280;
  flex-shrink: 0;
}
.basis-toggle {
  display: flex;
  background: #1e293b;
  border-radius: 6px;
  padding: 1px;
  gap: 1px;
  flex-shrink: 0;
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
.age-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.age-row input {
  width: 56px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #e8eaed;
  font-size: 13px;
  font-family: 'Space Mono', monospace;
  padding: 4px 8px;
  outline: none;
  text-align: center;
}
.age-row input:focus {
  border-color: #60a5fa;
}
.age-sep {
  color: #6b7280;
  font-size: 13px;
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
}
</style>
