import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

async function resolveUserRole(
  supabase: ReturnType<typeof createServerClient>,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null }
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role) {
    return profile.role
  }

  const fallbackRole = user.user_metadata?.role === "instructor" ? "instructor" : "student"
  const fallbackName = typeof user.user_metadata?.full_name === "string"
    ? user.user_metadata.full_name
    : (user.email?.split("@")[0] ?? "pilot")

  const { data: created } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? `${user.id}@local.invalid`,
        full_name: fallbackName,
        role: fallbackRole,
      },
      { onConflict: "id" }
    )
    .select("role")
    .maybeSingle()

  return created?.role ?? "student"
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(list: { name: string; value: string; options: CookieOptions }[]) {
          list.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Not logged in: allow dashboard routes to resolve auth on client side
  // to avoid redirect loops when cookies are not yet visible to middleware.
  if (!user && !path.startsWith("/auth") && !path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  if (user) {
    // Already logged in → redirect away from auth pages
    if (path.startsWith("/auth")) {
      const role = await resolveUserRole(supabase, user)
      const dest = role === "instructor"
        ? "/dashboard/instructor"
        : "/dashboard/student"
      return NextResponse.redirect(new URL(dest, request.url))
    }
    // Student trying to access instructor dashboard
    if (path.startsWith("/dashboard/instructor")) {
      const role = await resolveUserRole(supabase, user)
      if (role !== "instructor") {
        return NextResponse.redirect(new URL("/dashboard/student", request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
