"use client"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useLang } from "@/lib/i18n"
import type { Lang } from "@/lib/i18n"
import type { Profile, Submission } from "@/lib/types"
import {
  ARMS, KG_TO_LB, M_TO_IN, cgFwdLimit, cgInEnvelope, CG_REAR,
  calcPerformance, SURFACE_FACTORS
} from "@/lib/poh-data"

// MUI
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import Box from "@mui/material/Box"
import Tabs from "@mui/material/Tabs"
import Tab from "@mui/material/Tab"
import Paper from "@mui/material/Paper"
import Table from "@mui/material/Table"
import TableHead from "@mui/material/TableHead"
import TableBody from "@mui/material/TableBody"
import TableRow from "@mui/material/TableRow"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TextField from "@mui/material/TextField"
import MenuItem from "@mui/material/MenuItem"
import Grid from "@mui/material/Grid"
import Chip from "@mui/material/Chip"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import Alert from "@mui/material/Alert"
import Tooltip from "@mui/material/Tooltip"
import CircularProgress from "@mui/material/CircularProgress"
import Divider from "@mui/material/Divider"
import FlightIcon from "@mui/icons-material/Flight"
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf"
import SaveIcon from "@mui/icons-material/Save"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import ErrorIcon from "@mui/icons-material/Error"
import WarningIcon from "@mui/icons-material/Warning"
import AddIcon from "@mui/icons-material/Add"

const n = (v: string, fb = 0) => parseFloat(v) || fb

// ── CG Envelope SVG ───────────────────────────────────────────
function CGEnvelope({ mass5,cg5,mass7,cg7,s5ok,s7ok }: {
  mass5:number;cg5:number;mass7:number;cg7:number;s5ok:boolean;s7ok:boolean
}) {
  const W=500,H=220,pl=46,pr=14,pt=10,pb=30
  const tx = (cg:number) => pl+(cg-2.38)/(2.62-2.38)*(W-pl-pr)
  const ty = (m:number)  => pt+(1160-m)/(1160-750)*(H-pt-pb)
  const fwdPts  = [{m:780,cg:2.40},{m:980,cg:2.40},{m:1150,cg:2.46}]
  const rearPts = [{m:780,cg:2.59},{m:1150,cg:2.59}]
  const envPoly = [...fwdPts,{m:1150,cg:2.59},...[...rearPts].reverse()]
    .map(p=>`${tx(p.cg).toFixed(1)},${ty(p.m).toFixed(1)}`).join(" ")
  const yticks=[780,850,900,950,1000,1050,1100,1150]
  const xticks=[2.40,2.44,2.48,2.52,2.56,2.60]
  return (
    <Box component="svg" width="100%" viewBox={`0 0 ${W} ${H}`}
      sx={{ border:"1px solid", borderColor:"divider", borderRadius:1 }}
      role="img" aria-label="CG Envelope Diagram showing center of gravity limits">
      <title>CG Envelope Diagram 6.4.4</title>
      {yticks.map(m=>(
        <g key={m}>
          <line x1={pl} y1={ty(m)} x2={W-pr} y2={ty(m)} stroke="#E0E0E0" strokeWidth={1}/>
          <text x={pl-4} y={ty(m)+3.5} textAnchor="end" fill="#757575" fontSize={8}>{m}</text>
        </g>
      ))}
      {xticks.map(cg=>(
        <g key={cg}>
          <line x1={tx(cg)} y1={pt} x2={tx(cg)} y2={H-pb} stroke="#E0E0E0" strokeWidth={1}/>
          <text x={tx(cg)} y={H-pb+12} textAnchor="middle" fill="#757575" fontSize={8}>{cg.toFixed(2)}</text>
        </g>
      ))}
      <polygon points={envPoly} fill="rgba(21,101,192,0.07)" stroke="none"/>
      <polyline points={fwdPts.map(p=>`${tx(p.cg)},${ty(p.m)}`).join(" ")} fill="none" stroke="#C62828" strokeWidth={2}/>
      <polyline points={rearPts.map(p=>`${tx(p.cg)},${ty(p.m)}`).join(" ")} fill="none" stroke="#1565C0" strokeWidth={2}/>
      <text x={tx(2.50)} y={ty(1010)+4} textAnchor="middle" fill="#1565C0" fontSize={8} fontWeight="bold">NORMAL</text>
      {mass5>0&&cg5>0&&(
        <g>
          <circle cx={tx(cg5)} cy={ty(mass5)} r={6} fill={s5ok?"#2E7D32":"#C62828"}
            stroke="white" strokeWidth={2} role="img" aria-label={`Row 5: ${mass5.toFixed(0)}kg CG ${cg5.toFixed(3)}m`}/>
          <text x={tx(cg5)+9} y={ty(mass5)-3} fill="#212121" fontSize={8} fontWeight="bold">R5</text>
        </g>
      )}
      {mass7>0&&cg7>0&&(
        <g>
          <circle cx={tx(cg7)} cy={ty(mass7)} r={6} fill={s7ok?"#2E7D32":"#C62828"}
            stroke="white" strokeWidth={2} role="img" aria-label={`Row 7: ${mass7.toFixed(0)}kg CG ${cg7.toFixed(3)}m`}/>
          <text x={tx(cg7)+9} y={ty(mass7)+13} fill="#212121" fontSize={8} fontWeight="bold">R7</text>
        </g>
      )}
      {/* Legend */}
      <line x1={W-120} y1={pt+10} x2={W-100} y2={pt+10} stroke="#C62828" strokeWidth={2}/>
      <text x={W-96} y={pt+14} fill="#616161" fontSize={8}>Fwd limit</text>
      <line x1={W-120} y1={pt+23} x2={W-100} y2={pt+23} stroke="#1565C0" strokeWidth={2}/>
      <text x={W-96} y={pt+27} fill="#616161" fontSize={8}>Rear limit</text>
      <text x={W/2} y={H} textAnchor="middle" fill="#616161" fontSize={9}>CG Position [m]</text>
      <text x={10} y={H/2} textAnchor="middle" fill="#616161" fontSize={9}
        transform={`rotate(-90,10,${H/2})`}>Mass [kg]</text>
    </Box>
  )
}

