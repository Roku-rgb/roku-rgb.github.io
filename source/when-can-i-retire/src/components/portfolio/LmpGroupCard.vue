<script setup lang="ts">
import type { LmpGroup } from '../../types/portfolio'
import WithdrawGroupCard from './WithdrawGroupCard.vue'

const model = defineModel<LmpGroup>({ required: true })
const props = withDefaults(defineProps<{ requiredValue: number; inflation: number; currentAge: number; tag?: string; tagColor?: string; enabled?: boolean }>(), { tag: '', tagColor: '', enabled: true })
defineEmits<{ delete: []; 'toggle-enabled': [] }>()
</script>

<template>
  <WithdrawGroupCard v-model="model" type="lmp" :required-value="props.requiredValue" :inflation="props.inflation" :current-age="props.currentAge" :tag="props.tag" :tag-color="props.tagColor" :enabled="props.enabled" @delete="$emit('delete')" @toggle-enabled="$emit('toggle-enabled')">
    <slot />
  </WithdrawGroupCard>
</template>
