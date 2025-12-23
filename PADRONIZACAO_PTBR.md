# Padronização PT-BR - ERP Jurídico

Este documento descreve a implementação da padronização PT-BR para o sistema ERP Jurídico, mantendo total compatibilidade com o código existente.

## 📋 Objetivo

Criar uma camada de nomenclatura amigável em português brasileiro sobre a estrutura de dados existente, sem quebrar contratos ou perder dados.

## 🏗️ Arquitetura Implementada

### 1. Views PT-BR (Camada de Leitura)

Criadas views que expõem os dados com nomenclatura PT-BR:

- `vw_processos_pt` - Processos jurídicos
- `vw_processo_partes_pt` - Partes dos processos  
- `vw_contatos_pt` - Contatos/clientes
- `vw_agenda_pt` - Agenda/compromissos
- `vw_transacoes_financeiras_pt` - Transações financeiras
- `vw_etiquetas_pt` - Etiquetas/tags
- `vw_anexos_pt` - Anexos/documentos

### 2. Mapeamento de Campos

#### Campos Padrão
- `user_id` / `tenant_id` → `empresa_id`
- `created_at` → `criado_em`
- `updated_at` → `atualizado_em`

#### Campos Específicos
- `situacao` → `status`
- `observacao` → `observacoes`
- `record_type` → `tipo_registro`
- `storage_path` → `caminho_storage`

### 3. Tipos TypeScript PT-BR

#### Interfaces Principais

```typescript
// Processo
interface ProcessoPT {
  id: string;
  empresa_id: string;
  numero_processo?: string;
  tipo_processo: string;
  status: string;
  tribunal: string;
  // ... outros campos
  criado_em: string;
  atualizado_em: string;
}

// Contato
interface ContatoPT {
  id: string;
  empresa_id: string;
  nome?: string;
  nome_fantasia?: string;
  cpf_cnpj?: string;
  tipo_pessoa?: string;
  // ... outros campos
  criado_em: string;
  atualizado_em: string;
}
```

#### Enums PT-BR

```typescript
export const TipoProcessoEnum = {
  JUDICIAL: 'JUDICIAL',
  EXTRAJUDICIAL: 'EXTRAJUDICIAL',
  ADMINISTRATIVO: 'ADMINISTRATIVO',
  INTERNO: 'INTERNO'
} as const;

export const StatusProcessoEnum = {
  ATIVO: 'ativo',
  ARQUIVADO: 'arquivado',
  SUSPENSO: 'suspenso',
  ENCERRADO: 'encerrado'
} as const;
```

### 4. Adapters de Conversão

Funções para converter entre formatos:

```typescript
// DB → PT-BR
export function mapProcessoDbToPT(row: any): ProcessoPT {
  return {
    id: row.id,
    empresa_id: row.empresa_id ?? row.user_id ?? row.tenant_id,
    numero_processo: row.numero_processo ?? null,
    tipo_processo: row.tipo_processo ?? row.tipo ?? 'JUDICIAL',
    // ... mapeamento completo
    criado_em: row.criado_em ?? row.created_at,
    atualizado_em: row.atualizado_em ?? row.updated_at,
  };
}

// PT-BR → DB (para escrita)
export function mapProcessoPTToDb(data: Partial<ProcessoPT>): any {
  return {
    id: data.id,
    user_id: data.empresa_id,
    numero_processo: data.numero_processo,
    tipo: data.tipo_processo,
    // ... mapeamento reverso
  };
}
```

### 5. Hooks Customizados

#### Hook Principal - usePTBR

```typescript
// Leitura de processos
export function useProcessosPT() {
  const processos = useQuery({
    queryKey: ['processos-pt'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_processos_pt')
        .select('*')
        .order('atualizado_em', { ascending: false });
      
      if (error) throw error;
      return data?.map(mapProcessoDbToPT) || [];
    },
  });

  return {
    processos: processos.data || [],
    carregando: processos.isLoading,
    erro: processos.error,
    recarregar: processos.refetch,
  };
}
```

#### Hooks Utilitários

```typescript
export function useEmpresaContext() {
  return {
    obterEmpresaId: normalizeEmpresaId,
    formatarDataPTBR: (data: string) => 
      new Date(data).toLocaleDateString('pt-BR'),
    formatarMoedaPTBR: (valor: number) => 
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(valor),
  };
}
```

## 🚀 Como Usar

### 1. Leitura de Dados (Recomendado)

