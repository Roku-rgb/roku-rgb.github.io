<script setup lang="ts">
defineProps<{
  active: string;
}>();

const emit = defineEmits<{
  (e: "navigate", page: string): void;
}>();

const tabs = [
  { key: "calculator", label: "計算機" },
  { key: "portfolio", label: "多資產組合" },
  { key: "intro", label: "介紹" },
];
</script>

<template>
  <nav class="navbar">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="nav-btn"
      :class="{ active: active === tab.key }"
      @click="emit('navigate', tab.key)">
      {{ tab.label }}
    </button>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 12px 20px 0;
  background: #0a0f1c;
}
.nav-btn {
  padding: 8px 24px;
  font-size: 13px;
  font-weight: 600;
  font-family: "DM Sans", sans-serif;
  border: none;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  color: #6b7280;
  background: transparent;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.nav-btn.active {
  color: #e8eaed;
  border-bottom-color: #60a5fa;
  background: rgba(96, 165, 250, 0.08);
}
.nav-btn:hover:not(.active) {
  color: #94a3b8;
}
</style>
