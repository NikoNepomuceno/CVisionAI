import crypto from "crypto"

type CacheEntry<T> = {
  data: T
  expiresAt: number
}

class ResumeCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private readonly TTL_MS = 60 * 60 * 1000 // 1 hour in milliseconds

  /**
   * Generate a hash key from resume content
   */
  generateKey(resumeData: {
    skills: string[]
    experience: Array<{ company: string; role: string; duration?: string; description?: string }>
    education: Array<{ school: string; degree: string; year?: string }>
    summary?: string
  }): string {
    // Normalize and sort data for consistent hashing
    const normalized = {
      skills: [...resumeData.skills].sort(),
      experience: resumeData.experience
        .map((exp) => ({
          company: exp.company.trim().toLowerCase(),
          role: exp.role.trim().toLowerCase(),
          duration: exp.duration?.trim().toLowerCase() || "",
          description: exp.description?.trim().toLowerCase() || "",
        }))
        .sort((a, b) => a.company.localeCompare(b.company)),
      education: resumeData.education
        .map((edu) => ({
          school: edu.school.trim().toLowerCase(),
          degree: edu.degree.trim().toLowerCase(),
          year: edu.year?.trim().toLowerCase() || "",
        }))
        .sort((a, b) => a.school.localeCompare(b.school)),
      summary: (resumeData.summary || "").trim().toLowerCase(),
    }

    const hashInput = JSON.stringify(normalized)
    return crypto.createHash("sha256").update(hashInput).digest("hex")
  }

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set cache data with TTL
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.TTL_MS,
    })
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete a specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all expired entries
   */
  clearExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }
}

// Singleton instance
export const resumeCache = new ResumeCache()

// Clean up expired entries periodically (only in Node.js environment)
if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
  // Clean up on each access (lazy cleanup)
  // Also set up periodic cleanup if in a long-running process
  if (typeof setInterval !== "undefined") {
    setInterval(() => {
      resumeCache.clearExpired()
    }, 10 * 60 * 1000) // Every 10 minutes
  }
}

