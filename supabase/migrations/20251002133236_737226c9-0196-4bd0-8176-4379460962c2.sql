-- Criar tabela funcionarios_ie
CREATE TABLE public.funcionarios_ie (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  telefone text,
  cargo text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.funcionarios_ie ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para permitir todas operações
CREATE POLICY "Todos podem visualizar funcionarios" 
ON public.funcionarios_ie 
FOR SELECT 
USING (true);

CREATE POLICY "Todos podem inserir funcionarios" 
ON public.funcionarios_ie 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Todos podem atualizar funcionarios" 
ON public.funcionarios_ie 
FOR UPDATE 
USING (true);

CREATE POLICY "Todos podem excluir funcionarios" 
ON public.funcionarios_ie 
FOR DELETE 
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_funcionarios_ie_updated_at
BEFORE UPDATE ON public.funcionarios_ie
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Importar dados da tabela coordenador
INSERT INTO public.funcionarios_ie (nome, telefone, cargo)
SELECT 
  nome,
  telefone::text,
  'coordenador' as cargo
FROM public.coordenador;