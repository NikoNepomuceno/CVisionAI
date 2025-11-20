import { NextRequest, NextResponse } from "next/server"
import { analyzeResume, type ExtractedResume } from "@/lib/deepseek"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => (typeof item === "string" ? item.trim() : "")).filter((item) => item.length > 0)
}

function sanitizeExperience(value: unknown): ExtractedResume["experience"] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item !== "object" || item === null) return null
      const record = item as Record<string, unknown>
      const company = typeof record.company === "string" ? record.company.trim() : ""
      const role = typeof record.role === "string" ? record.role.trim() : ""
      if (!company && !role) return null
      const duration = typeof record.duration === "string" ? record.duration.trim() : undefined
      const description = typeof record.description === "string" ? record.description.trim() : undefined
      return { company, role, duration, description }
    })
    .filter((item): item is ExtractedResume["experience"][number] => Boolean(item))
}

function sanitizeEducation(value: unknown): ExtractedResume["education"] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item !== "object" || item === null) return null
      const record = item as Record<string, unknown>
      const school = typeof record.school === "string" ? record.school.trim() : ""
      const degree = typeof record.degree === "string" ? record.degree.trim() : ""
      if (!school && !degree) return null
      const year = typeof record.year === "string" ? record.year.trim() : undefined
      return { school, degree, year }
    })
    .filter((item): item is ExtractedResume["education"][number] => Boolean(item))
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null)
    const resumeSource: unknown = payload?.resume ?? payload

    if (!resumeSource || typeof resumeSource !== "object") {
      return NextResponse.json({ error: "Missing resume payload" }, { status: 400 })
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

    const analysis = await analyzeResume(resume)
    return NextResponse.json({ data: analysis })
  } catch (error: any) {
    console.error("[api/analyze] error", error)
    return NextResponse.json({ error: error?.message || "Analysis failed" }, { status: 500 })
  }
}


