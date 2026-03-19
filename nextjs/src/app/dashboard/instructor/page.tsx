"use client"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useLang } from "@/lib/i18n"
import type { Lang } from "@/lib/i18n"
import type { Profile, SubWithStudent } from "@/lib/types"
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
import CardActionArea from "@mui/material/CardActionArea"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import Alert from "@mui/material/Alert"
import CircularProgress from "@mui/material/CircularProgress"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"
import Avatar from "@mui/material/Avatar"
import Badge from "@mui/material/Badge"
import LinearProgress from "@mui/material/LinearProgress"
import Divider from "@mui/material/Divider"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"
import FlightIcon from "@mui/icons-material/Flight"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import ErrorIcon from "@mui/icons-material/Error"
import WarningIcon from "@mui/icons-material/Warning"
import CloseIcon from "@mui/icons-material/Close"
import FilterListIcon from "@mui/icons-material/FilterList"
import PeopleIcon from "@mui/icons-material/People"

// ── WB Chip ───────────────────────────────────────────────────
function WBChip({ status }: { status: string|null }) {
  if (status==="ok")            return <Chip label="✓ OK"     color="success" size="small" icon={<CheckCircleIcon/>}/>
  if (status==="out_of_limits") return <Chip label="✗ ΕΚΤΟΣ" color="error"   size="small" icon={<ErrorIcon/>}/>
  if (status==="check_range")   return <Chip label="⚠ CHECK" color="warning" size="small" icon={<WarningIcon/>}/>
  return <Chip label="—" size="small" variant="outlined"/>
}

