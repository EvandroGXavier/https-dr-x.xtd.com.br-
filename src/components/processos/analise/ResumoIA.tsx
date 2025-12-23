import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

interface ResumoIAProps {
  resumo: string | null;
}

export function ResumoIA({ resumo }: ResumoIAProps) {
  if (!resumo) return null;

  return (
    <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-800 dark:text-blue-300">
          <Lightbulb className="mr-2 h-5 w-5" />
          Resumo Inteligente do Caso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground">{resumo}</p>
      </CardContent>
    </Card>
  );
}
