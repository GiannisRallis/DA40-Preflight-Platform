"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useLang } from "@/lib/i18n"
import type { Lang } from "@/lib/i18n"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import Paper from "@mui/material/Paper"
import Alert from "@mui/material/Alert"
import CircularProgress from "@mui/material/CircularProgress"
import MenuItem from "@mui/material/MenuItem"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import FlightIcon from "@mui/icons-material/Flight"

export default function RegisterPage() {
  const [form, setForm]       = useState({ full_name:"",email:"",password:"",role:"student",school_name:"",license_num:"" })
  const [error, setError]     = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { t, lang, setLang }  = useLang()
  const sb = createClient()
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) { setError(t.auth.minPwd); return }
    setLoading(true); setError("")
    const { error: err } = await sb.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name:form.full_name, role:form.role, school_name:form.school_name, license_num:form.license_num } }
    })
    if (err) { setError(err.message); setLoading(false); return }
    setSuccess(true)
  }

  if (success) return (
    <Box sx={{ minHeight:"100vh", bgcolor:"background.default", display:"flex",
      alignItems:"center", justifyContent:"center", p:2 }}>
      <Paper variant="outlined" sx={{ p:4, maxWidth:440, width:"100%", borderRadius:3, textAlign:"center" }}>
        <CheckCircleIcon sx={{ fontSize:56, color:"success.main", mb:2 }} aria-hidden="true"/>
        <Typography variant="h5" fontWeight={700} gutterBottom>{t.auth.confirmEmail}</Typography>
        <Typography color="text.secondary" sx={{ mb:3 }}>
          {t.auth.confirmBody} <strong>{form.email}</strong>
        </Typography>
        <Button variant="contained" href="/auth/login" fullWidth size="large">
          {t.auth.goLogin}
        </Button>
      </Paper>
    </Box>
  )

  return (
    <Box sx={{ minHeight:"100vh", bgcolor:"background.default", display:"flex",
      alignItems:"center", justifyContent:"center", p:2 }}>

      <Paper variant="outlined" sx={{ p:{xs:3,sm:4}, width:"100%", maxWidth:460, borderRadius:3 }}>
        <Box sx={{ display:"flex", justifyContent:"flex-end", mb:2 }}>
          <ToggleButtonGroup size="small" exclusive value={lang}
            onChange={(_, v) => v && setLang(v as Lang)} aria-label="Language">
            <ToggleButton value="el" aria-label="Ελληνικά">ΕΛ</ToggleButton>
            <ToggleButton value="en" aria-label="English">EN</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:3 }}>
          <Box sx={{ bgcolor:"primary.main", borderRadius:2, p:1, display:"flex" }}>
            <FlightIcon sx={{ color:"white", fontSize:28 }} aria-hidden="true"/>
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight:1.2 }}>{t.app.name}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing:"0.12em" }}>{t.app.tagline}</Typography>
          </Box>
        </Box>

        <Typography variant="h5" component="h1" fontWeight={700} gutterBottom>{t.auth.register}</Typography>

        {error && <Alert severity="error" sx={{ mb:2 }} role="alert">{error}</Alert>}

        <Box component="form" id="register-form" onSubmit={onSubmit} noValidate
          sx={{ display:"flex", flexDirection:"column", gap:2 }}>
          <TextField label={t.auth.name} value={form.full_name}
            onChange={e=>set("full_name",e.target.value)} required fullWidth
            placeholder={t.auth.ph_name} autoFocus/>
          <TextField label={t.auth.email} type="email" value={form.email}
            onChange={e=>set("email",e.target.value)} required fullWidth
            placeholder={t.auth.ph_email} autoComplete="email"/>
          <TextField label={`${t.auth.password} (min 8)`} type="password" value={form.password}
            onChange={e=>set("password",e.target.value)} required fullWidth
            inputProps={{ minLength:8 }} autoComplete="new-password"/>
          <TextField label={t.auth.role} select value={form.role}
            onChange={e=>set("role",e.target.value)} fullWidth>
            <MenuItem value="student">{t.auth.studentRole}</MenuItem>
            <MenuItem value="instructor">{t.auth.instructorRole}</MenuItem>
          </TextField>
          <TextField label={t.auth.school} value={form.school_name}
            onChange={e=>set("school_name",e.target.value)} fullWidth
            placeholder={t.auth.ph_school}/>
          {form.role === "student" && (
            <TextField label={t.auth.license} value={form.license_num}
              onChange={e=>set("license_num",e.target.value)} fullWidth
              placeholder={t.auth.ph_spl}/>
          )}
          <Button type="submit" variant="contained" size="large" fullWidth
            disabled={loading} sx={{ mt:1, py:1.5 }}
            startIcon={loading ? <CircularProgress size={18} color="inherit"/> : undefined}>
            {loading ? t.auth.registering : t.auth.registerBtn}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt:3, textAlign:"center" }}>
          {t.auth.haveAccount}{" "}
          <Box component="a" href="/auth/login" sx={{ color:"primary.main", fontWeight:600 }}>
            {t.auth.login}
          </Box>
        </Typography>
      </Paper>
    </Box>
  )
}
