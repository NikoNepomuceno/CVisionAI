"use client"

import { useMemo } from "react"
import { CheckCircle2, TrendingUp, Download, Share2, Sparkles, ArrowLeft } from "lucide-react"
import type { KeywordAnalysis, ResumeAnalysis } from "@/lib/deepseek"
import { toast } from "@/hooks/use-toast"

interface ResultsPageProps {
  resumeData: {
    skills: string[]
    experience: Array<{ company: string; role: string; duration?: string; description?: string }>
    education: Array<{ school: string; degree: string; year?: string }>
    summary?: string
    analysis?: ResumeAnalysis
    keywordAnalysis?: KeywordAnalysis
  }
  onNext: (data: any) => void
  onPrevious: () => void
}

const PDF_CONFIG = {
  width: 612,
  height: 792,
  margin: 64,
  lineHeight: 16,
  startY: 728,
}
const MAX_LINES_PER_PAGE = Math.floor((PDF_CONFIG.startY - PDF_CONFIG.margin) / PDF_CONFIG.lineHeight)

function escapePdfText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/$$/g, "\\(").replace(/$$/g, "\\)")
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

  writeObject([`${fontObjectNumber} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`])

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

export default function ResultsPage({ resumeData, onNext, onPrevious }: ResultsPageProps) {
  const keywordAnalysis = resumeData.keywordAnalysis
  const analysis = resumeData.analysis

  // Calculate metrics from real data
  const matchPercentage = keywordAnalysis?.matchPercentage ?? 0
  const topStrengths = useMemo(() => {
    if (!analysis?.strengths || analysis.strengths.length === 0) return []
    return analysis.strengths.slice(0, 3).map((s) => s.title)
  }, [analysis])

  const skillsBreakdown = useMemo(() => {
    if (!keywordAnalysis) {
      return [
        { label: "Technical", value: 0 },
        { label: "Keywords", value: 0 },
        { label: "Match", value: 0 },
      ]
    }

    // Calculate average match for skills found in job
    const matchedSkills = keywordAnalysis.yourSkills.filter((s) => s.foundInJob)
    const avgMatch =
      matchedSkills.length > 0
        ? Math.round(matchedSkills.reduce((sum, s) => sum + s.match, 0) / matchedSkills.length)
        : 0

    // Calculate keyword match percentage
    const matchedKeywords = keywordAnalysis.jobKeywords.filter((k) => k.matched).length
    const keywordMatch =
      keywordAnalysis.jobKeywords.length > 0
        ? Math.round((matchedKeywords / keywordAnalysis.jobKeywords.length) * 100)
        : 0

    return [
      { label: "Technical", value: avgMatch },
      { label: "Keywords", value: keywordMatch },
      { label: "Overall Match", value: matchPercentage },
    ]
  }, [keywordAnalysis, matchPercentage])

  const nextSteps = useMemo(() => {
    if (keywordAnalysis?.suggestions && keywordAnalysis.suggestions.length > 0) {
      return keywordAnalysis.suggestions.slice(0, 5).map((s) => `✓ ${s}`)
    }
    if (analysis?.improvements && analysis.improvements.length > 0) {
      return analysis.improvements.slice(0, 5).map((i) => `✓ ${i.title}`)
    }
    return ["✓ Review your resume analysis", "✓ Check keyword matches", "✓ Apply to recommended jobs"]
  }, [keywordAnalysis, analysis])

  const improvementsCount = useMemo(() => {
    if (analysis?.improvements) return analysis.improvements.length
    if (keywordAnalysis?.suggestions) return keywordAnalysis.suggestions.length
    return 0
  }, [analysis, keywordAnalysis])

  const handleDownloadPDF = () => {
    const lines: string[] = []
    lines.push("CVisionAI Resume Analysis Results")
    lines.push(`Generated: ${new Date().toLocaleString()}`)
    lines.push("")

    // Overall Match Score
    if (keywordAnalysis) {
      lines.push("Overall Match Score")
      lines.push("=".repeat(20))
      lines.push(`${matchPercentage}%`)
      lines.push("")
    }

    // Top Strengths
    if (topStrengths.length > 0) {
      lines.push("Top Strengths")
      lines.push("=".repeat(12))
      topStrengths.forEach((strength, i) => {
        lines.push(`${i + 1}. ${strength}`)
      })
      lines.push("")
    }

    // Skills Breakdown
    if (skillsBreakdown.length > 0) {
      lines.push("Skills Breakdown")
      lines.push("=".repeat(16))
      skillsBreakdown.forEach((item) => {
        lines.push(`${item.label}: ${item.value}%`)
      })
      lines.push("")
    }

    // Next Steps
    if (nextSteps.length > 0) {
      lines.push("Next Steps")
      lines.push("=".repeat(10))
      nextSteps.forEach((step) => {
        lines.push(step.replace("✓ ", ""))
      })
      lines.push("")
    }

    // Missing Keywords
    if (keywordAnalysis?.missingKeywords && keywordAnalysis.missingKeywords.length > 0) {
      lines.push("Missing Keywords")
      lines.push("=".repeat(16))
      keywordAnalysis.missingKeywords.forEach((keyword) => {
        lines.push(`- ${keyword}`)
      })
      lines.push("")
    }

    // Analysis Summary
    if (analysis?.summary) {
      lines.push("Analysis Summary")
      lines.push("=".repeat(16))
      lines.push(analysis.summary)
      lines.push("")
    }

    const pdfLines = wrapTextLines(lines)
    const pdfBlob = createPdfBlob(pdfLines)
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `cv-results-${new Date().toISOString().split("T")[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "PDF Downloaded",
      description: "Your results report has been downloaded.",
    })
  }

  const handleShareReport = async () => {
    const shareText = `My Resume Analysis Results:\n\nMatch Score: ${matchPercentage}%\n\nTop Strengths:\n${topStrengths.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nGenerated by CVisionAI`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "CVisionAI Resume Analysis Results",
          text: shareText,
        })
        toast({
          title: "Shared Successfully",
          description: "Your results have been shared.",
        })
      } catch (err: any) {
        if (err.name !== "AbortError") {
          // Fallback to clipboard
          await navigator.clipboard.writeText(shareText)
          toast({
            title: "Copied to Clipboard",
            description: "Results have been copied to your clipboard.",
          })
        }
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareText)
      toast({
        title: "Copied to Clipboard",
        description: "Results have been copied to your clipboard.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8 animate-fade-in-up">
        <div className="flex justify-center">
          <div className="w-16 sm:w-20 h-16 sm:h-20 bg-success/10 rounded-full flex items-center justify-center animate-pulse-glow">
            <CheckCircle2 className="w-8 sm:w-12 h-8 sm:h-12 text-success" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Your Resume is Ready!</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          {improvementsCount > 0
            ? `You've identified ${improvementsCount} key areas to improve. Time to apply!`
            : "Your resume analysis is complete. Time to apply!"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Match Score */}
        <div className="card-base hover:shadow-lg transition-all duration-300 animate-fade-in-up border-t-4 border-t-primary">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Overall Match Score</h3>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
            <div className="text-3xl sm:text-5xl font-bold text-primary">{matchPercentage}%</div>
            {keywordAnalysis && matchPercentage > 0 && (
              <div className="flex items-center gap-1 text-success">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">
                  {matchPercentage >= 80
                    ? "Excellent match"
                    : matchPercentage >= 60
                      ? "Good match"
                      : "Needs improvement"}
                </span>
              </div>
            )}
          </div>
          {!keywordAnalysis && (
            <p className="text-xs text-muted-foreground mt-2">Complete keyword analysis to see your match score</p>
          )}
        </div>

        {/* Top Strengths */}
        <div
          className="card-base hover:shadow-lg transition-all duration-300 animate-fade-in-up border-t-4 border-t-secondary"
          style={{ animationDelay: "100ms" }}
        >
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-4">Top Strengths</h3>
          <div className="space-y-2">
            {topStrengths.length > 0 ? (
              topStrengths.map((strength, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-foreground">{strength}</span>
                </div>
              ))
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground">Complete analysis to see your strengths</p>
            )}
          </div>
        </div>

        {/* Skills Breakdown */}
        <div
          className="card-base hover:shadow-lg transition-all duration-300 animate-fade-in-up border-t-4 border-t-accent"
          style={{ animationDelay: "200ms" }}
        >
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-4">Skills Breakdown</h3>
          <div className="space-y-3">
            {skillsBreakdown.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs sm:text-sm font-medium text-foreground">{item.label}</span>
                  <span className="text-xs sm:text-sm text-muted-foreground">{item.value}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div
          className="card-base hover:shadow-lg transition-all duration-300 animate-fade-in-up border-t-4 border-t-primary"
          style={{ animationDelay: "300ms" }}
        >
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-4">Next Steps</h3>
          <div className="space-y-2">
            {nextSteps.map((step, i) => (
              <div key={i} className="text-xs sm:text-sm text-foreground">
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-6 sm:mt-8 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex-1 btn-secondary flex items-center justify-center gap-2 hover:shadow-md transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={handleShareReport}
            className="flex-1 btn-secondary flex items-center justify-center gap-2 hover:shadow-md transition-all text-sm"
          >
            <Share2 className="w-4 h-4" />
            Share Report
          </button>
        </div>
        <button onClick={() => onNext()} className="w-full btn-primary flex items-center justify-center gap-2 text-sm">
          <Sparkles className="w-4 h-4" />
          View Job Recommendations
        </button>
      </div>

      <div className="flex justify-between gap-3 mt-6 sm:mt-8">
        <button onClick={onPrevious} className="btn-secondary flex items-center gap-2 text-sm flex-1 sm:flex-none">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>
      </div>
    </div>
  )
}
