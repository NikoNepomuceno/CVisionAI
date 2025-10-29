"use client"

import { useState } from "react"
import { Bookmark, ExternalLink, Share2, MapPin, DollarSign, Sparkles, ArrowLeft } from "lucide-react"

interface RecommendationsPageProps {
  resumeData: any
  onPrevious: () => void
  onReset: () => void
}

export default function RecommendationsPage({ resumeData, onPrevious, onReset }: RecommendationsPageProps) {
  const [savedJobs, setSavedJobs] = useState<number[]>([])
  const [activeFilter, setActiveFilter] = useState("all")

  const jobs = [
    {
      id: 1,
      title: "Senior React Developer",
      company: "Tech Corp",
      match: 92,
      skills: ["React", "TypeScript", "Node.js"],
      location: "San Francisco, CA",
      salary: "$150K - $180K",
    },
    {
      id: 2,
      title: "Full Stack Engineer",
      company: "StartUp Inc",
      match: 88,
      skills: ["React", "Node.js", "SQL"],
      location: "Remote",
      salary: "$130K - $160K",
    },
    {
      id: 3,
      title: "Frontend Developer",
      company: "Design Studio",
      match: 85,
      skills: ["React", "TypeScript", "CSS"],
      location: "New York, NY",
      salary: "$120K - $150K",
    },
    {
      id: 4,
      title: "Software Engineer",
      company: "Cloud Systems",
      match: 82,
      skills: ["Node.js", "Python", "AWS"],
      location: "Seattle, WA",
      salary: "$140K - $170K",
    },
  ]

  const toggleSave = (id: number) => {
    setSavedJobs((prev) => (prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]))
  }

  const getMatchColor = (match: number) => {
    if (match >= 90) return "text-success"
    if (match >= 80) return "text-secondary"
    return "text-muted-foreground"
  }

  return (
    <div className="space-y-6">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-foreground mb-2">Recommended Jobs</h1>
        <p className="text-muted-foreground">Based on your resume and skills</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 animate-slide-in-right">
        {["all", "Best Match", "Trending", "Remote"].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
              activeFilter === filter
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "bg-muted text-foreground hover:bg-border hover:shadow-md"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.map((job, i) => (
          <div
            key={job.id}
            className="card-base hover:shadow-xl transition-all duration-300 animate-fade-in-up border-t-4 border-t-primary"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                <p className="text-sm text-muted-foreground">{job.company}</p>
              </div>
              <button
                onClick={() => toggleSave(job.id)}
                className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${
                  savedJobs.includes(job.id)
                    ? "bg-primary/10 text-primary shadow-lg shadow-primary/20"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Bookmark className="w-5 h-5" fill={savedJobs.includes(job.id) ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Match Score */}
            <div className="mb-4 p-3 bg-primary/5 rounded-lg border-2 border-primary/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Match Score</span>
                <span className={`text-2xl font-bold ${getMatchColor(job.match)}`}>{job.match}%</span>
              </div>
            </div>

            {/* Skills */}
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Matched Skills</p>
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
            </div>

            {/* Location & Salary */}
            <div className="space-y-2 mb-4 pb-4 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {job.location}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4 flex-shrink-0" />
                {job.salary}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button className="flex-1 btn-primary text-sm flex items-center justify-center gap-2 hover:shadow-lg transition-all">
                <ExternalLink className="w-4 h-4" />
                View Job
              </button>
              <button className="btn-secondary p-2 hover:shadow-md transition-all">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

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
