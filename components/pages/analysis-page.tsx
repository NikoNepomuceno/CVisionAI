"use client"

import { useEffect, useMemo, useState } from "react"
import type { JSX } from "react"
import { Zap, TrendingUp, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Download, LayoutGrid, BarChart3, Sparkles, Target, AlertTriangle, Lightbulb } from "lucide-react"
import type { ResumeAnalysis, AnalysisInsight } from "@/lib/deepseek"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Cell } from "recharts"

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
  key: Exclude<keyof ResumeAnalysis, "summary">
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
    icon: <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />,
    empty: "We couldn't spot clear strengths yet. Try highlighting your impact and core expertise.",
  },
  {
    key: "weaknesses",
    title: "Potential Gaps",
    borderLeftClass: "border-l-error",
    topBorderClass: "border-t-error",
    iconWrapperClass: "bg-error/10 text-error",
    metricClass: "text-error",
    icon: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
    empty: "No obvious gaps detected. Double-check that your resume addresses the target role's requirements.",
  },
  {
    key: "improvements",
    title: "Improvement Opportunities",
    borderLeftClass: "border-l-secondary",
    topBorderClass: "border-t-secondary",
    iconWrapperClass: "bg-secondary/10 text-secondary",
    metricClass: "text-secondary",
    icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />,
    empty: "You're in good shape! Consider tailoring your resume to specific job descriptions for finer adjustments.",
  },
]

// Enhanced PDF generation functions
const createPdfBlob = (pdfLines: string[]): Blob => {
  const pdfContent = pdfLines.join('\n')
  return new Blob([pdfContent], { type: 'application/pdf' })
}

const escapePdfText = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
}

const wrapTextLines = (lines: string[]): string[] => {
  const pdfLines: string[] = []
  
  // PDF Header
  pdfLines.push('%PDF-1.4')
  pdfLines.push('1 0 obj')
  pdfLines.push('<< /Type /Catalog /Pages 2 0 R >>')
  pdfLines.push('endobj')
  
  // Pages object
  pdfLines.push('2 0 obj')
  pdfLines.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  pdfLines.push('endobj')
  
  // Page object
  pdfLines.push('3 0 obj')
  pdfLines.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>')
  pdfLines.push('endobj')
  
  // Content stream
  let content = `
    BT
    /F1 12 Tf
    50 750 Td
    (CVisionAI - Resume Analysis Report) Tj
    0 -20 Td
    (Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}) Tj
    0 -40 Td
  `

  // Add all content lines
  lines.forEach(line => {
    if (line.trim() === '') {
      content += '0 -15 Td\n'
    } else if (line.startsWith('## ')) {
      // Section header
      content += `
        /F1 14 Tf
        (${escapePdfText(line.replace('## ', ''))}) Tj
        0 -25 Td
        /F1 12 Tf
      `
    } else if (line.startsWith('# ')) {
      // Main header
      content += `
        /F1 16 Tf
        (${escapePdfText(line.replace('# ', ''))}) Tj
        0 -30 Td
        /F1 12 Tf
      `
    } else if (line.startsWith('- ')) {
      // List item
      content += `(${escapePdfText('• ' + line.substring(2))}) Tj\n0 -18 Td\n`
    } else if (line.startsWith('   ')) {
      // Indented text
      content += `     (${escapePdfText(line.trim())}) Tj\n0 -15 Td\n`
    } else {
      // Regular text
      content += `(${escapePdfText(line)}) Tj\n0 -18 Td\n`
    }
  })

  content += 'ET'

  pdfLines.push('4 0 obj')
  pdfLines.push(`<< /Length ${content.length} >>`)
  pdfLines.push('stream')
  pdfLines.push(content)
  pdfLines.push('endstream')
  pdfLines.push('endobj')
  
  // Font dictionary
  pdfLines.push('5 0 obj')
  pdfLines.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  pdfLines.push('endobj')
  
  // Cross-reference table and trailer
  pdfLines.push('xref')
  pdfLines.push('0 6')
  pdfLines.push('0000000000 65535 f ')
  pdfLines.push('0000000010 00000 n ')
  pdfLines.push('0000000074 00000 n ')
  pdfLines.push('0000000172 00000 n ')
  pdfLines.push('0000000274 00000 n ')
  pdfLines.push('0000001000 00000 n ')
  pdfLines.push('trailer')
  pdfLines.push('<< /Size 6 /Root 1 0 R >>')
  pdfLines.push('startxref')
  pdfLines.push('1500')
  pdfLines.push('%%EOF')
  
  return pdfLines
}

