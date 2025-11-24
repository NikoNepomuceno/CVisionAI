"use client"

import { useState, useEffect, useMemo } from "react"
import { ExternalLink, Share2, MapPin, DollarSign, Sparkles, ArrowLeft, Loader2, AlertCircle, Star, TrendingUp, Zap } from "lucide-react"
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

  const getMatchGradient = (match: number) => {
    if (match >= 90) return "from-success/20 to-success/5"
    if (match >= 80) return "from-secondary/20 to-secondary/5"
    if (match >= 60) return "from-primary/20 to-primary/5"
    return "from-muted/20 to-muted/5"
  }

  const handleRetry = () => {
    setFetchVersion((version) => version + 1)
  }

  const getFilterIcon = (filterLabel: string) => {
    switch (filterLabel) {
      case "Best Match":
        return <Star className="w-3 h-3 sm:w-4 sm:h-4" />
      case "Remote":
        return <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
      case "Trending":
        return <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
      default:
        return <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-8 bg-primary rounded-full"></div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Recommended Jobs</h1>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground ml-5">Curated opportunities based on your resume and skills</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card-base animate-fade-in-up border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-4 py-6 px-4">
            <div className="relative">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping"></div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground mb-1">Generating Job Recommendations</p>
              <p className="text-sm text-muted-foreground">Analyzing your profile and matching with top opportunities</p>
              <div className="w-full bg-muted/30 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="card-base animate-fade-in-up border-2 border-error/20 bg-error/5">
          <div className="text-center py-6 px-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-error/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-error" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Unable to Load Recommendations</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">{error}</p>
            <button 
              onClick={handleRetry} 
              className="btn-secondary hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <Sparkles className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Success State */}
      {!isLoading && !error && (
        <>
          {/* Filter Tabs */}
          <div className="animate-slide-in-right">
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide">
              {[
                { label: "All", count: groupedJobs.all.length },
                { label: "Best Match", count: groupedJobs.bestMatch.length },
                { label: "Remote", count: groupedJobs.remote.length },
                { label: "Trending", count: groupedJobs.trending.length },
              ].map((filter) => {
                const isActive = (activeFilter === "all" && filter.label === "All") || 
                                (activeFilter === filter.label && filter.label !== "All")
                return (
                  <button
                    key={filter.label}
                    onClick={() => setActiveFilter(filter.label === "All" ? "all" : filter.label)}
                    className={`px-4 py-3 rounded-xl font-medium whitespace-nowrap transition-all duration-300 text-sm flex items-center gap-2 flex-shrink-0 min-w-max border-2 ${
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/30 border-primary transform scale-105"
                        : "bg-muted/50 text-foreground hover:bg-border hover:shadow-md border-transparent hover:border-primary/20"
                    }`}
                  >
                    {getFilterIcon(filter.label)}
                    <span>{filter.label}</span>
                    {filter.count > 0 && (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                      }`}>
                        {filter.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Job Cards Grid */}
          {filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredJobs.map((job, i) => (
                <div
                  key={job.id}
                  className="group card-base hover:shadow-2xl transition-all duration-500 animate-fade-in-up border-l-4 border-l-primary hover:border-l-primary/80 hover:transform hover:-translate-y-1 relative overflow-hidden"
                  style={{ animationDelay: `${i * 75}ms` }}
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getMatchGradient(job.match)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="mb-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 pr-4">
                          {job.title}
                        </h3>
                        {job.match >= 85 && (
                          <div className="flex-shrink-0 bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-xs font-semibold">Top</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">{job.company}</p>
                    </div>

                    {/* Match Score */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/10 group-hover:border-primary/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">Your Match</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted/30 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                job.match >= 90 ? "bg-success" : 
                                job.match >= 80 ? "bg-secondary" : 
                                job.match >= 60 ? "bg-primary" : "bg-muted-foreground"
                              }`}
                              style={{ width: `${job.match}%` }}
                            ></div>
                          </div>
                          <span className={`text-xl font-bold ${getMatchColor(job.match)}`}>{job.match}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Matched Skills</p>
                      {job.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {job.skills.slice(0, 4).map((skill, i) => (
                            <span
                              key={i}
                              className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all duration-200 border border-primary/20 hover:border-primary/30 hover:transform hover:scale-105 font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 4 && (
                            <span className="text-xs bg-muted/50 text-muted-foreground px-3 py-1.5 rounded-lg border border-border">
                              +{job.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No specific skills listed</p>
                      )}
                    </div>

                    {/* Job Details */}
                    <div className="space-y-3 mb-6 pb-4 border-b border-border/50">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 flex-shrink-0 text-primary" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      {job.salary && (
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <DollarSign className="w-4 h-4 flex-shrink-0 text-primary" />
                          <span className="truncate font-medium">{job.salary}</span>
                        </div>
                      )}
                      {job.type && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-secondary/10 text-secondary px-3 py-1.5 rounded-lg border border-secondary/20 font-semibold">
                            {job.type}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          toast({
                            title: "Job link",
                            description: "This would open the job posting in a new tab.",
                          })
                        }}
                        className="flex-1 btn-primary text-sm flex items-center justify-center gap-3 hover:shadow-lg transform hover:scale-105 transition-all duration-200 group/btn"
                      >
                        <ExternalLink className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                        <span>View Job</span>
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
                        className="btn-secondary p-3 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                        title="Share job details"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-base animate-fade-in-up border-2 border-dashed border-muted-foreground/20 bg-muted/10 text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-muted/30 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No Jobs Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                No jobs match your current filter selection. Try a different filter or check back later for new opportunities.
              </p>
              <button 
                onClick={() => setActiveFilter("all")}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Show All Jobs
              </button>
            </div>
          )}
        </>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-border/50">
        <button
          onClick={onPrevious}
          className="btn-secondary flex items-center justify-center gap-3 order-2 sm:order-1 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Resume
        </button>
        <button 
          onClick={onReset} 
          className="btn-primary flex items-center justify-center gap-3 order-1 sm:order-2 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          <Sparkles className="w-4 h-4" />
          Start New Analysis
        </button>
      </div>
    </div>
  )
}
