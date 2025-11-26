"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Upload,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  FileText,
  Shield,
  Zap,
  Users,
  Star,
  X,
  Lock,
  EyeOff,
  Server,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface UploadPageProps {
  onNext: (data: any) => void
}

export default function UploadPage({ onNext }: UploadPageProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval)
            return 95
          }
          return prev + 5
        })
      }, 200)
      return () => clearInterval(interval)
    } else {
      setUploadProgress(0)
    }
  }, [isLoading])

  const isValidFileType = (fileName: string): boolean => {
    const validExtensions = [".pdf", ".doc", ".docx"]
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf("."))
    return validExtensions.includes(extension)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const selectedFile = files[0]
      if (!isValidFileType(selectedFile.name)) {
        toast({
          variant: "destructive",
          title: "Invalid file format",
          description: "Please upload a PDF, DOC, or DOCX file.",
        })
        return
      }
      setFile(selectedFile)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (!isValidFileType(selectedFile.name)) {
        toast({
          variant: "destructive",
          title: "Invalid file format",
          description: "Please upload a PDF, DOC, or DOCX file.",
        })
        e.target.value = ""
        return
      }
      setFile(selectedFile)
    }
  }

  const removeFile = () => {
    setFile(null)
  }

  const handleUpload = async () => {
    if (!file) return
    setIsLoading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      if (!uploadRes.ok) throw new Error("Upload failed")

      setUploadProgress(100)

      const { text } = await uploadRes.json()
      toast({
        title: "File uploaded successfully",
        description: "AI analysis starting...",
      })

      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (!extractRes.ok) throw new Error("Extraction failed")

      const { data } = await extractRes.json()
      setShowSuccess(true)

      setTimeout(() => {
        onNext({ file, ...data })
      }, 1500)
    } catch (e) {
      console.error(e)
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col justify-start pt-4 sm:pt-2">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 w-full">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="flex justify-center mb-2 sm:mb-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20 dark:border-slate-900/30">
                <Sparkles className="w-3 h-3 text-primary dark:text-primary" />
                <span className="text-xs font-medium text-primary dark:text-primary">AI-Powered Analysis</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-1">
              Upload Your <span className="text-primary dark:text-primary">Resume</span>
            </h1>

            <p className="text-sm sm:text-xs text-foreground dark:text-white max-w-md mx-auto px-2 sm:px-0">
              Get instant AI-powered insights to transform your resume and land your dream job.
            </p>
          </div>

          {/* Main Content Card */}
          <div className="card-base rounded-xl p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Left Column - Features & Stats - Hidden on mobile, visible on lg+ */}
              <div className="lg:col-span-1 space-y-3 sm:space-y-4 hidden lg:block">
                {/* Enhanced Security Badge */}
                <div className="card-base p-3 border-l-3 border-l-[#50B98E] dark:border-l-[#C3E8C9]">
                  <div className="flex items-center gap-1 mb-2">
                    <Shield className="w-4 h-4 text-[#50B98E] dark:text-[#C3E8C9]" />
                    <h3 className="font-semibold text-foreground text-xs">Secure & Private</h3>
                  </div>
                  <p className="text-sm text-foreground dark:text-white mb-3">
                    Your resume is processed securely and never stored on our servers.
                  </p>

                  {/* Additional Security Features */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#50B98E]/10 dark:bg-[#C3E8C9]/10 rounded flex items-center justify-center">
                        <Lock className="w-3 h-3 text-[#50B98E] dark:text-[#C3E8C9]" />
                      </div>
                      <span className="text-xs text-foreground dark:text-white">End-to-end encrypted</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#50B98E]/10 dark:bg-[#C3E8C9]/10 rounded flex items-center justify-center">
                        <EyeOff className="w-3 h-3 text-[#50B98E] dark:text-[#C3E8C9]" />
                      </div>
                      <span className="text-xs text-foreground dark:text-white">No human review</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#50B98E]/10 dark:bg-[#C3E8C9]/10 rounded flex items-center justify-center">
                        <Server className="w-3 h-3 text-[#50B98E] dark:text-[#C3E8C9]" />
                      </div>
                      <span className="text-xs text-foreground dark:text-white">Auto-deleted after analysis</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="card-base p-3">
                  <h3 className="font-semibold text-foreground text-xs mb-2">Why Users Love Us</h3>
                  <div className="space-y-2">
                    {[
                      { icon: Zap, value: "30s", label: "Average Analysis Time" },
                      { icon: Users, value: "15K+", label: "Resumes Analyzed" },
                      { icon: Star, value: "4.9/5", label: "User Rating" },
                    ].map((stat, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                          <stat.icon className="w-3 h-3 text-primary" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground text-xs">{stat.value}</div>
                          <div className="text-xs text-foreground dark:text-white">{stat.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supported Formats */}
                <div className="card-base p-3">
                  <h3 className="font-semibold text-foreground text-xs mb-1">Supported Formats</h3>
                  <div className="flex flex-wrap gap-1">
                    {["PDF", "DOC", "DOCX"].map((format) => (
                      <span
                        key={format}
                        className="px-1.5 py-0.5 bg-muted text-foreground dark:text-white rounded text-xs font-medium"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Upload Area */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Mobile-Only Security & Stats Summary */}
                <div className="lg:hidden space-y-3">
                  {/* Security Summary */}
                  <div className="card-base p-3 border-l-3 border-l-[#50B98E] dark:border-l-[#C3E8C9]">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-[#50B98E] dark:text-[#C3E8C9]" />
                      <h3 className="font-semibold text-foreground text-sm">Secure & Private</h3>
                    </div>
                    <p className="text-sm text-foreground dark:text-white mb-3">
                      Your resume is processed securely and never stored.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="flex flex-col items-center">
                        <Lock className="w-4 h-4 text-[#50B98E] dark:text-[#C3E8C9] mb-1" />
                        <span className="text-xs text-foreground dark:text-white">Encrypted</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <EyeOff className="w-4 h-4 text-[#50B98E] dark:text-[#C3E8C9] mb-1" />
                        <span className="text-xs text-foreground dark:text-white">Private</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Server className="w-4 h-4 text-[#50B98E] dark:text-[#C3E8C9] mb-1" />
                        <span className="text-xs text-foreground dark:text-white">Auto-deleted</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Summary */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: Zap, value: "30s", label: "Fast" },
                      { icon: Users, value: "15K+", label: "Users" },
                      { icon: Star, value: "4.9/5", label: "Rating" },
                    ].map((stat, index) => (
                      <div key={index} className="card-base p-2 text-center">
                        <div className="flex justify-center mb-1">
                          <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                            <stat.icon className="w-3 h-3 text-primary" />
                          </div>
                        </div>
                        <div className="font-bold text-foreground text-xs">{stat.value}</div>
                        <div className="text-xs text-foreground dark:text-white">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Supported Formats */}
                  <div className="card-base p-3 text-center">
                    <h3 className="font-semibold text-foreground text-xs mb-2">Supported Formats</h3>
                    <div className="flex justify-center gap-2">
                      {["PDF", "DOC", "DOCX"].map((format) => (
                        <span
                          key={format}
                          className="px-2 py-1 bg-muted text-foreground dark:text-white rounded text-xs font-medium"
                        >
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* UPLOAD AREA */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-4 sm:p-6 md:p-8 text-center transition-all duration-300 min-h-[320px] sm:min-h-[330px] flex flex-col items-center justify-center relative ${
                    isDragging
                      ? "border-primary bg-primary/5 scale-105"
                      : file
                        ? "border-[#50B98E] dark:border-[#C3E8C9] bg-[#50B98E]/5 dark:bg-[#C3E8C9]/5"
                        : "border-border hover:border-primary/50 hover:bg-accent/5"
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />

                  <div className="flex flex-col items-center justify-center flex-1 w-full">
                    <label htmlFor="file-input" className="cursor-pointer block w-full">
                      {file ? (
                        <div className="space-y-3 sm:space-y-4">
                          <div className="relative">
                            <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-[#50B98E] dark:text-[#C3E8C9] mx-auto" />
                          </div>

                          <div className="space-y-2">
                            <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-foreground mx-auto" />
                            <h3 className="text-lg sm:text-xl font-semibold text-foreground">Ready for Analysis!</h3>
                            <p className="text-foreground dark:text-white break-words max-w-full mx-auto text-sm px-2 line-clamp-2">
                              {file.name}
                            </p>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                removeFile()
                              }}
                              className="inline-flex items-center gap-1 text-sm text-error hover:text-error/80 transition-colors mt-2"
                            >
                              <X className="w-4 h-4" />
                              Remove file
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          <div className="relative">
                            <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-primary mx-auto transition-transform duration-300" />
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                              {isDragging ? "Drop your resume here" : "Choose your resume"}
                            </h3>
                            <p className="text-sm text-foreground dark:text-white">Drag & drop or click to browse</p>
                            <p className="text-xs text-foreground dark:text-white">
                              Supports PDF, DOC, DOCX • Max 10MB
                            </p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Progress Bar - Positioned at bottom with proper spacing */}
                  {isLoading && (
                    <div className="w-full mt-4 sm:mt-6 space-y-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-foreground dark:text-white text-center">
                        {uploadProgress < 100 ? "Analyzing your resume..." : "Almost done!"}
                        <span className="block text-xs mt-1 font-medium">{uploadProgress}%</span>
                      </p>
                    </div>
                  )}

                  {/* Success Animation */}
                  {showSuccess && (
                    <div className="w-full mt-4 sm:mt-6 animate-fade-in">
                      <div className="flex items-center justify-center gap-2 text-[#50B98E] dark:text-[#C3E8C9] text-sm">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-semibold">Analysis Complete!</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleUpload}
                    disabled={!file || isLoading || showSuccess}
                    className="btn-primary w-full sm:w-auto px-6 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing... {uploadProgress}%</span>
                      </>
                    ) : showSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Redirecting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analyze My Resume</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
