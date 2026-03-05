import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PROFILE_REPORT_REASONS = [
  "Harassment",
  "Fake Profile",
  "Threats or Violence",
  "Scam or Fraud",
  "Inappropriate Content",
  "Underage User",
  "Other",
];

const MESSAGE_REPORT_REASONS = [
  "Harassment",
  "Threatening Message",
  "Inappropriate Image",
  "Spam",
  "Other",
];

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
  messageId?: string | null;
  source?: "profile" | "message" | "chat_header";
}

const ReportModal = ({ open, onOpenChange, reportedUserId, messageId = null, source = "profile" }: ReportModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [context, setContext] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reasons = source === "message" ? MESSAGE_REPORT_REASONS : PROFILE_REPORT_REASONS;

  const handleSubmit = async () => {
    if (!user || !reason) return;
    setSubmitting(true);
    await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_id: reportedUserId,
      reason,
      context: context || null,
      message_id: messageId || null,
      source,
    } as any);
    toast({
      title: "Report submitted",
      description: "Thank you for your report. Our safety team will review it and take appropriate action.",
    });
    setReason("");
    setContext("");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            {source === "message" ? "Report Message" : "Report User"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground"
            >
              <option value="">Select a reason...</option>
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Additional details (optional)</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              maxLength={1000}
              placeholder="Provide any additional context..."
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground resize-none h-24"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!reason || submitting}>
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;
