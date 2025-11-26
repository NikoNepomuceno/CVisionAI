"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Upload, CheckCircle2, Zap, BarChart3, Briefcase, ChevronRight, Moon, Sun } from "lucide-react"
import UploadPage from "@/components/pages/upload-page"
import ExtractionPage from "@/components/pages/extraction-page"
import AnalysisPage from "@/components/pages/analysis-page"
import FeedbackPage from "@/components/pages/feedback-page"
import KeywordPage from "@/components/pages/keyword-page"
import ResultsPage from "@/components/pages/results-page"
import RecommendationsPage from "@/components/pages/recommendations-page"
import SettingsModal from "@/components/settings-modal"
import LandingPage from "@/components/pages/landing-page"
import type { ResumeAnalysis, KeywordAnalysis } from "@/lib/deepseek"

type PageStep = "upload" | "extraction" | "analysis" | "feedback" | "keywords" | "results" | "recommendations"

type ExperienceItem = { company: string; role: string; duration?: string; description?: string }
type EducationItem = { school: string; degree: string; year?: string }

type ResumeSnapshot = {
  skills: string[]
  experience: ExperienceItem[]
  education: EducationItem[]
  summary: string
}

interface ResumeData extends ResumeSnapshot {
  file?: File
  analysis?: ResumeAnalysis
  keywordAnalysis?: KeywordAnalysis
  keywordJobDescription?: string
  lastAnalyzed?: ResumeSnapshot
  lastAnalyzedKey?: string
}

type ThemeMode = "light" | "dark" | "system"

function mergeResumeData(prev: ResumeData, data: Partial<ResumeData>): ResumeData {
  if (!data || Object.keys(data).length === 0) {
    return prev
  }

  const next: ResumeData = { ...prev, ...data }

  const resumeFieldsChanged = "skills" in data || "experience" in data || "education" in data || "summary" in data
  const fileChanged = "file" in data

  if ("analysis" in data) {
    if (data.analysis) {
      const { snapshot, key } = createSnapshot(getSnapshotSource(next))
      next.analysis = data.analysis
      next.lastAnalyzed = snapshot
      next.lastAnalyzedKey = key
    } else {
      next.analysis = undefined
      next.lastAnalyzed = undefined
      next.lastAnalyzedKey = undefined
    }
  } else if (resumeFieldsChanged || fileChanged) {
    next.analysis = undefined
    next.lastAnalyzed = undefined
    next.lastAnalyzedKey = undefined
  }

  if ("keywordAnalysis" in data) {
    next.keywordAnalysis = data.keywordAnalysis ?? undefined
  } else if (resumeFieldsChanged || fileChanged) {
    next.keywordAnalysis = undefined
  }

  if ("keywordJobDescription" in data) {
    next.keywordJobDescription = data.keywordJobDescription ?? ""
  } else if (resumeFieldsChanged || fileChanged) {
    next.keywordJobDescription = ""
  }

  if (fileChanged && !data.file) {
    next.file = undefined
  }

  const changed = (Object.keys(next) as Array<keyof ResumeData>).some((key) => next[key] !== prev[key])
  return changed ? next : prev
}

function createSnapshot(data: ResumeSnapshot): { snapshot: ResumeSnapshot; key: string } {
  const snapshot: ResumeSnapshot = {
    skills: [...data.skills],
    experience: data.experience.map((item) => ({ ...item })),
    education: data.education.map((item) => ({ ...item })),
    summary: data.summary,
  }
  return { snapshot, key: JSON.stringify(snapshot) }
}

function getSnapshotSource(data: ResumeSnapshot): ResumeSnapshot {
  return {
    skills: data.skills,
    experience: data.experience,
    education: data.education,
    summary: data.summary, // fixed typo: was data.sumground
  }
}

const STEPS: { id: PageStep; label: string; icon: React.ReactNode }[] = [
  { id: "upload", label: "Upload", icon: <Upload className="w-4 h-4" /> },
  { id: "extraction", label: "Extract", icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: "analysis", label: "Analyze", icon: <Zap className="w-4 h-4" /> },
  { id: "feedback", label: "Feedback", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "keywords", label: "Keywords", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "results", label: "Results", icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: "recommendations", label: "Jobs", icon: <Briefcase className="w-4 h-4" /> },
]

