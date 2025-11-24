"use client"

import { useEffect, useState } from "react"
import { Copy, Check, TrendingUp, ArrowRight, ArrowLeft, Loader2, Sparkles, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { KeywordAnalysis } from "@/lib/deepseek"

interface KeywordPageProps {
  resumeData: {
    skills: string[]
    experience: Array<{ company: string; role: string; duration?: string; description?: string }>
    education: Array<{ school: string; degree: string; year?: string }>
    summary?: string
    keywordAnalysis?: KeywordAnalysis
    keywordJobDescription?: string
  }
  onNext: (data: any) => void
  onPrevious: () => void
  onPersist: (data: { keywordAnalysis?: KeywordAnalysis | null; keywordJobDescription?: string }) => void
}

export default function KeywordPage({ resumeData, onNext, onPrevious, onPersist }: KeywordPageProps) {
  const [jobDescription, setJobDescription] = useState(resumeData.keywordJobDescription || "")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<KeywordAnalysis | null>(resumeData.keywordAnalysis || null)

  useEffect(() => {
    setJobDescription(resumeData.keywordJobDescription || "")
  }, [resumeData.keywordJobDescription])

  useEffect(() => {
    setAnalysis(resumeData.keywordAnalysis || null)
  }, [resumeData.keywordAnalysis])

  useEffect(() => {
    onPersist({ keywordJobDescription: jobDescription })
  }, [jobDescription, onPersist])

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
      setAnalysis(result.data)
      onPersist({ keywordAnalysis: result.data, keywordJobDescription: jobDescription.trim() })
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

  const handleProceed = () => {
    if (!analysis) return
    onNext({ keywordAnalysis: analysis, keywordJobDescription: jobDescription.trim() })
  }

  // Use real data if analysis exists, otherwise show placeholder with actual resume skills
  const yourSkills = analysis?.yourSkills || resumeData.skills.map((skill) => ({ skill, match: 0, foundInJob: false }))
  const jobKeywords = analysis?.jobKeywords || []
  const matchPercentage = analysis?.matchPercentage || 0
  const missingKeywords = analysis?.missingKeywords || []
  const suggestions = analysis?.suggestions || []

  return (
    <div className="space-y-6">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-foreground mb-2">Keyword Match Analysis</h1>
        <p className="text-muted-foreground">Compare your skills with job requirements</p>
      </div>

      <div className="card-base animate-fade-in-up border-t-4 border-t-primary">
        <label className="block text-sm font-medium text-foreground mb-2">Paste Job Description</label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here to analyze keyword matches..."
          className="input-base min-h-32 resize-none"
          disabled={isAnalyzing}
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !jobDescription.trim() || jobDescription.trim().length < 10}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze Keywords
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-base animate-fade-in-up border-t-4 border-t-secondary" style={{ animationDelay: "100ms" }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Skills</h2>
          <div className="space-y-3">
            {yourSkills.length > 0 ? (
              yourSkills.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between hover:bg-primary/5 p-2 rounded transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">{item.skill}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r transition-all ${
                          item.foundInJob ? "from-success to-success/70" : "from-primary to-primary/70"
                        }`}
                        style={{ width: `${item.match}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{item.match}%</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No skills found in resume.</p>
            )}
          </div>
        </div>

        <div className="card-base animate-fade-in-up border-t-4 border-t-accent" style={{ animationDelay: "200ms" }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Job Keywords</h2>
          <div className="space-y-2">
            {jobKeywords.length > 0 ? (
              jobKeywords.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:shadow-md ${
                    item.matched
                      ? "bg-success/10 border-2 border-success/20"
                      : "bg-muted hover:bg-muted/80 border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.matched ? "bg-success" : "bg-secondary"}`} />
                    <span className="text-sm font-medium text-foreground">{item.keyword}</span>
                    <span className="text-xs text-muted-foreground">({item.frequency}x)</span>
                  </div>
                  <button
                    onClick={() => handleCopy(item.keyword)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {copiedId === item.keyword ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No keywords extracted yet. Analyze a job description first.</p>
            )}
          </div>
        </div>
      </div>

      {analysis && (
        <>
          <div
            className="card-base bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 border-2 animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Overall Match Score
                </h3>
                <p className="text-sm text-muted-foreground">How well your resume matches this job</p>
              </div>
              <div className="text-5xl font-bold text-primary">{matchPercentage}%</div>
            </div>
          </div>

          {missingKeywords.length > 0 && (
            <div className="card-base animate-fade-in-up border-t-4 border-t-error" style={{ animationDelay: "400ms" }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-error" />
                <h3 className="text-lg font-semibold text-foreground">Missing Keywords</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {missingKeywords.map((keyword, i) => (
                  <span
                    key={i}
                    className="text-sm bg-error/10 text-error px-3 py-1 rounded-full border border-error/20"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="card-base animate-fade-in-up border-t-4 border-t-secondary" style={{ animationDelay: "500ms" }}>
              <h3 className="text-lg font-semibold text-foreground mb-3">Suggestions</h3>
              <ul className="space-y-2">
                {suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-secondary mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {!analysis && !isAnalyzing && (
        <div className="card-base text-center py-8 text-muted-foreground animate-fade-in-up">
          <p>Paste a job description and click "Analyze Keywords" to see the match analysis.</p>
        </div>
      )}

      <div className="flex justify-between gap-4 mt-8">
        <button onClick={onPrevious} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={handleProceed}
          disabled={!analysis}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          View Results
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
