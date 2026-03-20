<script setup lang="ts">
import type { ExpenseSource } from '../../types/portfolio'
import IncomeSourceCard from './IncomeSourceCard.vue'

const model = defineModel<ExpenseSource>({ required: true })
const props = withDefaults(defineProps<{ tag?: string; tagColor?: string }>(), { tag: '', tagColor: '' })
defineEmits<{ delete: [] }>()
</script>

<template>
  <IncomeSourceCard v-model="model" color="#fb923c" :tag="props.tag" :tag-color="props.tagColor" @delete="$emit('delete')">
    <slot />
  </IncomeSourceCard>
</template>
