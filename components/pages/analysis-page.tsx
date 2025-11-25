"use client"

import { useEffect, useMemo, useState } from "react"
import type { JSX } from "react"
import { Zap, TrendingUp, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Download, LayoutGrid, BarChart3, Sparkles, Target, AlertTriangle, Lightbulb } from "lucide-react"
import type { ResumeAnalysis, AnalysisInsight } from "@/lib/deepseek"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Cell, Tooltip } from "recharts"
import { createPdfBlob, downloadPdf, createAnalysisSections } from "@/lib/pdf-utils"

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

// PDF generation now handled by shared utility in lib/pdf-utils.ts

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

  // Get theme colors for chart - FIXED with actual brand colors
  const [themeColors, setThemeColors] = useState({
    success: "#C3E8C9", // Your brand success color
    error: "#ef4444", 
    secondary: "#F1AC20", // Your brand secondary color
    primary: "#4165D5", // Your brand primary color
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Use your actual brand colors directly
      setThemeColors({
        success: "#C3E8C9", // Light green from your brand
        error: "#ef4444",   // Red for errors
        secondary: "#F1AC20", // Yellow/orange from your brand
        primary: "#4165D5", // Blue from your brand
      })
    }
  }, [])

  // Transform analysis data for chart visualization - FIXED VERSION
  const chartData = useMemo(() => {
    if (!analysis) return [];

    const categories = [
      { 
        key: "strengths" as const, 
        label: "Strengths", 
        color: themeColors.success, 
      },
      { 
        key: "weaknesses" as const, 
        label: "Weaknesses", 
        color: themeColors.error, 
      },
      { 
        key: "improvements" as const, 
        label: "Improvements", 
        color: themeColors.secondary, 
      },
    ];

    return categories.map(({ key, label, color }) => {
      const insights = analysis[key] || [];
      const count = insights.length;
      const confidences = insights
        .map((insight) => insight.confidence)
        .filter((conf): conf is number => typeof conf === "number");
      const avgConfidence = confidences.length > 0
        ? Math.round(confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length)
        : 0;

      return {
        name: label,
        count,
        avgConfidence,
        color,
      };
    });
  }, [analysis, themeColors]);

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
    // Use shared PDF utility with proper styling
    const sections = createAnalysisSections(resumeData, analysis || undefined)
    
    const metadata = {
      title: 'CVisionAI - Comprehensive Resume Analysis Report',
      subtitle: 'AI-Powered Resume Analysis & Insights',
      generatedAt: new Date(),
      footer: 'Generated by CVisionAI - AI-Powered Resume Analysis Tool | Confidential Report - For personal use only',
    }

    const pdfBlob = createPdfBlob(sections, metadata)
    const filename = `cv-analysis-report-${new Date().toISOString().split('T')[0]}.pdf`
    downloadPdf(pdfBlob, filename)
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

              {/* Graph View - FIXED VERSION with larger centered chart */}
              {viewMode === "graph" && chartData.length > 0 && (
                <div className="card-base animate-fade-in-up border-t-4 border-t-primary rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">Analysis Overview</h2>
                  </div>
                  
                  {/* Centered Chart Container */}
                  <div className="flex justify-center items-center w-full mb-8">
                    <div className="h-[500px] w-full max-w-4xl">
                      <BarChart
                        data={chartData}
                        margin={{ top: 30, right: 50, left: 50, bottom: 80 }}
                        width={800}
                        height={500}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis 
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 14 }}
                          interval={0}
                        />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          width={80}
                          label={{ 
                            value: 'Insight Count', 
                            angle: -90, 
                            position: 'insideLeft',
                            offset: -15,
                            style: { fill: "hsl(var(--foreground))", fontSize: 14, fontWeight: 'bold' }
                          }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          domain={[0, 100]}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          width={80}
                          label={{ 
                            value: 'Avg Confidence %', 
                            angle: -90, 
                            position: 'insideRight',
                            offset: -15,
                            style: { fill: "hsl(var(--foreground))", fontSize: 14, fontWeight: 'bold' }
                          }}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === "count") return [value, "Insight Count"];
                            if (name === "avgConfidence") return [`${value}%`, "Avg Confidence"];
                            return [value, name];
                          }}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            color: "hsl(var(--foreground))",
                            borderRadius: "8px",
                            fontSize: "14px",
                            padding: "12px",
                          }}
                        />
                        <Legend 
                          wrapperStyle={{
                            paddingTop: "20px",
                            fontSize: "14px",
                          }}
                        />
                        
                        {/* Insight Count Bars - Larger and more prominent */}
                        <Bar 
                          yAxisId="left"
                          dataKey="count" 
                          name="Insight Count"
                          radius={[6, 6, 0, 0]}
                          barSize={40}
                        >
                          {chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-count-${index}`} 
                              fill={entry.color}
                              stroke={entry.color}
                              strokeWidth={2}
                            />
                          ))}
                        </Bar>
                        
                        {/* Avg Confidence Bars - Larger and more prominent */}
                        <Bar 
                          yAxisId="right"
                          dataKey="avgConfidence" 
                          name="Avg Confidence (%)"
                          radius={[6, 6, 0, 0]}
                          barSize={40}
                        >
                          {chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-confidence-${index}`} 
                              fill={`${entry.color}80`} // Add transparency
                              stroke={entry.color}
                              strokeWidth={2}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </div>
                  </div>
                  
                  {/* Stats Cards - Improved layout */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {chartData.map((item, index) => (
                      <div
                        key={item.name}
                        className="p-6 rounded-xl border-2 border-border bg-card hover:shadow-lg transition-all duration-300 hover:scale-105"
                        style={{ borderLeft: `6px solid ${item.color}` }}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div
                            className="w-6 h-6 rounded-full shadow-md"
                            style={{ backgroundColor: item.color }}
                          />
                          <h3 className="font-bold text-lg text-foreground">{item.name}</h3>
                        </div>
                        <div className="space-y-3 text-base">
                          <div className="flex justify-between items-center py-2 border-b border-border">
                            <span className="text-muted-foreground font-medium">Insight Count:</span>
                            <span className="font-bold text-foreground text-lg">{item.count}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-muted-foreground font-medium">Avg Confidence:</span>
                            <span className="font-bold text-foreground text-lg">{item.avgConfidence}%</span>
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