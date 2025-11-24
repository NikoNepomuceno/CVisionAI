import { ExternalLink, MapPin, DollarSign, Briefcase, Sparkles } from "lucide-react"
import type { JobRecommendation } from "@/lib/deepseek"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface JobDetailsDialogProps {
  job: JobRecommendation | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JobDetailsDialog({ job, open, onOpenChange }: JobDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {job ? (
          <>
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-2xl">{job.title}</DialogTitle>
              <DialogDescription className="flex flex-col gap-1 text-left">
                <span className="text-base text-foreground">{job.company}</span>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="w-4 h-4" />
                    Role Type
                  </div>
                  <p className="text-base font-semibold text-foreground">
                    {job.type ? job.type.replace("-", " ") : "Not specified"}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4" />
                    Match Score
                  </div>
                  <p className="text-base font-semibold text-foreground">{job.match}%</p>
                </div>
                {job.salary && (
                  <div className="p-3 rounded-lg border bg-muted/30 sm:col-span-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      Salary Range
                    </div>
                    <p className="text-base font-semibold text-foreground">{job.salary}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Matched Skills</p>
                {job.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No specific skills highlighted.</p>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Job Overview</p>
                <p className="text-sm leading-relaxed text-foreground">
                  {job.description || "This role has not provided a description yet."}
                </p>
              </div>
            </div>

            {job.url && (
              <button
                onClick={() => window.open(job.url, "_blank", "noopener,noreferrer")}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Original Posting
              </button>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}


