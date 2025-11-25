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

export type KeywordMatch = {
  keyword: string
  frequency: number
  matched: boolean
  category?: "skill" | "technology" | "tool" | "certification" | "other"
}

export type SkillMatch = {
  skill: string
  match: number // 0-100 percentage
  foundInJob: boolean
}

export type KeywordAnalysis = {
  yourSkills: SkillMatch[]
  jobKeywords: KeywordMatch[]
  matchPercentage: number
  missingKeywords: string[]
  suggestions: string[]
}

export type JobRecommendation = {
  id: string
  title: string
  company: string
  match: number // 0-100 percentage
  skills: string[] // Matched skills from resume
  location: string
  salary?: string
  description?: string
  url?: string
  type?: "full-time" | "part-time" | "contract" | "remote" | "hybrid"
  category?: "best-match" | "trending" | "remote" | "other"
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

export async function analyzeKeywordMatch(
  resume: ExtractedResume,
  jobDescription: string
): Promise<KeywordAnalysis> {
  if (!resume || !jobDescription) {
    throw new Error("Missing resume data or job description")
  }

  const system =
    "You are an expert at analyzing resumes and job descriptions. Extract keywords, match skills, and provide actionable insights."

  const userPrompt = `Analyze keyword matching between this resume and job description.

RESUME DATA:
${JSON.stringify(resume, null, 2)}

JOB DESCRIPTION:
${jobDescription}

Return a JSON object with this structure:
{
  "yourSkills": [
    {
      "skill": "string (from resume)",
      "match": 0-100 (how relevant this skill is to the job),
      "foundInJob": boolean (if skill appears in job description)
    }
  ],
  "jobKeywords": [
    {
      "keyword": "string (important keyword from job description)",
      "frequency": number (how many times it appears),
      "matched": boolean (if it exists in resume),
      "category": "skill" | "technology" | "tool" | "certification" | "other"
    }
  ],
  "missingKeywords": ["string array of important keywords not in resume"],
  "suggestions": ["string array of actionable suggestions to improve match"]
}

Guidelines:
- Extract 10-15 most important keywords from the job description
- Calculate match percentage for each resume skill (0-100)
- Identify missing critical keywords
- Provide 3-5 specific, actionable suggestions
- Focus on technical skills, tools, and technologies
- Consider synonyms and related terms when matching

Return ONLY valid JSON.`

  const content = await deepseekChat(userPrompt, { system, temperature: 0.2 })

  const jsonStart = content.indexOf("{")
  const jsonEnd = content.lastIndexOf("}")
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Failed to parse JSON keyword analysis from DeepSeek output")
  }

  const jsonText = content.slice(jsonStart, jsonEnd + 1)
  const parsed = JSON.parse(jsonText)

  // Normalize and validate the response
  const yourSkills: SkillMatch[] = Array.isArray(parsed.yourSkills)
    ? parsed.yourSkills
        .map((item: any) => ({
          skill: typeof item.skill === "string" ? item.skill : "",
          match: typeof item.match === "number" ? Math.max(0, Math.min(100, item.match)) : 0,
          foundInJob: typeof item.foundInJob === "boolean" ? item.foundInJob : false,
        }))
        .filter((item: SkillMatch) => item.skill.length > 0)
    : []

  const jobKeywords: KeywordMatch[] = Array.isArray(parsed.jobKeywords)
    ? parsed.jobKeywords
        .map((item: any) => ({
          keyword: typeof item.keyword === "string" ? item.keyword : "",
          frequency: typeof item.frequency === "number" ? Math.max(0, item.frequency) : 0,
          matched: typeof item.matched === "boolean" ? item.matched : false,
          category: typeof item.category === "string" ? item.category : "other",
        }))
        .filter((item: KeywordMatch) => item.keyword.length > 0)
    : []

  const missingKeywords: string[] = Array.isArray(parsed.missingKeywords)
    ? parsed.missingKeywords.filter((kw: any) => typeof kw === "string" && kw.length > 0)
    : []

  const suggestions: string[] = Array.isArray(parsed.suggestions)
    ? parsed.suggestions.filter((s: any) => typeof s === "string" && s.length > 0)
    : []

  // Calculate overall match percentage
  const matchedKeywords = jobKeywords.filter((k) => k.matched).length
  const matchPercentage =
    jobKeywords.length > 0 ? Math.round((matchedKeywords / jobKeywords.length) * 100) : 0

  return {
    yourSkills,
    jobKeywords,
    matchPercentage,
    missingKeywords,
    suggestions,
  }
}

function normalizeJobRecommendations(value: unknown): JobRecommendation[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item, index) => {
      if (typeof item !== "object" || item === null) return null
      const job = item as Record<string, unknown>

      const skills = Array.isArray(job.skills)
        ? job.skills.filter((s: any) => typeof s === "string" && s.length > 0)
        : []

      const match = typeof job.match === "number" ? Math.max(0, Math.min(100, job.match)) : 0

      return {
        id: typeof job.id === "string" ? job.id : `job-${index}`,
        title: typeof job.title === "string" ? job.title : "",
        company: typeof job.company === "string" ? job.company : "",
        match,
        skills,
        location: typeof job.location === "string" ? job.location : "Location not specified",
        salary: typeof job.salary === "string" ? job.salary : undefined,
        description: typeof job.description === "string" ? job.description : undefined,
        url: typeof job.url === "string" ? job.url : undefined,
        type: typeof job.type === "string" ? (job.type as JobRecommendation["type"]) : undefined,
        category: typeof job.category === "string" ? (job.category as JobRecommendation["category"]) : "other",
      }
    })
    .filter((item) => item && item.title && item.company) as JobRecommendation[]
}