// ── WB Status Chip ─────────────────────────────────────────────
function WBChip({ status }: { status: string }) {
  if (status === "ok")            return <Chip label="✓ Within Limits" color="success" size="small" icon={<CheckCircleIcon/>}/>
  if (status === "out_of_limits") return <Chip label="✗ Out of Limits" color="error"   size="small" icon={<ErrorIcon/>}/>
  return <Chip label="⚠ Check Range" color="warning" size="small" icon={<WarningIcon/>}/>
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ label, value, unit, warning }: { label:string; value:string|number; unit?:string; warning?:boolean }) {
  return (
    <Card variant="outlined" sx={{ flex:1, minWidth:120 }}>
      <CardContent sx={{ p:"12px!important" }}>
        <Typography variant="overline" color="text.secondary" display="block">{label}</Typography>
        <Typography variant="h5" fontWeight={700}
          color={warning ? "warning.main" : "primary.main"}
          className="data-mono">
          {value}
        </Typography>
        {unit && <Typography variant="caption" color="text.secondary">{unit}</Typography>}
      </CardContent>
    </Card>
  )
}

// ── Main Dashboard ────────────────────────────────────────────
export default function StudentDashboard() {
  const [profile, setProfile]   = useState<Profile|null>(null)
  const [history, setHistory]   = useState<Submission[]>([])
  const [mainTab, setMainTab]   = useState(0) // 0=preflight, 1=history
  const [subTab, setSubTab]     = useState(0) // 0=wb, 1=perf
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [exporting, setExporting] = useState(false)
  const { t, lang, setLang }    = useLang()
  const sb                      = createClient()
  const router                  = useRouter()

  // W&B state
  const [wb, setWb] = useState({
    flightType:"Training", flightDate:new Date().toISOString().slice(0,10),
    aircraftReg:"", emptyMass:"735", emptyArm:"2.476",
    frontSeats:"", rearSeats:"", baggage:"", fuel:"",
  })
  const setW = (k:keyof typeof wb) => (v:string) => setWb(p=>({...p,[k]:v}))

  // Performance state
  const [perf, setPerf] = useState({ pa:"0",oat:"15",wind:"0",surface:"asphalt",power:"65",flightTime:"1.0" })
  const setP = (k:keyof typeof perf) => (v:string) => setPerf(p=>({...p,[k]:v}))

  // W&B calcs
  const em=n(wb.emptyMass), ea=n(wb.emptyArm,2.476)
  const fs=n(wb.frontSeats), rs=n(wb.rearSeats), bg=n(wb.baggage), fu=n(wb.fuel)
  const mom5 = em*ea + fs*ARMS.front + rs*ARMS.rear + bg*ARMS.baggage
  const mass5 = em+fs+rs+bg
  const cg5   = mass5>0 ? mom5/mass5 : 0
  const mom7  = mom5 + fu*ARMS.fuel
  const mass7 = mass5+fu
  const cg7   = mass7>0 ? mom7/mass7 : 0
  const s5ok  = cgInEnvelope(mass5,cg5)
  const s7ok  = cgInEnvelope(mass7,cg7)
  const fwd5  = cgFwdLimit(mass5)
  const fwd7  = cgFwdLimit(mass7)
  const wbStatus = mass7===0 ? "check_range" : s7ok ? "ok" : "out_of_limits"

  // Perf calcs
  const perfRes = mass7>0 ? calcPerformance({
    mass7, pa:n(perf.pa), oat:n(perf.oat,15), wind:n(perf.wind),
    surface:perf.surface, power:n(perf.power,65), flightTime:n(perf.flightTime,1),
  }) : null

  const load = useCallback(async () => {
    const { data:{ user } } = await sb.auth.getUser()
    if (!user) { router.replace("/auth/login"); return }
    const [{ data:prof },{ data:subs }] = await Promise.all([
      sb.from("profiles").select("*").eq("id",user.id).maybeSingle(),
      sb.from("submissions").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(50),
    ])
    setProfile(prof); setHistory(subs||[])
  },[sb,router])

  useEffect(()=>{ load() },[load])

  async function handleSave() {
    if (!profile?.id) return
    setSaving(true)
    const { error } = await sb.from("submissions").insert({
      user_id:profile.id, flight_type:wb.flightType, flight_date:wb.flightDate,
      aircraft_reg:wb.aircraftReg||null, status:"submitted",
      empty_mass_kg:em, empty_arm_m:ea,
      front_seats_kg:fs, rear_seats_kg:rs, baggage_kg:bg, fuel_mass_kg:fu,
      total_mass_r5:mass5, total_mom_r5:parseFloat(mom5.toFixed(2)), cg_r5:parseFloat(cg5.toFixed(3)),
      total_mass_r7:mass7, total_mom_r7:parseFloat(mom7.toFixed(2)), cg_r7:parseFloat(cg7.toFixed(3)),
      wb_status:wbStatus,
      pressure_alt_ft:n(perf.pa), oat_c:n(perf.oat,15), wind_kts:n(perf.wind), runway_surface:perf.surface,
      ...(perfRes ? {
        to_roll_m:perfRes.toRoll, to_50ft_m:perfRes.to50ft, ldg_roll_m:perfRes.ldgRoll,
        roc_fpm:perfRes.roc, density_alt_ft:perfRes.da,
        power_pct:n(perf.power,65), fuel_flow_lhr:parseFloat(perfRes.fuelFlowLhr.toFixed(2)),
        flight_time_hr:n(perf.flightTime,1), trip_fuel_l:perfRes.tripFuelL, trip_fuel_kg:perfRes.tripFuelKg,
      } : {}),
    })
    if (!error) {
      setSaved(true)
      setTimeout(()=>{ setSaved(false); load(); setMainTab(1) },1500)
    } else alert("Error: "+error.message)
    setSaving(false)
  }

  async function handleExport() {
    if (!profile) return; setExporting(true)
    try {
      const { exportPreflightPDF } = await import("@/lib/pdf-export")
      await exportPreflightPDF({
        flight_type:wb.flightType, flight_date:wb.flightDate, aircraft_reg:wb.aircraftReg,
        status:"submitted", empty_mass_kg:em, empty_arm_m:ea, front_seats_kg:fs,
        rear_seats_kg:rs, baggage_kg:bg, fuel_mass_kg:fu,
        total_mass_r5:mass5, total_mom_r5:mom5, cg_r5:cg5,
        total_mass_r7:mass7, total_mom_r7:mom7, cg_r7:cg7, wb_status:wbStatus,
        pressure_alt_ft:n(perf.pa), oat_c:n(perf.oat,15), wind_kts:n(perf.wind),
        runway_surface:perf.surface, ...(perfRes||{}),
      } as any, { full_name:profile.full_name }, lang)
    } catch(e){ console.error(e) }
    setExporting(false)
  }

  async function logout() { await sb.auth.signOut(); router.replace("/auth/login") }

  // Status config
  const statusCfg: Record<string,{label:string;color:"default"|"info"|"success"|"warning"}> = {
    submitted: { label:t.status.submitted, color:"info" },
    reviewed:  { label:t.status.reviewed,  color:"success" },
    draft:     { label:t.status.draft,      color:"default" },
  }

  // ── W&B row renderer ─────────────────────────────────────────
  const wbRow = (
    num:number|string, label:string, arm:string|null,
    massVal:string|null, onMass:((v:string)=>void)|null,
    mom:number, totalMass?:number, totalMom?:number, bold=false
  ) => {
    const mKg = totalMass!==undefined ? totalMass : n(massVal||"")
    return (
      <TableRow key={String(num)} sx={{ bgcolor:bold?"primary.50":undefined }}>
        <TableCell sx={{ fontWeight:bold?700:400, color:"primary.main", width:28,
          fontFamily:"var(--font-mono, monospace)", textAlign:"center" }}>{num}</TableCell>
        <TableCell sx={{ fontSize:"0.8rem", fontWeight:bold?600:400 }}>{label}</TableCell>
        <TableCell className="data-mono" sx={{ color:"text.secondary", fontSize:"0.8rem" }}>{arm??"—"}</TableCell>
        <TableCell sx={{ width:100 }}>
          {totalMass!==undefined
            ? <Typography className="data-mono" fontWeight={bold?700:400} fontSize="0.9rem">{totalMass.toFixed(1)}</Typography>
            : massVal!==null&&onMass ? (
              <TextField type="number" value={massVal} onChange={e=>onMass(e.target.value)}
                size="small" inputProps={{ step:"0.1","aria-label":label+" mass kg" }}
                sx={{ width:90 }} placeholder="0"/>
            ) : null
          }
        </TableCell>
        <TableCell className="data-mono" align="right" sx={{ fontWeight:bold?700:400, fontSize:"0.85rem" }}>
          {(totalMom!==undefined?totalMom:mom).toFixed(1)}
        </TableCell>
        <TableCell className="data-mono" align="right" sx={{ color:"text.secondary", fontSize:"0.8rem" }}>
          {(mKg*KG_TO_LB).toFixed(0)}
        </TableCell>
        <TableCell className="data-mono" align="right" sx={{ color:"text.secondary", fontSize:"0.8rem" }}>
          {((totalMom!==undefined?totalMom:mom)*KG_TO_LB*M_TO_IN).toFixed(0)}
        </TableCell>
      </TableRow>
    )
  }

  return (
    <Box sx={{ minHeight:"100vh", bgcolor:"background.default" }}>
      {/* AppBar */}
      <AppBar position="sticky" color="primary" elevation={1}>
        <Toolbar>
          <FlightIcon sx={{ mr:1 }} aria-hidden="true"/>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow:0, mr:1 }}>{t.app.name}</Typography>
          <Chip label={t.nav.student} size="small" sx={{ bgcolor:"rgba(255,255,255,0.2)", color:"white", mr:"auto" }}/>
          <ToggleButtonGroup size="small" exclusive value={lang}
            onChange={(_,v)=>v&&setLang(v as Lang)} aria-label="Language"
            sx={{ "& .MuiToggleButton-root":{ color:"rgba(255,255,255,0.8)", borderColor:"rgba(255,255,255,0.3)" },
              "& .Mui-selected":{ bgcolor:"rgba(255,255,255,0.2)!important", color:"white!important" }, mr:2 }}>
            <ToggleButton value="el">ΕΛ</ToggleButton>
            <ToggleButton value="en">EN</ToggleButton>
          </ToggleButtonGroup>
          {profile && <Typography variant="body2" sx={{ mr:2, opacity:0.9 }}>{profile.full_name}</Typography>}
          <Button color="inherit" variant="outlined" size="small"
            onClick={logout} sx={{ borderColor:"rgba(255,255,255,0.5)" }}>
            {t.nav.logout}
          </Button>
        </Toolbar>
      </AppBar>

      {/* View tabs */}
      <Box sx={{ bgcolor:"background.paper", borderBottom:1, borderColor:"divider" }}>
        <Tabs value={mainTab} onChange={(_,v)=>setMainTab(v)} aria-label="Dashboard sections"
          sx={{ px:2 }}>
          <Tab label={t.tabs.preflight} id="tab-0" aria-controls="panel-0"/>
          <Tab label={`${t.tabs.history} (${history.length})`} id="tab-1" aria-controls="panel-1"/>
        </Tabs>
      </Box>

      <Box component="main" id="main-content" sx={{ p:{xs:2,sm:3}, maxWidth:1100, mx:"auto" }}>

        {/* ── PREFLIGHT ──────────────────────────────────── */}
        <Box role="tabpanel" id="panel-0" aria-labelledby="tab-0" hidden={mainTab!==0}>
          {mainTab===0 && (
            <>
              {/* Flight info */}
              <Grid container spacing={2} sx={{ mb:2 }}>
                <Grid size={{ xs:12, sm:4 }}>
                  <TextField label={t.flight.type} value={wb.flightType} fullWidth
                    onChange={e=>setWb(p=>({...p,flightType:e.target.value}))} placeholder="Training"/>
                </Grid>
                <Grid size={{ xs:12, sm:4 }}>
                  <TextField label={t.flight.date} type="date" value={wb.flightDate} fullWidth
                    onChange={e=>setWb(p=>({...p,flightDate:e.target.value}))}
                    InputLabelProps={{ shrink:true }}/>
                </Grid>
                <Grid size={{ xs:12, sm:4 }}>
                  <TextField label={t.flight.reg} value={wb.aircraftReg} fullWidth
                    onChange={e=>setWb(p=>({...p,aircraftReg:e.target.value}))} placeholder="SX-XXX"/>
                </Grid>
              </Grid>

              {/* Sub-tabs */}
              <Box sx={{ bgcolor:"background.paper", borderBottom:1, borderColor:"divider", borderRadius:"8px 8px 0 0", mb:0 }}>
                <Tabs value={subTab} onChange={(_,v)=>setSubTab(v)} aria-label="Calculator sections">
                  <Tab label={t.tabs.wb}   id="stab-0" aria-controls="spanel-0"/>
                  <Tab label={t.tabs.perf} id="stab-1" aria-controls="spanel-1"/>
                </Tabs>
              </Box>

              {/* ── W&B TAB ─────────────────────────────── */}
              <Box role="tabpanel" id="spanel-0" aria-labelledby="stab-0" hidden={subTab!==0}>
                {subTab===0 && (
                  <Paper variant="outlined" sx={{ borderTop:0, borderRadius:"0 0 8px 8px", p:2 }}>
                    <Box sx={{ mb:2, maxWidth:280 }}>
                      <TextField label={t.wb.emptyArm} type="number" value={wb.emptyArm} fullWidth
                        onChange={e=>setW("emptyArm")(e.target.value)} inputProps={{ step:"0.001" }}
                        helperText={`= ${(n(wb.emptyArm,2.476)*M_TO_IN).toFixed(1)} in`}/>
                    </Box>

                    <TableContainer>
                      <Table size="small" aria-label="Weight and Balance table">
                        <TableHead>
                          <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>Item</TableCell>
                            <TableCell>{t.wb.armHdr}</TableCell>
                            <TableCell>{t.wb.massKg}</TableCell>
                            <TableCell align="right">{t.wb.momKgm}</TableCell>
                            <TableCell align="right">{t.wb.massLb}</TableCell>
                            <TableCell align="right">{t.wb.momInLb}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {wbRow(1,t.wb.emptyMass,`${ea.toFixed(3)} m`,wb.emptyMass,setW("emptyMass"),em*ea)}
                          {wbRow(2,`${t.wb.front} — 2.300 m`,"2.300 m",wb.frontSeats,setW("frontSeats"),fs*ARMS.front)}
                          {wbRow(3,`${t.wb.rear} — 3.250 m`, "3.250 m",wb.rearSeats, setW("rearSeats"), rs*ARMS.rear)}
                          {wbRow(4,`${t.wb.baggage} — 3.650 m`,"3.650 m",wb.baggage,setW("baggage"),bg*ARMS.baggage)}
                          {wbRow(5,t.wb.row5,null,null,null,mom5,mass5,mom5,true)}
                          {wbRow(6,`${t.wb.fuel} — 0.84 kg/L — 2.630 m`,"2.630 m",wb.fuel,setW("fuel"),fu*ARMS.fuel)}
                          {wbRow(7,t.wb.row7,null,null,null,mom7,mass7,mom7,true)}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* CG Status */}
                    <Box sx={{ display:"flex", gap:2, flexWrap:"wrap", mt:2 }}>
                      {[
                        { label:`${t.wb.cgStatus} — Row 7`, mass:mass7, cg:cg7, ok:s7ok, fwd:fwd7 },
                        { label:`${t.wb.cgStatus} — Row 5`, mass:mass5, cg:cg5, ok:s5ok, fwd:fwd5 },
                      ].map((c,i)=>(
                        <Paper key={i} variant="outlined" sx={{ flex:1, minWidth:220, p:2,
                          borderColor:c.ok?"success.main":"error.main",
                          bgcolor:c.ok?"success.50":"error.50" }}>
                          <Typography variant="overline" color="text.secondary">{c.label}</Typography>
                          <Box sx={{ mt:0.5 }}><WBChip status={c.ok?"ok":"out_of_limits"}/></Box>
                          <Typography variant="body2" className="data-mono" sx={{ mt:1, color:"text.secondary" }}>
                            {c.mass.toFixed(1)} kg · CG {c.cg.toFixed(3)} m · Fwd {c.fwd?.toFixed(3)??"—"} m
                          </Typography>
                        </Paper>
                      ))}
                    </Box>

                    {/* CG Diagram */}
                    <Box sx={{ mt:2 }}>
                      <Typography variant="overline" color="text.secondary" display="block" sx={{ mb:1 }}>
                        {t.wb.cgDiagram}
                      </Typography>
                      <CGEnvelope mass5={mass5} cg5={cg5} mass7={mass7} cg7={cg7} s5ok={s5ok} s7ok={s7ok}/>
                    </Box>
                  </Paper>
                )}
              </Box>

              {/* ── PERF TAB ──────────────────────────────── */}
              <Box role="tabpanel" id="spanel-1" aria-labelledby="stab-1" hidden={subTab!==1}>
                {subTab===1 && (
                  <Paper variant="outlined" sx={{ borderTop:0, borderRadius:"0 0 8px 8px", p:2 }}>
                    <Grid container spacing={2} sx={{ mb:2 }}>
                      {[
                        { l:t.perf.pa,   k:"pa",   u:"ft" },
                        { l:t.perf.oat,  k:"oat",  u:"°C" },
                        { l:t.perf.wind, k:"wind",  u:"kts" },
                        { l:t.perf.power, k:"power", u:"%" },
                        { l:t.perf.flightTime, k:"flightTime", u:"hr" },
                      ].map(f=>(
                        <Grid key={f.k} size={{ xs:6, sm:4 }}>
                          <TextField label={`${f.l} (${f.u})`} type="number" value={(perf as any)[f.k]} fullWidth
                            onChange={e=>setP(f.k as any)(e.target.value)} size="small"/>
                        </Grid>
                      ))}
                      <Grid size={{ xs:12, sm:4 }}>
                        <TextField label={t.perf.surface} select value={perf.surface} fullWidth size="small"
                          onChange={e=>setP("surface")(e.target.value)}>
                          {Object.entries(t.perf.surfaces).map(([k,v])=>(
                            <MenuItem key={k} value={k}>{v}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    </Grid>

                    {perfRes ? (
                      <>
                        <Box sx={{ display:"flex", gap:1.5, flexWrap:"wrap", mb:2 }}>
                          <StatCard label={t.perf.toRoll} value={perfRes.toRoll}
                            unit={`m · ${Math.round(perfRes.toRoll*3.281)} ft`} warning={perfRes.toRoll>600}/>
                          <StatCard label={t.perf.to50ft} value={perfRes.to50ft}
                            unit={`m · ${Math.round(perfRes.to50ft*3.281)} ft`}/>
                          <StatCard label={t.perf.ldgRoll} value={perfRes.ldgRoll}
                            unit={`m · ${Math.round(perfRes.ldgRoll*3.281)} ft`}/>
                          <StatCard label={t.perf.roc} value={perfRes.roc} unit="ft/min"/>
                          <StatCard label={t.perf.da} value={perfRes.da} unit="ft"
                            warning={perfRes.da>n(perf.pa)+1500}/>
                          <StatCard label={t.perf.fuelFlow} value={perfRes.fuelFlowLhr.toFixed(1)} unit="L/hr"/>
                          <StatCard label={t.perf.tripFuel} value={perfRes.tripFuelL.toFixed(1)}
                            unit={`L · ${perfRes.tripFuelKg.toFixed(1)} kg`}/>
                        </Box>
                        {/* V-speeds */}
                        <Paper variant="outlined" sx={{ p:2 }}>
                          <Typography variant="overline" color="text.secondary" gutterBottom display="block">
                            {t.perf.vspeeds} — {mass7.toFixed(0)} kg
                          </Typography>
                          <Box sx={{ display:"flex", gap:3, flexWrap:"wrap" }}>
                            {[
                              { l:"vR",   v:mass7<=850?"49":mass7<=1000?"55":"59" },
                              { l:"vY",   v:mass7<=850?"54":mass7<=1000?"60":"66" },
                              { l:"vApp", v:mass7<=850?"58":mass7<=1000?"63":"71" },
                            ].map(v=>(
                              <Box key={v.l}>
                                <Typography variant="caption" color="text.secondary">{v.l}: </Typography>
                                <Typography component="span" variant="h5" fontWeight={700}
                                  color="primary.main" className="data-mono"> {v.v} </Typography>
                                <Typography variant="caption" color="text.secondary">KIAS</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Paper>
                      </>
                    ) : (
                      <Alert severity="info">{lang==="el"?"Εισάγετε δεδομένα W&B για να υπολογιστούν οι επιδόσεις.":"Enter W&B data first to calculate performance."}</Alert>
                    )}
                  </Paper>
                )}
              </Box>

              {/* Action bar */}
              <Divider sx={{ my:2 }}/>
              <Box sx={{ display:"flex", alignItems:"center", gap:1.5, flexWrap:"wrap" }}>
                <Box sx={{ mr:"auto" }}>
                  <WBChip status={wbStatus}/>
                  {mass7>0 && (
                    <Typography variant="caption" className="data-mono" color="text.secondary" sx={{ ml:1 }}>
                      {mass7.toFixed(1)} kg · CG {cg7.toFixed(3)} m
                    </Typography>
                  )}
                </Box>
                <Tooltip title={mass7===0 ? (lang==="el"?"Εισάγετε μάζα πρώτα":"Enter mass first") : ""}>
                  <span>
                    <Button variant="outlined" color="success"
                      startIcon={exporting ? <CircularProgress size={16}/> : <PictureAsPdfIcon/>}
                      disabled={exporting||mass7===0} onClick={handleExport}>
                      {t.actions.exportPdf}
                    </Button>
                  </span>
                </Tooltip>
                <Button variant="contained" size="large"
                  startIcon={saved ? <CheckCircleIcon/> : saving ? <CircularProgress size={18} color="inherit"/> : <SaveIcon/>}
                  disabled={saving||saved} onClick={handleSave}
                  color={saved?"success":"primary"}>
                  {saving?t.actions.submitting:saved?t.actions.submitted:t.actions.submit}
                </Button>
              </Box>
            </>
          )}
        </Box>

        {/* ── HISTORY ──────────────────────────────────────── */}
        <Box role="tabpanel" id="panel-1" aria-labelledby="tab-1" hidden={mainTab!==1}>
          {mainTab===1 && (
            <>
              <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"center", mb:2 }}>
                <Typography variant="h6">{t.tabs.history}</Typography>
                <Button variant="contained" startIcon={<AddIcon/>} onClick={()=>setMainTab(0)}>
                  {t.actions.newPreflight}
                </Button>
              </Box>
              {history.length===0 ? (
                <Alert severity="info">{t.misc.noHistory}</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table aria-label="Preflight history">
                    <TableHead>
                      <TableRow>
                        {[t.table.date,t.table.type,t.table.ac,t.table.mass,t.table.cg,
                          t.table.wb,t.table.toRoll,t.table.fuel,t.table.status,t.table.notes].map(h=>(
                          <TableCell key={h}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.map(sub=>{
                        const sc = statusCfg[sub.status]||statusCfg.draft
                        return (
                          <TableRow key={sub.id}>
                            <TableCell className="data-mono">
                              {new Date(sub.created_at).toLocaleDateString(lang==="el"?"el-GR":"en-GB")}
                            </TableCell>
                            <TableCell>{sub.flight_type||"—"}</TableCell>
                            <TableCell className="data-mono">{sub.aircraft_reg||"—"}</TableCell>
                            <TableCell className="data-mono">{sub.total_mass_r7?.toFixed(1)||"—"} kg</TableCell>
                            <TableCell className="data-mono">{sub.cg_r7?.toFixed(3)||"—"} m</TableCell>
                            <TableCell><WBChip status={sub.wb_status||"check_range"}/></TableCell>
                            <TableCell className="data-mono">{sub.to_roll_m||"—"} m</TableCell>
                            <TableCell className="data-mono">{sub.trip_fuel_l?.toFixed(1)||"—"} L</TableCell>
                            <TableCell>
                              <Chip label={sc.label} color={sc.color} size="small" variant="outlined"/>
                            </TableCell>
                            <TableCell sx={{ maxWidth:160, fontSize:"0.8rem",
                              color:sub.instructor_notes?"primary.main":"text.disabled" }}>
                              {sub.instructor_notes?.slice(0,40)||(lang==="el"?"—":"—")}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}
