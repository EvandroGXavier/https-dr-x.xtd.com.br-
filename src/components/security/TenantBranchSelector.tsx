import { useState, useEffect } from 'react';
import { Building, Building2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTenantContext } from '@/hooks/useTenantContext';
import { supabase } from '@/integrations/supabase/client';

interface Empresa {
  id: string; // UUID
  nome: string;
  cnpj?: string;
}

interface Filial {
  id: string; // UUID
  empresa_id: string; // UUID
  nome: string;
}

export function TenantBranchSelector() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [selectedFilial, setSelectedFilial] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  const { empresaId, filialId, selectContext } = useTenantContext();
  const { toast } = useToast();

  // Carregar empresas disponíveis
  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('saas_empresas')
        .select('empresa_id, nome, cnpj')
        .eq('ativa', true)
        .order('nome');

      if (error) throw error;
      // Map empresa_id to id for component compatibility
      const empresasData = (data || []).map(e => ({ id: e.empresa_id, nome: e.nome, cnpj: e.cnpj }));
      setEmpresas(empresasData);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar empresas disponíveis",
        variant: "destructive",
      });
    }
  };

  // Carregar filiais da empresa selecionada
  const fetchFiliais = async (empresaId: string) => {
    try {
      const { data, error } = await supabase
        .from('saas_filiais')
        .select('filial_id, empresa_id, nome')
        .eq('empresa_id', empresaId)
        .eq('ativa', true)
        .order('nome');

      if (error) throw error;
      // Map filial_id to id for component compatibility
      const filiaisData = (data || []).map(f => ({ id: f.filial_id, empresa_id: f.empresa_id, nome: f.nome }));
      setFiliais(filiaisData);
    } catch (error) {
      console.error('Erro ao carregar filiais:', error);
      setFiliais([]);
    }
  };

  useEffect(() => {
    fetchEmpresas().finally(() => setLoading(false));
  }, []);

  // Sincronizar estado local com contexto
  useEffect(() => {
    if (empresaId) {
      setSelectedEmpresa(empresaId); // Já é string
      fetchFiliais(empresaId);
    }
    if (filialId) {
      setSelectedFilial(filialId); // Já é string
    }
  }, [empresaId, filialId]);

  const handleEmpresaChange = async (value: string) => {
    setSelectedEmpresa(value);
    setSelectedFilial(''); // Reset filial selection
    
    if (value) {
      await fetchFiliais(value);
      // Auto-select context with just empresa
      await selectContext(value);
    }
  };

  const handleFilialChange = async (value: string) => {
    setSelectedFilial(value);
    
    if (selectedEmpresa && value) {
      await selectContext(selectedEmpresa, value);
    }
  };

  const getCurrentEmpresaName = () => {
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa?.nome || 'Nenhuma selecionada';
  };

  const getCurrentFilialName = () => {
    const filial = filiais.find(f => f.id === filialId);
    return filial?.nome || 'Matriz';
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Contexto</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building className="h-5 w-5" />
          <span>Contexto de Trabalho</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status atual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Empresa:</span>
            <Badge variant={empresaId ? "default" : "secondary"}>
              {getCurrentEmpresaName()}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Filial:</span>
            <Badge variant={filialId ? "default" : "outline"}>
              {getCurrentFilialName()}
            </Badge>
          </div>
        </div>

        {/* Seletor de empresa */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecionar Empresa</label>
          <Select value={selectedEmpresa} onValueChange={handleEmpresaChange}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha uma empresa" />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((empresa) => (
                <SelectItem key={empresa.id} value={empresa.id}>
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>{empresa.nome}</span>
                    {empresa.cnpj && (
                      <span className="text-xs text-muted-foreground">
                        ({empresa.cnpj})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seletor de filial (apenas se empresa selecionada e há filiais) */}
        {selectedEmpresa && filiais.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecionar Filial (Opcional)</label>
            <Select value={selectedFilial} onValueChange={handleFilialChange}>
              <SelectTrigger>
                <SelectValue placeholder="Matriz (todas as filiais)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>Matriz (todas as filiais)</span>
                  </div>
                </SelectItem>
                {filiais.map((filial) => (
                  <SelectItem key={filial.id} value={filial.id}>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4" />
                      <span>{filial.nome}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {empresas.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Nenhuma empresa disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}