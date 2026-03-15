<script setup lang="ts">
defineProps<{
  title: string
  color?: string
}>()
</script>

<template>
  <div>
    <div class="group-title" :style="{ color: color || '#60a5fa' }">
      <span class="group-title-left">
        <span class="group-title-text">{{ title }}</span>
        <slot name="title-extra" />
      </span>
      <slot name="title-right" />
    </div>
    <slot />
  </div>
</template>

<style scoped>
.group-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 12px;
  font-family: 'Space Mono', monospace;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 6px;
}
.group-title-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.group-title-text {
  flex-shrink: 0;
}
.group-title :deep([class*="sub"]) {
  font-size: 11px;
  letter-spacing: 0;
  text-transform: none;
  color: #555d6a;
}
</style>
