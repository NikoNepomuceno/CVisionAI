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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="text-2xl font-bold text-foreground dark:text-white flex-1">
              Feedback & Suggestions
            </DialogTitle>
            <button onClick={onDownload} className="btn-secondary flex items-center gap-2 text-sm flex-shrink-0 mt-1">
              <Download className="w-4 h-4" />
              Download
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
  )
}
