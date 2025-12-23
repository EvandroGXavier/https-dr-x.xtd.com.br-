# Padrão de Uso do tenant_id no Sistema

## 📋 Sumário Executivo

Este documento define o **padrão fundamental** para o uso do `tenant_id` em todo o sistema XavierAdv ERP. O objetivo é garantir **isolamento de dados multi-tenant seguro e consistente**.

---

## 🎯 Regra Fundamental

### ⚠️ CRÍTICO: tenant_id SEMPRE deve ser empresa_id

```
tenant_id = empresa_id  ✅ CORRETO
tenant_id = user_id     ❌ ERRADO
```

### Princípios Base

1. **`tenant_id`**: Identificador da **empresa** (organização) - usado para **isolamento de dados RLS**
2. **`user_id`**: Identificador do **usuário** - mantido separadamente para **auditoria**
3. **`empresa_id`**: Referência explícita à empresa proprietária dos dados
4. **`filial_id`**: Referência opcional à filial (subdivisão da empresa)

---

## 🔐 Por Que Isso É Importante?

### Problemas Causados pelo Uso Incorreto

Usar `user_id` como `tenant_id` causa:

- ❌ **Violações de RLS**: Políticas que verificam `tenant_id` falham
- ❌ **Vazamento de dados**: Usuários conseguem ver dados de outras empresas
- ❌ **Falhas intermitentes**: Operações de CREATE/UPDATE falham aleatoriamente
- ❌ **Inconsistência de dados**: Alguns registros com `tenant_id` incorreto

### Benefícios do Padrão Correto

✅ **Isolamento garantido**: Cada empresa vê apenas seus dados  
✅ **RLS funcionando**: Políticas de segurança operam corretamente  
✅ **Auditoria precisa**: `user_id` rastreia quem fez a ação  
✅ **Multi-filial**: Suporte para empresas com múltiplas filiais

---

## 🛠️ Implementação

### 1. Em Funções RPC (PostgreSQL)

#### ✅ Padrão Correto

```sql
CREATE OR REPLACE FUNCTION public.criar_entidade(
  p_nome TEXT,
  p_empresa_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_empresa_id UUID;
  v_filial_id UUID;
  v_tenant_id UUID;
BEGIN
  -- 1. Obter user_id autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- 2. Buscar empresa_id do perfil do usuário
  SELECT empresa_id, filial_id 
  INTO v_empresa_id, v_filial_id 
  FROM profiles 
  WHERE user_id = v_user_id;
  
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Usuário sem empresa configurada';
  END IF;
  
  -- 3. CRÍTICO: tenant_id = empresa_id
  v_tenant_id := v_empresa_id;
  
  -- 4. Inserir dados usando tenant_id correto
  INSERT INTO tabela (
    nome,
    tenant_id,      -- ← empresa_id
    user_id,        -- ← para auditoria
    empresa_id,     -- ← referência explícita
    filial_id       -- ← opcional
  ) VALUES (
    p_nome,
    v_tenant_id,    -- ✅ empresa_id
    v_user_id,      -- ✅ user_id para auditoria
    COALESCE(p_empresa_id, v_empresa_id),
    v_filial_id
  );
  
  RETURN jsonb_build_object('success', true);
END;
$$;
```

#### ❌ Padrão Incorreto (NÃO USAR)

```sql
-- ❌ ERRADO: Usar user_id como tenant_id
v_tenant_id := v_user_id;  -- NÃO FAÇA ISSO!

INSERT INTO tabela (tenant_id, user_id)
VALUES (v_user_id, v_user_id);  -- ❌ ERRADO!
```

---

### 2. No Frontend (TypeScript/React)

#### ✅ Padrão Correto

```typescript
import { useAuth } from '@/hooks/useAuth';

function MeuComponente() {
  const { profile } = useAuth();
  
  const salvarDados = async (data: any) => {
    const payload = {
      ...data,
      // CORRETO: usar empresa_id do profile
      tenant_id: profile?.empresa_id,
      empresa_id: profile?.empresa_id,
      filial_id: profile?.filial_id,
    };
    
    await supabase.from('tabela').insert(payload);
  };
}
```

#### ❌ Padrão Incorreto (NÃO USAR)

```typescript
// ❌ ERRADO: Usar user_id como tenant_id
const { user } = useAuth();

const payload = {
  ...data,
  tenant_id: user?.id,  // ❌ NUNCA FAÇA ISSO!
};
```

#### Hook Utilitário Recomendado

```typescript
// src/hooks/useTenantId.ts
import { useAuth } from '@/hooks/useAuth';

export function useTenantId() {
  const { profile } = useAuth();
  
  return {
    tenantId: profile?.empresa_id,
    empresaId: profile?.empresa_id,
    filialId: profile?.filial_id,
  };
}

// Uso:
const { tenantId, empresaId, filialId } = useTenantId();
```

