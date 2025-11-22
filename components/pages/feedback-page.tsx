"use client"

import { useState, useEffect, useMemo } from "react"
import { Copy, Check, ArrowRight, ArrowLeft, Download, Loader2, Zap, Eye } from "lucide-react"
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

const PDF_CONFIG = {
  width: 612,
  height: 792,
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

  return (
    <div className="space-y-6">
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-foreground">Feedback & Suggestions</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Eye className="w-4 h-4" />
              View in Popup
            </button>
            <button
              onClick={handleDownloadFeedback}
              disabled={feedbackItems.length === 0 || isLoading}
              className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="card-base animate-fade-in-up border border-dashed border-primary/40 bg-primary/5 flex items-center gap-3 py-6 px-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <div>
            <p className="font-medium text-foreground">Generating feedback…</p>
            <p className="text-sm text-muted-foreground">We're analyzing your resume to provide actionable suggestions.</p>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="card-base animate-fade-in-up border border-error/40 bg-error/5 text-error">
          <p className="font-semibold mb-2">We couldn't generate feedback.</p>
          <p className="text-sm text-error/80 mb-4">{error}</p>
          <button onClick={handleRetry} className="btn-secondary text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !error && feedbackItems.length > 0 && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 animate-slide-in-right">
            {categories.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                  activeFilter === filter
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-muted text-foreground hover:bg-border hover:shadow-md"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map((item, i) => (
              <div
                key={item.id}
                className={`card-base border-l-4 transition-all duration-300 animate-fade-in-up ${
                  item.priority === "high" ? "border-l-error" : "border-l-secondary"
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          item.priority === "high" ? "bg-error/10 text-error" : "bg-secondary/10 text-secondary"
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleCopy(item.id)}
                        className="flex items-center gap-1 text-xs text-primary hover:opacity-70 transition-opacity"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!isLoading && !error && feedbackItems.length === 0 && (
        <div className="card-base animate-fade-in-up border border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground">
          <p className="font-medium mb-2">No feedback available yet.</p>
          <p className="text-sm">
            We need more details in your resume to generate meaningful feedback. Try expanding your experience or skills.
          </p>
        </div>
      )}

      <div className="flex justify-between gap-4 mt-8">
        <button onClick={onPrevious} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>
        <button onClick={() => onNext()} className="btn-primary flex items-center gap-2">
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
