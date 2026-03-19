<script setup lang="ts">
import type { ExpenseSource } from '../../types/portfolio'
import IncomeSourceCard from './IncomeSourceCard.vue'

const model = defineModel<ExpenseSource>({ required: true })
defineEmits<{ delete: [] }>()
</script>

<template>
  <IncomeSourceCard v-model="model" color="#fb923c" @delete="$emit('delete')" />
</template>
