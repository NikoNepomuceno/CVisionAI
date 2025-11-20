"use client"

import { useEffect, useMemo, useState } from "react"
import { Zap, TrendingUp, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import type { ResumeAnalysis, AnalysisInsight } from "@/lib/deepseek"

interface AnalysisPageProps {
  resumeData: {
    skills: string[]
    experience: Array<{ company: string; role: string; duration?: string; description?: string }>
    education: Array<{ school: string; degree: string; year?: string }>
    summary?: string
    analysis?: ResumeAnalysis
    lastAnalyzed?: {
      skills: string[]
      experience: Array<{ company: string; role: string; duration?: string; description?: string }>
      education: Array<{ school: string; degree: string; year?: string }>
      summary: string
    }
  }
  onNext: (data: any) => void
  onPrevious: () => void
  onAnalysisPersist: (analysis?: ResumeAnalysis) => void
}

const SECTION_CONFIG: Array<{
  key: keyof ResumeAnalysis
  title: string
  borderLeftClass: string
  topBorderClass: string
  iconWrapperClass: string
  metricClass: string
  icon: JSX.Element
  empty: string
}> = [
  {
    key: "strengths",
    title: "Top Strengths",
    borderLeftClass: "border-l-success",
    topBorderClass: "border-t-success",
    iconWrapperClass: "bg-success/10 text-success",
    metricClass: "text-success",
    icon: <CheckCircle2 className="w-5 h-5" />,
    empty: "We couldn’t spot clear strengths yet. Try highlighting your impact and core expertise.",
  },
  {
    key: "weaknesses",
    title: "Potential Gaps",
    borderLeftClass: "border-l-error",
    topBorderClass: "border-t-error",
    iconWrapperClass: "bg-error/10 text-error",
    metricClass: "text-error",
    icon: <AlertCircle className="w-5 h-5" />,
    empty: "No obvious gaps detected. Double-check that your resume addresses the target role’s requirements.",
  },
  {
    key: "improvements",
    title: "Improvement Opportunities",
    borderLeftClass: "border-l-secondary",
    topBorderClass: "border-t-secondary",
    iconWrapperClass: "bg-secondary/10 text-secondary",
    metricClass: "text-secondary",
    icon: <TrendingUp className="w-5 h-5" />,
    empty: "You’re in good shape! Consider tailoring your resume to specific job descriptions for finer adjustments.",
  },
]

export default function AnalysisPage({ resumeData, onNext, onPrevious, onAnalysisPersist }: AnalysisPageProps) {
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(resumeData.analysis ?? null)
  const [isLoading, setIsLoading] = useState<boolean>(!resumeData.analysis)
  const [error, setError] = useState<string | null>(null)
  const [fetchVersion, setFetchVersion] = useState(0)
  const [lastFetchedKey, setLastFetchedKey] = useState<string | null>(() =>
    resumeData.lastAnalyzed ? JSON.stringify(resumeData.lastAnalyzed) : null,
  )

  const payload = useMemo(
    () => ({
      resume: {
        skills: resumeData.skills,
        experience: resumeData.experience,
        education: resumeData.education,
        summary: resumeData.summary,
      },
    }),
    [resumeData.skills, resumeData.experience, resumeData.education, resumeData.summary],
  )

  const payloadKey = useMemo(() => JSON.stringify(payload.resume), [payload])
  const providedSnapshotKey = useMemo(
    () => (resumeData.lastAnalyzed ? JSON.stringify(resumeData.lastAnalyzed) : null),
    [resumeData.lastAnalyzed],
  )

  useEffect(() => {
    if (resumeData.analysis) {
      setAnalysis(resumeData.analysis)
      setIsLoading(false)
      setError(null)
      setLastFetchedKey(providedSnapshotKey)
    }
  }, [resumeData.analysis, providedSnapshotKey])

  useEffect(() => {
    if (resumeData.analysis) return

    if (!fetchVersion && lastFetchedKey === payloadKey && analysis) {
      setIsLoading(false)
      return
    }

    let isActive = true
    const controller = new AbortController()

    async function run() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        if (!response.ok) {
          const message = await response.json().catch(() => ({ error: "Analysis request failed" }))
          throw new Error(message?.error || "Analysis request failed")
        }

        const { data } = await response.json()
        if (isActive) {
          setAnalysis(data)
          setLastFetchedKey(payloadKey)
          onAnalysisPersist(data)
          setFetchVersion((value) => (value === 0 ? value : 0))
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return
        if (isActive) {
          setError(err?.message || "Unable to analyze resume right now.")
          setAnalysis(null)
          setLastFetchedKey(null)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    run()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [analysis, fetchVersion, lastFetchedKey, onAnalysisPersist, payloadKey, resumeData.analysis])

  const handleRetry = () => {
    setLastFetchedKey(null)
    setFetchVersion((version) => version + 1)
  }

  const handleContinue = () => {
    onNext(analysis ? { analysis } : {})
  }

  const renderInsights = (
    insights: AnalysisInsight[],
    borderLeftClass: string,
    iconWrapperClass: string,
    icon: JSX.Element,
  ) => {
    return insights.map((insight, index) => (
      <div
        key={`${borderLeftClass}-${index}`}
        className={`card-base border-l-4 hover:shadow-lg transition-all duration-300 animate-fade-in-up ${borderLeftClass}`}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="flex gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${iconWrapperClass}`}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-foreground">{insight.title}</h3>
              {typeof insight.confidence === "number" && (
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                  {insight.confidence}% confidence
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{insight.description}</p>
            {insight.tags && insight.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {insight.tags.map((tag, i) => (
                  <span key={i} className="text-xs font-medium bg-muted px-2 py-1 rounded-full text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    ))
  }

  return (
    <div className="space-y-6">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-foreground mb-2">AI Analysis & Insights</h1>
        <p className="text-muted-foreground">We analyzed your resume to surface strengths, gaps, and next steps.</p>
      </div>

      {isLoading && (
        <div className="card-base animate-fade-in-up border border-dashed border-primary/40 bg-primary/5 flex items-center gap-3 py-6 px-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <div>
            <p className="font-medium text-foreground">Generating insights…</p>
            <p className="text-sm text-muted-foreground">We’re reviewing your skills, experience, and summary.</p>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="card-base animate-fade-in-up border border-error/40 bg-error/5 text-error">
          <p className="font-semibold mb-2">We couldn’t analyze your resume.</p>
          <p className="text-sm text-error/80 mb-4">{error}</p>
          <button onClick={handleRetry} className="btn-secondary text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !error && analysis && (
        <div className="space-y-4">
          {analysis.summary && (
            <div className="card-base animate-fade-in-up border-t-4 border-t-primary bg-primary/5">
              <h2 className="text-lg font-semibold text-foreground mb-2">Summary</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
            </div>
          )}

          {SECTION_CONFIG.map(({ key, title, borderLeftClass, topBorderClass, iconWrapperClass, metricClass, icon, empty }) => {
            const insights = analysis[key] || []
            return (
              <div
                key={key}
                className={`card-base animate-fade-in-up border-t-4 ${topBorderClass}`}
                style={{ animationDelay: "150ms" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                  <span className={`inline-flex items-center gap-1 text-sm ${metricClass}`}>
                    {icon}
                    {insights.length} items
                  </span>
                </div>

                {insights.length > 0 ? (
                  <div className="space-y-3">{renderInsights(insights, borderLeftClass, iconWrapperClass, icon)}</div>
                ) : (
                  <p className="text-sm text-muted-foreground">{empty}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!isLoading && !error && !analysis && (
        <div className="card-base animate-fade-in-up border border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground">
          <p className="font-medium mb-2">No insights available yet.</p>
          <p className="text-sm">
            We need more details in your resume to generate meaningful analysis. Try expanding your experience or skills.
          </p>
        </div>
      )}

      <div className="flex justify-between gap-4 mt-8">
        <button onClick={onPrevious} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={handleContinue}
          disabled={isLoading || (!!error && !analysis)}
          className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          View Detailed Feedback
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
