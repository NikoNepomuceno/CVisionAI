import { NextRequest, NextResponse } from "next/server"
import pdfParse from "pdf-parse"
import mammoth from "mammoth"

function getFileExtension(filename: string | null): string | null {
  if (!filename) return null
  const idx = filename.lastIndexOf(".")
  return idx === -1 ? null : filename.slice(idx + 1).toLowerCase()
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const ext = getFileExtension(file.name)

    let text = ""
    if (ext === "pdf") {
      const result = await pdfParse(buffer)
      text = result.text || ""
    } else if (ext === "docx") {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value || ""
    } else if (ext === "doc") {
      // Legacy .doc not directly supported; best effort pass-through
      text = ""
    } else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 })
    }

    return NextResponse.json({ text, filename: file.name, size: file.size })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 })
  }
}


