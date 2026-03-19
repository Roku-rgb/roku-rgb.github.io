<script setup lang="ts">
import type { RpGroup } from '../../types/portfolio'
import WithdrawGroupCard from './WithdrawGroupCard.vue'

const model = defineModel<RpGroup>({ required: true })
defineProps<{ requiredValue: number }>()
defineEmits<{ delete: [] }>()
</script>

<template>
  <WithdrawGroupCard v-model="model" type="rp" :required-value="requiredValue" @delete="$emit('delete')" />
</template>
