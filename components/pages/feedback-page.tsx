"use client"

import { useState, useEffect, useMemo } from "react"
import { Copy, Check, ArrowRight, ArrowLeft, Download, Loader2, Zap, Eye, Sparkles, Target, AlertTriangle, Lightbulb, Filter } from "lucide-react"
import type { FeedbackItem } from "@/lib/deepseek"
import FeedbackModal from "@/components/feedback-modal"

interface FeedbackPageProps {
  resumeData: {
    skills: string[]
    experience: Array<{ company: string; role: string; duration?: string; description?: string }>
    education: Array<{ school: string; degree: string; year?: string }>
    summary?: string
    analysis?: any
  }
  onNext: (data: any) => void
  onPrevious: () => void
}

// ... (keep all your existing PDF functions: createPdfBlob, escapePdfText, wrapTextLines)

export default function FeedbackPage({ resumeData, onNext, onPrevious }: FeedbackPageProps) {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchVersion, setFetchVersion] = useState(0)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const payload = useMemo(
    () => ({
      resume: {
        skills: resumeData.skills,
        experience: resumeData.experience,
        education: resumeData.education,
        summary: resumeData.summary,
      },
      analysis: resumeData.analysis,
    }),
    [resumeData.skills, resumeData.experience, resumeData.education, resumeData.summary, resumeData.analysis],
  )

  const payloadKey = useMemo(() => JSON.stringify(payload), [payload])

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()

    async function fetchFeedback() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        if (!response.ok) {
          const message = await response.json().catch(() => ({ error: "Feedback request failed" }))
          throw new Error(message?.error || "Feedback request failed")
        }

        const { feedback } = await response.json()
        if (isActive) {
          setFeedbackItems(feedback || [])
          setFetchVersion((value) => (value === 0 ? value : 0))
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return
        if (isActive) {
          setError(err?.message || "Unable to generate feedback right now.")
          setFeedbackItems([])
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    fetchFeedback()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [payloadKey, fetchVersion])

  const categories = useMemo(() => {
    const cats = new Set<string>()
    feedbackItems.forEach((item) => cats.add(item.category))
    return ["all", ...Array.from(cats).sort()]
  }, [feedbackItems])

  const filtered = useMemo(() => {
    if (activeFilter === "all") return feedbackItems
    return feedbackItems.filter((f) => f.category === activeFilter)
  }, [feedbackItems, activeFilter])

  const handleRetry = () => {
    setFetchVersion((version) => version + 1)
  }

  const handleCopy = (id: string) => {
    const item = feedbackItems.find((f) => f.id === id)
    if (item) {
      navigator.clipboard.writeText(`${item.title}\n\n${item.description}`)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handleDownloadFeedback = () => {
    if (feedbackItems.length === 0) return

    const lines: string[] = []
    lines.push("CVisionAI Feedback Summary")
    lines.push(`Generated: ${new Date().toLocaleString()}`)
    lines.push("")

    const groupedByCategory = feedbackItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    }, {} as Record<string, FeedbackItem[]>)

    Object.entries(groupedByCategory).forEach(([category, items]) => {
      lines.push(`\n${category}`)
      lines.push("=".repeat(category.length))
      items.forEach((item, index) => {
        lines.push(`\n${index + 1}. ${item.title} [${item.priority} priority]`)
        lines.push(`   ${item.description}`)
      })
      lines.push("")
    })

    const pdfLines = wrapTextLines(lines)
    const pdfBlob = createPdfBlob(pdfLines)
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `cv-feedback-${new Date().toISOString().split("T")[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-error/10 text-error border-error/20"
      case "medium":
        return "bg-secondary/10 text-secondary border-secondary/20"
      case "low":
        return "bg-primary/10 text-primary border-primary/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Enhanced Header */}
      <div className="mb-8 text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Actionable Feedback</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Feedback & Suggestions</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Personalized recommendations to enhance your resume and boost your job search success.
        </p>
      </div>

      {/* Stats and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 border border-border">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{filtered.length} items</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-2 h-2 bg-error rounded-full"></div>
            <span className="text-xs text-muted-foreground">High Priority</span>
            <div className="w-2 h-2 bg-secondary rounded-full"></div>
            <span className="text-xs text-muted-foreground">Medium Priority</span>
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-xs text-muted-foreground">Low Priority</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-secondary flex items-center gap-2 hover:scale-105 transition-transform"
            disabled={feedbackItems.length === 0}
          >
            <Eye className="w-4 h-4" />
            Popup View
          </button>
          <button
            onClick={handleDownloadFeedback}
            disabled={feedbackItems.length === 0 || isLoading}
            className="btn-primary flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card-base animate-fade-in-up border border-dashed border-primary/40 bg-primary/5 rounded-xl p-8 flex items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div className="flex-1">
            <p className="font-semibold text-foreground text-lg mb-1">Generating Feedback...</p>
            <p className="text-sm text-muted-foreground">We're analyzing your resume to provide actionable suggestions and improvements.</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="card-base animate-fade-in-up border-l-4 border-l-error bg-error/5 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-error" />
            <h3 className="font-semibold text-foreground text-lg">Feedback Generation Failed</h3>
          </div>
          <p className="text-error/80 mb-4">{error}</p>
          <button onClick={handleRetry} className="btn-secondary flex items-center gap-2 hover:scale-105 transition-transform">
            <Zap className="w-4 h-4" />
            Try Again
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      {!isLoading && !error && feedbackItems.length > 0 && (
        <div className="animate-fade-in-up">
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-5 py-3 rounded-xl font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  activeFilter === filter
                    ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                    : "bg-muted text-foreground hover:bg-border hover:shadow-md"
                }`}
              >
                {filter === "all" ? (
                  <>
                    <Target className="w-4 h-4" />
                    All Feedback
                  </>
                ) : (
                  filter.charAt(0).toUpperCase() + filter.slice(1)
                )}
              </button>
            ))}
          </div>

          {/* Feedback Items */}
          <div className="space-y-4 mt-4">
            {filtered.map((item, i) => (
              <div
                key={item.id}
                className={`card-base border-l-4 rounded-xl p-6 hover:shadow-lg transition-all duration-300 animate-fade-in-up group hover:scale-[1.02] ${
                  item.priority === "high" 
                    ? "border-l-error bg-error/5" 
                    : item.priority === "medium"
                    ? "border-l-secondary bg-secondary/5"
                    : "border-l-primary bg-primary/5"
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3 gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground text-lg mb-2 leading-tight">{item.title}</h3>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                            {item.category}
                          </span>
                          <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${getPriorityColor(item.priority)}`}>
                            {item.priority} priority
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(item.id)}
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border hover:border-primary/30 hover:scale-105 transition-transform"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-base">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && feedbackItems.length === 0 && (
        <div className="card-base animate-fade-in-up border border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground rounded-xl p-8 text-center">
          <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium text-lg mb-2">No feedback available yet</p>
          <p className="text-sm max-w-md mx-auto">
            We need more details in your resume to generate meaningful feedback. Try expanding your experience or skills sections.
          </p>
        </div>
      )}

      {/* Enhanced Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mt-8 pt-6 border-t border-border">
        <button 
          onClick={onPrevious} 
          className="btn-secondary flex items-center justify-center gap-2 order-2 sm:order-1 hover:scale-105 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Analysis
        </button>
        <button 
          onClick={() => onNext()} 
          className="btn-primary flex items-center justify-center gap-2 order-1 sm:order-2 hover:scale-105 transition-transform"
        >
          Check Keywords
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        feedbackItems={feedbackItems}
        onDownload={handleDownloadFeedback}
      />
    </div>
  )
}
