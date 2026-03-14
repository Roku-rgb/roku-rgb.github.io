<script setup lang="ts">
import type { RetireDetails } from '../types/retirement'

defineProps<{
  details: RetireDetails
}>()
</script>

<template>
  <div class="cards">
    <div class="card" style="--card-color: #f59e0b">
      <div class="card-title">🛡 LMP 本金</div>
      <div class="card-value">{{ details.lmp.toLocaleString() }}</div>
      <div class="card-sub">萬（保障基本開支）</div>
    </div>
    <div class="card" style="--card-color: #a78bfa">
      <div class="card-title">📈 RP 本金</div>
      <div class="card-value">{{ details.rp.toLocaleString() }}</div>
      <div class="card-sub">萬（彈性花費）</div>
    </div>
    <div class="card" style="--card-color: #34d399">
      <div class="card-title">💰 退休時資產</div>
      <div class="card-value">{{ details.assets.toLocaleString() }}</div>
      <div class="card-sub">萬（累積總額）</div>
    </div>
  </div>
</template>

<style scoped>
.cards {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
  border: 1px solid color-mix(in srgb, var(--card-color) 20%, transparent);
  border-radius: 12px;
  padding: 16px 18px;
  flex: 1;
  min-width: 140px;
  box-shadow: 0 4px 24px color-mix(in srgb, var(--card-color) 7%, transparent);
}
.card-title {
  font-size: 11px;
  color: #8a919e;
  margin-bottom: 4px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  font-family: 'DM Sans', sans-serif;
}
.card-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--card-color);
  font-family: 'Space Mono', monospace;
  line-height: 1.1;
}
.card-sub {
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
}
</style>
