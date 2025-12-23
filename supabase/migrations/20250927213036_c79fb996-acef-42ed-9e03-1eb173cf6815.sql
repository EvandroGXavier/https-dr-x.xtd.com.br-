-- Adiciona a coluna para o escopo de visibilidade por módulo
ALTER TABLE public.etiquetas
ADD COLUMN escopo_modulos TEXT[] NULL;

-- Adiciona um índice GIN para otimizar consultas no array
CREATE INDEX idx_etiquetas_escopo_modulos ON public.etiquetas USING GIN (escopo_modulos);

-- Comentário para documentar a nova coluna
COMMENT ON COLUMN public.etiquetas.escopo_modulos IS 'Define em quais módulos a etiqueta é visível. Se NULO ou vazio, é global.';