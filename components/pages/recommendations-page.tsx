"use client"

import { useState, useEffect, useMemo } from "react"
import { ExternalLink, Share2, MapPin, DollarSign, Sparkles, ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import type { JobRecommendation } from "@/lib/deepseek"
import { toast } from "@/hooks/use-toast"

interface RecommendationsPageProps {
  resumeData: {
    skills: string[]
    experience: Array<{ company: string; role: string; duration?: string; description?: string }>
    education: Array<{ school: string; degree: string; year?: string }>
    summary?: string
    keywordAnalysis?: any
  }
  onPrevious: () => void
  onReset: () => void
}

export default function RecommendationsPage({ resumeData, onPrevious, onReset }: RecommendationsPageProps) {
  const [activeFilter, setActiveFilter] = useState("all")
  const [jobs, setJobs] = useState<JobRecommendation[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchVersion, setFetchVersion] = useState(0)

  const payload = useMemo(
    () => ({
      resume: {
        skills: resumeData.skills,
        experience: resumeData.experience,
        education: resumeData.education,
        summary: resumeData.summary,
      },
      keywordAnalysis: resumeData.keywordAnalysis,
    }),
    [resumeData.skills, resumeData.experience, resumeData.education, resumeData.summary, resumeData.keywordAnalysis],
  )

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()

    async function fetchRecommendations() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        if (!response.ok) {
          const message = await response.json().catch(() => ({ error: "Recommendations request failed" }))
          throw new Error(message?.error || "Recommendations request failed")
        }

        const { data } = await response.json()
        if (isActive) {
          setJobs(data || [])
          setFetchVersion((value) => (value === 0 ? value : 0))
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return
        if (isActive) {
          setError(err?.message || "Unable to generate job recommendations right now.")
          setJobs([])
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    fetchRecommendations()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [payload, fetchVersion])

  // Group jobs by category/relevance
  const groupedJobs = useMemo(() => {
    const bestMatch = jobs.filter((job) => job.match >= 80 || job.category === "best-match")
    const remote = jobs.filter((job) => job.type === "remote" || job.location.toLowerCase().includes("remote"))
    const trending = jobs.filter((job) => job.category === "trending")
    const all = jobs

    return { all, bestMatch, remote, trending }
  }, [jobs])

  // Filter jobs based on active filter
  const filteredJobs = useMemo(() => {
    switch (activeFilter) {
      case "Best Match":
        return groupedJobs.bestMatch
      case "Remote":
        return groupedJobs.remote
      case "Trending":
        return groupedJobs.trending
      default:
        return groupedJobs.all
    }
  }, [activeFilter, groupedJobs])

  const getMatchColor = (match: number) => {
    if (match >= 90) return "text-success"
    if (match >= 80) return "text-secondary"
    if (match >= 60) return "text-primary"
    return "text-muted-foreground"
  }

  const handleRetry = () => {
    setFetchVersion((version) => version + 1)
  }

  return (
    <div className="space-y-6">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-foreground mb-2">Recommended Jobs</h1>
        <p className="text-muted-foreground">Based on your resume and skills</p>
      </div>

      {isLoading && (
        <div className="card-base animate-fade-in-up border border-dashed border-primary/40 bg-primary/5 flex items-center gap-3 py-6 px-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <div>
            <p className="font-medium text-foreground">Generating job recommendations…</p>
            <p className="text-sm text-muted-foreground">We're matching your skills to available positions.</p>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="card-base animate-fade-in-up border border-error/40 bg-error/5 text-error">
          <p className="font-semibold mb-2">We couldn't generate job recommendations.</p>
          <p className="text-sm text-error/80 mb-4">{error}</p>
          <button onClick={handleRetry} className="btn-secondary text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 animate-slide-in-right">
            {[
              { label: "All", count: groupedJobs.all.length },
              { label: "Best Match", count: groupedJobs.bestMatch.length },
              { label: "Remote", count: groupedJobs.remote.length },
              { label: "Trending", count: groupedJobs.trending.length },
            ].map((filter) => (
              <button
                key={filter.label}
                onClick={() => setActiveFilter(filter.label === "All" ? "all" : filter.label)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                  (activeFilter === "all" && filter.label === "All") ||
                  (activeFilter === filter.label && filter.label !== "All")
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-muted text-foreground hover:bg-border hover:shadow-md"
                }`}
              >
                {filter.label} {filter.count > 0 && `(${filter.count})`}
              </button>
            ))}
          </div>

          {filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredJobs.map((job, i) => (
                <div
                  key={job.id}
                  className="card-base hover:shadow-xl transition-all duration-300 animate-fade-in-up border-t-4 border-t-primary"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                  </div>

                  {/* Match Score */}
                  <div className="mb-4 p-3 bg-primary/5 rounded-lg border-2 border-primary/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Match Score</span>
                      <span className={`text-2xl font-bold ${getMatchColor(job.match)}`}>{job.match}%</span>
                    </div>
                  </div>

                  {/* Skills - Mapped from resume */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Matched Skills</p>
                    {job.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, i) => (
                          <span
                            key={i}
                            className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full hover:bg-primary/20 transition-colors border border-primary/20"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No skills specified</p>
                    )}
                  </div>

                  {/* Location & Salary */}
                  <div className="space-y-2 mb-4 pb-4 border-b border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      {job.location}
                    </div>
                    {job.salary && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4 flex-shrink-0" />
                        {job.salary}
                      </div>
                    )}
                    {job.type && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                          {job.type}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        toast({
                          title: "Job link",
                          description: "This would open the job posting in a new tab.",
                        })
                      }}
                      className="flex-1 btn-primary text-sm flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Job
                    </button>
                    <button
                      onClick={() => {
                        const shareText = `${job.title} at ${job.company} - ${job.match}% match\nLocation: ${job.location}${job.salary ? `\nSalary: ${job.salary}` : ""}`
                        navigator.clipboard.writeText(shareText)
                        toast({
                          title: "Copied to clipboard",
                          description: "Job details have been copied.",
                        })
                      }}
                      className="btn-secondary p-2 hover:shadow-md transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-base animate-fade-in-up border border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="font-medium mb-2">No jobs found for this filter.</p>
              <p className="text-sm">Try selecting a different filter or check back later.</p>
            </div>
          )}
        </>
      )}

      <div className="flex justify-between gap-4 mt-8">
        <button onClick={onPrevious} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>
        <button onClick={onReset} className="btn-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Start Over
        </button>
      </div>
    </div>
  )
}
