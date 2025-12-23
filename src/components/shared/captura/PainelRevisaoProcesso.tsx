import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

interface PainelRevisaoProcessoProps {
  dadosIA: any;
  onSubmit: (dados: any) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const qualificacaoOptions = [
  { value: 'autor', label: 'Autor' },
  { value: 'reu', label: 'Réu' },
  { value: 'testemunha', label: 'Testemunha' },
  { value: 'terceiro_interessado', label: 'Terceiro Interessado' },
  { value: 'outros', label: 'Outros' },
];

export function PainelRevisaoProcesso({ dadosIA, onSubmit, onCancel, isSaving }: PainelRevisaoProcessoProps) {
  const dados = dadosIA.dados_extraidos || {};
  const partes = dados.partes || { autor: [], reu: [] };
  
  const [partesEditadas, setPartesEditadas] = useState<Array<{ nome: string; qualificacao: string }>>([
    ...partes.autor?.map((nome: string) => ({ nome, qualificacao: 'autor' })) || [],
    ...partes.reu?.map((nome: string) => ({ nome, qualificacao: 'reu' })) || [],
  ]);

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      numero_processo: dados.numero_processo || '',
      tribunal: dados.tribunal || '',
      comarca: dados.comarca || '',
      vara: dados.vara || '',
      valor_causa: dados.valor_causa || 0,
      tipo_acao: dados.tipo_acao || '',
      data_distribuicao: dados.data_distribuicao || '',
    }
  });

  const handlePartesChange = (index: number, field: 'nome' | 'qualificacao', value: string) => {
    const novasPartes = [...partesEditadas];
    novasPartes[index] = { ...novasPartes[index], [field]: value };
    setPartesEditadas(novasPartes);
  };

  const adicionarParte = () => {
    setPartesEditadas([...partesEditadas, { nome: '', qualificacao: 'autor' }]);
  };

  const removerParte = (index: number) => {
    setPartesEditadas(partesEditadas.filter((_, i) => i !== index));
  };

  const onFormSubmit = (formData: any) => {
    // Combinar dados do formulário com as partes editadas
    const dadosCompletos = {
      ...formData,
      partes: partesEditadas,
      resumo_ia: dadosIA.resumo,
      timeline_ia: dadosIA.timeline,
      pontos_atencao_ia: dadosIA.pontos_atencao,
      tipo_documento: dadosIA.tipo_documento,
    };
    
    onSubmit(dadosCompletos);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-primary mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-sm">Dados Extraídos pela IA</p>
          <p className="text-sm text-muted-foreground mt-1">
            Revise e edite as informações abaixo antes de salvar. Todos os campos podem ser modificados.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {dadosIA.tipo_documento}
        </Badge>
      </div>

      {/* Card de Dados do Processo */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Processo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_processo">Número do Processo</Label>
              <Input
                id="numero_processo"
                {...register('numero_processo')}
                placeholder="0000000-00.0000.0.00.0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tribunal">Tribunal</Label>
              <Input
                id="tribunal"
                {...register('tribunal')}
                placeholder="Ex: TJMG"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="comarca">Comarca</Label>
              <Input
                id="comarca"
                {...register('comarca')}
                placeholder="Ex: Belo Horizonte"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vara">Vara</Label>
              <Input
                id="vara"
                {...register('vara')}
                placeholder="Ex: 1ª Vara Cível"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_causa">Valor da Causa</Label>
              <Input
                id="valor_causa"
                type="number"
                step="0.01"
                {...register('valor_causa', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_distribuicao">Data de Distribuição</Label>
              <Input
                id="data_distribuicao"
                type="date"
                {...register('data_distribuicao')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo_acao">Tipo de Ação</Label>
            <Input
              id="tipo_acao"
              {...register('tipo_acao')}
              placeholder="Ex: Ação de Cobrança"
            />
          </div>
        </CardContent>
      </Card>

      {/* Card de Partes Envolvidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Partes Envolvidas
            <Button type="button" variant="outline" size="sm" onClick={adicionarParte}>
              Adicionar Parte
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {partesEditadas.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma parte identificada. Clique em "Adicionar Parte" para incluir manualmente.
            </p>
          )}
          
          {partesEditadas.map((parte, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`parte-nome-${index}`}>Nome</Label>
                <Input
                  id={`parte-nome-${index}`}
                  value={parte.nome}
                  onChange={(e) => handlePartesChange(index, 'nome', e.target.value)}
                  placeholder="Nome da parte"
                />
              </div>
              <div className="w-48 space-y-2">
                <Label htmlFor={`parte-qualificacao-${index}`}>Qualificação</Label>
                <Select
                  value={parte.qualificacao}
                  onValueChange={(value) => handlePartesChange(index, 'qualificacao', value)}
                >
                  <SelectTrigger id={`parte-qualificacao-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {qualificacaoOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removerParte(index)}
              >
                ×
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Resumo da IA (se disponível) */}
      {dadosIA.resumo && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo Gerado pela IA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{dadosIA.resumo}</p>
          </CardContent>
        </Card>
      )}

      {/* Botões de Ação */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar Dados e Vincular'}
        </Button>
      </div>
    </form>
  );
}
