"use client"

import { Zap, TrendingUp, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react"

interface AnalysisPageProps {
  resumeData: any
  onNext: (data: any) => void
  onPrevious: () => void
}

export default function AnalysisPage({ resumeData, onNext, onPrevious }: AnalysisPageProps) {
  const insights = [
    {
      type: "strength",
      title: "Strong Technical Foundation",
      description: "Your technical skills are well-aligned with current market demands.",
      icon: <CheckCircle2 className="w-5 h-5" />,
      confidence: 95,
    },
    {
      type: "opportunity",
      title: "Add Quantifiable Achievements",
      description: 'Include metrics and numbers to demonstrate impact (e.g., "Improved performance by 40%").',
      icon: <Zap className="w-5 h-5" />,
      confidence: 88,
    },
    {
      type: "opportunity",
      title: "Highlight Leadership Experience",
      description: "Add any team lead or mentoring roles to strengthen your profile.",
      icon: <TrendingUp className="w-5 h-5" />,
      confidence: 82,
    },
    {
      type: "missing",
      title: "Add Certifications",
      description: "Consider adding relevant certifications to boost credibility.",
      icon: <AlertCircle className="w-5 h-5" />,
      confidence: 75,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-foreground mb-2">AI Analysis & Insights</h1>
        <p className="text-muted-foreground">Here's what we found in your resume</p>
      </div>

      <div className="space-y-4">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`card-base border-l-4 hover:shadow-lg transition-all duration-300 animate-fade-in-up ${
              insight.type === "strength"
                ? "border-l-success"
                : insight.type === "opportunity"
                  ? "border-l-secondary"
                  : "border-l-error"
            }`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex gap-4">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                  insight.type === "strength"
                    ? "bg-success/10 text-success"
                    : insight.type === "opportunity"
                      ? "bg-secondary/10 text-secondary"
                      : "bg-error/10 text-error"
                }`}
              >
                {insight.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-foreground">{insight.title}</h3>
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                    {insight.confidence}% confidence
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="card-base bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 border-2 animate-fade-in-up"
        style={{ animationDelay: "400ms" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Analysis Confidence</h3>
            <p className="text-sm text-muted-foreground">How confident we are in these insights</p>
          </div>
          <div className="text-4xl font-bold text-primary">92%</div>
        </div>
      </div>

      <div className="flex justify-between gap-4 mt-8">
        <button onClick={onPrevious} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>
        <button onClick={() => onNext()} className="btn-primary flex items-center gap-2">
          View Detailed Feedback
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
