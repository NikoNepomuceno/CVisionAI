"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Upload, CheckCircle2, Zap, BarChart3, Briefcase, ChevronRight, Settings } from "lucide-react"
import UploadPage from "@/components/pages/upload-page"
import ExtractionPage from "@/components/pages/extraction-page"
import AnalysisPage from "@/components/pages/analysis-page"
import FeedbackPage from "@/components/pages/feedback-page"
import KeywordPage from "@/components/pages/keyword-page"
import ResultsPage from "@/components/pages/results-page"
import RecommendationsPage from "@/components/pages/recommendations-page"
import SettingsModal from "@/components/settings-modal"

type PageStep = "upload" | "extraction" | "analysis" | "feedback" | "keywords" | "results" | "recommendations"

interface ResumeData {
  file?: File
  skills: string[]
  experience: Array<{ company: string; role: string; duration: string }>
  education: Array<{ school: string; degree: string }>
  summary: string
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
  })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)

  const handleNext = (data?: Partial<ResumeData>) => {
    if (data) {
      setResumeData((prev) => ({ ...prev, ...data }))
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
    if (stepIndex <= currentStepIndex) {
      setCurrentStep(stepId)
    }
  }

  const handleReset = () => {
    setCurrentStep("upload")
    setResumeData({
      skills: [],
      experience: [],
      education: [],
      summary: "",
    })
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 dark:from-background dark:via-background dark:to-accent/5">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-white font-bold text-sm">CV</span>
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
              style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleJumpToStep(step.id)}
                  disabled={index > currentStepIndex}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    step.id === currentStep
                      ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                      : index <= currentStepIndex
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
          {currentStep === "upload" && <UploadPage onNext={handleNext} />}
          {currentStep === "extraction" && (
            <ExtractionPage resumeData={resumeData} onNext={handleNext} onPrevious={handlePrevious} />
          )}
          {currentStep === "analysis" && (
            <AnalysisPage resumeData={resumeData} onNext={handleNext} onPrevious={handlePrevious} />
          )}
          {currentStep === "feedback" && (
            <FeedbackPage resumeData={resumeData} onNext={handleNext} onPrevious={handlePrevious} />
          )}
          {currentStep === "keywords" && (
            <KeywordPage resumeData={resumeData} onNext={handleNext} onPrevious={handlePrevious} />
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
