"use client"

import { useEffect, useMemo, useState } from "react"
import type { JSX } from "react"
import { Zap, TrendingUp, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Download, LayoutGrid, BarChart3 } from "lucide-react"
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

const PDF_CONFIG = {
  width: 612, // 8.5in
  height: 792, // 11in
  margin: 64,
  lineHeight: 16,
  startY: 728,
}
const MAX_LINES_PER_PAGE = Math.floor((PDF_CONFIG.startY - PDF_CONFIG.margin) / PDF_CONFIG.lineHeight)

function escapePdfText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

function createPdfBlob(lines: string[]): Blob {
  const normalizedLines = lines.map((line) => line.replace(/\r/g, ""))

  type PdfPage = { commands: string[]; lineCount: number }
  const startPage = (): PdfPage => ({
    commands: [
      "BT",
      "/F1 12 Tf",
      `${PDF_CONFIG.lineHeight} TL`,
      `1 0 0 1 ${PDF_CONFIG.margin} ${PDF_CONFIG.startY} Tm`,
    ],
    lineCount: 0,
  })

  const pages: PdfPage[] = [startPage()]
  const addLineToPage = (line: string) => {
    let current = pages[pages.length - 1]
    if (current.lineCount >= MAX_LINES_PER_PAGE) {
      current.commands.push("ET")
      current = startPage()
      pages.push(current)
    }

    const safeLine = escapePdfText(line || " ")
    if (current.lineCount === 0) {
      current.commands.push(`(${safeLine}) Tj`)
    } else {
      current.commands.push("T*")
      current.commands.push(`(${safeLine}) Tj`)
    }
    current.lineCount += 1
  }

  normalizedLines.forEach((line) => {
    addLineToPage(line)
  })
  pages[pages.length - 1].commands.push("ET")

  const textEncoder = new TextEncoder()

  type Chunk = Uint8Array
  const chunks: Chunk[] = []
  let length = 0

  const pushString = (value: string) => {
    const bytes = textEncoder.encode(value)
    chunks.push(bytes)
    length += bytes.length
  }

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes)
    length += bytes.length
  }

  const offsets: number[] = [0]

  pushString("%PDF-1.4\n")

  const writeObject = (body: Array<string | Uint8Array>) => {
    offsets.push(length)
    body.forEach((part) => {
      if (typeof part === "string") {
        pushString(part)
      } else {
        pushBytes(part)
      }
    })
  }

  const pageCount = pages.length
  const pageObjectNumbers: number[] = []
  const contentObjectNumbers: number[] = []
  let nextObjNumber = 3
  for (let i = 0; i < pageCount; i++) {
    pageObjectNumbers.push(nextObjNumber)
    contentObjectNumbers.push(nextObjNumber + 1)
    nextObjNumber += 2
  }
  const fontObjectNumber = nextObjNumber

  writeObject(["1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"])

  const kids = pageObjectNumbers.map((num) => `${num} 0 R`).join(" ")
  writeObject([`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>\nendobj\n`])

  pages.forEach((page, index) => {
    const contentBytes = textEncoder.encode(page.commands.join("\n"))
    const contentNumber = contentObjectNumbers[index]
    const pageNumber = pageObjectNumbers[index]

    writeObject([
      `${pageNumber} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_CONFIG.width} ${PDF_CONFIG.height}] /Contents ${contentNumber} 0 R /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> >>\nendobj\n`,
    ])

    writeObject([
      `${contentNumber} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`,
      contentBytes,
      "\nendstream\nendobj\n",
    ])
  })

  writeObject([
    `${fontObjectNumber} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
  ])

  const xrefStart = length
  pushString(`xref\n0 ${offsets.length}\n`)
  pushString("0000000000 65535 f \n")
  for (let i = 1; i < offsets.length; i++) {
    pushString(`${offsets[i].toString().padStart(10, "0")} 00000 n \n`)
  }
  pushString(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`)

  const pdfBuffer = new Uint8Array(length)
  let cursor = 0
  for (const chunk of chunks) {
    pdfBuffer.set(chunk, cursor)
    cursor += chunk.length
  }

  return new Blob([pdfBuffer], { type: "application/pdf" })
}

