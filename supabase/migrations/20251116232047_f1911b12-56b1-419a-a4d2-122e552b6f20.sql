-- =====================================================
-- MIGRAÇÃO DE DADOS: Corrigir tenant_id incorretos
-- =====================================================

-- Modificar função de auditoria CNPJ para permitir NULL em auth.uid() durante migrations
CREATE OR REPLACE FUNCTION public.audit_cnpj_consulta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só auditar se houver usuário autenticado (não durante migrations)
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.cnpj_consultas_audit (
      user_id,
      tenant_id,
      cnpj,
      acao,
      origem_dados
    ) VALUES (
      auth.uid(),
      NEW.tenant_id,
      NEW.cnpj,
      CASE WHEN TG_OP = 'INSERT' THEN 'consulta' ELSE 'atualizacao' END,
      NEW.origem_dados
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Agora executar as correções de dados

-- 1. Corrigir contatos_v2
UPDATE contatos_v2 c
SET 
  tenant_id = c.empresa_id,
  updated_at = NOW()
WHERE 
  c.tenant_id != c.empresa_id
  AND c.empresa_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = c.tenant_id 
    AND p.empresa_id = c.empresa_id
  );

-- 2. Corrigir contato_meios_contato
UPDATE contato_meios_contato cmc
SET 
  tenant_id = c.empresa_id,
  updated_at = NOW()
FROM contatos_v2 c
WHERE 
  cmc.contato_id = c.id
  AND cmc.tenant_id != c.empresa_id
  AND c.empresa_id IS NOT NULL;

-- 3. Corrigir contato_pf
UPDATE contato_pf cpf
SET 
  tenant_id = c.empresa_id,
  updated_at = NOW()
FROM contatos_v2 c
WHERE 
  cpf.contato_id = c.id
  AND cpf.tenant_id != c.empresa_id
  AND c.empresa_id IS NOT NULL;

-- 4. Corrigir contato_pj
UPDATE contato_pj cpj
SET 
  tenant_id = c.empresa_id,
  updated_at = NOW()
FROM contatos_v2 c
WHERE 
  cpj.contato_id = c.id
  AND cpj.tenant_id != c.empresa_id
  AND c.empresa_id IS NOT NULL;

-- 5. Corrigir contato_enderecos
UPDATE contato_enderecos ce
SET 
  tenant_id = c.empresa_id,
  updated_at = NOW()
FROM contatos_v2 c
WHERE 
  ce.contato_id = c.id
  AND ce.tenant_id != c.empresa_id
  AND c.empresa_id IS NOT NULL;

-- 6. Corrigir contato_etiquetas
UPDATE contato_etiquetas cet
SET 
  tenant_id = c.empresa_id
FROM contatos_v2 c
WHERE 
  cet.contato_id = c.id
  AND cet.tenant_id != c.empresa_id
  AND c.empresa_id IS NOT NULL;

-- 7. Corrigir contato_financeiro_config
UPDATE contato_financeiro_config cfc
SET 
  tenant_id = c.empresa_id,
  updated_at = NOW()
FROM contatos_v2 c
WHERE 
  cfc.contato_id = c.id
  AND cfc.tenant_id != c.empresa_id
  AND c.empresa_id IS NOT NULL;

-- 8. Corrigir contato_patrimonios
UPDATE contato_patrimonios cp
SET 
  tenant_id = c.empresa_id,
  updated_at = NOW()
FROM contatos_v2 c
WHERE 
  cp.contato_id = c.id
  AND cp.tenant_id != c.empresa_id
  AND c.empresa_id IS NOT NULL;

-- 9. Corrigir contato_vinculos
UPDATE contato_vinculos cv
SET 
  tenant_id = c.empresa_id,
  updated_at = NOW()
FROM contatos_v2 c
WHERE 
  cv.contato_id = c.id
  AND cv.tenant_id != c.empresa_id
  AND c.empresa_id IS NOT NULL;