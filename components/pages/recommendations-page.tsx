"use client"

import { useState, useEffect, useMemo } from "react"
import {
  ExternalLink,
  MapPin,
  DollarSign,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Star,
  TrendingUp,
  Zap,
  X,
  Calendar,
  Users,
  Building,
  Copy,
} from "lucide-react"
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

interface JobDetails {
  description: string
  requirements: string[]
  benefits: string[]
  applicationProcess: string
  companyInfo: string
}

export default function RecommendationsPage({ resumeData, onPrevious, onReset }: RecommendationsPageProps) {
  const [activeFilter, setActiveFilter] = useState("all")
  const [jobs, setJobs] = useState<JobRecommendation[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchVersion, setFetchVersion] = useState(0)
  const [selectedJob, setSelectedJob] = useState<JobRecommendation | null>(null)
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null)
  const [isDetailsLoading, setIsDetailsLoading] = useState<boolean>(false)

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
    if (match >= 60) return "text-primary dark:text-primary"
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

  const fetchJobDetails = async (job: JobRecommendation) => {
    setIsDetailsLoading(true)
    setSelectedJob(job)

    try {
      const response = await fetch("/api/job-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company,
          skills: job.skills,
          location: job.location,
          type: job.type,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch job details")
      }

      const { data } = await response.json()
      setJobDetails(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load job details",
        description: "Please try again later.",
      })
      setJobDetails(null)
    } finally {
      setIsDetailsLoading(false)
    }
  }

  const closeModal = () => {
    setSelectedJob(null)
    setJobDetails(null)
    setIsDetailsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 py-4 sm:py-6">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 w-full space-y-4 sm:space-y-6">
          {/* Header Section */}
          <div className="mb-6 sm:mb-8 animate-fade-in-up">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-1.5 sm:w-2 h-6 sm:h-8 bg-primary rounded-full flex-shrink-0"></div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Recommended Jobs</h1>
            </div>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground ml-3.5 sm:ml-5">
              Curated opportunities based on your resume and skills
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="card-base animate-fade-in-up border border-dashed border-primary/30 dark:border-slate-900/40 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3 sm:gap-4 py-4 sm:py-6 px-3 sm:px-4">
                <div className="relative">
                  <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin text-primary dark:text-slate-900 flex-shrink-0" />
                  <div className="absolute inset-0 border-2 border-primary/20 dark:border-slate-900/30 rounded-full animate-ping"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm sm:text-base mb-1">
                    Generating Job Recommendations
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Analyzing your profile and matching with top opportunities
                  </p>
                  <div className="w-full bg-muted/30 rounded-full h-1 sm:h-1.5 mt-2 overflow-hidden">
                    <div className="bg-primary h-full rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="card-base animate-fade-in-up border border-error/20 bg-error/5">
              <div className="text-center py-4 sm:py-6 px-3 sm:px-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 bg-error/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7 text-error" />
                </div>
                <h3 className="font-semibold text-foreground text-sm sm:text-base mb-2">
                  Unable to Load Recommendations
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 max-w-md mx-auto">{error}</p>
                <button
                  onClick={handleRetry}
                  className="btn-secondary hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto text-sm"
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
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
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 sm:pb-4 -mx-2 sm:-mx-3 px-2 sm:px-3 scrollbar-hide">
                  {[
                    { label: "All", count: groupedJobs.all.length },
                    { label: "Best Match", count: groupedJobs.bestMatch.length },
                    { label: "Remote", count: groupedJobs.remote.length },
                    { label: "Trending", count: groupedJobs.trending.length },
                  ].map((filter) => {
                    const isActive =
                      (activeFilter === "all" && filter.label === "All") ||
                      (activeFilter === filter.label && filter.label !== "All")
                    return (
                      <button
                        key={filter.label}
                        onClick={() => setActiveFilter(filter.label === "All" ? "all" : filter.label)}
                        className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl font-medium whitespace-nowrap transition-all duration-300 text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-max border ${
                          isActive
                            ? "bg-primary text-white shadow-lg shadow-primary/30 border-primary transform scale-105"
                            : "bg-muted/50 text-foreground hover:bg-border hover:shadow-md border-transparent hover:border-primary/20 dark:hover:border-slate-900/30"
                        }`}
                      >
                        {getFilterIcon(filter.label)}
                        <span>{filter.label}</span>
                        {filter.count > 0 && (
                          <span
                            className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs ${
                              isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary dark:text-primary"
                            }`}
                          >
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {filteredJobs.map((job, i) => (
                    <div
                      key={job.id}
                      className="group card-base hover:shadow-lg sm:hover:shadow-xl transition-all duration-500 animate-fade-in-up border-l-3 sm:border-l-4 border-l-primary hover:border-l-primary/80 hover:transform hover:-translate-y-1 relative overflow-hidden"
                      style={{ animationDelay: `${i * 75}ms` }}
                    >
                      {/* Background Gradient */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${getMatchGradient(job.match)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                      ></div>

                      <div className="relative z-10">
                        {/* Header */}
                        <div className="mb-4 sm:mb-6">
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground dark:text-white group-hover:text-primary dark:group-hover:text-primary transition-colors line-clamp-2 flex-1 min-w-0">
                              {job.title}
                            </h3>
                            {job.match >= 85 && (
                              <div className="flex-shrink-0 bg-primary/10 text-primary dark:text-secondary px-2 py-1 rounded-full flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                                <span className="text-xs font-semibold dark:text-white">Top</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground dark:text-white font-medium">{job.company}</p>
                        </div>

                        {/* Match Score */}
                        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg sm:rounded-xl border border-primary/10 dark:border-slate-900/20 group-hover:border-primary/20 dark:group-hover:border-slate-900/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-semibold text-foreground dark:text-white">
                              Your Match
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-12 sm:w-16 bg-muted/30 rounded-full h-1.5 sm:h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-1000 ${
                                    job.match >= 90
                                      ? "bg-success"
                                      : job.match >= 80
                                        ? "bg-secondary"
                                        : job.match >= 60
                                          ? "bg-primary"
                                          : "bg-muted-foreground"
                                  }`}
                                  style={{ width: `${job.match}%` }}
                                ></div>
                              </div>
                              <span className={`text-lg sm:text-xl font-bold ${getMatchColor(job.match)}`}>
                                {job.match}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="mb-4 sm:mb-6">
                          <p className="text-xs font-semibold text-muted-foreground dark:text-white uppercase tracking-wide mb-2 sm:mb-3">
                            Matched Skills
                          </p>
                          {job.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {job.skills.slice(0, 4).map((skill, i) => (
                                <span
                                  key={i}
                                  className="text-xs bg-primary/10 text-primary dark:text-primary px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg hover:bg-primary/20 transition-all duration-200 border border-primary/20 dark:border-slate-900/30 hover:border-primary/30 dark:hover:border-slate-900/40 hover:transform hover:scale-105 font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                              {job.skills.length > 4 && (
                                <span className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg border border-border">
                                  +{job.skills.length - 4} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm text-muted-foreground italic">No specific skills listed</p>
                          )}
                        </div>

                        {/* Job Details */}
                        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-border/50">
                          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground dark:text-white">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-primary dark:text-primary" />
                            <span className="truncate">{job.location}</span>
                          </div>
                          {job.salary && (
                            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground dark:text-white">
                              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-primary dark:text-primary" />
                              <span className="truncate font-medium">{job.salary}</span>
                            </div>
                          )}
                          {job.type && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-secondary/10 text-secondary dark:text-primary px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg border border-secondary/20 dark:border-primary hover:bg-secondary/20 dark:hover:bg-primary transition-all duration-200 font-semibold">
                                {job.type}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 sm:gap-3">
                          <button
                            onClick={() => fetchJobDetails(job)}
                            className="flex-1 btn-primary text-xs sm:text-sm flex items-center justify-center gap-2 sm:gap-3 hover:shadow-lg transform hover:scale-105 transition-all duration-200 group/btn py-2 sm:py-3"
                          >
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover/btn:scale-110" />
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
                            className="btn-secondary p-2 sm:p-3 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                            title="Copy job details"
                          >
                            <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card-base animate-fade-in-up border border-dashed border-muted-foreground/20 bg-muted/10 text-center py-8 sm:py-12">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-muted/30 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base mb-2">No Jobs Found</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mb-3 sm:mb-4 px-2">
                    No jobs match your current filter selection. Try a different filter or check back later for new
                    opportunities.
                  </p>
                  <button
                    onClick={() => setActiveFilter("all")}
                    className="btn-secondary inline-flex items-center gap-2 text-sm py-2"
                  >
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                    Show All Jobs
                  </button>
                </div>
              )}
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between pt-4 sm:pt-6 border-t border-border/50">
            <button
              onClick={onPrevious}
              className="btn-secondary flex items-center justify-center gap-2 sm:gap-3 order-2 sm:order-1 hover:shadow-lg transform hover:scale-105 transition-all duration-200 py-2.5 sm:py-3 text-sm w-full sm:w-auto"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              Back to Resume
            </button>
            <button
              onClick={onReset}
              className="btn-primary flex items-center justify-center gap-2 sm:gap-3 order-1 sm:order-2 hover:shadow-lg transform hover:scale-105 transition-all duration-200 py-2.5 sm:py-3 text-sm w-full sm:w-auto"
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              Start New Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white mb-2">
                  {selectedJob.title}
                </h2>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-white">
                    <Building className="w-4 h-4" />
                    <span className="font-medium">{selectedJob.company}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-white">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedJob.location}</span>
                  </div>
                  {selectedJob.type && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-white">
                      <Users className="w-4 h-4" />
                      <span>{selectedJob.type}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={closeModal}
                className="flex-shrink-0 p-2 hover:bg-muted rounded-lg transition-colors ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="p-6 space-y-6">
                {/* Match Score */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-primary dark:text-primary" />
                    <span className="font-semibold text-foreground dark:text-white">Your Match Score</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          selectedJob.match >= 90
                            ? "bg-success"
                            : selectedJob.match >= 80
                              ? "bg-secondary"
                              : selectedJob.match >= 60
                                ? "bg-primary"
                                : "bg-muted-foreground"
                        }`}
                        style={{ width: `${selectedJob.match}%` }}
                      />
                    </div>
                    <span className={`text-xl font-bold ${getMatchColor(selectedJob.match)}`}>
                      {selectedJob.match}%
                    </span>
                  </div>
                </div>

                {/* Loading State for Details */}
                {isDetailsLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-primary mr-3" />
                    <span className="text-muted-foreground dark:text-white">Loading job details...</span>
                  </div>
                )}

                {/* Job Details Content */}
                {jobDetails && !isDetailsLoading && (
                  <div className="space-y-6">
                    {/* Job Description */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary dark:text-primary" />
                        Job Description
                      </h3>
                      <p className="text-muted-foreground dark:text-white leading-relaxed">{jobDetails.description}</p>
                    </div>

                    {/* Requirements */}
                    {jobDetails.requirements && jobDetails.requirements.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3">Requirements</h3>
                        <ul className="space-y-2">
                          {jobDetails.requirements.map((requirement, index) => (
                            <li key={index} className="flex items-start gap-3 text-muted-foreground dark:text-white">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                              <span>{requirement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Benefits */}
                    {jobDetails.benefits && jobDetails.benefits.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3">Benefits</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {jobDetails.benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-success/10 rounded-lg">
                              <div className="w-2 h-2 bg-success rounded-full flex-shrink-0" />
                              <span className="text-sm text-success-foreground dark:text-primary">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Application Process */}
                    {jobDetails.applicationProcess && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3">
                          Application Process
                        </h3>
                        <p className="text-muted-foreground dark:text-white leading-relaxed">
                          {jobDetails.applicationProcess}
                        </p>
                      </div>
                    )}

                    {/* Company Info */}
                    {jobDetails.companyInfo && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3">
                          About {selectedJob.company}
                        </h3>
                        <p className="text-muted-foreground dark:text-white leading-relaxed">
                          {jobDetails.companyInfo}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Error State for Details */}
                {!jobDetails && !isDetailsLoading && (
                  <div className="text-center py-8 text-muted-foreground dark:text-white">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Unable to load job details. Please try again.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
