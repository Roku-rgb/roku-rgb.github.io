<script setup lang="ts">
import type { RetireDetails } from '../../types/retirement'

defineProps<{
  retireAge: number | null
  retireDetails: RetireDetails | null
}>()
</script>

<template>
  <div v-if="retireAge !== null && retireDetails" class="banner banner--ok">
    <div class="banner-subtitle">最早可退休年齡</div>
    <div class="banner-action">
      <slot name="subtitle-action" />
    </div>
    <div class="banner-age">{{ retireAge }}<span class="banner-unit"> 歲</span></div>
    <div class="banner-info">
      還需 <span class="hl">{{ retireDetails.yearsToRetire }}</span> 年 ・
      退休後每年花費 <span class="hl">{{ retireDetails.totalAnnualSpend }}</span> 萬（實質購買力）
    </div>
  </div>
  <div v-else class="banner banner--fail">
    <div class="banner-subtitle">最早可退休年齡</div>
    <div class="banner-action">
      <slot name="subtitle-action" />
    </div>
    <div class="banner-age">-<span class="banner-unit"> 歲</span></div>
    <div class="banner-info">
      還需 <span class="hl">-</span> 年 ・
      退休後每年花費 <span class="hl">-</span> 萬（實質購買力）
    </div>
  </div>
</template>

<style scoped>
.banner {
  position: relative;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 24px;
  text-align: center;
}
.banner--ok {
  background: linear-gradient(135deg, rgba(52, 211, 153, 0.1), rgba(96, 165, 250, 0.08));
  border: 1px solid rgba(52, 211, 153, 0.3);
  box-shadow: 0 4px 32px rgba(52, 211, 153, 0.08);
}
.banner--fail {
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.1), rgba(251, 146, 60, 0.08));
  border: 1px solid rgba(248, 113, 113, 0.3);
}
.banner-action {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
}
.banner-subtitle {
  font-size: 12px;
  color: #34d399;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.banner-age {
  font-size: 56px;
  font-weight: 800;
  color: #34d399;
  font-family: 'Space Mono', monospace;
  line-height: 1;
}
.banner-unit {
  font-size: 20px;
  font-weight: 400;
}
.banner-info {
  font-size: 13px;
  color: #8a919e;
  margin-top: 8px;
}
.banner-info .hl {
  color: #60a5fa;
  font-weight: 700;
}
.banner-warn {
  font-size: 14px;
  color: #f87171;
  font-weight: 700;
}
.banner-hint {
  font-size: 12px;
  color: #8a919e;
  margin-top: 4px;
}
</style>