```typescript
import { useProcessosPT, useContatosPT } from '@/hooks/usePTBR';

function MeuComponente() {
  const { processos, carregando } = useProcessosPT();
  const { contatos } = useContatosPT();

  if (carregando) return <div>Carregando...</div>;

  return (
    <div>
      {processos.map(processo => (
        <div key={processo.id}>
          <h3>{processo.numero_processo}</h3>
          <p>Status: {processo.status}</p>
          <p>Criado em: {processo.criado_em}</p>
        </div>
      ))}
    </div>
  );
}
```

### 2. Escrita de Dados (Usar Tabelas Físicas)

```typescript
import { supabase } from '@/integrations/supabase/client';
import { mapProcessoPTToDb } from '@/adapters/ptbrAdapters';

async function criarProcesso(dadosPT: Partial<ProcessoPT>) {
  const dadosDb = mapProcessoPTToDb(dadosPT);
  
  const { data, error } = await supabase
    .from('processos') // tabela física
    .insert(dadosDb)
    .select()
    .single();

  if (error) throw error;
  return mapProcessoDbToPT(data);
}
```

## 🛡️ Segurança

### RLS (Row Level Security)

As views PT-BR herdam automaticamente as políticas RLS das tabelas base:

- ✅ Isolamento por tenant mantido
- ✅ Controle de acesso preservado  
- ✅ Auditoria funcional

### Validação

```typescript
import { validatePTBRData } from '@/adapters/ptbrAdapters';

const { valid, errors } = validatePTBRData(dados, ['titulo', 'empresa_id']);
if (!valid) {
  console.error('Erros de validação:', errors);
}
```

## 📊 Benefícios

### ✅ Mantém Compatibilidade
- Código existente continua funcionando
- Zero breaking changes
- Migração gradual possível

### ✅ Melhora Experiência
- Nomenclatura amigável para desenvolvedores
- IntelliSense melhorado
- Documentação mais clara

### ✅ Performance
- Views são otimizadas
- Queries diretas para leitura
- Sem overhead significativo

### ✅ Manutenibilidade
- Código mais legível
- Padrões consistentes
- Fácil evolução

## 🔧 Manutenção

### Adicionando Nova View

1. Criar a view no banco:
```sql
CREATE VIEW public.vw_nova_tabela_pt AS
SELECT
  t.id,
  t.user_id AS empresa_id,
  t.campo_original AS campo_amigavel,
  t.created_at AS criado_em,
  t.updated_at AS atualizado_em
FROM public.nova_tabela t;
```

2. Criar tipo TypeScript:
```typescript
interface NovaTabela PT {
  id: string;
  empresa_id: string;
  campo_amigavel: string;
  criado_em: string;
  atualizado_em: string;
}
```

3. Criar adapter:
```typescript
export function mapNovaTabela ToPT(row: any): NovaTabela PT {
  return {
    id: row.id,
    empresa_id: row.empresa_id ?? row.user_id,
    campo_amigavel: row.campo_amigavel ?? row.campo_original,
    criado_em: row.criado_em ?? row.created_at,
    atualizado_em: row.atualizado_em ?? row.updated_at,
  };
}
```

4. Adicionar hook:
```typescript
export function useNovaTabela PT() {
  return useQuery({
    queryKey: ['nova-tabela-pt'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_nova_tabela_pt')
        .select('*');
      
      if (error) throw error;
      return data?.map(mapNovaTabela ToPT) || [];
    },
  });
}
```

## 📝 Convenções

### Banco de Dados
- Views: `vw_*_pt`
- Colunas: `snake_case` sem acentos
- Datas: `*_em` (criado_em, atualizado_em)
- IDs: `*_id` (empresa_id, processo_id)

### TypeScript
- Interfaces: `*PT` (ProcessoPT, ContatoPT)
- Enums: `*Enum` (TipoProcessoEnum)
- Hooks: `use*PT` (useProcessosPT)
- Adapters: `map*ToPT` / `map*ToDb`

### Textos
- UI: Português brasileiro completo
- Código: Inglês ou PT-BR sem acentos
- Comentários: Português brasileiro

## 🎯 Próximos Passos

1. **Migração Gradual**: Converter componentes existentes para usar views PT-BR
2. **Documentação**: Expandir exemplos e guias de uso
3. **Testes**: Criar testes automatizados para adapters
4. **Métricas**: Monitorar performance das views
5. **Feedback**: Coletar feedback dos desenvolvedores