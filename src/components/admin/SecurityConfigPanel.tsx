import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, CheckCircle, Settings, RefreshCw, Lock, Activity } from 'lucide-react';
import { securityValidator, SecurityValidationResult } from '@/lib/securityValidator';
import { securityHardening } from '@/lib/securityHardening';
import { SecurityAlert } from '@/components/security/SecurityAlert';
import { useToast } from '@/hooks/use-toast';

export function SecurityConfigPanel() {
  const [validationResult, setValidationResult] = useState<SecurityValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [securityScore, setSecurityScore] = useState<number>(0);
  const [hardeningResults, setHardeningResults] = useState<{
    score: number;
    issues: string[];
    recommendations: string[];
  } | null>(null);
  const { toast } = useToast();

  const runSecurityValidation = async () => {
    setIsValidating(true);
    try {
      const [result, scoreData, hardeningData] = await Promise.all([
        securityValidator.runFullSecurityValidation(),
        securityValidator.quickSecurityCheck(),
        securityHardening.runSecurityHealthCheck()
      ]);
      
      setValidationResult(result);
      setSecurityScore(scoreData.score);
      setHardeningResults(hardeningData);
      
      const overallScore = Math.round((scoreData.score + hardeningData.score) / 2);
      
      toast({
        title: "Validação de Segurança Concluída",
        description: `Score geral de segurança: ${overallScore}%`,
      });
    } catch (error) {
      toast({
        title: "Erro na Validação",
        description: "Falha ao executar validação de segurança",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    runSecurityValidation();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  if (!validationResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Painel de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando validação de segurança...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overallScore = hardeningResults ? 
    Math.round((securityScore + hardeningResults.score) / 2) : securityScore;

  return (
    <div className="space-y-6">
      {/* Security Alert - Customer Data Protection Status */}
      <SecurityAlert />

      {/* Enhanced Security Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              Config Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(securityScore)}`}>
              {securityScore}%
            </div>
            <p className="text-xs text-muted-foreground">Configuração</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4" />
              Hardening Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(hardeningResults?.score || 0)}`}>
              {hardeningResults?.score || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Proteção Avançada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4" />
              Score Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </div>
            <Badge variant={getScoreBadgeVariant(overallScore)} className="mt-1">
              {overallScore >= 90 ? 'Excelente' : overallScore >= 70 ? 'Bom' : 'Requer Atenção'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Critical Issues */}
      {validationResult.criticalIssues.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Problemas Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {validationResult.criticalIssues.map((issue, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{issue}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {validationResult.errors.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Erros de Configuração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {validationResult.errors.map((error, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {validationResult.warnings.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Settings className="h-5 w-5" />
              Avisos de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {validationResult.warnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Settings className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{warning}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {validationResult.isValid && validationResult.warnings.length === 0 && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Configuração de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700">
              ✅ Todas as validações de segurança passaram com sucesso!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Security Hardening Results */}
      {hardeningResults && hardeningResults.issues.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <Lock className="h-5 w-5" />
              Problemas de Proteção Avançada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {hardeningResults.issues.map((issue, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{issue}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Security Recommendations */}
      {hardeningResults && hardeningResults.recommendations.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Settings className="h-5 w-5" />
              Recomendações de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {hardeningResults.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Settings className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Manual Configuration Notice */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <Settings className="h-5 w-5" />
            Configuração Manual Necessária
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-blue-700">
            As seguintes configurações devem ser feitas manualmente no painel Supabase:
          </p>
          <ul className="space-y-2 text-sm">
            <li>• <strong>OTP Expiry:</strong> Email (1 hora), SMS/Phone (10 minutos)</li>
            <li>• <strong>Password Protection:</strong> Ativar proteção contra senhas vazadas</li>
            <li>• <strong>Rate Limiting:</strong> Revisar e ajustar limites conforme necessário</li>
          </ul>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('https://studio.dr-x.xtd.com.br/project/default/auth/providers', '_blank')}
          >
            Abrir Painel Supabase
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          onClick={runSecurityValidation} 
          disabled={isValidating}
          variant="outline"
        >
          {isValidating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Validando...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Revalidar Segurança
            </>
          )}
        </Button>
      </div>
    </div>
  );
}