export default function Home() {
  const [showLanding, setShowLanding] = useState(true)
  const [currentStep, setCurrentStep] = useState<PageStep>("upload")
  const [resumeData, setResumeData] = useState<ResumeData>({
    skills: [],
    experience: [],
    education: [],
    summary: "",
    file: undefined,
    analysis: undefined,
    keywordAnalysis: undefined,
    keywordJobDescription: "",
    lastAnalyzed: undefined,
    lastAnalyzedKey: undefined,
  })
  const [furthestStepIndex, setFurthestStepIndex] = useState(0)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>("light")

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentStep])

  const applyTheme = (mode: ThemeMode) => {
    const html = document.documentElement
    if (mode === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      html.classList.toggle("dark", isDark)
    } else {
      html.classList.toggle("dark", mode === "dark")
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme-preference", newTheme)
    applyTheme(newTheme)
  }

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)
  useEffect(() => {
    setFurthestStepIndex((prev) => (currentStepIndex > prev ? currentStepIndex : prev))
  }, [currentStepIndex])
  const applyResumeUpdate = useCallback((data: Partial<ResumeData>) => {
    setResumeData((prev) => mergeResumeData(prev, data))
  }, [])

  const handleNext = (data?: Partial<ResumeData>) => {
    if (data) {
      applyResumeUpdate(data)
    }
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].id)
    }
  }

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id)
    }
  }

  const handleJumpToStep = (stepId: PageStep) => {
    const stepIndex = STEPS.findIndex((s) => s.id === stepId)
    if (stepIndex === -1) return
    if (stepIndex <= furthestStepIndex) {
      setCurrentStep(stepId)
    }
  }

  const handleReset = () => {
    setCurrentStep("upload")
    setFurthestStepIndex(0)
    setResumeData({
      skills: [],
      experience: [],
      education: [],
      summary: "",
      file: undefined,
      analysis: undefined,
      keywordAnalysis: undefined,
      keywordJobDescription: "",
      lastAnalyzed: undefined,
      lastAnalyzedKey: undefined,
    })
  }

  const handleLogoClick = () => {
    setShowLanding(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
    setCurrentStep("upload")
    setFurthestStepIndex(0)
    setResumeData({
      skills: [],
      experience: [],
      education: [],
      summary: "",
      file: undefined,
      analysis: undefined,
      keywordAnalysis: undefined,
      keywordJobDescription: "",
      lastAnalyzed: undefined,
      lastAnalyzedKey: undefined,
    })
  }

  const handleAnalysisPersist = useCallback(
    (analysis?: ResumeAnalysis) => {
      if (!analysis) {
        applyResumeUpdate({ analysis: undefined })
        return
      }

      applyResumeUpdate({ analysis })
    },
    [applyResumeUpdate],
  )

  const handleKeywordPersist = useCallback(
    (data: { keywordAnalysis?: KeywordAnalysis | null; keywordJobDescription?: string }) => {
      const next: Partial<ResumeData> = {}
      if ("keywordAnalysis" in data) {
        next.keywordAnalysis = data.keywordAnalysis ?? undefined
      }
      if (typeof data.keywordJobDescription === "string") {
        next.keywordJobDescription = data.keywordJobDescription
      }
      if (Object.keys(next).length > 0) {
        applyResumeUpdate(next)
      }
    },
    [applyResumeUpdate],
  )

  if (!mounted) return null

  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#C3E8C9]/20 via-[#4165D5]/10 to-[#293855]/20 dark:from-[#293855] dark:via-[#4165D5]/20 dark:to-[#C3E8C9]/10 transition-colors duration-300">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#C3E8C9]/20 via-[#4165D5]/10 to-[#293855]/20 dark:from-[#293855] dark:via-[#4165D5]/20 dark:to-[#C3E8C9]/10 transition-colors duration-300" />

        {/* Animated Gradient Orbs */}
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-gradient-to-r from-[#4165D5]/20 to-[#293855]/20 dark:from-[#4165D5]/10 dark:to-[#293855]/10 rounded-full blur-3xl animate-pulse transition-colors duration-300" />
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-gradient-to-r from-[#F1AC20]/20 to-[#C3E8C9]/20 dark:from-[#F1AC20]/10 dark:to-[#C3E8C9]/10 rounded-full blur-3xl animate-pulse delay-1000 transition-colors duration-300" />
      </div>

      <header className="relative bg-white/70 dark:bg-[#293855]/70 backdrop-blur-md border-b border-[#4165D5]/20 dark:border-[#4165D5]/30 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-300 cursor-pointer"
              aria-label="Return to landing page"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-[#4165D5] to-[#293855] rounded-xl flex items-center justify-center shadow-lg shadow-[#4165D5]/20 dark:shadow-[#293855]/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
                  <img src="/CVisionAI-Logo-Header.png" alt="CV Logo" className="w-8 h-8 object-contain" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#50B98E] dark:bg-[#C3E8C9] rounded-full border-2 border-white dark:border-[#293855] animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#293855] dark:text-white transition-colors duration-300">
                  CVisionAI
                </h1>
                <p className="text-xs text-[#4165D5] dark:text-[#C3E8C9] transition-colors duration-300">
                  AI-Powered Resume Analysis
                </p>
              </div>
            </button>
            <div className="flex items-center gap-4">
              <div className="text-sm text-[#50B98E] dark:text-[#C3E8C9] font-medium transition-colors duration-300">
                Step {currentStepIndex + 1} of {STEPS.length}
              </div>
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
            </div>
          </div>

          {/* Progress Bar and Steps Navigation Container */}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
            {/* Progress Bar */}
            <div className="w-full bg-[#C3E8C9]/20 dark:bg-[#293855]/50 rounded-full h-2 overflow-hidden backdrop-blur-sm">
              <div
                className="bg-gradient-to-r from-[#4165D5] via-[#293855] to-[#F1AC20] h-2 rounded-full transition-all duration-700 ease-out shadow-lg shadow-[#4165D5]/20 dark:shadow-[#293855]/30"
                style={{ width: `${((currentStepIndex + 0.5) / STEPS.length) * 100}%` }}
              />
            </div>

            {/* Steps Navigation */}
            <div className="flex items-center justify-between mt-4 overflow-x-auto pb-2 scrollbar-hide w-full">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center gap-0.5 sm:gap-1 flex-1 min-w-0">
                  <button
                    onClick={() => handleJumpToStep(step.id)}
                    disabled={index > furthestStepIndex}
                    className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 backdrop-blur-sm w-full min-w-fit ${
                      step.id === currentStep
                        ? "bg-gradient-to-r from-[#4165D5] to-[#293855] text-white shadow-lg shadow-[#4165D5]/30 scale-100"
                        : index <= furthestStepIndex
                          ? "bg-white/50 dark:bg-[#293855]/50 text-[#4165D5] dark:text-[#C3E8C9] hover:bg-white/70 dark:hover:bg-[#293855]/70 cursor-pointer border border-[#4165D5]/20 dark:border-[#4165D5]/30"
                          : "bg-[#C3E8C9]/20 dark:bg-[#293855]/30 text-[#4165D5]/50 dark:text-[#C3E8C9]/50 cursor-not-allowed border border-[#4165D5]/10 dark:border-[#4165D5]/20"
                    }`}
                  >
                    {step.icon}
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-[#50B98E]/30 dark:text-[#C3E8C9]/30 hidden sm:block flex-shrink-0 mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto animate-fade-in-up">
          {currentStep === "upload" && <UploadPage onNext={handleNext} initialFile={resumeData.file} />}
          {currentStep === "extraction" && (
            <ExtractionPage resumeData={resumeData} onNext={handleNext} onPrevious={handlePrevious} />
          )}
          {currentStep === "analysis" && (
            <AnalysisPage
              resumeData={resumeData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onAnalysisPersist={handleAnalysisPersist}
            />
          )}
          {currentStep === "feedback" && (
            <FeedbackPage resumeData={resumeData} onNext={handleNext} onPrevious={handlePrevious} />
          )}
          {currentStep === "keywords" && (
            <KeywordPage
              resumeData={resumeData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onPersist={handleKeywordPersist}
            />
          )}
          {currentStep === "results" && (
            <ResultsPage resumeData={resumeData} onNext={handleNext} onPrevious={handlePrevious} />
          )}
          {currentStep === "recommendations" && (
            <RecommendationsPage resumeData={resumeData} onPrevious={handlePrevious} onReset={handleReset} />
          )}
        </div>
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}
