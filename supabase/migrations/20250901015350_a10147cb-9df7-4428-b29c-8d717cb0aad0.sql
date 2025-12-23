-- Add missing foreign key constraints for processo_partes
ALTER TABLE public.processo_partes 
ADD CONSTRAINT fk_processo_partes_processo 
FOREIGN KEY (processo_id) REFERENCES public.processos(id) ON DELETE CASCADE;

ALTER TABLE public.processo_partes 
ADD CONSTRAINT fk_processo_partes_contato 
FOREIGN KEY (contato_id) REFERENCES public.contatos(id) ON DELETE CASCADE;