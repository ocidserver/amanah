const FEE_CONFIG = {
  ujrahRate: 0.01,
  ujrahMin: 10_000,
  stampFee: 10_000,
  adminFee: 25_000,
  custodyRate: 0.005,
  custodyMin: 5_000,
}

export function calculateFees(amount: number): {
  ujrah: number
  stampFee: number
  adminFee: number
  custodyFee: number
  totalFee: number
  disbursedAmount: number
} {
  const ujrah = Math.max(Math.ceil(amount * FEE_CONFIG.ujrahRate), FEE_CONFIG.ujrahMin)
  const stampFee = FEE_CONFIG.stampFee
  const adminFee = FEE_CONFIG.adminFee
  const custodyFee = Math.max(Math.ceil(amount * FEE_CONFIG.custodyRate), FEE_CONFIG.custodyMin)
  const totalFee = ujrah + stampFee + adminFee + custodyFee
  const disbursedAmount = Math.max(amount - totalFee, 0)

  return { ujrah, stampFee, adminFee, custodyFee, totalFee, disbursedAmount }
}

export { FEE_CONFIG }