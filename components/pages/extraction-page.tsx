"use client"

import { useState } from "react"
import {
  ChevronDown,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Zap,
  Briefcase,
  GraduationCap,
} from "lucide-react"

interface ExtractionPageProps {
  resumeData: any
  onNext: (data: any) => void
  onPrevious: () => void
}

interface Experience {
  company: string
  role: string
  duration: string
  description?: string
}

interface Education {
  school: string
  degree: string
  year?: string
}

export default function ExtractionPage({ resumeData, onNext, onPrevious }: ExtractionPageProps) {
  const [skills, setSkills] = useState(resumeData.skills || ["React", "TypeScript", "Node.js", "SQL", "Python"])
  const [experience, setExperience] = useState<Experience[]>(
    resumeData.experience || [
      {
        company: "Tech Corp",
        role: "Senior Developer",
        duration: "2 years",
        description: "Led frontend development and mentored junior developers",
      },
      {
        company: "StartUp Inc",
        role: "Full Stack Engineer",
        duration: "1.5 years",
        description: "Built scalable web applications using modern technologies",
      },
    ],
  )
  const [education, setEducation] = useState<Education[]>(
    resumeData.education || [{ school: "State University", degree: "BS Computer Science", year: "2020" }],
  )
  const [expandedSections, setExpandedSections] = useState({
    skills: true,
    experience: true,
    education: true,
  })
  const [newSkill, setNewSkill] = useState("")
  const [showAddExperience, setShowAddExperience] = useState(false)
  const [showAddEducation, setShowAddEducation] = useState(false)
  const [newExperience, setNewExperience] = useState({ company: "", role: "", duration: "", description: "" })
  const [newEducation, setNewEducation] = useState({ school: "", degree: "", year: "" })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index))
  }

  const addExperience = () => {
    if (newExperience.company.trim() && newExperience.role.trim()) {
      setExperience([...experience, newExperience])
      setNewExperience({ company: "", role: "", duration: "", description: "" })
      setShowAddExperience(false)
    }
  }

  const removeExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index))
  }

  const addEducation = () => {
    if (newEducation.school.trim() && newEducation.degree.trim()) {
      setEducation([...education, newEducation])
      setNewEducation({ school: "", degree: "", year: "" })
      setShowAddEducation(false)
    }
  }

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    onNext({ skills, experience, education })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 w-full space-y-4 sm:space-y-6">
          {/* Enhanced Header */}
          <div className="text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 bg-primary/10 rounded-full border border-primary/20 dark:border-primary/40 mb-3 sm:mb-4">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary dark:text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary dark:text-primary">
                AI-Powered Extraction
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground dark:text-white mb-2">
              Extraction Summary
            </h1>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto px-2 sm:px-0">
              Review and edit the extracted information from your resume. Add missing details or make corrections as
              needed.
            </p>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground leading-relaxed transition-colors duration-300">
              Flat bicycle register periodically targets forty pages with industry scanning
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <div className="card-base p-2 sm:p-3 text-center border-t-3 sm:border-t-4 border-t-primary">
              <div className="flex flex-col items-center gap-1 mb-1 sm:mb-2">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-primary dark:text-white" />
                <h3 className="font-semibold text-foreground text-xs">Skills</h3>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground">{skills.length}</p>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                {skills.length} skills extracted
              </p>
            </div>

            <div className="card-base p-2 sm:p-3 text-center border-t-3 sm:border-t-4 border-t-secondary">
              <div className="flex flex-col items-center gap-1 mb-1 sm:mb-2">
                <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-secondary" />
                <h3 className="font-semibold text-foreground text-xs">Experience</h3>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground">{experience.length}</p>
              <p className="text-xs text-muted-foreground">Positions</p>
            </div>

            <div className="card-base p-2 sm:p-3 text-center border-t-3 sm:border-t-4 border-t-accent">
              <div className="flex flex-col items-center gap-1 mb-1 sm:mb-2">
                <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                <h3 className="font-semibold text-foreground text-xs">Education</h3>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground">{education.length}</p>
              <p className="text-xs text-muted-foreground">Institutions</p>
            </div>
          </div>

          {/* Skills Section */}
          <div className="card-base animate-fade-in-up border-t-3 sm:border-t-4 border-t-primary">
            <button
              onClick={() => toggleSection("skills")}
              className="w-full flex items-center justify-between group p-3 sm:p-4"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-primary dark:text-white" />
                </div>
                <div className="text-left">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground dark:text-white group-hover:text-primary dark:group-hover:text-primary transition-colors">
                    Skills
                  </h2>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    {skills.length} skills extracted
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 sm:w-5 sm:h-5 text-primary dark:text-white transition-all duration-300 ${expandedSections.skills ? "rotate-180" : ""} group-hover:scale-110`}
              />
            </button>
            {expandedSections.skills && (
              <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3 animate-slide-in-right">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {skills.map((skill, i) => (
                    <div
                      key={i}
                      className="bg-primary/10 text-primary dark:text-primary px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 hover:bg-primary/20 transition-all duration-200 border border-primary/20 dark:border-slate-900/30 group relative"
                    >
                      <span className="max-w-[120px] sm:max-w-none truncate">{skill}</span>
                      <button
                        onClick={() => removeSkill(i)}
                        className="opacity-0 group-hover:opacity-100 text-primary dark:text-primary dark:hover:text-error transition-all duration-200 flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-3 border-t border-border/50 flex-col sm:flex-row">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addSkill()}
                    placeholder="Add a new skill..."
                    className="input-base text-sm flex-1 min-w-0"
                  />
                  <button
                    onClick={addSkill}
                    className="btn-primary text-sm px-3 flex items-center justify-center gap-2 hover:scale-105 transition-transform min-w-[80px]"
                    disabled={!newSkill.trim()}
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="sm:hidden">Add</span>
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Experience Section */}
          <div
            className="card-base animate-fade-in-up border-t-3 sm:border-t-4 border-t-secondary"
            style={{ animationDelay: "100ms" }}
          >
            <button
              onClick={() => toggleSection("experience")}
              className="w-full flex items-center justify-between group p-3 sm:p-4"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-secondary" />
                </div>
                <div className="text-left">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground group-hover:text-secondary transition-colors">
                    Experience
                  </h2>
                  <p className="text-xs text-muted-foreground">{experience.length} positions extracted</p>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 sm:w-5 sm:h-5 text-secondary transition-all duration-300 ${expandedSections.experience ? "rotate-180" : ""} group-hover:scale-110`}
              />
            </button>
            {expandedSections.experience && (
              <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3 sm:space-y-4 animate-slide-in-right">
                {experience.map((exp, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-lg p-3 hover:border-secondary/50 dark:hover:border-secondary/40 hover:bg-secondary/5 dark:hover:bg-secondary/10 transition-all duration-200 group"
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm truncate">{exp.role}</h3>
                        <p className="text-secondary font-medium text-xs truncate mb-1">{exp.company}</p>
                        <p className="text-xs text-muted-foreground">{exp.duration}</p>
                      </div>
                      <button
                        onClick={() => removeExperience(i)}
                        className="opacity-0 group-hover:opacity-100 text-primary dark:text-primary dark:hover:text-error transition-all duration-200 flex-shrink-0 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {exp.description && (
                      <p className="text-xs text-foreground mt-2 leading-relaxed line-clamp-2">{exp.description}</p>
                    )}
                  </div>
                ))}

                {showAddExperience ? (
                  <div className="border-2 border-secondary/30 rounded-lg p-3 bg-secondary/5 space-y-3 animate-fade-in">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4 text-secondary" />
                        Add New Experience
                      </h3>
                      <button
                        onClick={() => setShowAddExperience(false)}
                        className="text-primary dark:text-primary hover:text-error flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Company"
                      value={newExperience.company}
                      onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                      className="input-base text-sm w-full"
                    />
                    <input
                      type="text"
                      placeholder="Job Title"
                      value={newExperience.role}
                      onChange={(e) => setNewExperience({ ...newExperience, role: e.target.value })}
                      className="input-base text-sm w-full"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g., 2 years)"
                      value={newExperience.duration}
                      onChange={(e) => setNewExperience({ ...newExperience, duration: e.target.value })}
                      className="input-base text-sm w-full"
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={newExperience.description}
                      onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                      className="input-base text-sm w-full resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2 justify-end flex-col sm:flex-row">
                      <button
                        onClick={() => setShowAddExperience(false)}
                        className="btn-secondary text-sm order-2 sm:order-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addExperience}
                        className="btn-primary text-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform order-1 sm:order-2"
                        disabled={!newExperience.company.trim() || !newExperience.role.trim()}
                      >
                        <Plus className="w-4 h-4" />
                        Add Experience
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddExperience(true)}
                    className="flex items-center gap-2 text-secondary hover:opacity-70 text-sm font-medium w-full justify-center py-2 border border-dashed border-border rounded-lg hover:border-secondary/50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Experience
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Education Section */}
          <div
            className="card-base animate-fade-in-up border-t-3 sm:border-t-4 border-t-accent"
            style={{ animationDelay: "200ms" }}
          >
            <button
              onClick={() => toggleSection("education")}
              className="w-full flex items-center justify-between group p-3 sm:p-4"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                </div>
                <div className="text-left">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground group-hover:text-accent transition-colors">
                    Education
                  </h2>
                  <p className="text-xs text-muted-foreground">Institutions</p>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 sm:w-5 sm:h-5 text-accent transition-all duration-300 ${expandedSections.education ? "rotate-180" : ""} group-hover:scale-110`}
              />
            </button>
            {expandedSections.education && (
              <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3 sm:space-y-4 animate-slide-in-right">
                {education.map((edu, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-lg p-3 hover:border-accent/50 dark:hover:border-accent/40 hover:bg-accent/5 dark:hover:bg-accent/10 transition-all duration-200 group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm truncate">{edu.degree}</h3>
                        <p className="text-accent font-medium text-xs truncate mb-1">{edu.school}</p>
                        {edu.year && <p className="text-xs text-muted-foreground">Graduated {edu.year}</p>}
                      </div>
                      <button
                        onClick={() => removeEducation(i)}
                        className="opacity-0 group-hover:opacity-100 text-primary dark:text-primary dark:hover:text-error transition-all duration-200 flex-shrink-0 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {showAddEducation ? (
                  <div className="border-2 border-accent/30 rounded-lg p-3 bg-accent/5 space-y-3">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4 text-accent" />
                        Add New Education
                      </h3>
                      <button
                        onClick={() => setShowAddEducation(false)}
                        className="text-primary dark:text-primary hover:text-error flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="School/University"
                      value={newEducation.school}
                      onChange={(e) => setNewEducation({ ...newEducation, school: e.target.value })}
                      className="input-base text-sm w-full"
                    />
                    <input
                      type="text"
                      placeholder="Degree (e.g., BS Computer Science)"
                      value={newEducation.degree}
                      onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                      className="input-base text-sm w-full"
                    />
                    <input
                      type="text"
                      placeholder="Graduation Year (optional)"
                      value={newEducation.year}
                      onChange={(e) => setNewEducation({ ...newEducation, year: e.target.value })}
                      className="input-base text-sm w-full"
                    />
                    <div className="flex gap-2 justify-end flex-col sm:flex-row">
                      <button
                        onClick={() => setShowAddEducation(false)}
                        className="btn-secondary text-sm order-2 sm:order-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addEducation}
                        className="btn-primary text-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform order-1 sm:order-2"
                        disabled={!newEducation.school.trim() || !newEducation.degree.trim()}
                      >
                        <Plus className="w-4 h-4" />
                        Add Education
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddEducation(true)}
                    className="flex items-center gap-2 text-accent hover:opacity-70 text-sm font-medium w-full justify-center py-2 border border-dashed border-border rounded-lg hover:border-accent/50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Education
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Enhanced Navigation */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between mt-6 sm:mt-8">
            <button
              onClick={onPrevious}
              className="btn-secondary flex items-center justify-center gap-2 order-2 sm:order-1 hover:scale-105 transition-transform py-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={handleNext}
              className="btn-primary flex items-center justify-center gap-2 order-1 sm:order-2 hover:scale-105 transition-transform py-3"
            >
              Continue to Analysis
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[#293855] dark:text-white text-sm mb-1 transition-colors duration-300">
              Automated Subtraction
            </h3>
            <p className="text-xs text-[#293855] dark:text-[#E3E6EB] leading-relaxed transition-colors duration-300">
              Subtract infinite opportunities and optimize content for maximum impact
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
