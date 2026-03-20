<script setup lang="ts">
import type { RpGroup } from '../../types/portfolio'
import WithdrawGroupCard from './WithdrawGroupCard.vue'

const model = defineModel<RpGroup>({ required: true })
const props = withDefaults(defineProps<{ requiredValue: number; inflation: number; currentAge: number; tag?: string; tagColor?: string }>(), { tag: '', tagColor: '' })
defineEmits<{ delete: [] }>()
</script>

<template>
  <WithdrawGroupCard v-model="model" type="rp" :required-value="props.requiredValue" :inflation="props.inflation" :current-age="props.currentAge" :tag="props.tag" :tag-color="props.tagColor" @delete="$emit('delete')">
    <slot />
  </WithdrawGroupCard>
</template>
