"use client"

import { useState } from "react"
import { ArrowRight, Zap, BarChart3, Brain, CheckCircle2 } from "lucide-react"

interface LandingPageProps {
  onGetStarted: () => void
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isHovering, setIsHovering] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10 flex flex-col">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-md border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
              <img src="/CVisionAI-Logo-Header.png" alt="CV Logo" className="w-6 sm:w-8 h-6 sm:h-8 object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">CVisionAI</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Resume Analysis</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12 md:py-20">
        <div className="max-w-3xl w-full animate-fade-in-up">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <div className="inline-block mb-3 sm:mb-4 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20">
              <span className="text-xs sm:text-sm font-medium text-primary">AI-Powered Analysis</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
              Elevate Your Resume with{" "}
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                AI Intelligence
              </span>
            </h2>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
              Transform your resume into a compelling professional document. Get AI-powered insights, keyword
              optimization, and personalized recommendations to land your dream job.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={onGetStarted}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="group px-6 sm:px-8 py-3 sm:py-4 bg-primary text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                Get Started Now
                <ArrowRight
                  className={`w-4 sm:w-5 h-4 sm:h-5 transition-transform duration-300 ${isHovering ? "translate-x-1" : ""}`}
                />
              </button>
              <button
                onClick={onGetStarted}
                className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary/5 transition-all duration-300 text-sm sm:text-base"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12">
            {[
              {
                icon: Brain,
                title: "AI Analysis",
                description: "Advanced AI algorithms analyze your resume comprehensively",
              },
              {
                icon: Zap,
                title: "Instant Insights",
                description: "Get actionable feedback in seconds, not hours",
              },
              {
                icon: BarChart3,
                title: "Keyword Optimization",
                description: "Optimize for job descriptions and ATS systems",
              },
              {
                icon: CheckCircle2,
                title: "Expert Recommendations",
                description: "Receive personalized suggestions to improve your profile",
              },
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group p-4 sm:p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 dark:hover:shadow-primary/5"
                >
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-all duration-300">
                    <Icon className="w-5 sm:w-6 h-5 sm:h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 sm:mb-2 text-sm sm:text-base">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 p-4 sm:p-6 md:p-8 bg-card border border-border rounded-xl">
            {[
              { number: "10k+", label: "Resumes Analyzed" },
              { number: "95%", label: "Success Rate" },
              { number: "24/7", label: "AI Support" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-0.5 sm:mb-1">
                  {stat.number}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm py-4 sm:py-6">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 text-center text-xs sm:text-sm text-muted-foreground">
          <p>CVisionAI © 2025. Your resume, reimagined.</p>
        </div>
      </footer>
    </div>
  )
}
