/** Present value of an ordinary annuity (payments at end of period) */
export const annuityPV = (pmt: number, r: number, n: number): number => {
  if (n <= 0) return 0;
  if (Math.abs(r) < 0.0001) return pmt * n;
  return pmt * ((1 - Math.pow(1 + r, -n)) / r);
};

/** Present value of an annuity-due (payments at start of period) */
export const annuityDuePV = (pmt: number, r: number, n: number): number => {
  if (n <= 0) return 0;
  if (Math.abs(r) < 0.0001) return pmt * n;
  return annuityPV(pmt, r, n) * (1 + r);
};

/** Convert nominal rate to real rate using Fisher equation */
export const nominalToReal = (nominal: number, inflation: number): number =>
  (1 + nominal) / (1 + inflation) - 1;

/** Future value with periodic deposits */
export const futureValue = (
  pv: number,
  rSaveNominal: number,
  n: number,
  annualDepositNominal: number,
  inflation: number,
): number => {
  let v = pv;
  let annualDepositReal = annualDepositNominal;

  // use fisher equation to convert nominal rate to real rate
  // (1 + rNominal) = (1 + rReal) * (1 + inflation)
  // => rReal = (1 + rNominal) / (1 + inflation) - 1
  var rReal = (1 + rSaveNominal) / (1 + inflation) - 1;
  for (let i = 0; i < n; i++) {
    v = v * (1 + rReal); // 本金成長
    annualDepositReal /= 1 + inflation; // 存款實質購買力
    v = v + annualDepositReal; // 存款增加 (年末存入)
  }
  return v;
};

/** Liability Matching Portfolio - present value of basic expenses */
export const calcLMP = (
  retireAge: number,
  endAge: number,
  eBase: number,
  pension: number,
  pensionAge: number,
  rLmp: number,
): number => {
  if (retireAge >= endAge) return 0;
  // 提領從 retireAge+1 開始（先提領、後成長 = annuity-due）
  // annuity-due PV = ordinary annuity PV × (1+r)
  // n1: 全額支出年數（retireAge+1 ~ pensionAge-1）
  // n2: 減額支出年數（pensionAge ~ endAge）
  if (retireAge + 1 < pensionAge) {
    const n1 = Math.max(0, Math.min(pensionAge, endAge + 1) - retireAge - 1);
    const n2 = Math.max(0, endAge - pensionAge + 1);
    const pv1 = annuityPV(eBase, rLmp, n1) * (1 + rLmp);
    const gap = Math.max(0, eBase - pension);
    const pv2at = annuityPV(gap, rLmp, n2) * (1 + rLmp);
    const pv2 = pv2at / Math.pow(1 + rLmp, n1);
    return pv1 + pv2;
  } else {
    const n = endAge - retireAge;
    const gap = Math.max(0, eBase - pension);
    return annuityPV(gap, rLmp, n) * (1 + rLmp);
  }
};

/** Risk Portfolio - present value of extra expenses */
export const calcRP = (
  retireAge: number,
  endAge: number,
  eExtra: number,
  rRp: number,
): number => {
  const n = endAge - retireAge;
  if (n <= 0) return 0;
  // 提領從 retireAge+1 開始（先提領、後成長 = annuity-due）
  return annuityPV(eExtra, rRp, n) * (1 + rRp);
};
