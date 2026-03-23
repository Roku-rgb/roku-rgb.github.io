<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  min: number
  max: number
  step: number
  unit?: string
  format?: (v: number) => string
}>(), {
  unit: '',
})

const model = defineModel<number>({ required: true })

const display = (v: number) => props.format ? props.format(v) : String(v)

const editing = ref(false)
const editValue = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function startEdit() {
  editing.value = true
  editValue.value = String(model.value)
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

function commitEdit() {
  const num = Number(editValue.value)
  if (!isNaN(num)) {
    const clamped = Math.min(props.max, Math.max(props.min, num))
    const stepped = Math.round(clamped / props.step) * props.step
    const stepDecimals = (props.step.toString().split('.')[1] || '').length
    const decimals = Math.max(stepDecimals, 3)
    model.value = Number(stepped.toFixed(decimals))
  }
  editing.value = false
}

function cancelEdit() {
  editing.value = false
}
</script>

<template>
  <div class="slider">
    <div class="slider-header">
      <span class="slider-left">
        <span class="slider-label">{{ label }}</span>
        <slot />
      </span>
      <span v-if="!editing" class="slider-value" @dblclick="startEdit">{{ display(model) }}{{ unit }}</span>
      <span v-else class="slider-value editing">
        <input
          ref="inputRef"
          v-model="editValue"
          class="slider-value-input"
          type="number"
          :min="min"
          :max="max"
          :step="step"
          @keydown.enter="commitEdit"
          @keydown.escape="cancelEdit"
          @blur="commitEdit"
        />
        <span class="slider-value-unit">{{ unit }}</span>
      </span>
    </div>
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      v-model.number="model"
    />
    <div class="slider-range">
      <span>{{ display(min) }}{{ unit }}</span>
      <span>{{ display(max) }}{{ unit }}</span>
    </div>
  </div>
</template>

<style scoped>
.slider {
  margin-bottom: 16px;
}
.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
}
.slider-label {
  font-size: 13px;
  color: #8a919e;
  font-family: 'DM Sans', sans-serif;
  letter-spacing: 0.3px;
}
.slider-value {
  font-size: 18px;
  font-weight: 700;
  color: #e8eaed;
  font-family: 'Space Mono', monospace;
  cursor: default;
}
.slider-value.editing {
  display: flex;
  align-items: baseline;
  gap: 2px;
}
.slider-value-input {
  width: 80px;
  font-size: 18px;
  font-weight: 700;
  color: #e8eaed;
  font-family: 'Space Mono', monospace;
  background: #23272e;
  border: 1px solid #60a5fa;
  border-radius: 4px;
  padding: 0 4px;
  outline: none;
  text-align: right;
  -moz-appearance: textfield;
}
.slider-value-input::-webkit-outer-spin-button,
.slider-value-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.slider-value-unit {
  font-size: 18px;
  font-weight: 700;
  color: #e8eaed;
  font-family: 'Space Mono', monospace;
}
.slider-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.slider input[type='range'] {
  width: 100%;
  accent-color: #60a5fa;
  height: 6px;
  cursor: pointer;
}
.slider-range {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #555d6a;
  margin-top: 2px;
}
</style>
