<script setup lang="ts">
import type { Investment, ValueBasis } from '../../types/portfolio'

const model = defineModel<Investment>({ required: true })
const props = defineProps<{ endValue: number }>()
defineEmits<{ delete: [] }>()

function set<K extends keyof Investment>(key: K, value: Investment[K]) {
  model.value = { ...model.value, [key]: value }
}
</script>

<template>
  <div class="card">
    <div class="card-header">
      <input
        class="card-label"
        :value="model.label"
        @input="set('label', ($event.target as HTMLInputElement).value)" />
      <button class="card-delete" @click="$emit('delete')">×</button>
    </div>
    <div class="card-body">
      <div class="field">
        <label>報酬率</label>
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
      <div class="field-row">
        <div class="field">
          <label>初始金額</label>
          <div class="input-unit">
            <input
              type="number"
              :value="model.initialValue"
              @input="set('initialValue', +($event.target as HTMLInputElement).value)" />
            <span class="unit">萬</span>
          </div>
        </div>
        <div class="field">
          <label>每月投資</label>
          <div class="input-unit">
            <input
              type="number"
              step="0.1"
              :value="model.monthlyContribution"
              @input="set('monthlyContribution', +($event.target as HTMLInputElement).value)" />
            <span class="unit">萬</span>
          </div>
        </div>
      </div>
      <div class="field">
        <label>期間</label>
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
      到期金額：<span class="computed-value">{{ Math.round(props.endValue).toLocaleString() }} 萬</span>
    </div>
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
.field-row {
  display: flex;
  gap: 12px;
}
.field-row .field {
  flex: 1;
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
  color: #60a5fa;
}
</style>
