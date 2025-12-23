# Análise de Segurança - Edge Functions do Módulo Processos

## Data: 2025-11-16

## Resumo Executivo

Este documento analisa as Edge Functions relacionadas ao módulo de Processos para identificar potenciais vazamentos de dados entre tenants e recomendar correções de segurança.

---

## 🔍 Edge Functions Analisadas

### 1. `supabase/functions/processo-ocr/index.ts`

**Propósito**: Processar OCR de documentos jurídicos para extrair informações como número do processo, partes, comarca, tribunal.

**Status Atual**: ⚠️ **SEM ISOLAMENTO MULTI-TENANT**

**Problemas Identificados**:
- ✅ A função não interage diretamente com o banco de dados
- ✅ Apenas processa o arquivo Base64 recebido e retorna dados extraídos
- ✅ Não há queries que possam vazar dados entre tenants
- ⚠️ **Não valida autenticação** - qualquer usuário pode chamar

**Risco**: **BAIXO** - Função apenas processa dados, não acessa banco

**Recomendações**:
```typescript
// OPCIONAL: Adicionar verificação de autenticação
serve(async (req) => {
  // Verificar JWT
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Não autorizado' }),
      { status: 401, headers: corsHeaders }
    );
  }

  // Resto do código...
});
```

**Prioridade**: Baixa (não acessa dados sensíveis)

---

### 2. `supabase/functions/anexo-processor/index.ts`

**Propósito**: Processar anexos de documentos (virus scan, OCR, extração de entidades).

**Status Atual**: ⚠️ **PARCIALMENTE VULNERÁVEL**

**Problemas Identificados**:

1. ❌ **Queries sem filtro de tenant_id**:
```typescript
// VULNERÁVEL (linha 30-37)
const { data: job, error: jobError } = await supabaseClient
  .from('anexo_jobs')
  .select(`
    *,
    anexos (*)
  `)
  .eq('id', jobId)
  .single();
```

2. ❌ **Updates sem considerar isolamento**:
```typescript
// VULNERÁVEL (linha 49-56, 84-92)
await supabaseClient
  .from('anexo_jobs')
  .update({ 
    status: 'running',
    updated_at: new Date().toISOString()
  })
  .eq('id', jobId);
```

**Risco**: **ALTO** - Um tenant pode processar anexos de outro tenant se souber o `jobId`

**Correções Necessárias**:

```typescript
// ✅ CORRETO: Verificar tenant antes de processar
serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extrair user do token JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Buscar tenant_id do usuário
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Token inválido');
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('empresa_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.empresa_id) {
      throw new Error('Usuário sem empresa configurada');
    }

    const { jobId } = await req.json();

    // ✅ Buscar job COM FILTRO de tenant_id
    const { data: job, error: jobError } = await supabaseClient
      .from('anexo_jobs')
      .select(`
        *,
        anexos!inner(*)
      `)
      .eq('id', jobId)
      .eq('tenant_id', profile.empresa_id)  // ← CRÍTICO
      .single();

    if (jobError || !job) {
      throw new Error('Job não encontrado ou acesso negado');
    }

    // Resto do processamento...
  } catch (error) {
    // ...
  }
});
```

**Prioridade**: **CRÍTICA** - Implementar imediatamente

---

### 3. `supabase/functions/aid-process/index.ts`

**Propósito**: Processar jobs de AID (AI Document Intelligence) para extração de texto e dados estruturados.

**Status Atual**: ⚠️ **PARCIALMENTE VULNERÁVEL**

**Problemas Identificados**:

1. ❌ **Queries sem filtro de tenant_id**:
```typescript
// VULNERÁVEL (linha 28-33)
const { data: job, error: jobError } = await supabase
  .from('aid_jobs')
  .select('*')
  .eq('id', jobId)
  .single();
```

2. ✅ RLS deve proteger, mas **melhor prática é validar explicitamente**

**Risco**: **MÉDIO** - Depende das políticas RLS da tabela `aid_jobs`

**Correções Necessárias**:

```typescript
// ✅ CORRETO: Adicionar verificação de tenant
serve(async (req) => {
  try {
    // Extrair user do token JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Token inválido');
    }

    // Buscar tenant_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('empresa_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.empresa_id) {
      throw new Error('Usuário sem empresa configurada');
    }

    const { jobId }: ProcessRequest = await req.json();

    // ✅ Buscar job COM FILTRO de tenant_id
    const { data: job, error: jobError } = await supabase
      .from('aid_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('empresa_id', profile.empresa_id)  // ← CRÍTICO
      .single();

    if (jobError || !job) {
      throw new Error('Job não encontrado ou acesso negado');
    }

    // Resto do processamento...
  } catch (error) {
    // ...
  }
});
```

**Prioridade**: **ALTA** - Implementar nas próximas iterações

---

## 📊 Resumo de Riscos

| Edge Function | Risco | Status | Prioridade |
|--------------|-------|--------|------------|
| `processo-ocr` | Baixo | Sem acesso ao BD | Baixa |
| `anexo-processor` | **ALTO** | Vulnerável | **CRÍTICA** |
| `aid-process` | Médio | Depende de RLS | Alta |

---

## ✅ Padrão Recomendado para Edge Functions

Todas as Edge Functions que acessam dados devem seguir este padrão:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. VALIDAR AUTENTICAÇÃO
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // 2. OBTER USUÁRIO E TENANT_ID
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Token inválido');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('empresa_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.empresa_id) {
      throw new Error('Usuário sem empresa configurada');
    }

    // 3. TODAS AS QUERIES DEVEM FILTRAR POR tenant_id
    const { data, error } = await supabase
      .from('minha_tabela')
      .select('*')
      .eq('tenant_id', profile.empresa_id)  // ← OBRIGATÓRIO
      .eq('id', recordId);

    if (error) throw error;

    // 4. VALIDAR QUE DADOS FORAM ENCONTRADOS
    if (!data) {
      throw new Error('Registro não encontrado ou acesso negado');
    }

    // Processar e retornar
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

---

## 📝 Checklist de Implementação

### Para `anexo-processor` (CRÍTICO):
- [ ] Adicionar extração de token JWT
- [ ] Buscar `tenant_id` do `profile`
- [ ] Filtrar query de `anexo_jobs` por `tenant_id`
- [ ] Validar que job pertence ao tenant antes de processar
- [ ] Testar isolamento entre tenants

### Para `aid-process` (ALTA):
- [ ] Adicionar extração de token JWT
- [ ] Buscar `tenant_id` do `profile`
- [ ] Filtrar query de `aid_jobs` por `empresa_id`
- [ ] Validar acesso antes de processar
- [ ] Testar isolamento entre tenants

### Para `processo-ocr` (BAIXA):
- [ ] Opcional: Adicionar validação de autenticação
- [ ] Não requer filtros de tenant (não acessa BD)

---

## 🚨 Impacto da Não Correção

**Cenário de Ataque**:
1. Tenant A cria um job de processamento (AID ou Anexo)
2. Tenant B descobre ou adivinha o `jobId` do Tenant A
3. Tenant B chama a Edge Function com o `jobId` do Tenant A
4. Edge Function processa o job sem validar o tenant
5. **Resultado**: Tenant B consegue processar dados do Tenant A

**Dados em Risco**:
- Anexos de processos
- Documentos extraídos via OCR
- Metadados de documentos
- Estruturas de dados de documentos jurídicos

---

## ✅ Próximos Passos

1. **Imediato** (Hoje):
   - Corrigir `anexo-processor` (CRÍTICO)
   
2. **Curto Prazo** (Esta Semana):
   - Corrigir `aid-process` (ALTA)
   - Criar testes automatizados de isolamento

3. **Médio Prazo** (Próximas Semanas):
   - Auditar todas as outras Edge Functions
   - Documentar padrão de segurança
   - Criar helper functions para validação de tenant

---

**Última Atualização**: 2025-11-16  
**Responsável**: Dr.X-EPR - Engenheiro de Software Sênior
