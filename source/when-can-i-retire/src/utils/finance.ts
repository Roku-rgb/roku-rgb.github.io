/** Present value of an annuity */
export const annuityPV = (pmt: number, r: number, n: number): number => {
  if (n <= 0) return 0
  if (Math.abs(r) < 0.0001) return pmt * n
  return pmt * ((1 - Math.pow(1 + r, -n)) / r)
}

/** Future value with periodic deposits */
export const futureValue = (pv: number, r: number, n: number, annualDeposit: number): number => {
  if (Math.abs(r) < 0.0001) return pv + annualDeposit * n
  return pv * Math.pow(1 + r, n) + annualDeposit * ((Math.pow(1 + r, n) - 1) / r)
}

/** Liability Matching Portfolio - present value of basic expenses */
export const calcLMP = (
  retireAge: number,
  endAge: number,
  eBase: number,
  pension: number,
  pensionAge: number,
  rLmp: number,
): number => {
  if (retireAge >= endAge) return 0
  if (retireAge < pensionAge) {
    const n1 = Math.min(pensionAge, endAge) - retireAge
    const n2 = Math.max(0, endAge - pensionAge)
    const pv1 = annuityPV(eBase, rLmp, n1)
    const gap = Math.max(0, eBase - pension)
    const pv2at = annuityPV(gap, rLmp, n2)
    const pv2 = pv2at / Math.pow(1 + rLmp, n1)
    return pv1 + pv2
  } else {
    const n = endAge - retireAge
    const gap = Math.max(0, eBase - pension)
    return annuityPV(gap, rLmp, n)
  }
}

/** Risk Portfolio - present value of extra expenses */
export const calcRP = (retireAge: number, endAge: number, eExtra: number, rRp: number): number => {
  const n = endAge - retireAge
  if (n <= 0) return 0
  return annuityPV(eExtra, rRp, n)
}
