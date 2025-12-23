import { Clock, Check, XCircle } from "lucide-react";

interface StatusIconProps {
  status: string | null;
}

export function StatusIcon({ status }: StatusIconProps) {
  if (!status) return null;

  switch (status.toUpperCase()) {
    case "QUEUED":
      return <Clock className="w-3 h-3 text-muted-foreground" />;
    case "SENT":
      return <Check className="w-3 h-3 text-muted-foreground" />;
    case "DELIVERED":
      return (
        <div className="flex -space-x-1">
          <Check className="w-3 h-3 text-muted-foreground" />
          <Check className="w-3 h-3 text-muted-foreground" />
        </div>
      );
    case "READ":
      return (
        <div className="flex -space-x-1">
          <Check className="w-3 h-3 text-blue-500" />
          <Check className="w-3 h-3 text-blue-500" />
        </div>
      );
    case "FAILED":
      return <XCircle className="w-3 h-3 text-destructive" />;
    default:
      return null;
  }
}
