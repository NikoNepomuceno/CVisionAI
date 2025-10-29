export type ExtractedResume = {
  skills: string[]
  experience: Array<{ company: string; role: string; duration?: string; description?: string }>
  education: Array<{ school: string; degree: string; year?: string }>
  summary?: string
}

interface ChatOptions {
  system?: string
  temperature?: number
  model?: string
}

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat"

async function deepseekChat(prompt: string, options: ChatOptions = {}) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("Missing DEEPSEEK_API_KEY")
  }

  const body = {
    model: options.model || DEFAULT_MODEL,
    messages: [
      options.system ? { role: "system", content: options.system } : undefined,
      { role: "user", content: prompt },
    ].filter(Boolean),
    temperature: options.temperature ?? 0.2,
    stream: false,
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`DeepSeek error: ${response.status} ${text}`)
  }

  const data = await response.json()
  const content: string | undefined = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error("DeepSeek returned empty content")
  }
  return content
}

export async function extractResumeFromText(resumeText: string): Promise<ExtractedResume> {
  const system =
    "You are a resume parsing assistant. Extract a clean JSON with keys: skills[], experience[{company, role, duration?, description?}], education[{school, degree, year?}], summary?. Return ONLY JSON."

  const userPrompt = `Extract structured resume data from the following text. If fields are missing, infer conservatively.\n\nRESUME:\n\n${resumeText}`

  const content = await deepseekChat(userPrompt, { system, temperature: 0.1 })

  // Attempt to parse JSON from model output
  const jsonStart = content.indexOf("{")
  const jsonEnd = content.lastIndexOf("}")
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Failed to parse JSON extraction from DeepSeek output")
  }
  const jsonText = content.slice(jsonStart, jsonEnd + 1)
  const parsed = JSON.parse(jsonText)

  return {
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
    education: Array.isArray(parsed.education) ? parsed.education : [],
    summary: typeof parsed.summary === "string" ? parsed.summary : undefined,
  }
}


