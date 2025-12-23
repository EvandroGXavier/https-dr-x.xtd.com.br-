-- Adiciona campos SIP ao profiles (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='profiles' AND column_name='sip_ramal'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN sip_ramal TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='profiles' AND column_name='sip_senha'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN sip_senha TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='profiles' AND column_name='sip_host'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN sip_host TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='profiles' AND column_name='sip_status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN sip_status TEXT DEFAULT 'offline';
  END IF;
END$$;

-- Cria tabela de chamadas
CREATE TABLE IF NOT EXISTS public.chamadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contato_id UUID REFERENCES public.contatos_v2(id) ON DELETE SET NULL,
  numero TEXT NOT NULL,
  direcao TEXT CHECK (direcao IN ('entrada','saida')) NOT NULL,
  status TEXT CHECK (status IN ('em_andamento','atendida','perdida','encerrada')) NOT NULL DEFAULT 'em_andamento',
  duracao INTEGER,
  iniciado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  encerrado_em TIMESTAMPTZ,
  tenant_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ativa RLS na tabela chamadas
ALTER TABLE public.chamadas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para chamadas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='chamadas' AND policyname='chamadas_owner_read'
  ) THEN
    CREATE POLICY chamadas_owner_read ON public.chamadas
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='chamadas' AND policyname='chamadas_owner_insert'
  ) THEN
    CREATE POLICY chamadas_owner_insert ON public.chamadas
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='chamadas' AND policyname='chamadas_owner_update'
  ) THEN
    CREATE POLICY chamadas_owner_update ON public.chamadas
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END$$;