import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePreenchimentoIAStore } from '@/store/preenchimento-ia';
import { Sparkles, User, Building, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AcaoMagicaProps {
  tipoDocumento: string;
  dadosExtraidos: Record<string, any>;
}

export function AcaoMagica({ tipoDocumento, dadosExtraidos }: AcaoMagicaProps) {
  const navigate = useNavigate();
  const { setDados } = usePreenchimentoIAStore();

  const getAcaoInfo = () => {
    switch (tipoDocumento.toUpperCase()) {
      case 'CNH':
      case 'RG':
      case 'CPF':
        return {
          icon: User,
          title: 'Documento de Identificação Detectado',
          description: 'Identificamos dados de uma pessoa física neste documento.',
          buttonText: 'Criar Contato a partir do Documento',
          buttonColor: 'bg-blue-500 hover:bg-blue-600',
          action: () => {
            setDados('contato_pf', dadosExtraidos);
            navigate('/contatos/novo');
          }
        };
      
      case 'CONTRATO_SOCIAL':
      case 'CNPJ':
        return {
          icon: Building,
          title: 'Documento de Empresa Detectado',
          description: 'Identificamos dados de uma pessoa jurídica neste documento.',
          buttonText: 'Cadastrar Empresa a partir do Contrato',
          buttonColor: 'bg-green-500 hover:bg-green-600',
          action: () => {
            setDados('contato_pj', dadosExtraidos);
            navigate('/contatos/novo');
          }
        };
      
      case 'PETICAO_INICIAL':
      case 'PETICAO':
        return {
          icon: Scale,
          title: 'Petição Judicial Detectada',
          description: 'Identificamos uma petição inicial com dados processuais.',
          buttonText: 'Autuar Processo a partir da Petição',
          buttonColor: 'bg-purple-500 hover:bg-purple-600',
          action: () => {
            setDados('processo', dadosExtraidos);
            navigate('/processos/novo');
          }
        };
      
      default:
        return null;
    }
  };

  const acaoInfo = getAcaoInfo();
  
  if (!acaoInfo) return null;

  const IconComponent = acaoInfo.icon;

  return (
    <Card className="mt-6 border-dashed border-2 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
          <Sparkles className="h-5 w-5" />
          Ação Rápida Sugerida
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <IconComponent className="h-4 w-4" />
          {acaoInfo.title}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {acaoInfo.description}
        </p>
        <Button 
          onClick={acaoInfo.action} 
          className={`w-full ${acaoInfo.buttonColor}`}
          size="lg"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {acaoInfo.buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}
