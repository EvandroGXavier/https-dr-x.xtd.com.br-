import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, CheckCircle, Lock, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CompraItensEditor } from './CompraItensEditor';
import { CompraParcelasEditor } from './CompraParcelasEditor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CompraEditorProps {
  compra: any;
  onUpdate: () => void;
}

export function CompraEditor({ compra, onUpdate }: CompraEditorProps) {
  const [form, setForm] = useState({
    fornecedor_id: compra.fornecedor_id || '',
    tipo: compra.tipo || '',
    data_emissao: compra.data_emissao || '',
    valor_total: compra.valor_total || '',
    chave_nfe: compra.chave_nfe || '',
    numero_nfe: compra.numero_nfe || '',
    observacoes: compra.observacoes || '',
  });
  const [itens, setItens] = useState<any[]>([]);
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [openFornecedor, setOpenFornecedor] = useState(false);
  const { toast } = useToast();

  const isAprovada = compra.status === 'aprovada';
  const dataRegistro = compra.created_at 
    ? format(new Date(compra.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : '-';

  useEffect(() => {
    carregarDados();
  }, [compra.id]);

  async function carregarDados() {
    // Carregar itens
    const { data: itensData } = await supabase
      .from('compras_itens')
      .select('*')
      .eq('compra_id', compra.id);
    if (itensData) setItens(itensData);

    // Carregar parcelas
    const { data: parcelasData } = await supabase
      .from('compras_parcelas')
      .select('*')
      .eq('compra_id', compra.id)
      .order('numero_parcela');
    if (parcelasData) setParcelas(parcelasData);

    // Carregar fornecedores
    const { data: fornecedoresData } = await supabase
      .from('vw_contatos_compat')
      .select('id, nome, documento')
      .order('nome');
    if (fornecedoresData) setFornecedores(fornecedoresData);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function salvar() {
    if (isAprovada) {
      toast({
        title: 'Edição bloqueada',
        description: 'Esta compra já foi aprovada e não pode mais ser editada.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Atualizar compra
      const { error: compraError } = await supabase
        .from('compras')
        .update({
          fornecedor_id: form.fornecedor_id || null,
          tipo: form.tipo,
          data_emissao: form.data_emissao,
          valor_total: parseFloat(form.valor_total.toString()),
          chave_nfe: form.chave_nfe,
          numero_nfe: form.numero_nfe,
          observacoes: form.observacoes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', compra.id);

      if (compraError) throw compraError;

      // Deletar itens antigos e inserir novos
      await supabase.from('compras_itens').delete().eq('compra_id', compra.id);
      if (itens.length > 0) {
        const { error: itensError } = await supabase
          .from('compras_itens')
          .insert(itens.map(item => ({
            compra_id: compra.id,
            codigo_produto: item.codigo_produto,
            descricao: item.descricao,
            ncm: item.ncm,
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            valor_total: item.valor_total,
            cfop: item.cfop,
            unidade: item.unidade,
          })));
        if (itensError) throw itensError;
      }

      // Deletar parcelas antigas e inserir novas
      await supabase.from('compras_parcelas').delete().eq('compra_id', compra.id);
      if (parcelas.length > 0) {
        const { error: parcelasError } = await supabase
          .from('compras_parcelas')
          .insert(parcelas.map(parcela => ({
            compra_id: compra.id,
            numero_parcela: parcela.numero_parcela,
            data_vencimento: parcela.data_vencimento,
            valor: parcela.valor,
          })));
        if (parcelasError) throw parcelasError;
      }

      toast({
        title: 'Alterações salvas',
        description: 'As informações da compra foram atualizadas com sucesso.',
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function aprovarCompra() {
    try {
      const { error } = await supabase
        .from('compras')
        .update({ 
          status: 'aprovada',
          updated_at: new Date().toISOString(),
        })
        .eq('id', compra.id);

      if (error) throw error;

      toast({
        title: 'Compra aprovada',
        description: 'A compra foi aprovada e está bloqueada para edição.',
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Erro ao aprovar',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Informações da Compra</CardTitle>
            <CardDescription>
              Registrada em: {dataRegistro}
            </CardDescription>
          </div>
          <Badge variant={isAprovada ? 'default' : 'secondary'}>
            {isAprovada ? (
              <>
                <Lock className="h-3 w-3 mr-1" />
                Aprovada - Edição bloqueada
              </>
            ) : (
              '🕓 Pendente - Edição liberada'
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAprovada && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-4">
            <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
              ⚠️ Esta compra foi aprovada e está bloqueada para edição. 
              Aprovada em: {compra.updated_at ? format(new Date(compra.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fornecedor_id">Fornecedor *</Label>
            <Popover open={openFornecedor} onOpenChange={setOpenFornecedor}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openFornecedor}
                  className="w-full justify-between"
                  disabled={isAprovada}
                >
                  {form.fornecedor_id
                    ? fornecedores.find((f) => f.id === form.fornecedor_id)?.nome
                    : "Selecione o fornecedor..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar fornecedor..." />
                  <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    {fornecedores.map((fornecedor) => (
                      <CommandItem
                        key={fornecedor.id}
                        value={`${fornecedor.nome} ${fornecedor.documento || ''}`}
                        onSelect={() => {
                          setForm({ ...form, fornecedor_id: fornecedor.id });
                          setOpenFornecedor(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{fornecedor.nome}</span>
                          {fornecedor.documento && (
                            <span className="text-sm text-muted-foreground">
                              {fornecedor.documento}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Compra</Label>
            <Input
              id="tipo"
              name="tipo"
              value={form.tipo}
              disabled={isAprovada}
              onChange={handleChange}
              placeholder="Ex: revenda, consumo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_emissao">Data de Emissão</Label>
            <Input
              id="data_emissao"
              name="data_emissao"
              type="date"
              value={form.data_emissao}
              disabled={isAprovada}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_total">Valor Total (R$)</Label>
            <Input
              id="valor_total"
              name="valor_total"
              type="number"
              step="0.01"
              value={form.valor_total}
              disabled={isAprovada}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numero_nfe">Número NF-e</Label>
            <Input
              id="numero_nfe"
              name="numero_nfe"
              value={form.numero_nfe}
              disabled={isAprovada}
              onChange={handleChange}
              placeholder="Número da nota fiscal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chave_nfe">Chave NF-e</Label>
            <Input
              id="chave_nfe"
              name="chave_nfe"
              value={form.chave_nfe}
              disabled={isAprovada}
              onChange={handleChange}
              placeholder="Chave de acesso da NF-e"
              maxLength={44}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            name="observacoes"
            value={form.observacoes}
            disabled={isAprovada}
            onChange={handleChange}
            rows={3}
            placeholder="Adicione observações sobre esta compra..."
          />
        </div>

        <div className="pt-4 space-y-6 border-t">
          <CompraItensEditor
            itens={itens}
            onChange={setItens}
            disabled={isAprovada}
          />

          <CompraParcelasEditor
            parcelas={parcelas}
            onChange={setParcelas}
            disabled={isAprovada}
          />
        </div>

        <div className="flex gap-3 pt-4">
          {!isAprovada && (
            <>
              <Button onClick={salvar} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              <Button variant="default" onClick={aprovarCompra}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar Compra
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
