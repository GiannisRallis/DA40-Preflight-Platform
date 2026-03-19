import type { CSSProperties } from "react"
const s: Record<string, CSSProperties> = {
  page:  { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f0f4ff", padding:16 },
  card:  { background:"#fff", borderRadius:12, padding:"40px 36px", width:"100%", maxWidth:420, boxShadow:"0 4px 24px rgba(0,0,0,0.08)" },
  logo:  { fontSize:13, fontWeight:700, color:"#1a56db", marginBottom:20, letterSpacing:1 },
  title: { fontSize:24, fontWeight:700, marginBottom:24, color:"#111" },
  form:  { display:"flex", flexDirection:"column", gap:6 },
  label: { fontSize:11, fontWeight:700, color:"#666", marginTop:12, textTransform:"uppercase", letterSpacing:0.8 },
  input: { padding:"10px 12px", borderRadius:6, border:"1.5px solid #e0e0e0", fontSize:15, outline:"none", transition:"border-color .15s" },
  error: { background:"#fff0f0", border:"1px solid #fcc", borderRadius:6, padding:"10px 12px", color:"#c62828", fontSize:13, marginTop:6 },
  btn:   { marginTop:20, padding:13, background:"#1a56db", color:"#fff", border:"none", borderRadius:7, fontSize:15, fontWeight:700, cursor:"pointer" },
  foot:  { textAlign:"center", marginTop:22, fontSize:14, color:"#666" },
  link:  { color:"#1a56db", fontWeight:600 },
}
export default s
