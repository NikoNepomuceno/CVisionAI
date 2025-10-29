"use client"

import { useState } from "react"
import { Copy, Check, TrendingUp, ArrowRight, ArrowLeft } from "lucide-react"

interface KeywordPageProps {
  resumeData: any
  onNext: (data: any) => void
  onPrevious: () => void
}

export default function KeywordPage({ resumeData, onNext, onPrevious }: KeywordPageProps) {
  const [jobDescription, setJobDescription] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const yourSkills = [
    { skill: "React", match: 95 },
    { skill: "TypeScript", match: 90 },
    { skill: "Node.js", match: 85 },
    { skill: "SQL", match: 80 },
    { skill: "Python", match: 70 },
  ]

  const jobKeywords = [
    { keyword: "React", frequency: 8, matched: true },
    { keyword: "TypeScript", frequency: 6, matched: true },
    { keyword: "REST API", frequency: 5, matched: false },
    { keyword: "Docker", frequency: 4, matched: false },
    { keyword: "AWS", frequency: 3, matched: false },
  ]

  const handleCopy = (id: string) => {
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const matchPercentage = Math.round((jobKeywords.filter((k) => k.matched).length / jobKeywords.length) * 100)

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
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-base animate-fade-in-up border-t-4 border-t-secondary" style={{ animationDelay: "100ms" }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Skills</h2>
          <div className="space-y-3">
            {yourSkills.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between hover:bg-primary/5 p-2 rounded transition-colors"
              >
                <span className="text-sm font-medium text-foreground">{item.skill}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                      style={{ width: `${item.match}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{item.match}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-base animate-fade-in-up border-t-4 border-t-accent" style={{ animationDelay: "200ms" }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Job Keywords</h2>
          <div className="space-y-2">
            {jobKeywords.map((item, i) => (
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
            ))}
          </div>
        </div>
      </div>

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

      <div className="flex justify-between gap-4 mt-8">
        <button onClick={onPrevious} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>
        <button onClick={() => onNext()} className="btn-primary flex items-center gap-2">
          View Results
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
