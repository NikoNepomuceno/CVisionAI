"use client"

import { useState } from "react"
import { Copy, Check, Bookmark, Share2, ArrowRight, ArrowLeft } from "lucide-react"

interface FeedbackPageProps {
  resumeData: any
  onNext: (data: any) => void
  onPrevious: () => void
}

export default function FeedbackPage({ resumeData, onNext, onPrevious }: FeedbackPageProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [activeFilter, setActiveFilter] = useState("all")
  const [completedItems, setCompletedItems] = useState<number[]>([])

  const feedbackItems = [
    {
      id: 1,
      category: "Clarity",
      title: "Use Action Verbs",
      description: 'Start bullet points with strong action verbs like "Developed", "Implemented", "Led".',
      priority: "high",
    },
    {
      id: 2,
      category: "Structure",
      title: "Consistent Formatting",
      description: "Ensure consistent date formats and bullet point styles throughout.",
      priority: "medium",
    },
    {
      id: 3,
      category: "Skills",
      title: "Add Technical Stack",
      description: "Specify the technologies and tools you used in each role.",
      priority: "high",
    },
    {
      id: 4,
      category: "Keywords",
      title: "Industry Keywords",
      description: "Include relevant industry keywords to improve ATS compatibility.",
      priority: "medium",
    },
    {
      id: 5,
      category: "Clarity",
      title: "Quantify Results",
      description: "Replace vague descriptions with specific metrics and percentages.",
      priority: "high",
    },
  ]

  const filters = ["all", "Clarity", "Structure", "Skills", "Keywords"]
  const filtered = activeFilter === "all" ? feedbackItems : feedbackItems.filter((f) => f.category === activeFilter)

  const handleCopy = (id: number) => {
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleComplete = (id: number) => {
    setCompletedItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  return (
    <div className="space-y-6">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-foreground mb-2">Feedback & Suggestions</h1>
        <p className="text-muted-foreground">
          {completedItems.length} of {feedbackItems.length} suggestions applied
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 animate-slide-in-right">
        {filters.map((filter) => (
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
              completedItems.includes(item.id) ? "opacity-60 bg-muted/50" : ""
            } ${item.priority === "high" ? "border-l-error" : "border-l-secondary"}`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex gap-4">
              <button
                onClick={() => toggleComplete(item.id)}
                className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  completedItems.includes(item.id)
                    ? "bg-success border-success shadow-lg shadow-success/20"
                    : "border-border hover:border-primary"
                }`}
              >
                {completedItems.includes(item.id) && <Check className="w-4 h-4 text-white" />}
              </button>
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
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Bookmark className="w-3 h-3" />
                    Save
                  </button>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Share2 className="w-3 h-3" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

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
    </div>
  )
}
