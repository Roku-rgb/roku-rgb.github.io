<script setup lang="ts">
import { withDefaults } from 'vue'
import type { LmpGroup } from '../../types/portfolio'
import WithdrawGroupCard from './WithdrawGroupCard.vue'

const model = defineModel<LmpGroup>({ required: true })
const props = withDefaults(defineProps<{ requiredValue: number; inflation: number; currentAge: number; tag?: string; tagColor?: string }>(), { tag: '', tagColor: '' })
defineEmits<{ delete: [] }>()
</script>

<template>
  <WithdrawGroupCard v-model="model" type="lmp" :required-value="props.requiredValue" :inflation="props.inflation" :current-age="props.currentAge" :tag="props.tag" :tag-color="props.tagColor" @delete="$emit('delete')">
    <slot />
  </WithdrawGroupCard>
</template>
