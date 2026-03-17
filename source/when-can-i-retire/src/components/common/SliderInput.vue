<script setup lang="ts">
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
</script>

<template>
  <div class="slider">
    <div class="slider-header">
      <span class="slider-label">{{ label }}</span>
      <span class="slider-value">{{ display(model) }}{{ unit }}</span>
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