export default function AnalysisPage({ resumeData, onNext, onPrevious, onAnalysisPersist }: AnalysisPageProps) {
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(resumeData.analysis ?? null)
  const [isLoading, setIsLoading] = useState<boolean>(!resumeData.analysis)
  const [error, setError] = useState<string | null>(null)
  const [fetchVersion, setFetchVersion] = useState(0)
  const [viewMode, setViewMode] = useState<"cards" | "graph">("cards")
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

  // Get theme colors for chart
  const [themeColors, setThemeColors] = useState({
    success: "#10b981",
    error: "#ef4444",
    secondary: "#f1ac20",
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement
      const computedStyle = getComputedStyle(root)
      setThemeColors({
        success: computedStyle.getPropertyValue("--success").trim() || "#10b981",
        error: computedStyle.getPropertyValue("--error").trim() || "#ef4444",
        secondary: computedStyle.getPropertyValue("--secondary").trim() || "#f1ac20",
      })
    }
  }, [])

  // Transform analysis data for chart visualization
  const chartData = useMemo(() => {
    if (!analysis) return []

    const categories = [
      { 
        key: "strengths" as const, 
        label: "Strengths", 
        color: themeColors.success, 
        dataKey: "strengths" 
      },
      { 
        key: "weaknesses" as const, 
        label: "Weaknesses", 
        color: themeColors.error, 
        dataKey: "weaknesses" 
      },
      { 
        key: "improvements" as const, 
        label: "Improvements", 
        color: themeColors.secondary, 
        dataKey: "improvements" 
      },
    ]

    return categories.map(({ key, label, color, dataKey }) => {
      const insights = analysis[key] || []
      const count = insights.length
      const confidences = insights
        .map((insight) => insight.confidence)
        .filter((conf): conf is number => typeof conf === "number")
      const avgConfidence = confidences.length > 0
        ? Math.round(confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length)
        : 0

      return {
        category: label,
        count,
        avgConfidence,
        color,
        dataKey,
      }
    })
  }, [analysis, themeColors])

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

  const handleDownloadSummary = () => {
    const lines: string[] = []
    
    // Header
    lines.push('# CVisionAI - Comprehensive Resume Analysis Report')
    lines.push('')
    lines.push(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`)
    lines.push('')

    // Resume Data Section
    lines.push('## Resume Overview')
    lines.push('')

    // Skills
    lines.push('### Skills & Competencies')
    if (resumeData.skills.length > 0) {
      resumeData.skills.forEach(skill => {
        lines.push(`- ${skill}`)
      })
    } else {
      lines.push('- No skills listed')
    }
    lines.push('')

    // Experience
    lines.push('### Professional Experience')
    if (resumeData.experience.length > 0) {
      resumeData.experience.forEach((exp, index) => {
        lines.push(`**${exp.role}** at ${exp.company}`)
        if (exp.duration) {
          lines.push(`  Duration: ${exp.duration}`)
        }
        if (exp.description) {
          lines.push(`  Description: ${exp.description}`)
        }
        if (index < resumeData.experience.length - 1) {
          lines.push('')
        }
      })
    } else {
      lines.push('- No experience listed')
    }
    lines.push('')

    // Education
    lines.push('### Education')
    if (resumeData.education.length > 0) {
      resumeData.education.forEach(edu => {
        lines.push(`- ${edu.degree} from ${edu.school}${edu.year ? ` (${edu.year})` : ''}`)
      })
    } else {
      lines.push('- No education listed')
    }
    lines.push('')

    // Summary
    if (resumeData.summary) {
      lines.push('### Professional Summary')
      lines.push(resumeData.summary)
      lines.push('')
    }

    // AI Analysis Section
    if (analysis) {
      lines.push('## AI-Powered Analysis & Insights')
      lines.push('')

      // Overall Summary
      if (analysis.summary) {
        lines.push('### Executive Summary')
        lines.push(analysis.summary)
        lines.push('')
      }

      // Strengths
      lines.push('### Top Strengths')
      if (analysis.strengths && analysis.strengths.length > 0) {
        analysis.strengths.forEach((insight, index) => {
          lines.push(`**${index + 1}. ${insight.title}**`)
          lines.push(`   ${insight.description}`)
          if (insight.tags && insight.tags.length > 0) {
            lines.push(`   Related Areas: ${insight.tags.join(', ')}`)
          }
          if (typeof insight.confidence === 'number') {
            lines.push(`   Confidence Level: ${insight.confidence}%`)
          }
          lines.push('')
        })
      } else {
        lines.push('No specific strengths identified. Consider highlighting your key achievements and core competencies.')
        lines.push('')
      }

      // Weaknesses
      lines.push('### Potential Gaps & Areas for Development')
      if (analysis.weaknesses && analysis.weaknesses.length > 0) {
        analysis.weaknesses.forEach((insight, index) => {
          lines.push(`**${index + 1}. ${insight.title}**`)
          lines.push(`   ${insight.description}`)
          if (insight.tags && insight.tags.length > 0) {
            lines.push(`   Related Areas: ${insight.tags.join(', ')}`)
          }
          if (typeof insight.confidence === 'number') {
            lines.push(`   Confidence Level: ${insight.confidence}%`)
          }
          lines.push('')
        })
      } else {
        lines.push('No significant gaps detected. Your resume appears well-rounded for most positions.')
        lines.push('')
      }

      // Improvements
      lines.push('### Improvement Opportunities')
      if (analysis.improvements && analysis.improvements.length > 0) {
        analysis.improvements.forEach((insight, index) => {
          lines.push(`**${index + 1}. ${insight.title}**`)
          lines.push(`   ${insight.description}`)
          if (insight.tags && insight.tags.length > 0) {
            lines.push(`   Related Areas: ${insight.tags.join(', ')}`)
          }
          if (typeof insight.confidence === 'number') {
            lines.push(`   Confidence Level: ${insight.confidence}%`)
          }
          lines.push('')
        })
      } else {
        lines.push('Your resume is in good shape! Consider tailoring it for specific job applications.')
        lines.push('')
      }

      // Statistics
      lines.push('### Analysis Statistics')
      const stats = {
        'Total Insights': (analysis.strengths?.length || 0) + (analysis.weaknesses?.length || 0) + (analysis.improvements?.length || 0),
        'Strengths Identified': analysis.strengths?.length || 0,
        'Areas for Improvement': analysis.weaknesses?.length || 0,
        'Optimization Opportunities': analysis.improvements?.length || 0,
      }
      
      Object.entries(stats).forEach(([key, value]) => {
        lines.push(`- ${key}: ${value}`)
      })
      lines.push('')

    } else {
      lines.push('## AI Analysis')
      lines.push('No AI analysis available. Please run the analysis to get insights.')
      lines.push('')
    }

    // Footer
    lines.push('---')
    lines.push('Generated by CVisionAI - AI-Powered Resume Analysis Tool')
    lines.push('Confidential Report - For personal use only')

    const pdfLines = wrapTextLines(lines)
    const pdfBlob = createPdfBlob(pdfLines)
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `cv-analysis-report-${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
        className={`card-base border-l-3 sm:border-l-4 hover:shadow-md transition-all duration-300 animate-fade-in-up group ${borderLeftClass}`}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="flex gap-3 sm:gap-4">
          <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${iconWrapperClass} group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2 sm:gap-3">
              <h3 className="font-semibold text-foreground text-sm sm:text-base leading-tight">{insight.title}</h3>
              {typeof insight.confidence === "number" && (
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 sm:px-3 sm:py-1.5 rounded-full whitespace-nowrap flex-shrink-0 self-start">
                  {insight.confidence}% confidence
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3">{insight.description}</p>
            {insight.tags && insight.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {insight.tags.map((tag, i) => (
                  <span key={i} className="text-xs font-medium bg-muted px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-muted-foreground border border-border">
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
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 py-4 sm:py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full space-y-6">
          {/* Enhanced Header */}
          <div className="text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 bg-primary/10 rounded-full border border-primary/20 mb-3 sm:mb-4">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">AI-Powered Analysis</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3">AI Analysis & Insights</h1>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-0 leading-relaxed">
              We analyzed your resume to surface strengths, gaps, and actionable next steps.
            </p>
          </div>

          {/* View Controls - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center mb-6 animate-fade-in-up">
            {/* View Toggle - Full width on mobile */}
            <div className="w-full sm:w-auto">
              <div className="flex items-center bg-muted rounded-lg p-1 border border-border w-full sm:w-auto">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-4 py-3 sm:px-4 sm:py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 flex-1 ${
                    viewMode === "cards"
                      ? "bg-primary text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-sm">Cards</span>
                </button>
                <button
                  onClick={() => setViewMode("graph")}
                  className={`px-4 py-3 sm:px-4 sm:py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 flex-1 ${
                    viewMode === "graph"
                      ? "bg-primary text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm">Graph</span>
                </button>
              </div>
            </div>
            
            {/* Download Button - Full width on mobile, below toggle */}
            <button
              onClick={handleDownloadSummary}
              disabled={!analysis || isLoading}
              className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 transition-transform text-sm py-3 w-full sm:w-auto sm:mt-0 mt-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Full Report</span>
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="card-base animate-fade-in-up border border-dashed border-primary/40 bg-primary/5 flex items-center gap-4 py-6 sm:py-8 px-4 sm:px-6 rounded-xl">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-base sm:text-lg mb-1">Generating AI Insights...</p>
                <p className="text-xs sm:text-sm text-muted-foreground">We're analyzing your skills, experience, and qualifications to provide personalized recommendations.</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="card-base animate-fade-in-up border-l-4 border-l-error bg-error/5 rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-error flex-shrink-0" />
                <h3 className="font-semibold text-foreground text-base sm:text-lg">Analysis Failed</h3>
              </div>
              <p className="text-error/80 mb-4 text-sm sm:text-base">{error}</p>
              <button onClick={handleRetry} className="btn-secondary flex items-center justify-center gap-2 hover:scale-105 transition-transform text-sm w-full sm:w-auto">
                <Zap className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}

          {/* Analysis Content */}
          {!isLoading && !error && analysis && (
            <div className="space-y-6">
              {/* Summary Section */}
              {analysis.summary && (
                <div className="card-base animate-fade-in-up border-t-4 border-t-primary bg-primary/5 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">Executive Summary</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{analysis.summary}</p>
                </div>
              )}

              {/* Cards View */}
              {viewMode === "cards" && (
                <div className="grid gap-6">
                  {SECTION_CONFIG.map(({ key, title, borderLeftClass, topBorderClass, iconWrapperClass, metricClass, icon, empty }) => {
                    const insights = analysis[key] || []
                    return (
                      <div
                        key={key}
                        className={`card-base animate-fade-in-up border-t-4 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 ${topBorderClass}`}
                        style={{ animationDelay: "150ms" }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconWrapperClass}`}>
                              {icon}
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-foreground">{title}</h2>
                              <p className="text-sm text-muted-foreground">{insights.length} insights found</p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-sm font-medium ${metricClass} bg-muted px-3 py-1.5 rounded-full self-start sm:self-auto`}>
                            {insights.length} items
                          </span>
                        </div>

                        {insights.length > 0 ? (
                          <div className="space-y-4">{renderInsights(insights, borderLeftClass, iconWrapperClass, icon)}</div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-base">{empty}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Graph View */}
              {viewMode === "graph" && chartData.length > 0 && (
                <div className="card-base animate-fade-in-up border-t-4 border-t-primary rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">Analysis Overview</h2>
                  </div>
                  
                  <ChartContainer
                    config={{
                      strengthsCount: {
                        label: "Strengths - Count",
                        color: "hsl(var(--success))",
                      },
                      strengthsConfidence: {
                        label: "Strengths - Confidence",
                        color: "hsl(var(--success))",
                      },
                      weaknessesCount: {
                        label: "Weaknesses - Count",
                        color: "hsl(var(--error))",
                      },
                      weaknessesConfidence: {
                        label: "Weaknesses - Confidence",
                        color: "hsl(var(--error))",
                      },
                      improvementsCount: {
                        label: "Improvements - Count",
                        color: "hsl(var(--secondary))",
                      },
                      improvementsConfidence: {
                        label: "Improvements - Confidence",
                        color: "hsl(var(--secondary))",
                      },
                    }}
                    className="h-[300px] sm:h-[400px] w-full"
                  >
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="category"
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        yAxisId="left"
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 100]}
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent 
                          formatter={(value, name) => {
                            const nameStr = String(name || "")
                            if (nameStr.includes("Count") || nameStr === "count") {
                              return [`${value}`, "Insight Count"]
                            }
                            if (nameStr.includes("Confidence") || nameStr === "avgConfidence") {
                              return [`${value}%`, "Avg Confidence (%)"]
                            }
                            return [value, name]
                          }}
                        />} 
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="count"
                        name="Insight Count"
                        radius={[4, 4, 0, 0]}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-count-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                      <Bar
                        yAxisId="right"
                        dataKey="avgConfidence"
                        name="Avg Confidence (%)"
                        radius={[4, 4, 0, 0]}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-confidence-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {chartData.map((item) => (
                      <div
                        key={item.category}
                        className="p-4 rounded-xl border border-border bg-muted/30 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <h3 className="font-semibold text-foreground">{item.category}</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Insight Count:</span>
                            <span className="font-semibold text-foreground">{item.count}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Avg Confidence:</span>
                            <span className="font-semibold text-foreground">{item.avgConfidence}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewMode === "graph" && chartData.length === 0 && (
                <div className="card-base animate-fade-in-up border border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground rounded-xl p-8 text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-lg mb-2">No data available for graph view</p>
                  <p className="text-sm">Switch to cards view to see detailed insights and recommendations.</p>
                </div>
              )}
            </div>
          )}

          {/* No Analysis State */}
          {!isLoading && !error && !analysis && (
            <div className="card-base animate-fade-in-up border border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground rounded-xl p-6 sm:p-8 text-center">
              <Lightbulb className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-base sm:text-lg mb-2">No insights available yet</p>
              <p className="text-sm">
                We need more details in your resume to generate meaningful analysis. Try expanding your experience or skills sections.
              </p>
            </div>
          )}

          {/* Enhanced Navigation - Stacked on mobile */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between mt-8 pt-6 border-t border-border">
            <button 
              onClick={onPrevious} 
              className="btn-secondary flex items-center justify-center gap-2 order-2 sm:order-1 hover:scale-105 transition-transform py-3 text-sm w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Extraction
            </button>
            <button
              onClick={handleContinue}
              disabled={isLoading || (!!error && !analysis)}
              className="btn-primary flex items-center justify-center gap-2 order-1 sm:order-2 hover:scale-105 transition-transform disabled:opacity-60 disabled:cursor-not-allowed py-3 text-sm w-full sm:w-auto"
            >
              View Detailed Feedback
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}