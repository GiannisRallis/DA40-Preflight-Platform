"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useLang } from "@/lib/i18n"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import Paper from "@mui/material/Paper"
import Alert from "@mui/material/Alert"
import CircularProgress from "@mui/material/CircularProgress"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import FlightIcon from "@mui/icons-material/Flight"
import type { Lang } from "@/lib/i18n"

export default function LoginPage() {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)
  const { t, lang, setLang }    = useLang()
  const router = useRouter()
  const sb     = createClient()

  useEffect(() => {
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: p } = await sb.from("profiles").select("role").eq("id", user.id).maybeSingle()
      router.replace(p?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student")
    })
  }, []) // eslint-disable-line

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    const { data, error: err } = await sb.auth.signInWithPassword({ email, password })
    if (err) { setError(t.auth.loginError); setLoading(false); return }
    const { data: p } = await sb.from("profiles").select("role").eq("id", data.user.id).maybeSingle()
    router.push(p?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student")
    router.refresh()
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper
        variant="outlined"
        sx={{ p: { xs: 3, sm: 4 }, width: "100%", maxWidth: 400, borderRadius: 3 }}
      >
        {/* Language switcher */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={lang}
            onChange={(_, v) => v && setLang(v as Lang)}
            aria-label="Language"
          >
            <ToggleButton value="el" aria-label="Ελληνικά">ΕΛ</ToggleButton>
            <ToggleButton value="en" aria-label="English">EN</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Box sx={{ bgcolor: "primary.main", borderRadius: 2, p: 1, display: "flex" }}>
            <FlightIcon sx={{ color: "white", fontSize: 28 }} aria-hidden="true"/>
          </Box>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {t.app.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.12em" }}>
              {t.app.tagline}
            </Typography>
          </Box>
        </Box>

        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          {t.auth.login}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} role="alert">
            {error}
          </Alert>
        )}

        <Box
          component="form"
          id="login-form"
          onSubmit={onSubmit}
          noValidate
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label={t.auth.email}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            fullWidth
            autoComplete="email"
            autoFocus
            placeholder={t.auth.ph_email}
            inputProps={{ "aria-required": true }}
          />
          <TextField
            label={t.auth.password}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
            inputProps={{ "aria-required": true }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
            sx={{ mt: 1, py: 1.5 }}
            startIcon={loading ? <CircularProgress size={18} color="inherit"/> : undefined}
          >
            {loading ? t.auth.loggingIn : t.auth.loginBtn}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>
          {t.auth.noAccount}{" "}
          <Box component="a" href="/auth/register" sx={{ color: "primary.main", fontWeight: 600 }}>
            {t.auth.register}
          </Box>
        </Typography>
      </Paper>
    </Box>
  )
}
