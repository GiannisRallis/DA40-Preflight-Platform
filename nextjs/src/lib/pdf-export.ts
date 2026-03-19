// ============================================================
// pdf-export.ts — jsPDF preflight record export
// ============================================================
import type { Submission, Profile } from "./types"
import type { Lang } from "./i18n"
import { ARMS, KG_TO_LB, M_TO_IN } from "./poh-data"

export async function exportPreflightPDF(
  sub: Submission,
  student: Pick<Profile, "full_name">,
  lang: Lang
): Promise<void> {
  const { default: jsPDF } = await import("jspdf")
  const isEn = lang === "en"

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const W = 210, M = 14, CW = W - 2 * M

  // ── Header ────────────────────────────────────────────────
  doc.setFillColor(7, 13, 26)
  doc.rect(0, 0, W, 28, "F")
  doc.setTextColor(96, 165, 250)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("DA-40 D — Preflight Record", M, 11)
  doc.setFontSize(8.5)
  doc.setTextColor(122, 144, 184)
  doc.text(`POH §5 & §6.4.3  ·  ${new Date().toLocaleString(isEn ? "en-GB" : "el-GR")}`, M, 20)
  doc.setTextColor(200, 210, 230)
  doc.setFont("helvetica", "normal")
  doc.text(student.full_name, W - M, 20, { align: "right" })

  // ── Flight info box ────────────────────────────────────────
  let y = 34
  doc.setFillColor(17, 30, 56)
  doc.roundedRect(M, y, CW, 18, 2, 2, "F")
  const fLabels = isEn ? ["Pilot","Flight Type","Date","Aircraft"] : ["Πιλότος","Τύπος","Ημερομηνία","Νηολόγιο"]
  const fVals   = [
    student.full_name,
    sub.flight_type || "—",
    sub.flight_date,
    sub.aircraft_reg || "—",
  ]
  fLabels.forEach((l, i) => {
    const x = M + 8 + i * (CW - 16) / 4
    doc.setFontSize(7.5); doc.setTextColor(122, 144, 184); doc.text(l, x, y + 7)
    doc.setFontSize(10); doc.setTextColor(232, 237, 248)
    doc.setFont("helvetica", "bold"); doc.text(fVals[i], x, y + 15)
    doc.setFont("helvetica", "normal")
  })
  y += 25

  // ── W&B Table ──────────────────────────────────────────────
  doc.setFontSize(9); doc.setTextColor(96, 165, 250); doc.setFont("helvetica", "bold")
  doc.text(isEn ? "WEIGHT & BALANCE (POH Table 6.4.3)" : "ΒΑΡΟΣ & ΙΣΟΡΡΟΠΙΑ (POH Πίνακας 6.4.3)", M, y)
  y += 5

  doc.setFillColor(30, 64, 175)
  doc.rect(M, y, CW, 6.5, "F")
  doc.setTextColor(255, 255, 255); doc.setFontSize(7)
  const hx = [M+1, M+8, M+74, M+99, M+120, M+142, M+162]
  const hs = isEn
    ? ["#","Item","Arm (m)","Mass (kg)","Moment (kg·m)","Mass (lb)","Moment (in·lb)"]
    : ["#","Στοιχείο","Βραχίονας (m)","Μάζα (kg)","Ροπή (kg·m)","Μάζα (lb)","Ροπή (in·lb)"]
  hs.forEach((h, i) => doc.text(h, hx[i], y + 4.5))
  y += 6.5

  const arm1 = sub.empty_arm_m ?? 2.476
  const rows: [string|number, string, string, number|null, number][] = [
    [1, isEn ? "Empty mass (M&B Report)" : "Empty mass (M&B Report)", arm1.toFixed(3), sub.empty_mass_kg, (sub.empty_mass_kg??0)*arm1],
    [2, `${isEn?"Front seats":"Front seats"} — 2.300 m`, "2.300", sub.front_seats_kg, (sub.front_seats_kg??0)*ARMS.front],
    [3, `${isEn?"Rear seats":"Rear seats"} — 3.250 m`, "3.250", sub.rear_seats_kg, (sub.rear_seats_kg??0)*ARMS.rear],
    [4, `${isEn?"Baggage":"Baggage"} — 3.650 m`, "3.650", sub.baggage_kg, (sub.baggage_kg??0)*ARMS.baggage],
    [5, isEn ? "TOTAL — empty fuel tanks (Rows 1–4)" : "ΣΥΝΟΛΟ — άδεις δεξαμενές", "—", sub.total_mass_r5, sub.total_mom_r5 ?? 0],
    [6, `${isEn?"Fuel":"Καύσιμο"} — 0.84 kg/L, 2.630 m`, "2.630", sub.fuel_mass_kg, (sub.fuel_mass_kg??0)*ARMS.fuel],
    [7, isEn ? "TOTAL — full fuel tanks (Row 5 + Row 6)" : "ΣΥΝΟΛΟ — πλήρεις δεξαμενές", "—", sub.total_mass_r7, sub.total_mom_r7 ?? 0],
  ]

  rows.forEach(([num, label, arm, mass, mom], ri) => {
    const isBold = num === 5 || num === 7
    if (isBold) {
      doc.setFillColor(17, 30, 56)
      doc.rect(M, y, CW, 6.8, "F")
      doc.setTextColor(96, 165, 250); doc.setFont("helvetica", "bold")
    } else {
      doc.setFillColor(ri % 2 === 0 ? 11 : 13, ri % 2 === 0 ? 18 : 22, ri % 2 === 0 ? 35 : 40)
      doc.rect(M, y, CW, 6, "F")
      doc.setTextColor(232, 237, 248); doc.setFont("helvetica", "normal")
    }
    doc.setFontSize(7)
    const rowH = isBold ? 6.8 : 6
    doc.text(String(num), hx[0], y + rowH * 0.7)
    doc.text(label,   hx[1], y + rowH * 0.7)
    doc.text(arm,     hx[2], y + rowH * 0.7)
    if (mass != null) doc.text(mass.toFixed(1), hx[3], y + rowH * 0.7)
    doc.text(mom.toFixed(1), hx[4], y + rowH * 0.7)
    if (mass != null) {
      doc.text((mass * KG_TO_LB).toFixed(0), hx[5], y + rowH * 0.7)
      doc.text((mom * KG_TO_LB * M_TO_IN).toFixed(0), hx[6], y + rowH * 0.7)
    }
    y += rowH
  })

  // CG result
  y += 4
  const [wr, wg, wb_] = sub.wb_status === "ok" ? [16, 185, 129]
    : sub.wb_status === "out_of_limits" ? [239, 68, 68]
    : [245, 158, 11]
  doc.setFillColor(wr, wg, wb_)
  doc.roundedRect(M, y, 85, 12, 2, 2, "F")
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(8)
  const wbLabel = sub.wb_status === "ok"
    ? (isEn ? "✓ WITHIN LIMITS" : "✓ ΕΝΤΟΣ ΟΡΊΩΝ")
    : sub.wb_status === "out_of_limits"
    ? (isEn ? "✗ OUT OF LIMITS" : "✗ ΕΚΤΟΣ ΟΡΊΩΝ")
    : (isEn ? "⚠ CHECK RANGE" : "⚠ ΕΛΕΓΞΕ")
  doc.text(wbLabel, M + 4, y + 5)
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(122, 144, 184)
  doc.text(`CG R5: ${sub.cg_r5?.toFixed(3) ?? "—"} m  |  CG R7: ${sub.cg_r7?.toFixed(3) ?? "—"} m`, M + 4, y + 10)

  // ── Performance ────────────────────────────────────────────
  y += 20
  doc.setFontSize(9); doc.setTextColor(16, 185, 129); doc.setFont("helvetica", "bold")
  doc.text(isEn ? "PERFORMANCE & FUEL" : "ΕΠΙΔΟΣΕΙΣ & ΚΑΥΣΙΜΑ", M, y)
  y += 6

  const perfRows = [
    [isEn?"Pressure Alt":"Pressure Alt", `${sub.pressure_alt_ft ?? "—"} ft`,
     isEn?"T/O Roll":"T/O Roll", `${sub.to_roll_m ?? "—"} m`],
    [isEn?"OAT":"OAT", `${sub.oat_c ?? "—"} °C`,
     isEn?"T/O over 50ft":"T/O over 50ft", `${sub.to_50ft_m ?? "—"} m`],
    [isEn?"Wind":"Wind", `${sub.wind_kts ?? 0} kts`,
     isEn?"LDG Roll":"LDG Roll", `${sub.ldg_roll_m ?? "—"} m`],
    [isEn?"Surface":"Διάδρομος", sub.runway_surface ?? "—",
     isEn?"Rate of Climb":"Rate of Climb", `${sub.roc_fpm ?? "—"} ft/min`],
    [isEn?"Density Alt":"Density Alt", `${sub.density_alt_ft ?? "—"} ft`,
     isEn?"Fuel Flow":"Fuel Flow", `${sub.fuel_flow_lhr?.toFixed(1) ?? "—"} L/hr`],
    [isEn?"Flight Time":"Χρόνος", `${sub.flight_time_hr ?? "—"} hr`,
     isEn?"Trip Fuel":"Trip Fuel", `${sub.trip_fuel_l?.toFixed(1) ?? "—"} L / ${sub.trip_fuel_kg?.toFixed(1) ?? "—"} kg`],
  ]

  perfRows.forEach((row, ri) => {
    doc.setFillColor(ri%2===0?11:13, ri%2===0?18:22, ri%2===0?35:40)
    doc.rect(M, y, CW, 6, "F")
    doc.setFontSize(7.5); doc.setTextColor(122, 144, 184); doc.setFont("helvetica", "normal")
    doc.text(row[0], M + 2, y + 4.3)
    doc.setTextColor(232, 237, 248); doc.setFont("helvetica", "bold")
    doc.text(row[1], M + 42, y + 4.3)
    doc.setTextColor(122, 144, 184); doc.setFont("helvetica", "normal")
    doc.text(row[2], M + CW/2 + 2, y + 4.3)
    doc.setTextColor(232, 237, 248); doc.setFont("helvetica", "bold")
    doc.text(row[3], M + CW/2 + 42, y + 4.3)
    y += 6
  })

  // ── Footer ─────────────────────────────────────────────────
  doc.setFillColor(7, 13, 26)
  doc.rect(0, 282, W, 15, "F")
  doc.setTextColor(80, 90, 110); doc.setFontSize(6.5); doc.setFont("helvetica", "normal")
  doc.text(
    isEn
      ? "⚠ For planning purposes only. Always verify against the original DA-40 D POH. Pilot bears sole responsibility for all flight decisions."
      : "⚠ Μόνο για σκοπούς σχεδιασμού. Πάντα επαληθεύστε στο πρωτότυπο POH. Ο πιλότος φέρει αποκλειστική ευθύνη.",
    M, 289
  )
  doc.text(`DA40 Platform · ${new Date().getFullYear()}`, W - M, 289, { align: "right" })

  const fname = `DA40_Preflight_${sub.flight_date}_${sub.aircraft_reg || "REG"}.pdf`
  doc.save(fname)
}
