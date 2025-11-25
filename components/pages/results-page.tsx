"use client"

import { useMemo } from "react"
import { CheckCircle2, TrendingUp, Download, Share2, Sparkles, ArrowLeft, Target, Zap, BarChart3, Rocket, Award, Star } from "lucide-react"
import type { KeywordAnalysis, ResumeAnalysis } from "@/lib/deepseek"
import { toast } from "@/hooks/use-toast"
import { createPdfBlob, downloadPdf, type PDFSection } from "@/lib/pdf-utils"

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

// PDF generation now handled by shared utility in lib/pdf-utils.ts

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
    const sections: PDFSection[] = []

    // Overall Match Score
    if (keywordAnalysis) {
      sections.push({
        title: 'Overall Match Score',
        type: 'section',
        content: [
          `**${matchPercentage}%** - ${getMatchLabel(matchPercentage)}`,
          keywordAnalysis.matchPercentage > 0 
            ? `Your resume matches ${matchPercentage}% of the job requirements.`
            : 'Complete keyword analysis to see your match score.',
        ],
      })
    }

    // Top Strengths
    if (topStrengths.length > 0) {
      sections.push({
        title: 'Top Strengths',
        type: 'section',
        content: topStrengths.map((strength, i) => `${i + 1}. ${strength}`),
      })
    }

    // Skills Breakdown
    if (skillsBreakdown.length > 0) {
      const breakdownContent = skillsBreakdown.map((item) => 
        `- ${item.label}: ${item.value}%`
      )
      sections.push({
        title: 'Skills Breakdown',
        type: 'section',
        content: breakdownContent,
      })
    }

    // Next Steps
    if (nextSteps.length > 0) {
      sections.push({
        title: 'Next Steps',
        type: 'section',
        content: nextSteps.map((step) => step.replace("✓ ", "")),
      })
    }

    // Missing Keywords
    if (keywordAnalysis?.missingKeywords && keywordAnalysis.missingKeywords.length > 0) {
      sections.push({
        title: 'Missing Keywords',
        type: 'section',
        content: keywordAnalysis.missingKeywords.map((keyword) => `- ${keyword}`),
      })
    }

    // Analysis Summary
    if (analysis?.summary) {
      sections.push({
        title: 'Analysis Summary',
        type: 'section',
        content: [analysis.summary],
      })
    }

    const metadata = {
      title: 'CVisionAI Resume Analysis Results',
      subtitle: 'Comprehensive Resume Analysis & Match Score',
      generatedAt: new Date(),
      footer: 'Generated by CVisionAI - AI-Powered Resume Analysis Tool | Confidential Report - For personal use only',
    }

    const pdfBlob = createPdfBlob(sections, metadata)
    const filename = `cv-results-${new Date().toISOString().split("T")[0]}.pdf`
    downloadPdf(pdfBlob, filename)

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
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 py-4 sm:py-6">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 w-full space-y-4 sm:space-y-6">
          {/* Enhanced Header */}
          <div className="text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 bg-success/10 rounded-full border border-success/20 mb-3 sm:mb-4">
              <Award className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
              <span className="text-xs sm:text-sm font-medium text-success">Analysis Complete</span>
            </div>
            <div className="flex justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-success/20 to-success/10 rounded-full flex items-center justify-center animate-pulse border-2 border-success/30">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-success" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Your Resume is Ready!</h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-0 leading-relaxed">
              {improvementsCount > 0
                ? `You've identified ${improvementsCount} key areas to improve. Time to apply!`
                : "Your resume analysis is complete. Time to apply!"}
            </p>
          </div>

          {/* Main Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Match Score Card */}
            <div className="card-base hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 animate-fade-in-up border-t-3 sm:border-t-4 border-t-primary rounded-xl p-4 sm:p-6 bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-primary flex-shrink-0" />
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">Overall Match Score</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Your resume compatibility</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-primary mb-3 sm:mb-4">{matchPercentage}%</div>
                {keywordAnalysis && matchPercentage > 0 && (
                  <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5 sm:px-4 sm:py-2 border border-border">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                    <span className={`text-sm sm:text-base font-semibold ${getMatchColor(matchPercentage)}`}>
                      {getMatchLabel(matchPercentage)}
                    </span>
                  </div>
                )}
              </div>
              {!keywordAnalysis && (
                <p className="text-center text-muted-foreground mt-3 sm:mt-4 text-xs sm:text-sm">Complete keyword analysis to see your match score</p>
              )}
            </div>

            {/* Top Strengths Card */}
            <div
              className="card-base hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 animate-fade-in-up border-t-3 sm:border-t-4 border-t-secondary rounded-xl p-4 sm:p-6"
              style={{ animationDelay: "100ms" }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-secondary flex-shrink-0" />
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">Top Strengths</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Your competitive advantages</p>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {topStrengths.length > 0 ? (
                  topStrengths.map((strength, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-secondary/5 hover:bg-secondary/10 transition-colors group">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                      </div>
                      <span className="text-foreground font-medium leading-relaxed text-sm sm:text-base">{strength}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <Star className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 opacity-50" />
                    <p className="text-sm">Complete analysis to see your strengths</p>
                  </div>
                )}
              </div>
            </div>

            {/* Skills Breakdown Card */}
            <div
              className="card-base hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 animate-fade-in-up border-t-3 sm:border-t-4 border-t-accent rounded-xl p-4 sm:p-6"
              style={{ animationDelay: "200ms" }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-accent flex-shrink-0" />
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">Skills Breakdown</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Detailed performance metrics</p>
                </div>
              </div>
              <div className="space-y-4 sm:space-y-6">
                {skillsBreakdown.map((item, i) => (
                  <div key={i} className="group">
                    <div className="flex justify-between items-center mb-2 sm:mb-3">
                      <span className="font-semibold text-foreground text-sm sm:text-base group-hover:text-primary transition-colors">{item.label}</span>
                      <span className={`text-base sm:text-lg font-bold ${getMatchColor(item.value)}`}>{item.value}%</span>
                    </div>
                    <div className="w-full h-2 sm:h-3 bg-muted rounded-full overflow-hidden">
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
              className="card-base hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 animate-fade-in-up border-t-3 sm:border-t-4 border-t-primary rounded-xl p-4 sm:p-6"
              style={{ animationDelay: "300ms" }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Rocket className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-primary flex-shrink-0" />
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">Next Steps</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Your action plan</p>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {nextSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors group">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-success" />
                    </div>
                    <span className="text-foreground leading-relaxed text-sm sm:text-base">{step.replace("✓ ", "")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons - Updated Layout */}
          <div 
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 animate-fade-in-up" 
            style={{ animationDelay: "400ms" }}
          >
            <button
              onClick={handleDownloadPDF}
              className="btn-secondary flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium hover:scale-105 transition-transform rounded-xl flex-1"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              Download PDF Report
            </button>
            <button
              onClick={handleShareReport}
              className="btn-secondary flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium hover:scale-105 transition-transform rounded-xl flex-1"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              Share Results
            </button>
            <button 
              onClick={() => onNext()} 
              className="btn-primary flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium hover:scale-105 transition-transform rounded-xl flex-1"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              View Job Recommendations
            </button>
          </div>

          {/* Navigation */}
          <div className="flex justify-center sm:justify-start mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border">
            <button 
              onClick={onPrevious} 
              className="btn-secondary flex items-center gap-2 hover:scale-105 transition-transform py-2.5 sm:py-3 text-sm w-full sm:w-auto justify-center sm:justify-start px-6"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              Back to Keywords
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}