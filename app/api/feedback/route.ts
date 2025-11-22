import { NextRequest, NextResponse } from "next/server"
import { generateFeedback, type ExtractedResume, type ResumeAnalysis } from "@/lib/deepseek"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => (typeof item === "string" ? item.trim() : "")).filter((item) => item.length > 0)
}

function sanitizeExperience(value: unknown): ExtractedResume["experience"] {
  if (!Array.isArray(value)) return []
  const result: ExtractedResume["experience"] = []
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue
    const record = item as Record<string, unknown>
    const company = typeof record.company === "string" ? record.company.trim() : ""
    const role = typeof record.role === "string" ? record.role.trim() : ""
    if (!company && !role) continue
    const duration = typeof record.duration === "string" ? record.duration.trim() : undefined
    const description = typeof record.description === "string" ? record.description.trim() : undefined
    result.push({ company, role, duration, description })
  }
  return result
}

function sanitizeEducation(value: unknown): ExtractedResume["education"] {
  if (!Array.isArray(value)) return []
  const result: ExtractedResume["education"] = []
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue
    const record = item as Record<string, unknown>
    const school = typeof record.school === "string" ? record.school.trim() : ""
    const degree = typeof record.degree === "string" ? record.degree.trim() : ""
    if (!school && !degree) continue
    const year = typeof record.year === "string" ? record.year.trim() : undefined
    result.push({ school, degree, year })
  }
  return result
}

function sanitizeAnalysis(value: unknown): ResumeAnalysis | undefined {
  if (!value || typeof value !== "object") return undefined
  // Basic validation - we'll let generateFeedback handle the actual structure
  return value as ResumeAnalysis
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null)

    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 })
    }

    const resumeSource: unknown = payload.resume ?? payload

    if (!resumeSource || typeof resumeSource !== "object") {
      return NextResponse.json({ error: "Missing resume data" }, { status: 400 })
    }

    const resumeRecord = resumeSource as Record<string, unknown>

    const resume: ExtractedResume = {
      skills: sanitizeStringArray(resumeRecord.skills),
      experience: sanitizeExperience(resumeRecord.experience),
      education: sanitizeEducation(resumeRecord.education),
      summary: typeof resumeRecord.summary === "string" ? resumeRecord.summary.trim() : undefined,
    }

    if (
      resume.skills.length === 0 &&
      resume.experience.length === 0 &&
      resume.education.length === 0 &&
      !resume.summary
    ) {
      return NextResponse.json({ error: "Resume data is empty" }, { status: 400 })
    }

    const analysis = sanitizeAnalysis(payload.analysis)

    const feedback = await generateFeedback(resume, analysis)
    return NextResponse.json({ feedback })
  } catch (error: any) {
    console.error("[api/feedback] error", error)
    return NextResponse.json({ error: error?.message || "Feedback generation failed" }, { status: 500 })
  }
}

