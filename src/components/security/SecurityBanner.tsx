import { Shield, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SecurityBannerProps {
  message?: string;
  variant?: "warning" | "info" | "error";
}

export function SecurityBanner({ 
  message = "O sistema está em modo seguro. Algumas ações foram restritas até a conclusão das políticas de segurança.",
  variant = "warning" 
}: SecurityBannerProps) {
  const variantStyles = {
    warning: "border-warning bg-warning/10",
    info: "border-info bg-info/10",
    error: "border-destructive bg-destructive/10"
  };

  const Icon = variant === "error" ? AlertTriangle : Shield;

  return (
    <Alert className={variantStyles[variant]}>
      <Icon className="h-4 w-4" />
      <AlertDescription className="text-sm">
        {message}
      </AlertDescription>
    </Alert>
  );
}
