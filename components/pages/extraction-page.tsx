"use client"

import { useState } from "react"
import { ChevronDown, Plus, Trash2, ArrowRight, ArrowLeft, X } from "lucide-react"

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
      { company: "Tech Corp", role: "Senior Developer", duration: "2 years" },
      { company: "StartUp Inc", role: "Full Stack Engineer", duration: "1.5 years" },
    ],
  )
  const [education, setEducation] = useState<Education[]>(
    resumeData.education || [{ school: "State University", degree: "BS Computer Science" }],
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
    <div className="space-y-6">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-foreground mb-2">Extraction Summary</h1>
        <p className="text-muted-foreground">Review and edit the extracted information from your resume</p>
      </div>

      {/* Skills Section */}
      <div className="card-base animate-fade-in-up border-t-4 border-t-primary">
        <button onClick={() => toggleSection("skills")} className="w-full flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Skills</h2>
          <ChevronDown
            className={`w-5 h-5 text-primary transition-transform duration-300 ${expandedSections.skills ? "rotate-180" : ""}`}
          />
        </button>
        {expandedSections.skills && (
          <div className="mt-4 space-y-3 animate-slide-in-right">
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <div
                  key={i}
                  className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-primary/20 transition-all duration-200 border border-primary/20"
                >
                  {skill}
                  <button onClick={() => removeSkill(i)} className="hover:opacity-70">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSkill()}
                placeholder="Add a new skill..."
                className="input-base text-sm flex-1"
              />
              <button onClick={addSkill} className="btn-primary text-sm px-3">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Experience Section */}
      <div className="card-base animate-fade-in-up border-t-4 border-t-secondary" style={{ animationDelay: "100ms" }}>
        <button onClick={() => toggleSection("experience")} className="w-full flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Experience</h2>
          <ChevronDown
            className={`w-5 h-5 text-secondary transition-transform duration-300 ${expandedSections.experience ? "rotate-180" : ""}`}
          />
        </button>
        {expandedSections.experience && (
          <div className="mt-4 space-y-4 animate-slide-in-right">
            {experience.map((exp, i) => (
              <div
                key={i}
                className="border-2 border-border rounded-lg p-4 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{exp.role}</h3>
                    <p className="text-sm text-muted-foreground">{exp.company}</p>
                  </div>
                  <button
                    onClick={() => removeExperience(i)}
                    className="text-muted-foreground hover:text-error transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">{exp.duration}</p>
                {exp.description && <p className="text-sm text-foreground mt-2">{exp.description}</p>}
              </div>
            ))}

            {showAddExperience ? (
              <div className="border-2 border-primary/30 rounded-lg p-4 bg-primary/5 space-y-3">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-foreground">Add New Experience</h3>
                  <button
                    onClick={() => setShowAddExperience(false)}
                    className="text-muted-foreground hover:text-foreground"
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
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowAddExperience(false)} className="btn-secondary text-sm">
                    Cancel
                  </button>
                  <button onClick={addExperience} className="btn-primary text-sm">
                    Add Experience
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddExperience(true)}
                className="flex items-center gap-2 text-primary hover:opacity-70 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Experience
              </button>
            )}
          </div>
        )}
      </div>

      {/* Education Section */}
      <div className="card-base animate-fade-in-up border-t-4 border-t-accent" style={{ animationDelay: "200ms" }}>
        <button onClick={() => toggleSection("education")} className="w-full flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Education</h2>
          <ChevronDown
            className={`w-5 h-5 text-accent transition-transform duration-300 ${expandedSections.education ? "rotate-180" : ""}`}
          />
        </button>
        {expandedSections.education && (
          <div className="mt-4 space-y-4 animate-slide-in-right">
            {education.map((edu, i) => (
              <div
                key={i}
                className="border-2 border-border rounded-lg p-4 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{edu.degree}</h3>
                    <p className="text-sm text-muted-foreground">{edu.school}</p>
                  </div>
                  <button
                    onClick={() => removeEducation(i)}
                    className="text-muted-foreground hover:text-error transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {edu.year && <p className="text-sm text-muted-foreground mt-2">{edu.year}</p>}
              </div>
            ))}

            {showAddEducation ? (
              <div className="border-2 border-primary/30 rounded-lg p-4 bg-primary/5 space-y-3">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-foreground">Add New Education</h3>
                  <button
                    onClick={() => setShowAddEducation(false)}
                    className="text-muted-foreground hover:text-foreground"
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
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowAddEducation(false)} className="btn-secondary text-sm">
                    Cancel
                  </button>
                  <button onClick={addEducation} className="btn-primary text-sm">
                    Add Education
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddEducation(true)}
                className="flex items-center gap-2 text-primary hover:opacity-70 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Education
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between gap-4 mt-8">
        <button onClick={onPrevious} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>
        <button onClick={handleNext} className="btn-primary flex items-center gap-2">
          Continue to Analysis
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
