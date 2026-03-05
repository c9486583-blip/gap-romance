import { AlertTriangle, Flag, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContentWarningProps {
  reason?: string | null;
  onReport: () => void;
  onBlock: () => void;
}

const ContentWarning = ({ reason, onReport, onBlock }: ContentWarningProps) => (
  <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 mt-1">
    <div className="flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs text-destructive font-medium">
          This message may contain aggressive or threatening content — please review carefully.
        </p>
        <div className="flex gap-2 mt-2">
          <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={onReport}>
            <Flag className="w-3 h-3 mr-1" /> Report
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10" onClick={onBlock}>
            <Ban className="w-3 h-3 mr-1" /> Block
          </Button>
        </div>
      </div>
    </div>
  </div>
);

export default ContentWarning;