function wrapTextLines(lines: string[], maxWidth = 90): string[] {
  const result: string[] = []

  lines.forEach((line) => {
    if (!line) {
      result.push("")
      return
    }

    const words = line.split(/\s+/).filter(Boolean)
    let current = ""

    words.forEach((word) => {
      if (word.length > maxWidth) {
        if (current) {
          result.push(current)
          current = ""
        }
        for (let i = 0; i < word.length; i += maxWidth) {
          const chunk = word.slice(i, i + maxWidth)
          if (chunk.length === maxWidth) {
            result.push(chunk)
          } else {
            current = chunk
          }
        }
        return
      }

      const candidate = current ? `${current} ${word}` : word
      if (candidate.length > maxWidth) {
        if (current) {
          result.push(current)
        }
        current = word
      } else {
        current = candidate
      }
    })

    if (current) {
      result.push(current)
    }
  })

  return result
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
    if (!analysis) return

    const lines: string[] = []
    const addSection = (title: string, insights: AnalysisInsight[]) => {
      lines.push(`\n${title}`)
      if (insights.length === 0) {
        lines.push("- None")
        return
      }
      insights.forEach((insight, index) => {
        lines.push(`${index + 1}. ${insight.title}`)
        lines.push(`   ${insight.description}`)
        if (insight.tags && insight.tags.length > 0) {
          lines.push(`   Tags: ${insight.tags.join(", ")}`)
        }
        if (typeof insight.confidence === "number") {
          lines.push(`   Confidence: ${insight.confidence}%`)
        }
      })
    }

    lines.push("CVisionAI Analysis Summary")
    lines.push(`Generated: ${new Date().toLocaleString()}`)
    if (analysis.summary) {
      lines.push("\nOverall Summary")
      lines.push(analysis.summary)
    }

    addSection("Strengths", analysis.strengths || [])
    lines.push("")
    addSection("Weaknesses", analysis.weaknesses || [])
    lines.push("")
    addSection("Improvement Opportunities", analysis.improvements || [])

    const pdfLines = wrapTextLines(lines)
    const pdfBlob = createPdfBlob(pdfLines)
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `cv-analysis-${new Date().toISOString().split("T")[0]}.pdf`
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
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">AI Analysis & Insights</h1>
            <p className="text-muted-foreground">We analyzed your resume to surface strengths, gaps, and next steps.</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode === "cards"
                  ? "bg-primary text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Cards
            </button>
            <button
              onClick={() => setViewMode("graph")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode === "graph"
                  ? "bg-primary text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Graph
            </button>
          </div>
          <button
            onClick={handleDownloadSummary}
            disabled={!analysis || isLoading}
            className="btn-secondary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Download Summary
          </button>
        </div>
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

          {viewMode === "cards" && (
            <>
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
            </>
          )}

          {viewMode === "graph" && chartData.length > 0 && (
            <div className="card-base animate-fade-in-up border-t-4 border-t-primary">
              <h2 className="text-lg font-semibold text-foreground mb-6">Analysis Overview</h2>
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
                className="h-[400px] w-full"
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
                    label={{ value: "Count", angle: -90, position: "insideLeft", className: "text-xs fill-muted-foreground" }}
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    label={{ value: "Confidence %", angle: 90, position: "insideRight", className: "text-xs fill-muted-foreground" }}
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
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {chartData.map((item) => (
                  <div
                    key={item.category}
                    className="p-4 rounded-lg border border-border bg-muted/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <h3 className="font-semibold text-foreground text-sm">{item.category}</h3>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>Count: <span className="text-foreground font-medium">{item.count}</span></p>
                      <p>Avg Confidence: <span className="text-foreground font-medium">{item.avgConfidence}%</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === "graph" && chartData.length === 0 && (
            <div className="card-base animate-fade-in-up border border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground">
              <p className="font-medium mb-2">No data available for graph view.</p>
              <p className="text-sm">Switch to cards view to see detailed insights.</p>
            </div>
          )}
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
