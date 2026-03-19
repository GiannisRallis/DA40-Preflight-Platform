import type { Metadata } from "next"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter"
import { LangProvider } from "@/lib/i18n"
import ThemeRegistry from "@/lib/ThemeRegistry"

export const metadata: Metadata = {
  title: "DA40 Preflight Platform",
  description: "Electronic Weight & Balance and Performance Calculator for Diamond DA-40 D",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <head>
        <meta name="viewport" content="initial-scale=1, width=device-width"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        {/* Roboto for MUI + JetBrains Mono for data values */}
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
      </head>
      <body>
        <AppRouterCacheProvider>
          <ThemeRegistry>
            <LangProvider>
              {children}
            </LangProvider>
          </ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
