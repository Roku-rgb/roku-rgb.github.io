<script setup lang="ts">
import type { LmpGroup } from '../../types/portfolio'
import WithdrawGroupCard from './WithdrawGroupCard.vue'

const model = defineModel<LmpGroup>({ required: true })
defineProps<{ requiredValue: number }>()
defineEmits<{ delete: [] }>()
</script>

<template>
  <WithdrawGroupCard v-model="model" type="lmp" :required-value="requiredValue" @delete="$emit('delete')" />
</template>
