/** Present value of an annuity */
export const annuityPV = (pmt: number, r: number, n: number): number => {
  if (n <= 0) return 0;
  if (Math.abs(r) < 0.0001) return pmt * n;
  return pmt * ((1 - Math.pow(1 + r, -n)) / r);
};

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
  if (retireAge < pensionAge) {
    const n1 = Math.min(pensionAge, endAge) - retireAge;
    const n2 = Math.max(0, endAge - pensionAge);
    const pv1 = annuityPV(eBase, rLmp, n1);
    const gap = Math.max(0, eBase - pension);
    const pv2at = annuityPV(gap, rLmp, n2);
    const pv2 = pv2at / Math.pow(1 + rLmp, n1);
    return pv1 + pv2;
  } else {
    const n = endAge - retireAge;
    const gap = Math.max(0, eBase - pension);
    return annuityPV(gap, rLmp, n);
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
  return annuityPV(eExtra, rRp, n);
};
