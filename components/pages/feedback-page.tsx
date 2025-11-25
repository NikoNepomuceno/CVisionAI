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
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 py-4 sm:py-6">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 w-full space-y-4 sm:space-y-6">
          {/* Enhanced Header */}
          <div className="text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 bg-primary/10 rounded-full border border-primary/20 mb-3 sm:mb-4">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">Actionable Feedback</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3">Feedback & Suggestions</h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2 sm:px-0 leading-relaxed">
              Personalized recommendations to enhance your resume and boost your job search success.
            </p>
          </div>

          {/* Stats and Controls */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center mb-4 sm:mb-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Item Counter */}
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 border border-border w-full sm:w-auto justify-center sm:justify-start">
                <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{filtered.length} items</span>
              </div>
              
              {/* Priority Legend - Hidden on mobile, shown on sm+ */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-error rounded-full"></div>
                  <span className="text-xs text-muted-foreground">High</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Medium</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Low</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-secondary flex items-center justify-center gap-2 hover:scale-105 transition-transform text-xs sm:text-sm py-2.5 flex-1 sm:flex-initial"
                disabled={feedbackItems.length === 0}
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Popup View</span>
              </button>
              <button
                onClick={handleDownloadFeedback}
                disabled={feedbackItems.length === 0 || isLoading}
                className="btn-primary flex items-center justify-center gap-2 hover:scale-105 transition-transform disabled:opacity-60 disabled:cursor-not-allowed text-xs sm:text-sm py-2.5 flex-1 sm:flex-initial"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="card-base animate-fade-in-up border border-dashed border-primary/40 bg-primary/5 rounded-xl p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-base sm:text-lg mb-1">Generating Feedback...</p>
                <p className="text-xs sm:text-sm text-muted-foreground">We're analyzing your resume to provide actionable suggestions and improvements.</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="card-base animate-fade-in-up border-l-3 sm:border-l-4 border-l-error bg-error/5 rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-error flex-shrink-0" />
                <h3 className="font-semibold text-foreground text-base sm:text-lg">Feedback Generation Failed</h3>
              </div>
              <p className="text-error/80 mb-4 text-sm sm:text-base">{error}</p>
              <button onClick={handleRetry} className="btn-secondary flex items-center justify-center gap-2 hover:scale-105 transition-transform text-sm w-full sm:w-auto">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                Try Again
              </button>
            </div>
          )}

          {/* Filter Tabs */}
          {!isLoading && !error && feedbackItems.length > 0 && (
            <div className="animate-fade-in-up">
              <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-3 sm:pb-4 scrollbar-hide">
                {categories.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${
                      activeFilter === filter
                        ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                        : "bg-muted text-foreground hover:bg-border hover:shadow-md"
                    }`}
                  >
                    {filter === "all" ? (
                      <>
                        <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">All</span>
                      </>
                    ) : (
                      filter.charAt(0).toUpperCase() + filter.slice(1)
                    )}
                  </button>
                ))}
              </div>

              {/* Feedback Items */}
              <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                {filtered.map((item, i) => (
                  <div
                    key={item.id}
                    className={`card-base border-l-3 sm:border-l-4 rounded-xl p-4 sm:p-6 hover:shadow-md transition-all duration-300 animate-fade-in-up group ${
                      item.priority === "high" 
                        ? "border-l-error bg-error/5" 
                        : item.priority === "medium"
                        ? "border-l-secondary bg-secondary/5"
                        : "border-l-primary bg-primary/5"
                    }`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground text-base sm:text-lg mb-2 leading-tight">{item.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 sm:px-3 sm:py-1 rounded-full border border-primary/20">
                            {item.category}
                          </span>
                          <span className={`text-xs font-medium px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border ${getPriorityColor(item.priority)}`}>
                            {item.priority} priority
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(item.id)}
                        className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors bg-background/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 border border-border hover:border-primary/30 hover:scale-105 transition-transform w-full sm:w-auto"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && feedbackItems.length === 0 && (
            <div className="card-base animate-fade-in-up border border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground rounded-xl p-6 sm:p-8 text-center">
              <Lightbulb className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 opacity-50" />
              <p className="font-medium text-base sm:text-lg mb-1 sm:mb-2">No feedback available yet</p>
              <p className="text-xs sm:text-sm max-w-md mx-auto">
                We need more details in your resume to generate meaningful feedback. Try expanding your experience or skills sections.
              </p>
            </div>
          )}

          {/* Enhanced Navigation */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border">
            <button 
              onClick={onPrevious} 
              className="btn-secondary flex items-center justify-center gap-2 order-2 sm:order-1 hover:scale-105 transition-transform py-2.5 sm:py-3 text-sm w-full sm:w-auto"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              Back to Analysis
            </button>
            <button 
              onClick={() => onNext()} 
              className="btn-primary flex items-center justify-center gap-2 order-1 sm:order-2 hover:scale-105 transition-transform py-2.5 sm:py-3 text-sm w-full sm:w-auto"
            >
              Check Keywords
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>

          <FeedbackModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            feedbackItems={feedbackItems}
            onDownload={handleDownloadFeedback}
          />
        </div>
      </div>
    </div>
  )
}
