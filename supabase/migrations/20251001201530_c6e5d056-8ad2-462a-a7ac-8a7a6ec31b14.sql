-- Create contatos_terceirizacao table
CREATE TABLE public.contatos_terceirizacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contatos_terceirizacao ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations
CREATE POLICY "Permitir visualização de contatos"
  ON public.contatos_terceirizacao
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de contatos"
  ON public.contatos_terceirizacao
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de contatos"
  ON public.contatos_terceirizacao
  FOR UPDATE
  USING (true);

CREATE POLICY "Permitir exclusão de contatos"
  ON public.contatos_terceirizacao
  FOR DELETE
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_contatos_terceirizacao_updated_at
  BEFORE UPDATE ON public.contatos_terceirizacao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();