export type ExtractedResume = {
  skills: string[]
  experience: Array<{ company: string; role: string; duration?: string; description?: string }>
  education: Array<{ school: string; degree: string; year?: string }>
  summary?: string
}

export type AnalysisInsight = {
  title: string
  description: string
  confidence?: number
  tags?: string[]
  category?: string
}

export type ResumeAnalysis = {
  strengths: AnalysisInsight[]
  weaknesses: AnalysisInsight[]
  improvements: AnalysisInsight[]
  summary?: string
}

export type FeedbackItem = {
  id: string
  category: "Clarity" | "Structure" | "Skills" | "Keywords" | "Content"
  title: string
  description: string
  priority: "high" | "medium" | "low"
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

function normalizeInsights(value: unknown): AnalysisInsight[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (typeof item !== "object" || item === null) return null
      const insight = item as Record<string, unknown>
      const confidence = typeof insight.confidence === "number" ? Math.max(0, Math.min(100, insight.confidence)) : undefined
      const tags = Array.isArray(insight.tags) ? insight.tags.filter((tag) => typeof tag === "string") : undefined

      return {
        title: typeof insight.title === "string" ? insight.title : "",
        description: typeof insight.description === "string" ? insight.description : "",
        confidence,
        tags,
        category: typeof insight.category === "string" ? insight.category : undefined,
      }
    })
    .filter((item) => item && item.title && item.description) as AnalysisInsight[]
}

export async function analyzeResume(resume: ExtractedResume): Promise<ResumeAnalysis> {
  if (!resume) {
    throw new Error("Missing resume data")
  }

  const system =
    "You are an expert career coach analyzing resumes. Return structured JSON with strengths, weaknesses, and improvement tips. Insights must be specific, actionable, and job-market relevant."

  const userPrompt = `Analyze the following structured resume data. Consider existing skills and experience. Incorporate any skills present in the data even if inferred.

RESUME DATA:
${JSON.stringify(resume, null, 2)}

Desired JSON format:
{
  "strengths": [{ "title": string, "description": string, "confidence": 0-100?, "tags": string[]?, "category": string? }],
  "weaknesses": [{ ...same shape... }],
  "improvements": [{ ...same shape... }],
  "summary": string?
}

Ensure arrays have at most 6 items each and focus on job-relevant insights.`

  const content = await deepseekChat(userPrompt, { system, temperature: 0.15 })

  const jsonStart = content.indexOf("{")
  const jsonEnd = content.lastIndexOf("}")
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Failed to parse JSON analysis from DeepSeek output")
  }

  const jsonText = content.slice(jsonStart, jsonEnd + 1)
  const parsed = JSON.parse(jsonText)

  return {
    strengths: normalizeInsights(parsed.strengths),
    weaknesses: normalizeInsights(parsed.weaknesses),
    improvements: normalizeInsights(parsed.improvements),
    summary: typeof parsed.summary === "string" ? parsed.summary : undefined,
  }
}

function normalizeFeedback(value: unknown): FeedbackItem[] {
  if (!Array.isArray(value)) return []

  const validCategories = ["Clarity", "Structure", "Skills", "Keywords", "Content"]
  const validPriorities = ["high", "medium", "low"]

  return value
    .map((item, index) => {
      if (typeof item !== "object" || item === null) return null
      const feedback = item as Record<string, unknown>

      const category = typeof feedback.category === "string" && validCategories.includes(feedback.category)
        ? feedback.category as FeedbackItem["category"]
        : "Content"

      const priority = typeof feedback.priority === "string" && validPriorities.includes(feedback.priority)
        ? feedback.priority as FeedbackItem["priority"]
        : "medium"

      return {
        id: typeof feedback.id === "string" ? feedback.id : `feedback-${index}`,
        category,
        title: typeof feedback.title === "string" ? feedback.title : "",
        description: typeof feedback.description === "string" ? feedback.description : "",
        priority,
      }
    })
    .filter((item) => item && item.title && item.description) as FeedbackItem[]
}

export async function generateFeedback(
  resume: ExtractedResume,
  analysis?: ResumeAnalysis,
): Promise<FeedbackItem[]> {
  if (!resume) {
    throw new Error("Missing resume data")
  }

  const system =
    "You are an expert resume coach providing actionable feedback based on the actual resume content. Generate specific, implementable suggestions that reference the actual content in the resume."

  let userPrompt = `Analyze the following resume data and provide actionable feedback. Reference specific companies, roles, skills, or sections when making suggestions.

RESUME DATA:
${JSON.stringify(resume, null, 2)}`

  if (analysis) {
    userPrompt += `\n\nPREVIOUS ANALYSIS:
${JSON.stringify(analysis, null, 2)}`
  }

  userPrompt += `\n\nGenerate feedback items in this JSON format:
{
  "feedback": [
    {
      "id": "unique-id",
      "category": "Clarity" | "Structure" | "Skills" | "Keywords" | "Content",
      "title": "Brief, actionable title",
      "description": "Specific description referencing actual resume content (e.g., 'Your experience at [Company] mentions [Role] but lacks quantifiable achievements. Consider adding metrics like...')",
      "priority": "high" | "medium" | "low"
    }
  ]
}

Guidelines:
- Generate 8-12 feedback items
- Reference specific companies, roles, or skills from the resume
- High priority = critical issues that significantly impact resume quality
- Medium priority = important improvements
- Low priority = nice-to-have enhancements
- Be specific and actionable
- Focus on what's actually in the resume, not generic advice

Return ONLY valid JSON.`

  const content = await deepseekChat(userPrompt, { system, temperature: 0.2 })

  const jsonStart = content.indexOf("{")
  const jsonEnd = content.lastIndexOf("}")
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Failed to parse JSON feedback from DeepSeek output")
  }

  const jsonText = content.slice(jsonStart, jsonEnd + 1)
  const parsed = JSON.parse(jsonText)

  // Handle both { feedback: [...] } and [...] formats
  const feedback = Array.isArray(parsed.feedback) 
    ? parsed.feedback 
    : Array.isArray(parsed) 
      ? parsed 
      : []
  return normalizeFeedback(feedback)
}


