// ============================================================
// poh-data.ts — Diamond DA-40 D POH digitized data & calculations
// All tables from POH §5 & §6.4.3 / Diagram 6.4.4
// ============================================================

// ── Fixed arms (metres) ──────────────────────────────────────
export const ARMS = {
  front:   2.300,  // row 2: front seats
  rear:    3.250,  // row 3: rear seats
  baggage: 3.650,  // row 4: baggage
  fuel:    2.630,  // row 6: fuel (0.84 kg/L)
} as const

// ── Unit conversion ──────────────────────────────────────────
export const KG_TO_LB  = 2.2046226218
export const M_TO_IN   = 39.37007874

// ── CG Envelope limits (POH Diagram 6.4.4) ──────────────────
export const CG_REAR = 2.590  // rear limit, all masses

/** Forward CG limit (m) for given mass (kg). Returns null if out of range. */
export function cgFwdLimit(massKg: number): number | null {
  if (massKg < 780 || massKg > 1150) return null
  if (massKg <= 980) return 2.400
  return 2.400 + (massKg - 980) * (2.460 - 2.400) / (1150 - 980)
}

/** Check if CG point is within envelope */
export function cgInEnvelope(massKg: number, cgM: number): boolean {
  const fwd = cgFwdLimit(massKg)
  return fwd !== null && cgM >= fwd && cgM <= CG_REAR && massKg >= 780 && massKg <= 1150
}

// ── Bilinear interpolation helper ───────────────────────────
type PerfTable = Record<number, Record<number, number>>

export function interp2d(table: PerfTable, pa: number, mass: number): number {
  const alts   = Object.keys(table).map(Number).sort((a, b) => a - b)
  const masses = Object.keys(table[alts[0]]).map(Number).sort((a, b) => a - b)

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  pa   = clamp(pa,   alts[0],   alts[alts.length - 1])
  mass = clamp(mass, masses[0], masses[masses.length - 1])

  const ai   = alts.findIndex(a => a >= pa)
  const aLo  = ai === 0 ? alts[0] : alts[ai - 1]
  const aHi  = alts[ai]
  const tA   = aHi === aLo ? 0 : (pa - aLo) / (aHi - aLo)

  const mi   = masses.findIndex(m => m >= mass)
  const mLo  = mi === 0 ? masses[0] : masses[mi - 1]
  const mHi  = masses[mi]
  const tM   = mHi === mLo ? 0 : (mass - mLo) / (mHi - mLo)

  const v = (a: number, m: number) => table[a][m]
  return (1 - tA) * ((1 - tM) * v(aLo, mLo) + tM * v(aLo, mHi))
       + tA       * ((1 - tM) * v(aHi, mLo) + tM * v(aHi, mHi))
}

// ── Performance correction factors ──────────────────────────

/** ISA temperature at given pressure altitude */
export function isaTempC(paFt: number): number {
  return 15 - (paFt / 1000) * 2
}

/** Temperature correction factor (above ISA increases distance) */
export function tempFactor(oatC: number, paFt: number): number {
  const isa   = isaTempC(paFt)
  const delta = oatC - isa
  return 1 + delta * 0.007
}

/** Wind correction factor (+head reduces distance, -tail increases) */
export function windFactor(windKts: number): number {
  return Math.max(0.6, 1 - windKts * 0.005)
}

/** Density altitude (ft) */
export function densityAlt(paFt: number, oatC: number): number {
  const isa = isaTempC(paFt)
  return Math.round(paFt + (oatC - isa) * 120)
}

// ── Runway surface correction factors ───────────────────────
export const SURFACE_FACTORS: Record<string, number> = {
  asphalt:      1.00,
  grass_short:  1.10,
  grass_medium: 1.15,
  grass_long:   1.25,
}

// ── POH Performance Tables ───────────────────────────────────

