"use client"

import { useState, useEffect } from "react"
import {
  ArrowRight,
  Zap,
  BarChart3,
  Brain,
  Star,
  Shield,
  Users,
  Sparkles,
  Target,
  FileText,
  Settings,
  Moon,
  Sun,
} from "lucide-react"

interface LandingPageProps {
  onGetStarted: () => void
}

type ThemeMode = "light" | "dark" | "system"

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [theme, setTheme] = useState<ThemeMode>("light")
  const [mounted, setMounted] = useState(false)

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Deep learning algorithms scan every section of your resume for optimization opportunities",
      color: "from-[#4165D5] to-[#293855]",
      bgColor: "bg-[#4165D5]/10",
    },
    {
      icon: Zap,
      title: "Instant Optimization",
      description: "Real-time suggestions to improve impact and readability in seconds",
      color: "from-[#F1AC20] to-[#e09a1c]",
      bgColor: "bg-[#F1AC20]/10",
    },
    {
      icon: BarChart3,
      title: "ATS Compatibility",
      description: "Ensure your resume passes through applicant tracking systems successfully",
      color: "from-[#50B98E] dark:from-[#C3E8C9] to-[#a8d8b1]",
      bgColor: "bg-[#50B98E]/10 dark:bg-[#C3E8C9]/10",
    },
    {
      icon: Target,
      title: "Job Matching",
      description: "Tailor your resume specifically for your target role and industry",
      color: "from-[#293855] to-[#4165D5]",
      bgColor: "bg-[#293855]/10",
    },
  ]

  useEffect(() => {
    setMounted(true)
    // Load saved theme preference
    const saved = localStorage.getItem("theme-preference") as ThemeMode | null
    if (saved) {
      setTheme(saved)
      applyTheme(saved)
    } else {
      // Check system preference
      const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(systemIsDark ? "dark" : "light")
      applyTheme(systemIsDark ? "dark" : "light")
    }
  }, [])

  const applyTheme = (mode: ThemeMode) => {
    const html = document.documentElement
    if (mode === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      html.classList.toggle("dark", isDark)
    } else {
      html.classList.toggle("dark", mode === "dark")
    }
  }

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme)
    localStorage.setItem("theme-preference", newTheme)
    applyTheme(newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    handleThemeChange(newTheme)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#C3E8C9]/20 via-[#4165D5]/10 to-[#293855]/20 dark:from-[#293855] dark:via-[#4165D5]/20 dark:to-[#C3E8C9]/10 flex flex-col transition-colors duration-300">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0">
        {/* Main Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#C3E8C9]/20 via-[#4165D5]/10 to-[#293855]/20 dark:from-[#293855] dark:via-[#4165D5]/20 dark:to-[#C3E8C9]/10 transition-colors duration-300" />

        {/* Animated Gradient Orbs */}
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-gradient-to-r from-[#4165D5]/20 to-[#293855]/20 dark:from-[#4165D5]/10 dark:to-[#293855]/10 rounded-full blur-3xl animate-pulse transition-colors duration-300" />
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-gradient-to-r from-[#F1AC20]/20 to-[#C3E8C9]/20 dark:from-[#F1AC20]/10 dark:to-[#C3E8C9]/10 rounded-full blur-3xl animate-pulse delay-1000 transition-colors duration-300" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(65,101,213,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(65,101,213,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(65,101,213,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(65,101,213,0.05)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] transition-colors duration-300" />
      </div>

      {/* Header */}
      <header className="relative bg-white/70 dark:bg-[#293855]/70 backdrop-blur-md border-b border-[#4165D5]/20 dark:border-[#4165D5]/30 sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-[#4165D5] to-[#293855] rounded-xl flex items-center justify-center shadow-lg shadow-[#4165D5]/20 dark:shadow-[#293855]/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
                  <img src="/CVisionAI-Logo-Header.png" alt="CV Logo" className="w-8 h-8 object-contain" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#50B98E] dark:bg-[#C3E8C9] rounded-full border-2 border-white dark:border-[#293855] animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#293855] dark:text-white transition-colors duration-300">
                  CVisionAI
                </h1>
                <p className="text-xs text-[#4165D5] dark:text-[#C3E8C9] transition-colors duration-300">
                  AI-Powered Resume Analysis
                </p>
              </div>
            </div>

            {/* Right side - Theme Toggle and Trust Indicators */}
            <div className="flex items-center gap-6">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-[#C3E8C9]/20 dark:bg-[#293855] border border-[#4165D5]/20 dark:border-[#4165D5]/30 hover:bg-[#C3E8C9]/30 dark:hover:bg-[#293855]/80 transition-all duration-300 group"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-[#F1AC20] group-hover:scale-110 transition-transform duration-300" />
                ) : (
                  <Moon className="w-5 h-5 text-[#4165D5] group-hover:scale-110 transition-transform duration-300" />
                )}
              </button>

              {/* Trust Indicators */}
              <div className="hidden lg:flex items-center gap-6">
                <div className="flex items-center gap-2 text-[#293855] dark:text-foreground transition-colors duration-300">
                  <Shield className="w-4 h-4 text-[#50B98E] dark:text-[#C3E8C9]" />
                  <span className="text-sm font-medium">Secure & Private</span>
                </div>
                <div className="flex items-center gap-2 text-[#293855] dark:text-foreground transition-colors duration-300">
                  <Users className="w-4 h-4 text-[#4165D5]" />
                  <span className="text-sm font-medium">15K+ Professionals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full py-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Hero Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#4165D5]/10 dark:bg-[#4165D5]/20 border border-[#4165D5]/20 dark:border-[#4165D5]/30 backdrop-blur-sm transition-colors duration-300">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-3 h-3 fill-[#50B98E] dark:fill-[#C3E8C9] text-[#50B98E] dark:text-[#C3E8C9]"
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-[#293855] dark:text-white transition-colors duration-300">
                  Rated 4.9/5 by Career Experts
                </span>
                <Sparkles className="w-3 h-3 text-[#50B98E] dark:text-[#C3E8C9]" />
              </div>

              {/* Main Heading */}
              <div className="space-y-6">
                <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-[#293855] dark:text-white leading-tight transition-colors duration-300">
                  Transform Your{" "}
                  <span className="bg-gradient-to-r from-[#4165D5] via-[#293855] to-[#F1AC20] bg-clip-text text-transparent">
                    Resume
                  </span>{" "}
                  with AI
                </h2>
                <p className="text-lg text-[#293855] dark:text-slate-300 leading-relaxed transition-colors duration-300">
                  Go beyond basic formatting. Our AI analyzes content, suggests improvements, and optimizes your resume
                  for both humans and ATS systems.
                </p>
              </div>

              {/* Macridging Tickets Section - Fixed Layout */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/50 dark:bg-[#4165D5]/20 border border-[#4165D5]/20 dark:border-[#4165D5]/30 backdrop-blur-sm transition-colors duration-300">
                  <div className="w-10 h-10 bg-[#50B98E] dark:bg-[#C3E8C9]/20 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                    <FileText className="w-5 h-5 text-[#293855] dark:text-white transition-colors duration-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[#293855] dark:text-white text-sm mb-1 transition-colors duration-300">
                      Add Macridging Tickets
                    </h3>
                    <p className="text-xs text-[#293855] dark:text-slate-300 leading-relaxed transition-colors duration-300">
                      Flat bicycle register periodically targets forty pages with industry scanning
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/50 dark:bg-[#4165D5]/20 border border-[#4165D5]/20 dark:border-[#4165D5]/30 backdrop-blur-sm transition-colors duration-300">
                  <div className="w-10 h-10 bg-[#4165D5]/10 dark:bg-[#4165D5]/30 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                    <Settings className="w-5 h-5 text-[#4165D5] dark:text-[#4165D5]/90 transition-colors duration-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[#293855] dark:text-white text-sm mb-1 transition-colors duration-300">
                      Automated Subtraction
                    </h3>
                    <p className="text-xs text-[#293855] dark:text-slate-300 leading-relaxed transition-colors duration-300">
                      Subtract infinite opportunities and optimize content for maximum impact
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onGetStarted}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  className="group px-8 py-4 bg-gradient-to-r from-[#4165D5] to-[#293855] hover:from-[#3a5bc0] hover:to-[#223044] text-white rounded-2xl font-semibold transition-all duration-300 hover:shadow-2xl hover:shadow-[#4165D5]/30 dark:hover:shadow-[#4165D5]/30 hover:scale-105 flex items-center justify-center gap-3 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span>Start Free Analysis</span>
                  <ArrowRight
                    className={`w-5 h-5 transition-transform duration-300 ${isHovering ? "translate-x-1" : ""}`}
                  />
                </button>

                <button className="group px-8 py-4 border-2 border-[#4165D5] dark:border-[#C3E8C9] text-[#4165D5] dark:text-[#C3E8C9] rounded-2xl font-semibold transition-all duration-300 hover:bg-[#4165D5]/10 dark:hover:bg-[#C3E8C9]/10 flex items-center justify-center gap-3">
                  <span>Learn More</span>
                </button>
              </div>
            </div>

            {/* Right Column - Fixed Feature Cards Stack */}
            <div className="relative">
              {/* Feature Showcase Container */}
              <div className="relative h-96 mb-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <div
                      key={index}
                      className={`absolute inset-0 p-8 rounded-3xl border backdrop-blur-sm transition-all duration-500 transform ${
                        activeFeature === index
                          ? "opacity-100 scale-100 bg-white/70 dark:bg-[#4165D5]/20 border-[#4165D5]/20 dark:border-[#4165D5]/30 z-30 shadow-xl"
                          : "opacity-0 scale-95 bg-white/50 dark:bg-[#4165D5]/20 border-[#4165D5]/20 dark:border-[#4165D5]/30 z-20"
                      }`}
                      style={{
                        transform: `scale(${activeFeature === index ? 1 : 0.95}) translateY(${activeFeature === index ? 0 : 10}px)`,
                      }}
                    >
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center shadow-lg mb-6`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-[#293855] dark:text-white mb-3 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-[#293855] dark:text-slate-300 leading-relaxed transition-colors duration-300">
                        {feature.description}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Progress Indicator */}
              <div className="flex justify-center gap-2 mb-6">
                {features.map((feature, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveFeature(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      activeFeature === index
                        ? `bg-gradient-to-r ${feature.color} w-8`
                        : "bg-[#4165D5]/30 dark:bg-[#C3E8C9]/30 hover:bg-[#4165D5]/50 dark:hover:bg-[#C3E8C9]/50"
                    }`}
                  />
                ))}
              </div>

              {/* Feature Navigation Cards */}
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <button
                      key={index}
                      onClick={() => setActiveFeature(index)}
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        activeFeature === index
                          ? `border-[#4165D5] dark:border-[#C3E8C9] bg-[#4165D5]/10 dark:bg-[#C3E8C9]/10 shadow-lg scale-105`
                          : `border-[#4165D5]/20 dark:border-[#4165D5]/30 bg-white/50 dark:bg-[#4165D5]/20 hover:bg-[#4165D5]/50 dark:hover:bg-[#4165D5]/10 hover:scale-102`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center`}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[#293855] dark:text-white font-medium text-sm text-left transition-colors duration-300">
                          {feature.title}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Gradient */}
      <div className="relative h-32 bg-gradient-to-t from-white dark:from-primary to-transparent transition-colors duration-300" />
    </div>
  )
}
