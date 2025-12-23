import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useGlobalF1 } from '@/hooks/useGlobalF1';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AjudaButtonProps {
  topic?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  className?: string;
}

export const AjudaButton = ({ 
  topic,
  variant = 'ghost',
  size = 'icon',
  showText = false,
  className
}: AjudaButtonProps) => {
  const { openHelp } = useGlobalF1();

  const handleClick = () => {
    openHelp(topic);
  };

  const buttonContent = (
    <>
      <HelpCircle className="h-4 w-4" />
      {showText && <span className="ml-2">Ajuda</span>}
    </>
  );

  if (!showText && size === 'icon') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            className={className}
            aria-label="Abrir ajuda (F1)"
          >
            {buttonContent}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Ajuda (F1)</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      {buttonContent}
    </Button>
  );
};