/** T/O Ground Roll (m) — ISA, zero wind, asphalt */
export const TO_ROLL: PerfTable = {
      0: { 850: 155, 1000: 220, 1050: 250, 1100: 285, 1150: 325 },
   2000: { 850: 175, 1000: 250, 1050: 285, 1100: 325, 1150: 375 },
   4000: { 850: 200, 1000: 285, 1050: 325, 1100: 375, 1150: 435 },
   6000: { 850: 230, 1000: 330, 1050: 375, 1100: 435, 1150: 510 },
   8000: { 850: 270, 1000: 385, 1050: 440, 1100: 515, 1150: 605 },
  10000: { 850: 320, 1000: 460, 1050: 530, 1100: 620, 1150: 730 },
}

/** T/O Distance over 50ft obstacle (m) */
export const TO_50FT: PerfTable = {
      0: { 850: 355, 1000: 490, 1050: 560, 1100: 635, 1150:  720 },
   2000: { 850: 405, 1000: 565, 1050: 640, 1100: 730, 1150:  835 },
   4000: { 850: 465, 1000: 650, 1050: 745, 1100: 850, 1150:  975 },
   6000: { 850: 545, 1000: 765, 1050: 875, 1100:1005, 1150: 1155 },
   8000: { 850: 640, 1000: 905, 1050:1040, 1100:1200, 1150: 1385 },
  10000: { 850: 765, 1000:1095, 1050:1265, 1100:1465, 1150: 1700 },
}

/** Landing Ground Roll (m) — Flaps LDG, ISA, zero wind */
export const LDG_ROLL: PerfTable = {
      0: { 850: 155, 1000: 210, 1150: 287 },
   2000: { 850: 170, 1000: 230, 1150: 315 },
   4000: { 850: 190, 1000: 255, 1150: 350 },
   6000: { 850: 210, 1000: 285, 1150: 390 },
   8000: { 850: 235, 1000: 320, 1150: 435 },
  10000: { 850: 265, 1000: 360, 1150: 490 },
}

/** Rate of Climb at T/O (ft/min) */
export const ROC_TO: PerfTable = {
      0: { 850: 1200, 1000: 900, 1050: 800, 1100: 700, 1150: 560 },
   2000: { 850: 1060, 1000: 780, 1050: 690, 1100: 600, 1150: 480 },
   4000: { 850:  920, 1000: 660, 1050: 580, 1100: 500, 1150: 395 },
   6000: { 850:  785, 1000: 545, 1050: 470, 1100: 395, 1150: 305 },
   8000: { 850:  655, 1000: 435, 1050: 365, 1100: 295, 1150: 215 },
  10000: { 850:  530, 1000: 330, 1050: 265, 1100: 200, 1150: 125 },
}

// ── Calculate all performance results ───────────────────────
export interface PerfInputs {
  mass7:       number   // kg — T/O mass (Row 7)
  pa:          number   // ft
  oat:         number   // °C
  wind:        number   // kts (+head/-tail)
  surface:     string
  power:       number   // %
  flightTime:  number   // hr
}

export interface PerfResults {
  toRoll:      number
  to50ft:      number
  ldgRoll:     number
  roc:         number
  da:          number
  fuelFlowLhr: number
  tripFuelL:   number
  tripFuelKg:  number
}

export function calcPerformance(inp: PerfInputs): PerfResults {
  const tf  = tempFactor(inp.oat, inp.pa)
  const wf  = windFactor(inp.wind)
  const sf  = SURFACE_FACTORS[inp.surface] ?? 1.0

  const toRoll = Math.round(interp2d(TO_ROLL, inp.pa, inp.mass7) * tf * wf * sf)
  const to50ft = Math.round(interp2d(TO_50FT, inp.pa, inp.mass7) * tf * wf * sf)
  const ldgRoll = Math.round(interp2d(LDG_ROLL, inp.pa, inp.mass7) * tf * wf * sf)
  const roc     = Math.round(interp2d(ROC_TO, inp.pa, inp.mass7) / tf)
  const da      = densityAlt(inp.pa, inp.oat)

  const fuelFlowLhr = 5 + (inp.power / 100) * 20
  const tripFuelL   = parseFloat((fuelFlowLhr * inp.flightTime).toFixed(1))
  const tripFuelKg  = parseFloat((tripFuelL * 0.84).toFixed(1))

  return { toRoll, to50ft, ldgRoll, roc, da, fuelFlowLhr, tripFuelL, tripFuelKg }
}
