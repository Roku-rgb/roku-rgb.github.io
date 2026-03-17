<script setup lang="ts">
import type { IncomeSource, ValueBasis } from '../../types/portfolio'

const model = defineModel<IncomeSource>({ required: true })
defineEmits<{ delete: [] }>()

function set<K extends keyof IncomeSource>(key: K, value: IncomeSource[K]) {
  model.value = { ...model.value, [key]: value }
}
function setBasis(field: 'amountBasis' | 'growthBasis', value: ValueBasis) {
  set(field, value)
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
        <label>金額/年</label>
        <div class="input-row">
          <div class="input-unit">
            <input
              type="number"
              :value="model.annualAmount"
              @input="set('annualAmount', +($event.target as HTMLInputElement).value)" />
            <span class="unit">萬</span>
          </div>
          <div class="basis-toggle">
            <button :class="{ active: model.amountBasis === 'nominal' }" @click="setBasis('amountBasis', 'nominal')">名目</button>
            <button :class="{ active: model.amountBasis === 'real' }" @click="setBasis('amountBasis', 'real')">實質</button>
          </div>
        </div>
      </div>
      <div class="field">
        <label>年成長率</label>
        <div class="input-row">
          <div class="input-unit">
            <input
              type="number"
              step="0.1"
              :value="model.growthRate"
              @input="set('growthRate', +($event.target as HTMLInputElement).value)" />
            <span class="unit">%</span>
          </div>
          <div class="basis-toggle">
            <button :class="{ active: model.growthBasis === 'nominal' }" @click="setBasis('growthBasis', 'nominal')">名目</button>
            <button :class="{ active: model.growthBasis === 'real' }" @click="setBasis('growthBasis', 'real')">實質</button>
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
  </div>
</template>

<style scoped>
.card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #1e293b;
  border-left: 3px solid #34d399;
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
</style>
