"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Upload, CheckCircle2, Zap, BarChart3, Briefcase, ChevronRight, Settings } from "lucide-react"
import UploadPage from "@/components/pages/upload-page"
import ExtractionPage from "@/components/pages/extraction-page"
import AnalysisPage from "@/components/pages/analysis-page"
import FeedbackPage from "@/components/pages/feedback-page"
import KeywordPage from "@/components/pages/keyword-page"
import ResultsPage from "@/components/pages/results-page"
import RecommendationsPage from "@/components/pages/recommendations-page"
import SettingsModal from "@/components/settings-modal"
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

function mergeResumeData(prev: ResumeData, data: Partial<ResumeData>): ResumeData {
  if (!data || Object.keys(data).length === 0) {
    return prev
  }

  const next: ResumeData = { ...prev, ...data }

  const resumeFieldsChanged =
    "skills" in data || "experience" in data || "education" in data || "summary" in data
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
    summary: data.summary,
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

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const handleAnalysisPersist = useCallback((analysis?: ResumeAnalysis) => {
    if (!analysis) {
      applyResumeUpdate({ analysis: undefined })
      return
    }

    applyResumeUpdate({ analysis })
  }, [applyResumeUpdate])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 dark:from-background dark:via-background dark:to-accent/5">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                <img
                  src="/CVisionAI-Logo-Header.png"
                  alt="CV Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CVisionAI</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Resume Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground font-medium">
                Step {currentStepIndex + 1} of {STEPS.length}
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 hover:bg-muted dark:hover:bg-muted rounded-lg transition-colors duration-200"
              >
                <Settings className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </div>
          </div>

          <div className="w-full bg-muted dark:bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary via-primary to-secondary h-2 rounded-full transition-all duration-700 ease-out shadow-lg shadow-primary/20"
              style={{ width: `${(currentStepIndex / STEPS.length) * 100}%` }}
            />
          </div>

          <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleJumpToStep(step.id)}
                disabled={index > furthestStepIndex}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    step.id === currentStep
                    ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                    : index <= furthestStepIndex
                      ? "bg-accent/30 text-primary hover:bg-accent/50 cursor-pointer dark:bg-accent/20 dark:text-accent"
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-50 dark:bg-muted"
                  }`}
                >
                  {step.icon}
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-border hidden sm:block flex-shrink-0 dark:text-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in-up">
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
