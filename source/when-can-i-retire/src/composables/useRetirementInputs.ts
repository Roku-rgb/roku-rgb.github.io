import { ref } from 'vue'

export function useRetirementInputs() {
  const currentAge = ref(30)
  const currentCash = ref(100)
  const monthlySave = ref(2)
  const endAge = ref(85)
  const eBase = ref(48)
  const eExtra = ref(20)
  const pension = ref(24)
  const pensionAge = ref(65)
  const rLmp = ref(1.5)
  const rRp = ref(6)
  const rSave = ref(5)
  const inflation = ref(2)

  return {
    currentAge,
    currentCash,
    monthlySave,
    endAge,
    eBase,
    eExtra,
    pension,
    pensionAge,
    rLmp,
    rRp,
    rSave,
    inflation,
  }
}