---

### 3. Políticas RLS (Row Level Security)

#### ✅ Padrão Correto

```sql
-- Política para SELECT (leitura)
CREATE POLICY "select_by_tenant" ON tabela
FOR SELECT
USING (
  tenant_id IN (
    SELECT empresa_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- Política para INSERT (criação)
CREATE POLICY "insert_by_tenant" ON tabela
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT empresa_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- Política para UPDATE (atualização)
CREATE POLICY "update_by_tenant" ON tabela
FOR UPDATE
USING (
  tenant_id IN (
    SELECT empresa_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);
```

#### ⚠️ Alternativa com Função Helper

```sql
-- Criar função helper para evitar repetição
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id 
  FROM profiles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Usar nas políticas
CREATE POLICY "select_by_tenant" ON tabela
FOR SELECT
USING (tenant_id = get_user_tenant_id());
```

---

## 📊 Estrutura de Dados Recomendada

### Tabela Base (Template)

```sql
CREATE TABLE nome_tabela (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Campos de multi-tenancy
  tenant_id UUID NOT NULL,      -- ← empresa_id para RLS
  user_id UUID NOT NULL,         -- ← usuário que criou (auditoria)
  empresa_id UUID,               -- ← referência explícita
  filial_id UUID,                -- ← opcional
  
  -- Campos de negócio
  nome TEXT NOT NULL,
  descricao TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices recomendados
CREATE INDEX idx_tabela_tenant ON nome_tabela(tenant_id);
CREATE INDEX idx_tabela_empresa ON nome_tabela(empresa_id);
CREATE INDEX idx_tabela_user ON nome_tabela(user_id);

-- RLS obrigatório
ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;
```

---

## 🔍 Validação e Testes

### Script SQL para Detectar Inconsistências

```sql
-- Verificar registros com tenant_id = user_id (INCORRETO)
SELECT 
  'contatos_v2' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN tenant_id != empresa_id THEN 1 END) as incorretos,
  ROUND(
    COUNT(CASE WHEN tenant_id != empresa_id THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as percentual_incorreto
FROM contatos_v2
WHERE empresa_id IS NOT NULL

UNION ALL

SELECT 
  'contato_meios_contato',
  COUNT(*),
  COUNT(CASE WHEN cmc.tenant_id != c.empresa_id THEN 1 END),
  ROUND(
    COUNT(CASE WHEN cmc.tenant_id != c.empresa_id THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100,
    2
  )
FROM contato_meios_contato cmc
JOIN contatos_v2 c ON c.id = cmc.contato_id
WHERE c.empresa_id IS NOT NULL;
```

### Testes Recomendados

1. **Teste de Criação**:
   - Criar novo registro
   - Verificar que `tenant_id = empresa_id`
   - Verificar que `user_id` é o usuário autenticado

2. **Teste de Isolamento**:
   - Usuário da Empresa A tenta acessar dados da Empresa B
   - Deve retornar vazio ou erro 403

3. **Teste de Atualização**:
   - Atualizar registro existente
   - Verificar que `tenant_id` não mudou
   - Verificar que `updated_at` foi atualizado

---

## 🚨 Troubleshooting

### Problema: "Erro ao salvar dados" ou "RLS violation"

**Causa**: `tenant_id` está incorreto ou não corresponde ao `empresa_id` do usuário.

**Solução**:
1. Verificar que `profile?.empresa_id` está definido
2. Confirmar que `tenant_id = empresa_id` no payload
3. Verificar políticas RLS da tabela

### Problema: "Dados não aparecem após criação"

**Causa**: `tenant_id` foi definido com valor diferente do `empresa_id` do usuário.

**Solução**:
1. Executar query de validação (ver seção acima)
2. Corrigir registros inconsistentes:
   ```sql
   UPDATE tabela 
   SET tenant_id = empresa_id 
   WHERE tenant_id != empresa_id;
   ```

---

## 📚 Referências

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-tenancy with RLS](https://supabase.com/docs/guides/database/postgres/row-level-security#multi-tenancy)
- `Docs/CONTATOS_V2_DIAGNOSTICO.md` - Diagnóstico completo do módulo Contatos

---

## ✅ Checklist de Implementação

Ao criar/modificar qualquer funcionalidade:

- [ ] Função RPC usa `v_empresa_id` como `tenant_id`
- [ ] Frontend usa `profile?.empresa_id` como `tenant_id`
- [ ] RLS policies verificam `tenant_id` corretamente
- [ ] Testes de isolamento passam
- [ ] Auditoria registra `user_id` separadamente
- [ ] Documentação atualizada

---

**Última Atualização**: 2025-11-16  
**Responsável**: Sistema XavierAdv ERP
