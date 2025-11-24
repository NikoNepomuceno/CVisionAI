"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Upload, CheckCircle2, Sparkles, ArrowRight } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface UploadPageProps {
  onNext: (data: any) => void
  initialFile?: File | null
}

export default function UploadPage({ onNext, initialFile = null }: UploadPageProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(initialFile)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setFile(initialFile)
  }, [initialFile])

  const isValidFileType = (fileName: string): boolean => {
    const validExtensions = ['.pdf', '.doc', '.docx']
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
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
        // Reset the input
        e.target.value = ""
        return
      }
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      if (!uploadRes.ok) throw new Error("Upload failed")
      const { text } = await uploadRes.json()
      toast({
        title: "File uploaded successfully",
        description: file.name,
      })

      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (!extractRes.ok) throw new Error("Extraction failed")
      const { data } = await extractRes.json()
      onNext({ file, ...data })
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4 mb-12 animate-fade-in-up">
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 hover:border-primary/40 transition-colors duration-300">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Analysis</span>
          </div>
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-foreground leading-tight">Enhance Your Resume with AI</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload your resume and get instant AI-powered insights to improve your chances of landing your dream job.
        </p>
      </div>

      <div className="max-w-2xl mx-auto animate-slide-in-right">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${isDragging
              ? "border-primary bg-primary/5 scale-105 shadow-lg shadow-primary/20"
              : "border-border hover:border-primary/50 hover:bg-accent/5"
            }`}
        >
          <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" id="file-input" />
          <label htmlFor="file-input" className="cursor-pointer block">
            <div className="flex justify-center mb-4">
              {file ? (
                <div className="relative">
                  <CheckCircle2 className="w-16 h-16 text-primary animate-pulse" />
                </div>
              ) : (
                <div className="relative">
                  <Upload className="w-16 h-16 text-primary" />
                </div>
              )}
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {file ? "File Selected" : "Drop your resume here"}
            </h3>
            <p className="text-muted-foreground mb-4">{file ? file.name : "or click to browse (PDF, DOC, DOCX)"}</p>
            {!file && <p className="text-sm text-muted-foreground">Max file size: 10MB</p>}
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
        {[
          { name: "Sarah Chen", role: "Product Manager", quote: "Improved my resume in 10 minutes!" },
          { name: "James Wilson", role: "Software Engineer", quote: "Got 3 interviews after using this." },
          { name: "Maria Garcia", role: "Designer", quote: "Best resume tool I've used." },
        ].map((testimonial, i) => (
          <div
            key={i}
            className="card-base text-center hover:shadow-lg transition-all duration-300 animate-fade-in-up border-t-4 border-t-secondary"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
            <p className="font-semibold text-foreground">{testimonial.name}</p>
            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-12">
        <button
          onClick={handleUpload}
          disabled={!file || isLoading}
          className="btn-primary text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Analyze My Resume
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
