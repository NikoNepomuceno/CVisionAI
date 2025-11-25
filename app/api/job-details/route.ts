import { NextRequest, NextResponse } from "next/server"
import { generateJobDetails } from "@/lib/deepseek"
import { resumeCache } from "@/lib/cache"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null)

    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 })
    }

    const jobTitle = typeof payload.jobTitle === "string" ? payload.jobTitle.trim() : ""
    const company = typeof payload.company === "string" ? payload.company.trim() : ""
    const location = typeof payload.location === "string" ? payload.location.trim() : "Location not specified"
    const type = typeof payload.type === "string" ? payload.type.trim() : undefined
    const skills = Array.isArray(payload.skills)
      ? payload.skills.filter((s: any) => typeof s === "string" && s.trim().length > 0).map((s: any) => s.trim())
      : []

    if (!jobTitle || !company) {
      return NextResponse.json(
        { error: "Job title and company are required" },
        { status: 400 }
      )
    }

    // Generate cache key
    const cacheKeyData = `${jobTitle}|${company}|${location}|${type || ""}|${skills.join(",")}`
    const cacheKeyHash = crypto.createHash("sha256").update(cacheKeyData.toLowerCase()).digest("hex").slice(0, 16)
    const cacheKey = `job-details:${cacheKeyHash}`

    // Check cache first
    const cached = resumeCache.get(cacheKey)
    if (cached) {
      return NextResponse.json({ data: cached, cached: true })
    }

    // Generate job details
    const jobDetails = await generateJobDetails(jobTitle, company, skills, location, type)

    // Store in cache
    resumeCache.set(cacheKey, jobDetails)

    return NextResponse.json({ data: jobDetails, cached: false })
  } catch (error: any) {
    console.error("[api/job-details] error", error)
    return NextResponse.json({ error: error?.message || "Job details generation failed" }, { status: 500 })
  }
}

