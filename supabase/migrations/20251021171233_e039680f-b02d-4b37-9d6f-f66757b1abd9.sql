-- Fix: Remover todas as versões das funções e recriar

-- Drop explícito com tipos completos
DROP FUNCTION IF EXISTS fn_atualizar_contato_completo(uuid, text, text, text, uuid, jsonb, jsonb, jsonb, jsonb) CASCADE;
DROP FUNCTION IF EXISTS fn_atualizar_contato_completo CASCADE;

-- Recriar com assinatura correta (p_observacao)
CREATE OR REPLACE FUNCTION fn_atualizar_contato_completo(
  p_contato_id uuid,
  p_nome text DEFAULT NULL,
  p_observacao text DEFAULT NULL,
  p_classificacao text DEFAULT NULL,
  p_responsavel_id uuid DEFAULT NULL,
  p_meios_contato jsonb DEFAULT NULL,
  p_enderecos jsonb DEFAULT NULL,
  p_dados_pf jsonb DEFAULT NULL,
  p_dados_pj jsonb DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_tenant_id uuid;
  v_user_id uuid;
  v_meio jsonb;
  v_endereco jsonb;
BEGIN
  v_tenant_id := current_setting('app.tenant_id', true)::uuid;
  v_user_id := auth.uid();
  
  UPDATE contatos_v2
  SET
    nome = COALESCE(p_nome, nome),
    observacao = COALESCE(p_observacao, observacao),
    classificacao = COALESCE(p_classificacao, classificacao),
    responsavel_id = COALESCE(p_responsavel_id, responsavel_id),
    updated_by = v_user_id,
    updated_at = now()
  WHERE id = p_contato_id 
    AND tenant_id = v_tenant_id
    AND deleted_at IS NULL;
  
  IF p_meios_contato IS NOT NULL THEN
    FOR v_meio IN SELECT * FROM jsonb_array_elements(p_meios_contato)
    LOOP
      INSERT INTO contato_meios_contato (
        contato_id, tipo, valor, principal, tenant_id
      ) VALUES (
        p_contato_id,
        (v_meio->>'tipo'),
        (v_meio->>'valor'),
        COALESCE((v_meio->>'principal')::boolean, false),
        v_tenant_id
      )
      ON CONFLICT (contato_id, tipo) 
      DO UPDATE SET
        valor = EXCLUDED.valor,
        principal = EXCLUDED.principal,
        updated_at = now();
    END LOOP;
  END IF;
  
  IF p_enderecos IS NOT NULL THEN
    FOR v_endereco IN SELECT * FROM jsonb_array_elements(p_enderecos)
    LOOP
      INSERT INTO contato_enderecos (
        contato_id, tipo, logradouro, numero, complemento, bairro, cidade, uf, cep, principal, tenant_id
      ) VALUES (
        p_contato_id,
        (v_endereco->>'tipo'),
        (v_endereco->>'logradouro'),
        (v_endereco->>'numero'),
        (v_endereco->>'complemento'),
        (v_endereco->>'bairro'),
        (v_endereco->>'cidade'),
        (v_endereco->>'uf'),
        (v_endereco->>'cep'),
        COALESCE((v_endereco->>'principal')::boolean, false),
        v_tenant_id
      )
      ON CONFLICT (contato_id, tipo)
      DO UPDATE SET
        logradouro = EXCLUDED.logradouro,
        numero = EXCLUDED.numero,
        complemento = EXCLUDED.complemento,
        bairro = EXCLUDED.bairro,
        cidade = EXCLUDED.cidade,
        uf = EXCLUDED.uf,
        cep = EXCLUDED.cep,
        principal = EXCLUDED.principal,
        updated_at = now();
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Contato atualizado com sucesso'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao atualizar contato: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION fn_atualizar_contato_completo TO authenticated;