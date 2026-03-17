<script setup lang="ts">
import { computed } from "vue";
import type { RetireDetails } from "../../types/retirement";

const props = defineProps<{
  details: RetireDetails | null;
  inflation: number;
  currentAge: number;
  isNominal: boolean;
}>();

const emit = defineEmits<{
  "update:isNominal": [value: boolean];
}>();

const display = computed(() => {
  if (!props.details) {
    return {
      lmp: "-",
      rp: "-",
      assets: "-",
    };
  } else {
    let f = 1;
    if (props.isNominal) {
      const k = props.details.age - props.currentAge;
      f = Math.pow(1 + props.inflation / 100, k);
    }
    return {
      lmp: Math.round(props.details.lmp * f),
      rp: Math.round(props.details.rp * f),
      assets: Math.round(props.details.assets * f),
    };
  }
});
</script>

<template>
  <div class="info-block">
    <div class="block-header">
      <div class="block-title">
        退休所需資金
        <span class="block-unit"
          >（單位：萬元，{{ isNominal ? "名目" : "實質購買力" }}）</span
        >
      </div>
      <div class="toggle-group">
        <button
          class="toggle-btn"
          :class="{ active: isNominal }"
          @click="emit('update:isNominal', true)">
          名目
        </button>
        <button
          class="toggle-btn"
          :class="{ active: !isNominal }"
          @click="emit('update:isNominal', false)">
          實質購買力
        </button>
      </div>
    </div>
    <div class="cards">
      <div class="card" style="--card-color: #34d399">
        <div class="card-title">💰 退休時資產</div>
        <div class="card-value">{{ display.assets.toLocaleString() }}</div>
        <div class="card-sub">萬（累積總額）</div>
      </div>
      <div class="card" style="--card-color: #f59e0b">
        <div class="card-title">🛡 LMP 本金</div>
        <div class="card-value">{{ display.lmp.toLocaleString() }}</div>
        <div class="card-sub">萬（保障基本開支）</div>
      </div>
      <div class="card" style="--card-color: #a78bfa">
        <div class="card-title">📈 RP 本金</div>
        <div class="card-value">{{ display.rp.toLocaleString() }}</div>
        <div class="card-sub">萬（彈性花費）</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.info-block {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}
.block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.block-title {
  font-size: 13px;
  color: #8a919e;
  font-weight: 500;
}
.block-unit {
  font-size: 11px;
  color: #555d6a;
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
.cards {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
@media (max-width: 640px) {
  .card:first-child {
    flex: 1 1 100%;
  }
  .card:not(:first-child) {
    flex: 1 1 calc(50% - 5px);
    min-width: 0;
  }
}
.card {
  background: linear-gradient(
    135deg,
    rgba(30, 41, 59, 0.9),
    rgba(15, 23, 42, 0.95)
  );
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
  font-family: "DM Sans", sans-serif;
}
.card-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--card-color);
  font-family: "Space Mono", monospace;
  line-height: 1.1;
}
.card-sub {
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
}
</style>
