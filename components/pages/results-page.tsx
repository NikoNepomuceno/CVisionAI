"use client"

import { useMemo } from "react"
import { CheckCircle2, TrendingUp, Download, Share2, Sparkles, ArrowLeft, Target, Zap, BarChart3, Rocket, Award, Star } from "lucide-react"
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

// ... (keep all your existing PDF functions: createPdfBlob, escapePdfText, wrapTextLines)

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

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return "text-success"
    if (percentage >= 60) return "text-secondary"
    if (percentage >= 40) return "text-primary"
    return "text-error"
  }

  const getMatchLabel = (percentage: number) => {
    if (percentage >= 80) return "Excellent Match"
    if (percentage >= 60) return "Good Match"
    if (percentage >= 40) return "Fair Match"
    return "Needs Improvement"
  }

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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Enhanced Header */}
      <div className="text-center space-y-4 mb-8 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full border border-success/20 mb-4">
          <Award className="w-4 h-4 text-success" />
          <span className="text-sm font-medium text-success">Analysis Complete</span>
        </div>
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-success/20 to-success/10 rounded-full flex items-center justify-center animate-pulse border-2 border-success/30">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground">Your Resume is Ready!</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {improvementsCount > 0
            ? `You've identified ${improvementsCount} key areas to improve. Time to apply!`
            : "Your resume analysis is complete. Time to apply!"}
        </p>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Match Score Card */}
        <div className="card-base hover:shadow-xl transition-all duration-300 animate-fade-in-up border-t-4 border-t-primary rounded-xl p-6 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-8 h-8 text-primary" />
            <div>
              <h3 className="text-xl font-bold text-foreground">Overall Match Score</h3>
              <p className="text-sm text-muted-foreground">Your resume compatibility</p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-7xl lg:text-8xl font-bold text-primary mb-4">{matchPercentage}%</div>
            {keywordAnalysis && matchPercentage > 0 && (
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 border border-border">
                <TrendingUp className="w-5 h-5 text-success" />
                <span className={`text-lg font-semibold ${getMatchColor(matchPercentage)}`}>
                  {getMatchLabel(matchPercentage)}
                </span>
              </div>
            )}
          </div>
          {!keywordAnalysis && (
            <p className="text-center text-muted-foreground mt-4">Complete keyword analysis to see your match score</p>
          )}
        </div>

        {/* Top Strengths Card */}
        <div
          className="card-base hover:shadow-xl transition-all duration-300 animate-fade-in-up border-t-4 border-t-secondary rounded-xl p-6"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-8 h-8 text-secondary" />
            <div>
              <h3 className="text-xl font-bold text-foreground">Top Strengths</h3>
              <p className="text-sm text-muted-foreground">Your competitive advantages</p>
            </div>
          </div>
          <div className="space-y-4">
            {topStrengths.length > 0 ? (
              topStrengths.map((strength, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/5 hover:bg-secondary/10 transition-colors group">
                  <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <span className="text-foreground font-medium leading-relaxed">{strength}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Complete analysis to see your strengths</p>
              </div>
            )}
          </div>
        </div>

        {/* Skills Breakdown Card */}
        <div
          className="card-base hover:shadow-xl transition-all duration-300 animate-fade-in-up border-t-4 border-t-accent rounded-xl p-6"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-8 h-8 text-accent" />
            <div>
              <h3 className="text-xl font-bold text-foreground">Skills Breakdown</h3>
              <p className="text-sm text-muted-foreground">Detailed performance metrics</p>
            </div>
          </div>
          <div className="space-y-6">
            {skillsBreakdown.map((item, i) => (
              <div key={i} className="group">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.label}</span>
                  <span className={`text-lg font-bold ${getMatchColor(item.value)}`}>{item.value}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-1000 ease-out group-hover:from-primary/80 group-hover:to-primary/60"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps Card */}
        <div
          className="card-base hover:shadow-xl transition-all duration-300 animate-fade-in-up border-t-4 border-t-primary rounded-xl p-6"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Rocket className="w-8 h-8 text-primary" />
            <div>
              <h3 className="text-xl font-bold text-foreground">Next Steps</h3>
              <p className="text-sm text-muted-foreground">Your action plan</p>
            </div>
          </div>
          <div className="space-y-3">
            {nextSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors group">
                <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-3 h-3 text-success" />
                </div>
                <span className="text-foreground leading-relaxed">{step.replace("✓ ", "")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
        <button
          onClick={handleDownloadPDF}
          className="flex-1 btn-secondary flex items-center justify-center gap-3 px-6 py-4 text-base font-medium hover:scale-105 transition-transform rounded-xl"
        >
          <Download className="w-5 h-5" />
          Download PDF Report
        </button>
        <button
          onClick={handleShareReport}
          className="flex-1 btn-secondary flex items-center justify-center gap-3 px-6 py-4 text-base font-medium hover:scale-105 transition-transform rounded-xl"
        >
          <Share2 className="w-5 h-5" />
          Share Results
        </button>
        <button 
          onClick={() => onNext()} 
          className="flex-1 btn-primary flex items-center justify-center gap-3 px-6 py-4 text-base font-medium hover:scale-105 transition-transform rounded-xl"
        >
          <Sparkles className="w-5 h-5" />
          View Job Recommendations
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-6 border-t border-border">
        <button 
          onClick={onPrevious} 
          className="btn-secondary flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Keywords
        </button>
      </div>
    </div>
  )
}
