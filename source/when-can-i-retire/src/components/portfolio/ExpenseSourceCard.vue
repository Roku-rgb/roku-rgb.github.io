<script setup lang="ts">
import type { ExpenseSource } from '../../types/portfolio'
import IncomeSourceCard from './IncomeSourceCard.vue'

const model = defineModel<ExpenseSource>({ required: true })
const props = withDefaults(defineProps<{ tag?: string; tagColor?: string; enabled?: boolean }>(), { tag: '', tagColor: '', enabled: true })
defineEmits<{ delete: []; 'toggle-enabled': [] }>()
</script>

<template>
  <IncomeSourceCard v-model="model" color="#fb923c" :tag="props.tag" :tag-color="props.tagColor" :enabled="props.enabled" @delete="$emit('delete')" @toggle-enabled="$emit('toggle-enabled')">
    <slot />
  </IncomeSourceCard>
</template>
