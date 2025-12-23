-- Remover campo 'nome' da tabela contatos_v2 usando CASCADE
-- Este campo é LEGACY e foi substituído por nome_fantasia

ALTER TABLE public.contatos_v2 DROP COLUMN IF EXISTS nome CASCADE;

-- Recriar view vw_contatos_completo sem referência ao campo nome
CREATE VIEW public.vw_contatos_completo AS
SELECT 
  c.*,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM public.etiqueta_vinculos ev
      JOIN public.etiquetas e ON ev.etiqueta_id = e.id
      WHERE ev.referencia_id = c.id 
        AND ev.referencia_tipo = 'contato'
        AND LOWER(e.nome) = 'ativo'
    ) THEN true
    ELSE false
  END AS ativo
FROM public.contatos_v2 c;

-- Criar ou atualizar função para criar "Contato Padrão" para cada tenant
CREATE OR REPLACE FUNCTION public.get_or_create_contato_padrao(p_tenant_id uuid, p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contato_id uuid;
BEGIN
  -- Buscar contato padrão existente
  SELECT id INTO v_contato_id
  FROM public.contatos_v2
  WHERE tenant_id = p_tenant_id
    AND nome_fantasia = 'Contato Padrão'
  LIMIT 1;
  
  -- Se não existir, criar
  IF v_contato_id IS NULL THEN
    INSERT INTO public.contatos_v2 (
      tenant_id,
      user_id,
      nome_fantasia,
      tipo_pessoa,
      celular,
      observacao
    ) VALUES (
      p_tenant_id,
      p_user_id,
      'Contato Padrão',
      'lead',
      '00000000000',
      'Contato padrão criado automaticamente para importações sem fornecedor identificado'
    )
    RETURNING id INTO v_contato_id;
  END IF;
  
  RETURN v_contato_id;
END;
$$;