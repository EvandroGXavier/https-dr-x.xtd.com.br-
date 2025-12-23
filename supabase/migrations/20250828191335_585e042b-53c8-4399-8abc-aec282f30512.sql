-- Trigger para updated_at em processo_honorarios
CREATE OR REPLACE FUNCTION update_processo_honorarios_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dropar trigger se existir e recriar
DROP TRIGGER IF EXISTS trigger_update_processo_honorarios_updated_at ON public.processo_honorarios;
CREATE TRIGGER trigger_update_processo_honorarios_updated_at
  BEFORE UPDATE ON public.processo_honorarios
  FOR EACH ROW
  EXECUTE FUNCTION update_processo_honorarios_updated_at();

-- Criar view para anexos consolidados
CREATE OR REPLACE VIEW public.vw_processo_anexos_consolidados AS
SELECT 
  pa.processo_id,
  pa.id as anexo_id,
  pa.titulo,
  pa.arquivo_url,
  pa.origem,
  pa.contato_id,
  c.nome as contato_nome,
  pa.created_at
FROM public.processo_anexos pa
LEFT JOIN public.contatos c ON pa.contato_id = c.id
WHERE pa.origem = 'processo'

UNION ALL

SELECT 
  pp.processo_id,
  ca.id as anexo_id,
  ca.arquivo_nome_original as titulo,
  ca.arquivo_caminho as arquivo_url,
  'contato'::origem_anexo as origem,
  ca.contato_id,
  c.nome as contato_nome,
  ca.created_at
FROM public.processo_partes pp
JOIN public.contato_anexo ca ON pp.contato_id = ca.contato_id
JOIN public.contatos c ON ca.contato_id = c.id
WHERE ca.deleted_at IS NULL;

-- Função para validar processo por etiqueta
CREATE OR REPLACE FUNCTION public.validate_processo_by_etiqueta(
  p_etiqueta etiqueta_processo,
  p_numero_processo text,
  p_cliente_principal_id uuid,
  p_titulo text
) RETURNS jsonb 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  errors text[] := '{}';
BEGIN
  -- Validações por etiqueta
  CASE p_etiqueta
    WHEN 'judicial' THEN
      IF p_numero_processo IS NULL OR p_numero_processo = '' THEN
        errors := array_append(errors, 'Número do processo é obrigatório para processos judiciais');
      END IF;
      IF p_cliente_principal_id IS NULL THEN
        errors := array_append(errors, 'Cliente principal é obrigatório para processos judiciais');
      END IF;
      IF p_titulo IS NULL OR p_titulo = '' THEN
        errors := array_append(errors, 'Título é obrigatório para processos judiciais');
      END IF;
    
    WHEN 'extrajudicial' THEN
      IF p_cliente_principal_id IS NULL THEN
        errors := array_append(errors, 'Cliente principal é obrigatório para processos extrajudiciais');
      END IF;
      IF p_titulo IS NULL OR p_titulo = '' THEN
        errors := array_append(errors, 'Título é obrigatório para processos extrajudiciais');
      END IF;
    
    WHEN 'administrativo', 'interno' THEN
      IF p_titulo IS NULL OR p_titulo = '' THEN
        errors := array_append(errors, 'Título é obrigatório');
      END IF;
  END CASE;
  
  RETURN jsonb_build_object(
    'valid', array_length(errors, 1) IS NULL,
    'errors', to_jsonb(errors)
  );
END;
$$ LANGUAGE plpgsql;