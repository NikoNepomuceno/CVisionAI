import { NextRequest, NextResponse } from "next/server"
import { extractResumeFromText } from "@/lib/deepseek"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 })
    }
    const extracted = await extractResumeFromText(text)
    return NextResponse.json({ data: extracted })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Extraction failed" }, { status: 500 })
  }
}


