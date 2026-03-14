import { computed, ref, type Ref } from "vue";
import { futureValue, calcLMP, calcRP } from "../utils/finance";
import type { CalcResult } from "../types/retirement";

interface CalcInputs {
  // 個人 / 儲蓄
  currentAge: Ref<number>; // 目前年齡
  currentCash: Ref<number>; // 當前現金
  monthlySave: Ref<number>; // 每月存款 (名目)
  rSave: Ref<number>; // 儲蓄期報酬率 (名目)

  // 退休 / 支出
  endAge: Ref<number>; // 規劃活到
  eBase: Ref<number>; // 每年基本開支 (實質購買力)
  eExtra: Ref<number>; // 每年額外花費 (實質購買力)
  pension: Ref<number>; // 年金收入 (實質購買力)

  // 利率假設
  pensionAge: Ref<number>; // 年金起領年齡
  rLmp: Ref<number>; // TIPS 實質殖利率 (LMP)
  rRp: Ref<number>; // 股市實質報酬率 (RP)
  inflation: Ref<number>; // 預估通膨率
}

export function defaultInputs(): CalcInputs {
  return {
    currentAge: ref(30),
    currentCash: ref(100),
    monthlySave: ref(2),
    rSave: ref(8),

    endAge: ref(85),
    eBase: ref(48),
    eExtra: ref(20),
    pension: ref(24),

    pensionAge: ref(65),
    rLmp: ref(1.5),
    rRp: ref(6),
    inflation: ref(2),
  };
}

export function useRetirementCalc(inputs: CalcInputs) {
  const result = computed<CalcResult>(() => {
    const annualSaveNominal = inputs.monthlySave.value * 12; // 每年存款 (名目)
    const inflation = inputs.inflation.value / 100; // 通膨率

    const rSaveNominal = inputs.rSave.value / 100; // 儲蓄期名目報酬率
    const rLmpReal = inputs.rLmp.value / 100; // LMP 實質殖利率
    const rRpReal = inputs.rRp.value / 100; // RP 實質報酬率

    const data = [];
    let retireAge: number | null = null;

    // 最大年齡限制 (動態調整計算範圍)
    let maxAge = Math.min(inputs.endAge.value, 70);
    if (inputs.currentAge.value > 65) {
      maxAge = Math.min(inputs.endAge.value, 100);
    }

    for (let age = inputs.currentAge.value; age <= maxAge; age++) {
      const k = age - inputs.currentAge.value;
      const assets = futureValue(
        inputs.currentCash.value,
        rSaveNominal,
        k,
        annualSaveNominal,
        inflation,
      );
      const lmp = calcLMP(
        age,
        inputs.endAge.value,
        inputs.eBase.value,
        inputs.pension.value,
        inputs.pensionAge.value,
        rLmpReal,
      );
      const rp = calcRP(age, inputs.endAge.value, inputs.eExtra.value, rRpReal);
      const target = lmp + rp;
      const surplus = assets - target;

      data.push({
        age,
        assets: assets,
        lmp: lmp,
        rp: rp,
        target: target,
        surplus: surplus,
      });

      if (retireAge === null && surplus >= 0) {
        retireAge = age;
      }
    }

    let retireDetails = null;
    if (retireAge !== null) {
      const entry = data.find((d) => d.age === retireAge);
      if (entry) {
        retireDetails = {
          age: retireAge,
          assets: entry.assets,
          lmp: entry.lmp,
          rp: entry.rp,
          target: entry.target,
          yearsToRetire: retireAge - inputs.currentAge.value,
          totalAnnualSpend: inputs.eBase.value + inputs.eExtra.value,
        };
      }
    }

    return { data, retireAge, retireDetails };
  });

  return result;
}
