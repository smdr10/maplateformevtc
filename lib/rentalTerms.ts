// Conditions de location (ignorees pour une vente)
export function rentalTerms(body: Record<string, unknown>) {
  const num = (v: unknown, max: number) => {
    const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
    return Number.isFinite(n) && n >= 0 && n <= max ? n : null
  }
  const date = typeof body.availableFrom === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.availableFrom) ? new Date(body.availableFrom) : null
  return {
    depositAmount: num(body.depositAmount, 100000),
    includedKmPerWeek: num(body.includedKmPerWeek, 20000) === null ? null : Math.round(num(body.includedKmPerWeek, 20000)!),
    insuranceIncluded: typeof body.insuranceIncluded === 'boolean' ? body.insuranceIncluded : null,
    minRentalWeeks: num(body.minRentalWeeks, 104) === null ? null : Math.round(num(body.minRentalWeeks, 104)!),
    driverRequirements: typeof body.driverRequirements === 'string' && body.driverRequirements.trim() ? body.driverRequirements.trim().slice(0, 500) : null,
    availableFrom: date,
  }
}