// ── Review Dialog ─────────────────────────────────────────────
function ReviewDialog({ sub, onClose, onSave }: {
  sub: SubWithStudent
  onClose: () => void
  onSave: (id:string, notes:string, status:"submitted"|"reviewed") => Promise<void>
}) {
  const [notes, setNotes]   = useState(sub.instructor_notes||"")
  const [status, setStatus] = useState<"submitted"|"reviewed">(
    sub.status==="reviewed" ? "reviewed" : "submitted"
  )
  const [saving, setSaving] = useState(false)
  const { t } = useLang()

  async function save() {
    setSaving(true); await onSave(sub.id, notes, status); setSaving(false); onClose()
  }

  const row = (l:string, v:string|number|null|undefined, u="") =>
    v!=null ? <Box key={l} sx={{ display:"flex", justifyContent:"space-between", py:0.5,
      borderBottom:"1px solid", borderColor:"divider" }}>
      <Typography variant="body2" color="text.secondary">{l}</Typography>
      <Typography variant="body2" fontWeight={600} className="data-mono">{v}{u?` ${u}`:""}</Typography>
    </Box> : null

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth
      aria-labelledby="review-dialog-title">
      <DialogTitle id="review-dialog-title">
        <Box sx={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {sub.student?.full_name||"Student"} — {new Date(sub.created_at).toLocaleDateString("el-GR")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {sub.flight_type||"—"} · {sub.aircraft_reg||"—"} · {sub.flight_date}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close review dialog"><CloseIcon/></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mb:2 }}>
          {/* W&B */}
          <Grid size={{ xs:12, md:6 }}>
            <Paper variant="outlined" sx={{ p:1.5 }}>
              <Typography variant="overline" color="primary.main" display="block" gutterBottom>
                WEIGHT &amp; BALANCE
              </Typography>
              {row("Empty mass", sub.empty_mass_kg, "kg")}
              {row("Front seats", sub.front_seats_kg, "kg")}
              {row("Rear seats", sub.rear_seats_kg, "kg")}
              {row("Baggage", sub.baggage_kg, "kg")}
              {row("Fuel", sub.fuel_mass_kg, "kg")}
              <Box sx={{ mt:1, p:1, bgcolor:"primary.50", borderRadius:1 }}>
                <Typography variant="body2" fontWeight={700} color="primary.main">
                  Row 5: {sub.total_mass_r5?.toFixed(1)} kg · CG {sub.cg_r5?.toFixed(3)} m
                </Typography>
                <Typography variant="body2" fontWeight={700} color="primary.dark">
                  Row 7: {sub.total_mass_r7?.toFixed(1)} kg · CG {sub.cg_r7?.toFixed(3)} m
                </Typography>
                <Box sx={{ mt:0.5 }}><WBChip status={sub.wb_status}/></Box>
              </Box>
            </Paper>
          </Grid>
          {/* Performance */}
          <Grid size={{ xs:12, md:6 }}>
            <Paper variant="outlined" sx={{ p:1.5 }}>
              <Typography variant="overline" color="success.main" display="block" gutterBottom>
                PERFORMANCE &amp; FUEL
              </Typography>
              {row("Pressure Alt", sub.pressure_alt_ft, "ft")}
              {row("OAT", sub.oat_c, "°C")}
              {row("Wind", sub.wind_kts, "kts")}
              {row("T/O Roll", sub.to_roll_m, "m")}
              {row("T/O over 50ft", sub.to_50ft_m, "m")}
              {row("LDG Roll", sub.ldg_roll_m, "m")}
              {row("Rate of Climb", sub.roc_fpm, "ft/min")}
              {row("Density Alt", sub.density_alt_ft, "ft")}
              {row("Fuel Flow", sub.fuel_flow_lhr, "L/hr")}
              {row("Trip Fuel", sub.trip_fuel_l, "L")}
            </Paper>
          </Grid>
        </Grid>

        {/* Review form */}
        <Paper variant="outlined" sx={{ p:2, bgcolor:"primary.50" }}>
          <Typography variant="overline" color="primary.main" display="block" gutterBottom>
            {t.instr.notes}
          </Typography>
          <TextField label={t.instr.statusLabel} select value={status} fullWidth size="small" sx={{ mb:2 }}
            onChange={e=>setStatus(e.target.value as "submitted"|"reviewed")}>
            <MenuItem value="submitted">{t.instr.awaitingStatus}</MenuItem>
            <MenuItem value="reviewed">{t.instr.reviewedStatus}</MenuItem>
          </TextField>
          <TextField label={t.instr.notes} multiline rows={3} fullWidth value={notes}
            onChange={e=>setNotes(e.target.value)} placeholder={t.instr.notesPh}
            inputProps={{ "aria-label":"Instructor notes" }}/>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px:3, py:2 }}>
        <Button onClick={onClose} variant="outlined">{t.instr.cancel}</Button>
        <Button onClick={save} variant="contained" disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit"/> : <CheckCircleIcon/>}>
          {t.instr.save}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ══════════════════════════════════════════════════════════════
export default function InstructorDashboard() {
  const [profile, setProfile]         = useState<Profile|null>(null)
  const [students, setStudents]       = useState<Profile[]>([])
  const [submissions, setSubmissions] = useState<SubWithStudent[]>([])
  const [tab, setTab]                 = useState(0)
  const [filterStudent, setFilter]    = useState("")
  const [filterStatus, setFStatus]    = useState("")
  const [selected, setSelected]       = useState<SubWithStudent|null>(null)
  const [loading, setLoading]         = useState(true)
  const { t, lang, setLang }          = useLang()
  const sb                            = createClient()
  const router                        = useRouter()

  const load = useCallback(async () => {
    setLoading(true)
    const { data:{ user } } = await sb.auth.getUser()
    if (!user) { router.replace("/auth/login"); return }
    const { data:prof } = await sb.from("profiles").select("*").eq("id",user.id).maybeSingle()
    setProfile(prof)
    const [{ data:studs },{ data:subs }] = await Promise.all([
      sb.from("profiles").select("*").eq("role","student").order("full_name"),
      sb.from("submissions").select("*").order("created_at",{ascending:false}).limit(1000),
    ])
    const byId = Object.fromEntries((studs||[]).map(s=>[s.id,s]))
    setStudents(studs||[])
    setSubmissions((subs||[]).map(s=>({
      ...s,
      student:byId[s.user_id]
        ? {full_name:byId[s.user_id].full_name,email:byId[s.user_id].email,license_num:byId[s.user_id].license_num}
        : undefined,
    })) as SubWithStudent[])
    setLoading(false)
  },[sb,router])

  useEffect(()=>{ load() },[load])

  async function handleReview(id:string, notes:string, status:"submitted"|"reviewed") {
    await sb.from("submissions").update({
      instructor_notes:notes, reviewed_by:profile?.id,
      reviewed_at:new Date().toISOString(), status,
    }).eq("id",id)
    setSubmissions(prev=>prev.map(s=>s.id===id?{...s,instructor_notes:notes,status,reviewed_at:new Date().toISOString()}:s))
  }

  async function logout() { await sb.auth.signOut(); router.replace("/auth/login") }

  const filtered = submissions
    .filter(s=>!filterStudent||s.user_id===filterStudent)
    .filter(s=>!filterStatus||s.status===filterStatus)

  const pending  = submissions.filter(s=>s.status==="submitted").length
  const reviewed = submissions.filter(s=>s.status==="reviewed").length
  const issues   = submissions.filter(s=>s.wb_status==="out_of_limits").length
  const avgCG    = submissions.filter(s=>s.cg_r7).reduce((a,s,_,arr)=>a+(s.cg_r7||0)/arr.length,0)

  const studentStats = students.map(st=>{
    const subs = submissions.filter(s=>s.user_id===st.id)
    const ok   = subs.filter(s=>s.wb_status==="ok").length
    const pct  = subs.length>0 ? Math.round(ok/subs.length*100) : null
    return { ...st, total:subs.length, ok, pct, pending:subs.filter(s=>s.status==="submitted").length }
  }).sort((a,b)=>b.pending-a.pending)

  const statusCfg: Record<string,{label:string;color:"default"|"info"|"success"|"warning"}> = {
    submitted:{ label:t.status.submitted, color:"info" },
    reviewed: { label:t.status.reviewed,  color:"success" },
    draft:    { label:t.status.draft,      color:"default" },
  }

  return (
    <Box sx={{ minHeight:"100vh", bgcolor:"background.default" }}>
      <AppBar position="sticky" color="primary" elevation={1}>
        <Toolbar>
          <FlightIcon sx={{ mr:1 }} aria-hidden="true"/>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow:0, mr:1 }}>{t.app.name}</Typography>
          <Chip label={t.nav.instructor} size="small" sx={{ bgcolor:"rgba(255,255,255,0.2)", color:"white", mr:"auto" }}/>
          {pending>0 && (
            <Chip label={`${pending} ${t.instr.pending}`} color="error" size="small" sx={{ mr:2 }}/>
          )}
          <ToggleButtonGroup size="small" exclusive value={lang}
            onChange={(_,v)=>v&&setLang(v as Lang)} aria-label="Language"
            sx={{ "& .MuiToggleButton-root":{color:"rgba(255,255,255,0.8)",borderColor:"rgba(255,255,255,0.3)"},
              "& .Mui-selected":{bgcolor:"rgba(255,255,255,0.2)!important",color:"white!important"},mr:2 }}>
            <ToggleButton value="el">ΕΛ</ToggleButton>
            <ToggleButton value="en">EN</ToggleButton>
          </ToggleButtonGroup>
          {profile && <Typography variant="body2" sx={{ mr:2, opacity:0.9 }}>{profile.full_name}</Typography>}
          <Button color="inherit" variant="outlined" size="small" onClick={logout}
            sx={{ borderColor:"rgba(255,255,255,0.5)" }}>{t.nav.logout}</Button>
        </Toolbar>
      </AppBar>

      {/* Stats bar */}
      <Box sx={{ bgcolor:"background.paper", borderBottom:1, borderColor:"divider" }}>
        <Box sx={{ display:"flex", gap:0, overflowX:"auto" }}>
          {[
            { v:submissions.length, l:t.instr.totalFlights, c:"primary.main" },
            { v:pending,            l:t.instr.pending,       c:"warning.main" },
            { v:reviewed,           l:t.instr.reviewed,      c:"success.main" },
            { v:issues,             l:t.instr.wbIssues,      c:"error.main" },
            { v:students.length,    l:t.instr.students,      c:"secondary.main" },
            { v:avgCG>0?avgCG.toFixed(3):"—", l:t.instr.avgCg, c:"info.main" },
          ].map((s,i)=>(
            <Box key={i} sx={{ px:3, py:1.5, borderRight:1, borderColor:"divider", flexShrink:0 }}>
              <Typography variant="h5" fontWeight={700} color={s.c} className="data-mono">{s.v}</Typography>
              <Typography variant="caption" color="text.secondary">{s.l}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Main tabs */}
      <Box sx={{ bgcolor:"background.paper", borderBottom:1, borderColor:"divider" }}>
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} aria-label="Instructor sections" sx={{ px:2 }}>
          <Tab label={<Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
            📋 {t.instr.submissions}
            {pending>0 && <Chip label={pending} color="error" size="small"/>}
          </Box>} id="tab-0" aria-controls="panel-0"/>
          <Tab label={`👥 ${t.instr.students} (${students.length})`} id="tab-1" aria-controls="panel-1"/>
          <Tab label={`📊 ${t.instr.analytics}`} id="tab-2" aria-controls="panel-2"/>
        </Tabs>
      </Box>

      <Box component="main" id="main-content" sx={{ p:{xs:2,sm:3} }}>

        {/* ── SUBMISSIONS ────────────────────────────────── */}
        <Box role="tabpanel" id="panel-0" aria-labelledby="tab-0" hidden={tab!==0}>
          {tab===0 && (
            <>
              {/* Filters */}
              <Box sx={{ display:"flex", gap:1.5, mb:2, flexWrap:"wrap", alignItems:"center" }}>
                <FilterListIcon color="action" aria-hidden="true"/>
                <TextField label={t.instr.allStudents} select value={filterStudent} size="small" sx={{ minWidth:200 }}
                  onChange={e=>setFilter(e.target.value)}>
                  <MenuItem value="">{t.instr.allStudents}</MenuItem>
                  {students.map(s=><MenuItem key={s.id} value={s.id}>{s.full_name}</MenuItem>)}
                </TextField>
                <TextField label={t.instr.allStatuses} select value={filterStatus} size="small" sx={{ minWidth:180 }}
                  onChange={e=>setFStatus(e.target.value)}>
                  <MenuItem value="">{t.instr.allStatuses}</MenuItem>
                  <MenuItem value="submitted">{t.instr.awaitingStatus}</MenuItem>
                  <MenuItem value="reviewed">{t.instr.reviewedStatus}</MenuItem>
                  <MenuItem value="draft">{t.status.draft}</MenuItem>
                </TextField>
                <Typography variant="body2" color="text.secondary">
                  {filtered.length} / {submissions.length}
                </Typography>
                {(filterStudent||filterStatus) && (
                  <Button size="small" variant="outlined" onClick={()=>{setFilter("");setFStatus("")}}>
                    {t.actions.clear}
                  </Button>
                )}
              </Box>

              {loading ? (
                <Box sx={{ py:8, textAlign:"center" }}><CircularProgress aria-label="Loading"/></Box>
              ) : filtered.length===0 ? (
                <Alert severity="info">{t.instr.noSubmissions}</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table aria-label="Student submissions" size="small">
                    <TableHead>
                      <TableRow>
                        {[t.table.date,t.table.student,t.table.type,t.table.ac,
                          t.table.mass,t.table.cg,t.table.wb,t.table.toRoll,
                          t.table.status,t.table.notes,t.table.actions].map(h=>(
                          <TableCell key={h}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.map(sub=>{
                        const sc = statusCfg[sub.status]||statusCfg.draft
                        return (
                          <TableRow key={sub.id}
                            sx={{ cursor:"pointer", bgcolor:sub.status==="submitted"?"warning.50":undefined }}
                            onClick={()=>setSelected(sub)}>
                            <TableCell className="data-mono" sx={{ fontSize:"0.8rem" }}>
                              {new Date(sub.created_at).toLocaleDateString(lang==="el"?"el-GR":"en-GB")}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>{sub.student?.full_name||"—"}</Typography>
                              <Typography variant="caption" color="text.secondary">{sub.student?.license_num}</Typography>
                            </TableCell>
                            <TableCell>{sub.flight_type||"—"}</TableCell>
                            <TableCell className="data-mono" sx={{ fontSize:"0.8rem" }}>{sub.aircraft_reg||"—"}</TableCell>
                            <TableCell className="data-mono">{sub.total_mass_r7?.toFixed(1)||"—"} kg</TableCell>
                            <TableCell className="data-mono">{sub.cg_r7?.toFixed(3)||"—"} m</TableCell>
                            <TableCell><WBChip status={sub.wb_status}/></TableCell>
                            <TableCell className="data-mono">{sub.to_roll_m||"—"} m</TableCell>
                            <TableCell>
                              <Chip label={sc.label} color={sc.color} size="small" variant="outlined"/>
                            </TableCell>
                            <TableCell sx={{ maxWidth:150, fontSize:"0.8rem",
                              color:sub.instructor_notes?"primary.main":"text.disabled",overflow:"hidden",
                              textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                              {sub.instructor_notes?.slice(0,40)||"—"}
                            </TableCell>
                            <TableCell onClick={e=>{e.stopPropagation();setSelected(sub)}}>
                              <Button size="small" variant="outlined">✏ {t.instr.evaluate}</Button>
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

        {/* ── STUDENTS ──────────────────────────────────── */}
        <Box role="tabpanel" id="panel-1" aria-labelledby="tab-1" hidden={tab!==1}>
          {tab===1 && (
            <Grid container spacing={2}>
              {studentStats.length===0 ? (
                <Grid size={12}><Alert severity="info">{t.instr.noStudents}</Alert></Grid>
              ) : studentStats.map(st=>(
                <Grid key={st.id} size={{ xs:12, sm:6, md:4 }}>
                  <Card variant="outlined">
                    <CardActionArea onClick={()=>{ setFilter(st.id); setTab(0) }}
                      aria-label={`View ${st.full_name}'s submissions`}>
                      <CardContent>
                        <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:1.5 }}>
                          <Badge badgeContent={st.pending>0?st.pending:0} color="error">
                            <Avatar sx={{ bgcolor:"primary.main", width:44, height:44 }}>
                              {st.full_name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
                            </Avatar>
                          </Badge>
                          <Box sx={{ flex:1 }}>
                            <Typography variant="subtitle1" fontWeight={700}>{st.full_name}</Typography>
                            <Typography variant="caption" color="text.secondary">{st.email}</Typography>
                            {st.license_num && <Typography variant="caption" color="text.secondary" display="block" className="data-mono">SPL: {st.license_num}</Typography>}
                          </Box>
                        </Box>
                        <Grid container spacing={1}>
                          {[
                            { l:t.table.flights, v:st.total },
                            { l:"W&B OK",         v:st.ok },
                            { l:t.table.passRate, v:st.pct!=null?`${st.pct}%`:"—" },
                          ].map(x=>(
                            <Grid key={x.l} size={4}>
                              <Paper variant="outlined" sx={{ p:1, textAlign:"center" }}>
                                <Typography variant="h6" fontWeight={700} color="primary.main" className="data-mono">{x.v}</Typography>
                                <Typography variant="caption" color="text.secondary">{x.l}</Typography>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                        {st.pct!==null && (
                          <Box sx={{ mt:1.5 }}>
                            <LinearProgress variant="determinate" value={st.pct}
                              color={st.pct>=80?"success":st.pct>=60?"warning":"error"}
                              sx={{ height:6, borderRadius:3 }}
                              aria-label={`Pass rate: ${st.pct}%`}/>
                          </Box>
                        )}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* ── ANALYTICS ─────────────────────────────────── */}
        <Box role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden={tab!==2}>
          {tab===2 && (
            <Grid container spacing={2}>
              {/* CG Distribution */}
              <Grid size={{ xs:12, md:6 }}>
                <Paper variant="outlined" sx={{ p:2 }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>{t.instr.cgDist}</Typography>
                  {(() => {
                    const cgs = submissions.filter(s=>s.cg_r7).map(s=>s.cg_r7!)
                    if (!cgs.length) return <Alert severity="info">{t.misc.noData}</Alert>
                    const bins=[2.40,2.43,2.46,2.49,2.52,2.55,2.58,2.61]
                    const cts=bins.slice(0,-1).map((b,i)=>cgs.filter(c=>c>=b&&c<bins[i+1]).length)
                    const mx=Math.max(...cts,1)
                    return (
                      <Box role="img" aria-label="CG Distribution bar chart" sx={{ display:"flex",alignItems:"flex-end",gap:0.5,height:120,mt:1 }}>
                        {cts.map((c,i)=>(
                          <Box key={i} sx={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",height:"100%" }}>
                            <Typography variant="caption" sx={{ fontSize:"0.65rem", color:"text.secondary" }}>{c||""}</Typography>
                            <Tooltip title={`${bins[i].toFixed(2)}–${bins[i+1].toFixed(2)} m: ${c} flights`}>
                              <Box sx={{ width:"100%", bgcolor:c>0?"primary.main":"grey.200",
                                borderRadius:"2px 2px 0 0", height:`${(c/mx)*100}%`, minHeight:c>0?3:0,
                                transition:"height .3s", cursor:"default" }}
                                role="presentation"/>
                            </Tooltip>
                            <Typography variant="caption" sx={{ fontSize:"0.6rem",transform:"rotate(-45deg)",
                              transformOrigin:"top center", mt:0.5, color:"text.secondary", whiteSpace:"nowrap" }}>
                              {bins[i].toFixed(2)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )
                  })()}
                </Paper>
              </Grid>

              {/* Common Issues */}
              <Grid size={{ xs:12, md:6 }}>
                <Paper variant="outlined" sx={{ p:2 }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>{t.instr.commonIssues}</Typography>
                  {[
                    { l:"W&B out of limits", v:submissions.filter(s=>s.wb_status==="out_of_limits").length, c:"error" as const },
                    { l:"W&B check range",   v:submissions.filter(s=>s.wb_status==="check_range").length,   c:"warning" as const },
                    { l:"T/O Roll > 500m",   v:submissions.filter(s=>s.to_roll_m&&s.to_roll_m>500).length,  c:"info" as const },
                  ].map(x=>{
                    const pct=submissions.length>0?Math.round(x.v/submissions.length*100):0
                    return (
                      <Box key={x.l} sx={{ mb:2 }}>
                        <Box sx={{ display:"flex",justifyContent:"space-between",mb:0.5 }}>
                          <Typography variant="body2">{x.l}</Typography>
                          <Typography variant="body2" fontWeight={700} color={`${x.c}.main`} className="data-mono">
                            {x.v} ({pct}%)
                          </Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={pct} color={x.c}
                          sx={{ height:6, borderRadius:3 }}
                          aria-label={`${x.l}: ${pct}%`}/>
                      </Box>
                    )
                  })}
                  <Divider sx={{ my:1 }}/>
                  <Typography variant="body2" color="text.secondary">
                    Total: <strong>{submissions.length}</strong> · W&B Pass:{" "}
                    <strong style={{ color:"#2E7D32" }}>
                      {submissions.length>0?Math.round(submissions.filter(s=>s.wb_status==="ok").length/submissions.length*100):0}%
                    </strong>
                  </Typography>
                </Paper>
              </Grid>

              {/* Student Ranking */}
              <Grid size={12}>
                <Paper variant="outlined" sx={{ p:2 }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>{t.instr.ranking}</Typography>
                  <TableContainer>
                    <Table size="small" aria-label="Student ranking">
                      <TableHead>
                        <TableRow>
                          {[t.table.student,t.table.flights,"W&B OK",t.table.passRate,t.instr.pending,t.table.lastSub].map(h=>(
                            <TableCell key={h}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {studentStats.filter(s=>s.total>0).map((st,i)=>{
                          const last=submissions.find(s=>s.user_id===st.id)
                          return (
                            <TableRow key={st.id}>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>{st.full_name}</Typography>
                                <Typography variant="caption" color="text.secondary" className="data-mono">{st.license_num||st.email}</Typography>
                              </TableCell>
                              <TableCell className="data-mono">{st.total}</TableCell>
                              <TableCell className="data-mono">{st.ok}</TableCell>
                              <TableCell>
                                <Box sx={{ display:"flex",alignItems:"center",gap:1 }}>
                                  <Typography fontWeight={700} className="data-mono"
                                    color={st.pct==null?"text.disabled":st.pct>=80?"success.main":st.pct>=60?"warning.main":"error.main"}>
                                    {st.pct!=null?`${st.pct}%`:"—"}
                                  </Typography>
                                  {st.pct!=null && (
                                    <LinearProgress variant="determinate" value={st.pct} sx={{ flex:1,height:4,borderRadius:2 }}
                                      color={st.pct>=80?"success":st.pct>=60?"warning":"error"}
                                      aria-label={`Pass rate ${st.pct}%`}/>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                {st.pending>0
                                  ? <Chip label={st.pending} color="warning" size="small"/>
                                  : <Typography variant="body2" color="text.disabled">—</Typography>}
                              </TableCell>
                              <TableCell className="data-mono" sx={{ fontSize:"0.8rem", color:"text.secondary" }}>
                                {last?new Date(last.created_at).toLocaleDateString(lang==="el"?"el-GR":"en-GB"):"—"}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>

      {/* Review Dialog */}
      {selected && (
        <ReviewDialog sub={selected} onClose={()=>setSelected(null)} onSave={handleReview}/>
      )}
    </Box>
  )
}
