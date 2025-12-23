import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { EnhancedEditor } from '@/components/biblioteca/EnhancedEditor';
import { TagManagement } from '@/components/biblioteca/TagManagement';
import { useToast } from '@/hooks/use-toast';

export default function BibliotecaModeloForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isViewMode = searchParams.get('view') === 'true';
  const isEdit = !!id;
  
  const { grupos, createModelo, updateModelo, getModelo } = useBiblioteca();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    grupo_id: '',
    descricao: '',
    formato: 'html',
    conteudo: '',
    publicado: true,
    exige_contato: true,
    exige_processo: false,
    gatilho_financeiro: false,
    tags_etiquetas: [] as string[],
    financeiro_config: {
      tipo: 'CR',
      classe: 'Honorários',
      grupo: 'Contratos',
      subgrupo: 'CHA',
      vencimento_dias: 5,
      descricao_padrao: 'Honorários {{contato.nome}}'
    }
  });

  useEffect(() => {
    if (isEdit && id) {
      loadModelo();
    }
  }, [id, isEdit]);

  const loadModelo = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const modelo = await getModelo(id);
      if (modelo) {
        setFormData({
          titulo: modelo.titulo,
          grupo_id: modelo.grupo_id,
          descricao: modelo.descricao || '',
          formato: modelo.formato,
          conteudo: modelo.conteudo,
          publicado: modelo.publicado,
          exige_contato: modelo.exige_contato,
          exige_processo: modelo.exige_processo,
          gatilho_financeiro: modelo.gatilho_financeiro,
          tags_etiquetas: [],
          financeiro_config: modelo.financeiro_config || formData.financeiro_config
        });
      }
    } catch (error) {
      console.error('Erro ao carregar modelo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.grupo_id || !formData.conteudo) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isEdit && id) {
        await updateModelo(id, formData);
      } else {
        await createModelo(formData);
      }
      navigate('/biblioteca');
    } catch (error) {
      console.error('Erro ao salvar modelo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, conteudo: content }));
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateFinanceiroConfig = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      financeiro_config: {
        ...prev.financeiro_config,
        [field]: value
      }
    }));
  };

  if (loading && isEdit) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p>Carregando modelo...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/biblioteca')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isViewMode ? 'Visualizar Modelo' : isEdit ? 'Editar Modelo' : 'Novo Modelo'}
            </h1>
            <p className="text-muted-foreground">
              {isViewMode ? 'Visualização do modelo' : isEdit ? 'Edite as informações do modelo' : 'Crie um novo modelo de documento'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="detalhes" className="w-full">
            <TabsList>
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
              <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="titulo">Título *</Label>
                      <Input
                        id="titulo"
                        value={formData.titulo}
                        onChange={(e) => updateField('titulo', e.target.value)}
                        placeholder="Ex: CHA - Contrato de Honorários"
                        disabled={isViewMode}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="grupo">Categoria do Modelo *</Label>
                      <Select
                        value={formData.grupo_id}
                        onValueChange={(value) => updateField('grupo_id', value)}
                        disabled={isViewMode}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {grupos.map((grupo) => (
                            <SelectItem key={grupo.id} value={grupo.id}>
                              {grupo.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => updateField('descricao', e.target.value)}
                      placeholder="Descrição do modelo..."
                      disabled={isViewMode}
                    />
                  </div>

                  <div className="space-y-2">
                    <TagManagement
                      selectedTags={formData.tags_etiquetas}
                      onTagsChange={(tags) => updateField('tags_etiquetas', tags)}
                      disabled={isViewMode}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="formato">Formato</Label>
                    <Select
                      value={formData.formato}
                      onValueChange={(value) => updateField('formato', value)}
                      disabled={isViewMode}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="markdown">Markdown</SelectItem>
                        <SelectItem value="text">Texto Simples</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conteudo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Conteúdo do Modelo</CardTitle>
                </CardHeader>
                <CardContent>
                <EnhancedEditor
                  conteudo={formData.conteudo}
                  onContentChange={handleContentChange}
                  formato={formData.formato}
                  onSave={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="configuracoes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Modelo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Publicado</Label>
                      <p className="text-sm text-muted-foreground">
                        Modelo disponível para uso
                      </p>
                    </div>
                    <Switch
                      checked={formData.publicado}
                      onCheckedChange={(checked) => updateField('publicado', checked)}
                      disabled={isViewMode}
                    />
                  </div>

                  <Separator />

                  {/* Requirements */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Requisitos</h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Exige Contato</Label>
                        <p className="text-sm text-muted-foreground">
                          Modelo requer dados de contato
                        </p>
                      </div>
                      <Switch
                        checked={formData.exige_contato}
                        onCheckedChange={(checked) => updateField('exige_contato', checked)}
                        disabled={isViewMode}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Exige Processo</Label>
                        <p className="text-sm text-muted-foreground">
                          Modelo requer dados de processo
                        </p>
                      </div>
                      <Switch
                        checked={formData.exige_processo}
                        onCheckedChange={(checked) => updateField('exige_processo', checked)}
                        disabled={isViewMode}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Financial Trigger */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Gatilho Financeiro</Label>
                        <p className="text-sm text-muted-foreground">
                          Criar lançamento financeiro ao finalizar documento
                        </p>
                      </div>
                      <Switch
                        checked={formData.gatilho_financeiro}
                        onCheckedChange={(checked) => updateField('gatilho_financeiro', checked)}
                        disabled={isViewMode}
                      />
                    </div>

                    {formData.gatilho_financeiro && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Configuração Financeira</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Tipo</Label>
                              <Select
                                value={formData.financeiro_config.tipo}
                                onValueChange={(value) => updateFinanceiroConfig('tipo', value)}
                                disabled={isViewMode}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CR">A Receber</SelectItem>
                                  <SelectItem value="CP">A Pagar</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Classe</Label>
                              <Input
                                value={formData.financeiro_config.classe}
                                onChange={(e) => updateFinanceiroConfig('classe', e.target.value)}
                                disabled={isViewMode}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Grupo</Label>
                              <Input
                                value={formData.financeiro_config.grupo}
                                onChange={(e) => updateFinanceiroConfig('grupo', e.target.value)}
                                disabled={isViewMode}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Subgrupo</Label>
                              <Input
                                value={formData.financeiro_config.subgrupo}
                                onChange={(e) => updateFinanceiroConfig('subgrupo', e.target.value)}
                                disabled={isViewMode}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Dias para Vencimento</Label>
                              <Input
                                type="number"
                                value={formData.financeiro_config.vencimento_dias}
                                onChange={(e) => updateFinanceiroConfig('vencimento_dias', parseInt(e.target.value))}
                                disabled={isViewMode}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Descrição Padrão</Label>
                            <Input
                              value={formData.financeiro_config.descricao_padrao}
                              onChange={(e) => updateFinanceiroConfig('descricao_padrao', e.target.value)}
                              disabled={isViewMode}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          {!isViewMode && (
            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/biblioteca')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Modelo'}
              </Button>
            </div>
          )}
          
          {isViewMode && (
            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                onClick={() => navigate(`/biblioteca/modelos/${id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Editar Modelo
              </Button>
            </div>
          )}
        </form>
      </div>
    </AppLayout>
  );
}