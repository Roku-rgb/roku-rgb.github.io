import { computed, type Ref } from "vue";

export interface WithdrawRow {
  age: number;
  lmpWithdraw: number; // 從 LMP 提領（基本開支扣除年金）
  pension: number; // 年金收入
  rpWithdraw: number; // 從 RP 提領（額外花費）
  totalWithdraw: number; // 總提領 = lmpWithdraw + rpWithdraw
  totalSpend: number; // 總支出 = lmpWithdraw + pension + rpWithdraw
  lmpBalanceStart: number; // LMP 帳戶年初餘額
  lmpBalanceEnd: number; // LMP 帳戶年末餘額
  rpBalanceStart: number; // RP 帳戶年初餘額
  rpBalanceEnd: number; // RP 帳戶年末餘額
}

interface WithdrawInputs {
  retireAge: Ref<number | null>;
  endAge: Ref<number>;
  eBase: Ref<number>;
  eExtra: Ref<number>;
  pension: Ref<number>;
  pensionAge: Ref<number>;
  rLmp: Ref<number>;
  rRp: Ref<number>;
  lmpAtRetire: Ref<number>;
  rpAtRetire: Ref<number>;
}

export function useWithdrawSchedule(inputs: WithdrawInputs) {
  const rows = computed<WithdrawRow[]>(() => {
    if (inputs.retireAge.value === null) return [];

    const retireAge = inputs.retireAge.value + 1;
    const endAge = inputs.endAge.value;
    const eBase = inputs.eBase.value;
    const eExtra = inputs.eExtra.value;
    const pensionAmt = inputs.pension.value;
    const pensionAge = inputs.pensionAge.value;
    const rLmp = inputs.rLmp.value / 100;
    const rRp = inputs.rRp.value / 100;

    let lmpBal = inputs.lmpAtRetire.value;
    let rpBal = inputs.rpAtRetire.value;
    const result: WithdrawRow[] = [];

    for (let age = retireAge; age <= endAge; age++) {
      const lmpBalanceStart = lmpBal;
      const rpBalanceStart = rpBal;

      const hasPension = age >= pensionAge; // 是否已領年金
      const pen = hasPension ? pensionAmt : 0; // 年金收入
      const lmpW = Math.max(0, eBase - pen); // 從 LMP 提領（基本開支扣除年金）
      const rpW = eExtra; // 從 RP 提領（額外花費）

      // 扣除提領
      lmpBal -= lmpW;
      rpBal -= rpW;

      // 年末餘額成長
      lmpBal *= 1 + rLmp;
      rpBal *= 1 + rRp;

      result.push({
        age,
        lmpWithdraw: lmpW,
        pension: pen,
        rpWithdraw: rpW,
        totalWithdraw: lmpW + rpW,
        totalSpend: lmpW + pen + rpW,
        lmpBalanceStart: lmpBalanceStart,
        lmpBalanceEnd: lmpBal,
        rpBalanceStart: rpBalanceStart,
        rpBalanceEnd: rpBal,
      });
    }

    return result;
  });

  return rows;
}
