import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useProcessoTj } from "@/hooks/useProcessoTj";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  Gavel, Globe, Lock, RefreshCw, Server, 
  Scale, Shield, AlertTriangle, FileText,
  Baby, HeartPulse, AlertCircle, Repeat, User, Database
} from "lucide-react";
import type { ProcessoTj } from "@/types/processos";

interface ProcessoTjTabProps {
  processoId: string;
}

export function ProcessoTjTab({ processoId }: ProcessoTjTabProps) {
  const { processoTj, isLoading, save, isSaving } = useProcessoTj(processoId);
  const [isEditing, setIsEditing] = useState(false);
  
  const form = useForm<Partial<ProcessoTj>>({
    defaultValues: {
      sistema_judicial: 'pje',
      nivel_sigilo: 0,
      nivel_sigilo_desc: 'Sem Sigilo',
      justica_gratuita: 'nao',
      antecipacao_tutela: 'nao_requerida',
      processo_digitalizado: true,
    }
  });

  // Sincroniza dados quando carregados
  useEffect(() => {
    if (processoTj) {
      form.reset(processoTj);
      setIsEditing(false);
    }
  }, [processoTj, form]);

  const handleSave = async () => {
    const data = form.getValues();
    try {
      await save(data);
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const hasData = !!processoTj;

  // Badge de Situação
  const getSituacaoBadge = (situacao?: string) => {
    if (!situacao) return null;
    const lower = situacao.toLowerCase();
    if (lower.includes('arquivado')) return <Badge variant="secondary">{situacao}</Badge>;
    if (lower.includes('baixado')) return <Badge variant="outline">{situacao}</Badge>;
    if (lower.includes('movimento') || lower.includes('ativo')) return <Badge className="bg-green-600">{situacao}</Badge>;
    return <Badge variant="outline">{situacao}</Badge>;
  };

  // Badge de Sigilo
  const getSigiloBadge = (nivel?: number) => {
    if (!nivel || nivel === 0) return <Badge variant="outline"><Shield className="h-3 w-3 mr-1" />Público</Badge>;
    if (nivel === 1) return <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />Segredo de Justiça</Badge>;
    return <Badge variant="destructive"><Lock className="h-3 w-3 mr-1" />Ultra-Secreto</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header com Status de Sincronização */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Gavel className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Dados do Tribunal</h3>
                <p className="text-sm text-muted-foreground">
                  {processoTj?.data_ultima_verificacao 
                    ? `Última sincronização: ${new Date(processoTj.data_ultima_verificacao).toLocaleDateString('pt-BR')}`
                    : "Dados não sincronizados com o Tribunal"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {hasData && getSituacaoBadge(processoTj?.situacao)}
              {hasData && getSigiloBadge(processoTj?.nivel_sigilo)}
              <Button variant="outline" size="sm" disabled>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar (Em breve)
              </Button>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  {hasData ? "Editar" : "Adicionar Dados"}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { form.reset(processoTj || {}); setIsEditing(false); }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modo Visualização */}
      {!isEditing && hasData && (
        <>
          {/* Bloco 1: Dados Principais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Dados Principais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Número do Processo</span>
                  <p className="font-medium">{processoTj?.numero_oficial || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Número CNJ</span>
                  <p className="font-medium">{processoTj?.numero_cnj || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Chave do Processo</span>
                  <p className="font-medium font-mono text-xs">{processoTj?.chave_processo || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tribunal / UF</span>
                  <p className="font-medium">{processoTj?.tribunal || '-'} {processoTj?.uf ? `(${processoTj.uf})` : ''}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Comarca</span>
                  <p className="font-medium">{processoTj?.comarca || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vara / Turma</span>
                  <p className="font-medium">{processoTj?.vara || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Órgão Julgador</span>
                  <p className="font-medium">{processoTj?.orgao_julgador || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Juiz(a) Responsável</span>
                  <p className="font-medium">{processoTj?.juiz_responsavel || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Data de Autuação</span>
                  <p className="font-medium">
                    {processoTj?.data_autuacao 
                      ? new Date(processoTj.data_autuacao).toLocaleDateString('pt-BR')
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bloco 2: Classificação e Valores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Scale className="h-4 w-4" />
                Classificação e Valores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Classe</span>
                  <p className="font-medium">{processoTj?.classe || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Competência</span>
                  <p className="font-medium">{processoTj?.competencia || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Assunto Principal</span>
                  <p className="font-medium">{processoTj?.assunto || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Instância</span>
                  <p className="font-medium capitalize">{processoTj?.instancia || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo de Justiça</span>
                  <p className="font-medium capitalize">{processoTj?.tipo_justica || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor da Causa</span>
                  <p className="font-medium">
                    {processoTj?.valor_causa 
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(processoTj.valor_causa)
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bloco 3: Informações Adicionais (Flags EPROC) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4" />
                Informações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FlagDisplay 
                  icon={<Scale className="h-4 w-4" />}
                  label="Justiça Gratuita" 
                  value={processoTj?.justica_gratuita}
                  formatFn={(v) => v === 'deferida' ? 'Deferida' : v === 'requerida' ? 'Requerida' : v === 'indeferida' ? 'Indeferida' : 'Não'}
                  highlight={processoTj?.justica_gratuita === 'deferida'}
                />
                <FlagDisplay 
                  icon={<AlertCircle className="h-4 w-4" />}
                  label="Antecipação de Tutela" 
                  value={processoTj?.antecipacao_tutela}
                  formatFn={(v) => v === 'deferida' ? 'Deferida' : v === 'requerida' ? 'Requerida' : v === 'indeferida' ? 'Indeferida' : 'Não Requerida'}
                  highlight={processoTj?.antecipacao_tutela === 'deferida'}
                />
                <FlagDisplay 
                  icon={<Baby className="h-4 w-4" />}
                  label="Criança/Adolescente" 
                  value={processoTj?.crianca_adolescente}
                  highlight={processoTj?.crianca_adolescente}
                />
                <FlagDisplay 
                  icon={<HeartPulse className="h-4 w-4" />}
                  label="Doença Grave" 
                  value={processoTj?.doenca_grave}
                  highlight={processoTj?.doenca_grave}
                />
                <FlagDisplay 
                  icon={<AlertCircle className="h-4 w-4" />}
                  label="Petição Urgente" 
                  value={processoTj?.peticao_urgente}
                  highlight={processoTj?.peticao_urgente}
                />
                <FlagDisplay 
                  icon={<Repeat className="h-4 w-4" />}
                  label="Reconvenção" 
                  value={processoTj?.reconvencao}
                  highlight={processoTj?.reconvencao}
                />
                <FlagDisplay 
                  icon={<User className="h-4 w-4" />}
                  label="Réu Preso" 
                  value={processoTj?.reu_preso}
                  highlight={processoTj?.reu_preso}
                />
                <FlagDisplay 
                  icon={<Database className="h-4 w-4" />}
                  label="Processo Digitalizado" 
                  value={processoTj?.processo_digitalizado}
                  highlight={processoTj?.processo_digitalizado}
                />
              </div>
            </CardContent>
          </Card>

          {/* Bloco 4: Sistema e Acesso */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-4 w-4" />
                Sistema e Acesso
              </CardTitle>
              <CardDescription>Credenciais para automação futura (Crawler)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Sistema Eletrônico</span>
                  <p className="font-medium uppercase">{processoTj?.sistema_judicial || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Link de Acesso</span>
                  {processoTj?.link_consulta ? (
                    <a 
                      href={processoTj.link_consulta} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      Abrir no Tribunal
                    </a>
                  ) : (
                    <p className="font-medium">-</p>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Senha do Processo</span>
                  <p className="font-medium">{processoTj?.senha_acesso ? '••••••••' : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Modo Edição ou Sem Dados */}
      {(isEditing || !hasData) && isEditing && (
        <>
          {/* Form: Dados Principais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Dados Principais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_oficial">Número do Processo *</Label>
                  <Input id="numero_oficial" {...form.register("numero_oficial")} placeholder="0000000-00.0000.0.00.0000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero_cnj">Número CNJ</Label>
                  <Input id="numero_cnj" {...form.register("numero_cnj")} placeholder="0000000-00.0000.0.00.0000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chave_processo">Chave do Processo</Label>
                  <Input id="chave_processo" {...form.register("chave_processo")} placeholder="Chave única do tribunal" />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tribunal">Tribunal / Órgão</Label>
                  <Input id="tribunal" {...form.register("tribunal")} placeholder="Ex: TJMG" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf">UF</Label>
                  <Select value={form.watch("uf") || ""} onValueChange={(v) => form.setValue("uf", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comarca">Comarca / Foro</Label>
                  <Input id="comarca" {...form.register("comarca")} placeholder="Ex: Belo Horizonte" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vara">Vara / Turma</Label>
                  <Input id="vara" {...form.register("vara")} placeholder="Ex: 1ª Vara Cível" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgao_julgador">Órgão Julgador</Label>
                  <Input id="orgao_julgador" {...form.register("orgao_julgador")} placeholder="Ex: 1ª Câmara Cível" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="juiz_responsavel">Juiz(a) Responsável</Label>
                  <Input id="juiz_responsavel" {...form.register("juiz_responsavel")} placeholder="Nome do magistrado" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="situacao">Situação</Label>
                  <Input id="situacao" {...form.register("situacao")} placeholder="Ex: MOVIMENTO" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_autuacao">Data de Autuação</Label>
                  <Input id="data_autuacao" type="date" {...form.register("data_autuacao")} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form: Classificação e Valores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Scale className="h-4 w-4" />
                Classificação e Valores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="classe">Classe da Ação</Label>
                  <Input id="classe" {...form.register("classe")} placeholder="Ex: Procedimento Comum Cível" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="competencia">Competência</Label>
                  <Input id="competencia" {...form.register("competencia")} placeholder="Ex: Cível" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assunto">Assunto Principal</Label>
                  <Input id="assunto" {...form.register("assunto")} placeholder="Ex: Indenização por Dano Material" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instancia">Instância</Label>
                  <Select value={form.watch("instancia") || ""} onValueChange={(v) => form.setValue("instancia", v as ProcessoTj['instancia'])}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primeira">Primeira Instância</SelectItem>
                      <SelectItem value="segunda">Segunda Instância</SelectItem>
                      <SelectItem value="superior">Tribunais Superiores</SelectItem>
                      <SelectItem value="suprema">STF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_justica">Tipo de Justiça</Label>
                  <Select value={form.watch("tipo_justica") || ""} onValueChange={(v) => form.setValue("tipo_justica", v as ProcessoTj['tipo_justica'])}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estadual">Justiça Estadual</SelectItem>
                      <SelectItem value="federal">Justiça Federal</SelectItem>
                      <SelectItem value="trabalho">Justiça do Trabalho</SelectItem>
                      <SelectItem value="militar">Justiça Militar</SelectItem>
                      <SelectItem value="eleitoral">Justiça Eleitoral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_causa">Valor da Causa (R$)</Label>
                  <Input 
                    id="valor_causa" 
                    type="number" 
                    step="0.01"
                    {...form.register("valor_causa", { valueAsNumber: true })} 
                    placeholder="0,00" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nivel_sigilo">Nível de Sigilo</Label>
                  <Select 
                    value={String(form.watch("nivel_sigilo") || 0)} 
                    onValueChange={(v) => {
                      const nivel = parseInt(v);
                      form.setValue("nivel_sigilo", nivel);
                      form.setValue("nivel_sigilo_desc", nivel === 0 ? 'Sem Sigilo' : nivel === 1 ? 'Segredo de Justiça' : 'Ultra-Secreto');
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - Sem Sigilo (Público)</SelectItem>
                      <SelectItem value="1">1 - Segredo de Justiça</SelectItem>
                      <SelectItem value="2">2 - Ultra-Secreto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form: Informações Adicionais (Flags EPROC) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4" />
                Informações Adicionais (EPROC)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Justiça Gratuita</Label>
                  <Select value={form.watch("justica_gratuita") || "nao"} onValueChange={(v) => form.setValue("justica_gratuita", v as ProcessoTj['justica_gratuita'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="requerida">Requerida</SelectItem>
                      <SelectItem value="deferida">Deferida</SelectItem>
                      <SelectItem value="indeferida">Indeferida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Antecipação de Tutela</Label>
                  <Select value={form.watch("antecipacao_tutela") || "nao_requerida"} onValueChange={(v) => form.setValue("antecipacao_tutela", v as ProcessoTj['antecipacao_tutela'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao_requerida">Não Requerida</SelectItem>
                      <SelectItem value="requerida">Requerida</SelectItem>
                      <SelectItem value="deferida">Deferida</SelectItem>
                      <SelectItem value="indeferida">Indeferida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="crianca_adolescente" 
                    checked={form.watch("crianca_adolescente") || false}
                    onCheckedChange={(c) => form.setValue("crianca_adolescente", !!c)}
                  />
                  <Label htmlFor="crianca_adolescente" className="text-sm">Criança/Adolescente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="doenca_grave" 
                    checked={form.watch("doenca_grave") || false}
                    onCheckedChange={(c) => form.setValue("doenca_grave", !!c)}
                  />
                  <Label htmlFor="doenca_grave" className="text-sm">Doença Grave</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="peticao_urgente" 
                    checked={form.watch("peticao_urgente") || false}
                    onCheckedChange={(c) => form.setValue("peticao_urgente", !!c)}
                  />
                  <Label htmlFor="peticao_urgente" className="text-sm">Petição Urgente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="reconvencao" 
                    checked={form.watch("reconvencao") || false}
                    onCheckedChange={(c) => form.setValue("reconvencao", !!c)}
                  />
                  <Label htmlFor="reconvencao" className="text-sm">Reconvenção</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="reu_preso" 
                    checked={form.watch("reu_preso") || false}
                    onCheckedChange={(c) => form.setValue("reu_preso", !!c)}
                  />
                  <Label htmlFor="reu_preso" className="text-sm">Réu Preso</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="admitida_execucao" 
                    checked={form.watch("admitida_execucao") || false}
                    onCheckedChange={(c) => form.setValue("admitida_execucao", !!c)}
                  />
                  <Label htmlFor="admitida_execucao" className="text-sm">Admitida Execução</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="processo_digitalizado" 
                    checked={form.watch("processo_digitalizado") ?? true}
                    onCheckedChange={(c) => form.setValue("processo_digitalizado", !!c)}
                  />
                  <Label htmlFor="processo_digitalizado" className="text-sm">Processo Digitalizado</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form: Sistema e Acesso */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-4 w-4" />
                Sistema e Acesso
              </CardTitle>
              <CardDescription>Credenciais para automação futura (Crawler)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Sistema Eletrônico</Label>
                  <Select value={form.watch("sistema_judicial") || "pje"} onValueChange={(v) => form.setValue("sistema_judicial", v as ProcessoTj['sistema_judicial'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pje">PJe (Processo Judicial Eletrônico)</SelectItem>
                      <SelectItem value="eproc">Eproc</SelectItem>
                      <SelectItem value="esaj">e-SAJ</SelectItem>
                      <SelectItem value="projudi">Projudi</SelectItem>
                      <SelectItem value="sajadv">SAJ-ADV</SelectItem>
                      <SelectItem value="outros">Outros / Físico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link_consulta">Link de Acesso Direto</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                      <Globe className="h-4 w-4" />
                    </span>
                    <Input 
                      id="link_consulta" 
                      {...form.register("link_consulta")} 
                      placeholder="https://..."
                      className="rounded-l-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha_acesso">Senha do Processo</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </span>
                    <Input 
                      id="senha_acesso" 
                      type="password"
                      {...form.register("senha_acesso")} 
                      placeholder="Segredo de justiça"
                      className="rounded-l-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    * Esta senha é usada para processos em segredo de justiça
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão Salvar no final */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { form.reset(processoTj || {}); setIsEditing(false); }}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Dados Judiciais"}
            </Button>
          </div>
        </>
      )}

      {/* Estado Vazio (sem dados e não editando) */}
      {!hasData && !isEditing && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gavel className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado judicial cadastrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Adicione os dados do tribunal para este processo
            </p>
            <Button onClick={() => setIsEditing(true)}>
              Adicionar Dados do Tribunal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente auxiliar para exibir flags
function FlagDisplay({ 
  icon, 
  label, 
  value, 
  formatFn,
  highlight 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | boolean | undefined; 
  formatFn?: (v: string) => string;
  highlight?: boolean;
}) {
  const displayValue = typeof value === 'boolean' 
    ? (value ? 'Sim' : 'Não')
    : (formatFn && value ? formatFn(value) : (value || 'Não'));
  
  return (
    <div className={`p-3 rounded-lg border ${highlight ? 'bg-primary/10 border-primary/30' : 'bg-muted/50'}`}>
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`font-medium text-sm ${highlight ? 'text-primary' : ''}`}>{displayValue}</p>
    </div>
  );
}
