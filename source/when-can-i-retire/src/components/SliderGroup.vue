<script setup lang="ts">
defineProps<{
  title: string
  color?: string
}>()
</script>

<template>
  <div>
    <div class="group-title" :style="{ color: color || '#60a5fa' }">{{ title }}</div>
    <slot />
  </div>
</template>

<style scoped>
.group-title {
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 12px;
  font-family: 'Space Mono', monospace;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 6px;
}
</style>
