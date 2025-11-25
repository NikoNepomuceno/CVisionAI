"use client"

import { useEffect, useState } from "react"
import { Copy, Check, TrendingUp, ArrowRight, ArrowLeft, Loader2, Sparkles, AlertCircle, Target, Zap, Search, BarChart3 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { KeywordAnalysis } from "@/lib/deepseek"

interface KeywordPageProps {
  resumeData: {
    skills: string[]
    experience: Array<{ company: string; role: string; duration?: string; description?: string }>
    education: Array<{ school: string; degree: string; year?: string }>
    summary?: string
    keywordAnalysis?: KeywordAnalysis | null
    keywordJobDescription?: string
  }
  onNext: (data: any) => void
  onPrevious: () => void
  onPersist?: (data: { keywordAnalysis?: KeywordAnalysis | null; keywordJobDescription?: string }) => void
}

export default function KeywordPage({ resumeData, onNext, onPrevious, onPersist }: KeywordPageProps) {
  const [jobDescription, setJobDescription] = useState(resumeData.keywordJobDescription ?? "")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<KeywordAnalysis | null>(resumeData.keywordAnalysis ?? null)

  // Keep local state in sync if resume data updates (e.g., navigating back)
  useEffect(() => {
    if (resumeData.keywordAnalysis) {
      setAnalysis(resumeData.keywordAnalysis)
    }
    if (typeof resumeData.keywordJobDescription === "string") {
      setJobDescription(resumeData.keywordJobDescription)
    }
  }, [resumeData.keywordAnalysis, resumeData.keywordJobDescription])

  const handleAnalyze = async () => {
    if (!jobDescription.trim() || jobDescription.trim().length < 10) {
      toast({
        variant: "destructive",
        title: "Invalid job description",
        description: "Please paste a job description with at least 10 characters.",
      })
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: resumeData,
          jobDescription: jobDescription.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Analysis failed")
      }

      const result = await response.json()
      const keywordAnalysis = result.data
      setAnalysis(keywordAnalysis)
      
      // Persist the analysis and job description
      if (onPersist) {
        onPersist({
          keywordAnalysis,
          keywordJobDescription: jobDescription.trim(),
        })
      }
      
      toast({
        title: "Analysis complete",
        description: "Keyword matching analysis is ready.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: error.message || "Failed to analyze keywords. Please try again.",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(text)
    setTimeout(() => setCopiedId(null), 2000)
    toast({
      title: "Copied!",
      description: "Keyword copied to clipboard.",
    })
  }

  // Use real data if analysis exists, otherwise show placeholder with actual resume skills
  const yourSkills = analysis?.yourSkills || resumeData.skills.map((skill) => ({ skill, match: 0, foundInJob: false }))
  const jobKeywords = analysis?.jobKeywords || []
  const matchPercentage = analysis?.matchPercentage || 0
  const missingKeywords = analysis?.missingKeywords || []
  const suggestions = analysis?.suggestions || []

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return "from-success to-success/70"
    if (percentage >= 60) return "from-secondary to-secondary/70"
    if (percentage >= 40) return "from-primary to-primary/70"
    return "from-error to-error/70"
  }

  const getMatchLabel = (percentage: number) => {
    if (percentage >= 80) return "Excellent Match"
    if (percentage >= 60) return "Good Match"
    if (percentage >= 40) return "Fair Match"
    return "Needs Improvement"
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 py-4 sm:py-6">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 w-full space-y-4 sm:space-y-6">
          {/* Enhanced Header */}
          <div className="text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 bg-primary/10 rounded-full border border-primary/20 mb-3 sm:mb-4">
              <Target className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">Keyword Optimization</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3">Keyword Match Analysis</h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2 sm:px-0 leading-relaxed">
              Compare your skills with job requirements to optimize your resume for ATS systems.
            </p>
          </div>

          {/* Job Description Input */}
          <div className="card-base animate-fade-in-up border-t-3 sm:border-t-4 border-t-primary rounded-xl p-4 sm:p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Paste Job Description</h2>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here to analyze keyword matches and optimize your resume for this specific role..."
              className="input-base min-h-32 resize-none text-sm rounded-lg border-2 focus:border-primary/50 transition-colors"
              disabled={isAnalyzing}
            />
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <span className="text-xs text-muted-foreground text-center sm:text-left">
                {jobDescription.length > 0 ? `${jobDescription.length} characters` : "Paste job description to begin"}
              </span>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !jobDescription.trim() || jobDescription.trim().length < 10}
                className="btn-primary flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform text-sm w-full sm:w-auto"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Analyzing Keywords...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Analyze Keywords</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Skills Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Your Skills */}
            <div className="card-base animate-fade-in-up border-t-3 sm:border-t-4 border-t-secondary rounded-xl p-4 sm:p-6 hover:shadow-md transition-all duration-300" style={{ animationDelay: "100ms" }}>
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-secondary flex-shrink-0" />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">Your Skills</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">{yourSkills.length} skills detected</p>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {yourSkills.length > 0 ? (
                  yourSkills.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 sm:p-4 rounded-lg hover:bg-secondary/5 transition-all duration-200 group border border-border hover:border-secondary/30"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${item.foundInJob ? "bg-success" : "bg-muted-foreground/30"}`} />
                        <span className="text-xs sm:text-sm font-medium text-foreground truncate">{item.skill}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
                        <div className="w-16 sm:w-20 h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r transition-all duration-500 ${getMatchColor(item.match)}`}
                            style={{ width: `${item.match}%` }}
                          />
                        </div>
                        <span className={`text-xs sm:text-sm font-semibold w-8 sm:w-10 text-right ${
                          item.match >= 80 ? "text-success" :
                          item.match >= 60 ? "text-secondary" :
                          item.match >= 40 ? "text-primary" : "text-error"
                        }`}>
                          {item.match}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <Zap className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 opacity-50" />
                    <p className="text-xs sm:text-sm">No skills found in your resume.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Job Keywords */}
            <div className="card-base animate-fade-in-up border-t-3 sm:border-t-4 border-t-primary rounded-xl p-4 sm:p-6 hover:shadow-md transition-all duration-300" style={{ animationDelay: "200ms" }}>
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">Job Keywords</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">{jobKeywords.length} keywords extracted</p>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {jobKeywords.length > 0 ? (
                  jobKeywords.map((item, i) => (
                    <div
                      key={i}
                      className={`group flex items-center justify-between p-3 sm:p-4 rounded-lg transition-all duration-200 hover:shadow-md border ${
                        item.matched
                          ? "bg-success/10 border-success/20 hover:border-success/30"
                          : "bg-muted/50 border-transparent hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${item.matched ? "bg-success" : "bg-primary"}`} />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs sm:text-sm font-medium text-foreground block truncate">{item.keyword}</span>
                          <span className="text-xs text-muted-foreground">Mentioned {item.frequency} time{item.frequency !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(item.keyword)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all duration-200 flex-shrink-0 bg-background/80 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 hover:scale-110"
                      >
                        {copiedId === item.keyword ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : <Copy className="w-3 h-3 sm:w-4 sm:h-4" />}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <Target className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 opacity-50" />
                    <p className="text-xs sm:text-sm">No keywords extracted yet. Analyze a job description first.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-4 sm:space-y-6">
              {/* Match Score */}
              <div
                className="card-base bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-4 sm:p-6 animate-fade-in-up hover:shadow-md transition-all duration-300"
                style={{ animationDelay: "300ms" }}
              >
                <div className="flex flex-col items-center text-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-primary flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-foreground text-lg sm:text-xl">Overall Match Score</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">How well your resume matches this job description</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 w-full">
                    <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-primary">{matchPercentage}%</div>
                    <div className={`text-base sm:text-lg font-semibold ${getMatchColor(matchPercentage).replace('from-', 'text-').split(' ')[0]}`}>
                      {getMatchLabel(matchPercentage)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Missing Keywords */}
              {missingKeywords.length > 0 && (
                <div className="card-base animate-fade-in-up border-t-3 sm:border-t-4 border-t-error rounded-xl p-4 sm:p-6 hover:shadow-md transition-all duration-300" style={{ animationDelay: "400ms" }}>
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-error flex-shrink-0" />
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">Missing Keywords</h3>
                  </div>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">These important keywords from the job description are missing from your resume:</p>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {missingKeywords.map((keyword, i) => (
                      <span
                        key={i}
                        className="text-xs sm:text-sm bg-error/10 text-error px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-error/20 hover:bg-error/15 transition-colors"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div
                  className="card-base animate-fade-in-up border-t-3 sm:border-t-4 border-t-secondary rounded-xl p-4 sm:p-6 hover:shadow-md transition-all duration-300"
                  style={{ animationDelay: "500ms" }}
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-secondary flex-shrink-0" />
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">Optimization Suggestions</h3>
                  </div>
                  <ul className="space-y-2 sm:space-y-3">
                    {suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-secondary/5 hover:bg-secondary/10 transition-colors">
                        <span className="text-secondary mt-1 flex-shrink-0 text-sm">•</span>
                        <span className="text-foreground leading-relaxed text-sm sm:text-base">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!analysis && !isAnalyzing && (
            <div className="card-base text-center py-8 sm:py-12 text-muted-foreground animate-fade-in-up rounded-xl border-2 border-dashed border-muted-foreground/30">
              <Target className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 opacity-50" />
              <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Ready for Analysis</h3>
              <p className="text-xs sm:text-sm max-w-md mx-auto px-2">
                Paste a job description above and click "Analyze Keywords" to see how well your resume matches the role.
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
              Back to Feedback
            </button>
            <button
              onClick={() =>
                onNext({
                  keywordAnalysis: analysis,
                  keywordJobDescription: jobDescription.trim(),
                })
              }
              disabled={!analysis}
              className="btn-primary flex items-center justify-center gap-2 order-1 sm:order-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed py-2.5 sm:py-3 text-sm w-full sm:w-auto"
            >
              View Results Summary
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
