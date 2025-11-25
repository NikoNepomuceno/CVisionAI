"use client"

import { useState, useEffect } from "react"
import { X, Moon, Sun, Monitor } from "lucide-react"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type ThemeMode = "system" | "light" | "dark"

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [theme, setTheme] = useState<ThemeMode>("system")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load saved theme preference
    const saved = localStorage.getItem("theme-preference") as ThemeMode | null
    if (saved) {
      setTheme(saved)
      applyTheme(saved)
    } else {
      // Check system preference if no saved preference
      const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme("system")
      applyTheme("system")
    }
  }, [])

  const applyTheme = (mode: ThemeMode) => {
    const html = document.documentElement
    
    // Remove existing theme classes
    html.classList.remove("light", "dark")
    
    if (mode === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      html.classList.add(isDark ? "dark" : "light")
    } else {
      html.classList.add(mode)
    }
    
    // Update data-theme attribute for better CSS targeting
    html.setAttribute("data-theme", mode === "system" 
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : mode
    )
  }

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme)
    localStorage.setItem("theme-preference", newTheme)
    applyTheme(newTheme)
  }

  // Listen for system theme changes
  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = () => applyTheme("system")
      
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme])

  if (!mounted || !isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Settings</h2>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-muted rounded-lg transition-colors duration-200"
              aria-label="Close settings"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Theme Section */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">Appearance</label>
              <div className="space-y-2">
                {/* System Theme */}
                <button
                  onClick={() => handleThemeChange("system")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                    theme === "system"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-primary/50 bg-muted/50 text-foreground"
                  }`}
                  aria-pressed={theme === "system"}
                >
                  <Monitor className="w-5 h-5 text-primary" />
                  <div className="text-left flex-1">
                    <p className="font-medium">Use System</p>
                    <p className="text-xs text-muted-foreground">Follow device settings</p>
                  </div>
                  {theme === "system" && (
                    <div className="w-2 h-2 bg-primary rounded-full" aria-hidden="true" />
                  )}
                </button>

                {/* Light Theme */}
                <button
                  onClick={() => handleThemeChange("light")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                    theme === "light"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-primary/50 bg-muted/50 text-foreground"
                  }`}
                  aria-pressed={theme === "light"}
                >
                  <Sun className="w-5 h-5 text-secondary" />
                  <div className="text-left flex-1">
                    <p className="font-medium">Light Mode</p>
                    <p className="text-xs text-muted-foreground">Always use light theme</p>
                  </div>
                  {theme === "light" && (
                    <div className="w-2 h-2 bg-primary rounded-full" aria-hidden="true" />
                  )}
                </button>

                {/* Dark Theme */}
                <button
                  onClick={() => handleThemeChange("dark")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                    theme === "dark"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-primary/50 bg-muted/50 text-foreground"
                  }`}
                  aria-pressed={theme === "dark"}
                >
                  <Moon className="w-5 h-5 text-accent" />
                  <div className="text-left flex-1">
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">Always use dark theme</p>
                  </div>
                  {theme === "dark" && (
                    <div className="w-2 h-2 bg-primary rounded-full" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-border">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  )
}