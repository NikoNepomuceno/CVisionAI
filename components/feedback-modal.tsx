"use client"

import { Download } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { FeedbackItem } from "@/lib/deepseek"

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  feedbackItems: FeedbackItem[]
  onDownload: () => void
}

export default function FeedbackModal({ isOpen, onClose, feedbackItems, onDownload }: FeedbackModalProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        [data-slot="dialog-content"].feedback-modal [data-slot="dialog-close"] {
          width: 2.5rem !important;
          height: 2.5rem !important;
          top: 1.5rem !important;
          right: 1.5rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 0.5rem !important;
          background-color: hsl(var(--muted) / 0.5) !important;
          border: 1px solid hsl(var(--border)) !important;
          opacity: 1 !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
        }
        [data-slot="dialog-content"].feedback-modal [data-slot="dialog-close"]:hover {
          background-color: hsl(var(--muted)) !important;
          border-color: hsl(var(--primary) / 0.5) !important;
          box-shadow: 0 4px 6px -1px hsl(var(--primary) / 0.2) !important;
          transform: scale(1.1) !important;
        }
        [data-slot="dialog-content"].feedback-modal [data-slot="dialog-close"] svg {
          width: 1.25rem !important;
          height: 1.25rem !important;
        }
        .dark [data-slot="dialog-content"].feedback-modal [data-slot="dialog-close"] {
          background-color: hsl(var(--muted) / 0.3) !important;
        }
        .dark [data-slot="dialog-content"].feedback-modal [data-slot="dialog-close"]:hover {
          background-color: hsl(var(--muted)) !important;
        }
      `}} />
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="feedback-modal max-w-6xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-2xl font-bold text-foreground dark:text-white">
                Feedback & Suggestions
              </DialogTitle>
              <button 
                onClick={onDownload} 
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 dark:bg-muted/30 hover:bg-muted dark:hover:bg-muted border border-border dark:border-border hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-md hover:shadow-primary/20 transition-all duration-200 text-foreground dark:text-white hover:scale-110 cursor-pointer flex-shrink-0"
                title="Download PDF"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 mt-2 custom-scrollbar">
          {feedbackItems.length === 0 ? (
            <div className="card-base text-center py-8 text-muted-foreground dark:text-slate-400">
              <p>No feedback available.</p>
            </div>
          ) : (
            feedbackItems.map((item, i) => (
              <div
                key={item.id}
                className={`card-base border-l-4 transition-all duration-300 animate-fade-in-up ${
                  item.priority === "high" ? "border-l-error" : "border-l-secondary"
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="font-semibold text-foreground dark:text-white">{item.title}</h3>
                      <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">{item.category}</p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        item.priority === "high"
                          ? "bg-error/10 text-error dark:text-white"
                          : "bg-secondary/10 text-secondary dark:text-white"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground dark:text-slate-300 mt-2">{item.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