export async function generateJobRecommendations(
  resume: ExtractedResume,
  keywordAnalysis?: KeywordAnalysis,
): Promise<JobRecommendation[]> {
  if (!resume) {
    throw new Error("Missing resume data")
  }

  const system =
    "You are an expert job matching assistant. Generate realistic job recommendations based on resume data. Return structured JSON with job listings that match the candidate's skills and experience."

  let userPrompt = `Generate 8-12 job recommendations based on the following resume data. Consider the candidate's skills, experience, and education.

RESUME DATA:
${JSON.stringify(resume, null, 2)}`

  if (keywordAnalysis) {
    userPrompt += `\n\nKEYWORD ANALYSIS:
Match Percentage: ${keywordAnalysis.matchPercentage}%
Matched Skills: ${keywordAnalysis.yourSkills.filter((s) => s.foundInJob).map((s) => s.skill).join(", ")}
Missing Keywords: ${keywordAnalysis.missingKeywords.join(", ")}`
  }

  userPrompt += `\n\nReturn a JSON array of job recommendations in this format:
[
  {
    "id": "unique-id",
    "title": "Job Title",
    "company": "Company Name",
    "match": 0-100 (match percentage based on skills/experience alignment),
    "skills": ["skill1", "skill2", "skill3"] (skills from resume that match this job),
    "location": "City, State or Remote",
    "salary": "Salary range (optional, e.g., '$100K - $130K')",
    "description": "Brief job description (optional)",
    "type": "full-time" | "part-time" | "contract" | "remote" | "hybrid" (optional),
    "category": "best-match" | "trending" | "remote" | "other"
  }
]

Guidelines:
- Generate realistic job titles and company names
- Match percentage should reflect how well the job aligns with the resume (consider skills, experience level, education)
- Include 3-5 matched skills per job (skills that appear in both resume and job requirements)
- Vary locations (include some remote options)
- Include salary ranges when appropriate
- Categorize jobs: "best-match" for highest match scores (80%+), "remote" for remote positions, "trending" for popular/in-demand roles
- Ensure diversity in job titles and companies
- Match percentage should be realistic based on actual skill alignment

Return ONLY valid JSON array.`

  const content = await deepseekChat(userPrompt, { system, temperature: 0.3 })

  const jsonStart = content.indexOf("[")
  const jsonEnd = content.lastIndexOf("]")
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Failed to parse JSON job recommendations from DeepSeek output")
  }

  const jsonText = content.slice(jsonStart, jsonEnd + 1)
  const parsed = JSON.parse(jsonText)

  const recommendations = normalizeJobRecommendations(parsed)

  // Sort by match percentage (highest first)
  return recommendations.sort((a, b) => b.match - a.match)
}

export type JobDetails = {
  description: string
  requirements: string[]
  benefits: string[]
  applicationProcess: string
  companyInfo: string
}

export async function generateJobDetails(
  jobTitle: string,
  company: string,
  skills: string[],
  location: string,
  type?: string
): Promise<JobDetails> {
  if (!jobTitle || !company) {
    throw new Error("Missing job title or company")
  }

  const system =
    "You are an expert job description writer. Generate detailed, realistic job information based on the provided job details. Return structured JSON with comprehensive job information."

  const userPrompt = `Generate detailed job information for the following position:

JOB TITLE: ${jobTitle}
COMPANY: ${company}
LOCATION: ${location}
TYPE: ${type || "full-time"}
RELEVANT SKILLS: ${skills.join(", ") || "Not specified"}

Return a JSON object with this structure:
{
  "description": "Detailed job description (2-3 paragraphs explaining the role, responsibilities, and what the company is looking for)",
  "requirements": ["Requirement 1", "Requirement 2", "Requirement 3", ...] (5-8 specific requirements),
  "benefits": ["Benefit 1", "Benefit 2", "Benefit 3", ...] (4-6 realistic benefits),
  "applicationProcess": "Brief description of how to apply (1-2 sentences)",
  "companyInfo": "Brief information about the company (1-2 sentences)"
}

Guidelines:
- Make the description realistic and detailed
- Requirements should be specific and relevant to the job title
- Benefits should be realistic (health insurance, 401k, remote work, etc.)
- Application process should be brief but informative
- Company info should be generic but professional
- All content should be professional and appropriate

Return ONLY valid JSON.`

  const content = await deepseekChat(userPrompt, { system, temperature: 0.3 })

  const jsonStart = content.indexOf("{")
  const jsonEnd = content.lastIndexOf("}")
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Failed to parse JSON job details from DeepSeek output")
  }

  const jsonText = content.slice(jsonStart, jsonEnd + 1)
  const parsed = JSON.parse(jsonText)

  // Normalize and validate
  return {
    description: typeof parsed.description === "string" ? parsed.description : "Job description not available.",
    requirements: Array.isArray(parsed.requirements)
      ? parsed.requirements.filter((r: any) => typeof r === "string" && r.length > 0)
      : [],
    benefits: Array.isArray(parsed.benefits)
      ? parsed.benefits.filter((b: any) => typeof b === "string" && b.length > 0)
      : [],
    applicationProcess: typeof parsed.applicationProcess === "string" ? parsed.applicationProcess : "Apply through company website or job portal.",
    companyInfo: typeof parsed.companyInfo === "string" ? parsed.companyInfo : `${company} is a professional organization.`,
  }
}


