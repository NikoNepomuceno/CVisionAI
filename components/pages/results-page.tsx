"use client"

import { CheckCircle2, TrendingUp, Download, Share2, Sparkles, ArrowLeft } from "lucide-react"

interface ResultsPageProps {
  resumeData: any
  onNext: (data: any) => void
  onPrevious: () => void
}

export default function ResultsPage({ resumeData, onNext, onPrevious }: ResultsPageProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4 mb-8 animate-fade-in-up">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center animate-pulse-glow">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
        </div>
  <h1 className="text-4xl font-bold text-foreground">Your Resume is Ready!</h1>
        <p className="text-lg text-muted-foreground">You've improved 5 key areas. Time to apply!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Match Score */}
        <div className="card-base hover:shadow-lg transition-all duration-300 animate-fade-in-up border-t-4 border-t-primary">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Overall Match Score</h3>
          <div className="flex items-end gap-4">
            <div className="text-5xl font-bold text-primary">78%</div>
            <div className="flex items-center gap-1 text-success mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+12% improvement</span>
            </div>
          </div>
        </div>

        {/* Top Strengths */}
        <div
          className="card-base hover:shadow-lg transition-all duration-300 animate-fade-in-up border-t-4 border-t-secondary"
          style={{ animationDelay: "100ms" }}
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Top Strengths</h3>
          <div className="space-y-2">
            {[
              "Technical Skills",
              "Experience",
              "Education",
            ].map((strength, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                <span className="text-sm text-foreground">{strength}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skills Breakdown */}
        <div
          className="card-base hover:shadow-lg transition-all duration-300 animate-fade-in-up border-t-4 border-t-accent"
          style={{ animationDelay: "200ms" }}
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Skills Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: "Technical", value: 85 },
              { label: "Soft Skills", value: 72 },
              { label: "Keywords", value: 78 },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className="text-sm text-muted-foreground">{item.value}%</span>
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
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Next Steps</h3>
          <div className="space-y-2">
            {[
              "✓ Add 2-3 measurable achievements",
              "✓ Highlight technical skills",
              "✓ Reorder experience by relevance",
            ].map((step, i) => (
              <div key={i} className="text-sm text-foreground">
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
        <button className="flex-1 btn-secondary flex items-center justify-center gap-2 hover:shadow-md transition-all">
          <Download className="w-4 h-4" />
          Download PDF
        </button>
        <button className="flex-1 btn-secondary flex items-center justify-center gap-2 hover:shadow-md transition-all">
          <Share2 className="w-4 h-4" />
          Share Report
        </button>
        <button onClick={() => onNext()} className="flex-1 btn-primary flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          View Job Recommendations
        </button>
      </div>

      <div className="flex justify-between gap-4 mt-8">
        <button onClick={onPrevious} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>
      </div>
    </div>
  )
}
