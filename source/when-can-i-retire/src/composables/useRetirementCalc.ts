import { computed, type Ref } from 'vue'
import { futureValue, calcLMP, calcRP } from '../utils/finance'
import type { CalcResult } from '../types/retirement'

interface CalcInputs {
  currentAge: Ref<number>
  currentCash: Ref<number>
  monthlySave: Ref<number>
  endAge: Ref<number>
  eBase: Ref<number>
  eExtra: Ref<number>
  pension: Ref<number>
  pensionAge: Ref<number>
  rLmp: Ref<number>
  rRp: Ref<number>
  rSave: Ref<number>
}

export function useRetirementCalc(inputs: CalcInputs) {
  const result = computed<CalcResult>(() => {
    const annualSave = inputs.monthlySave.value * 12
    const rSaveReal = inputs.rSave.value / 100
    const rLmpReal = inputs.rLmp.value / 100
    const rRpReal = inputs.rRp.value / 100

    const data = []
    let retireAge: number | null = null

    for (let age = inputs.currentAge.value; age <= Math.min(inputs.endAge.value, 70); age++) {
      const k = age - inputs.currentAge.value
      const assets = futureValue(inputs.currentCash.value, rSaveReal, k, annualSave)
      const lmp = calcLMP(age, inputs.endAge.value, inputs.eBase.value, inputs.pension.value, inputs.pensionAge.value, rLmpReal)
      const rp = calcRP(age, inputs.endAge.value, inputs.eExtra.value, rRpReal)
      const target = lmp + rp
      const surplus = assets - target

      data.push({
        age,
        assets: Math.round(assets),
        lmp: Math.round(lmp),
        rp: Math.round(rp),
        target: Math.round(target),
        surplus: Math.round(surplus),
      })

      if (retireAge === null && surplus >= 0) {
        retireAge = age
      }
    }

    let retireDetails = null
    if (retireAge !== null) {
      const entry = data.find(d => d.age === retireAge)
      if (entry) {
        retireDetails = {
          age: retireAge,
          assets: entry.assets,
          lmp: entry.lmp,
          rp: entry.rp,
          target: entry.target,
          yearsToRetire: retireAge - inputs.currentAge.value,
          totalAnnualSpend: inputs.eBase.value + inputs.eExtra.value,
        }
      }
    }

    return { data, retireAge, retireDetails }
  })

  return result
}
