import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { QueryProvider } from "@/components/providers/query-provider"
import { cookies } from "next/headers"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CVisionAI",
  description: "Enhance your resume with AI-powered insights and analysis",
  icons: {
    icon: [
      {
        url: "/CVisionAI-Logo-Header.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
  },
}

function getInitialTheme() {
  // This runs only on the server
  return 'light' // Default theme, you can make this dynamic
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const initialTheme = getInitialTheme()
  const isDark = initialTheme === 'dark'

  return (
    <html 
      lang="en" 
      className={isDark ? 'dark' : ''}
      data-theme={initialTheme}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme-preference') || 'system';
                  const root = document.documentElement;
                  
                  if (theme === 'system') {
                    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    root.classList.toggle('dark', isDark);
                    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
                  } else {
                    root.classList.toggle('dark', theme === 'dark');
                    root.setAttribute('data-theme', theme);
                  }
                } catch (e) {
                  console.log('Theme initialization error:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${geist.className} antialiased`}>
        <QueryProvider>
          {children}
          <Toaster />
          <Analytics />
        </QueryProvider>
      </body>
    </html>
  )
}