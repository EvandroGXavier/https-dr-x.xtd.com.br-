import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagChipProps {
  nome: string;
  cor?: string;
  icone?: string;
  onRemove?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const TagChip = ({ nome, cor = "#6B7280", icone = "🏷️", onRemove, className, size = "md" }: TagChipProps) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${cor}20`,
        borderColor: cor,
        color: cor,
      }}
    >
      <span className="text-xs">{icone}</span>
      <span>{nome}</span>
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto w-auto p-0 hover:bg-transparent"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Badge>
  );
};