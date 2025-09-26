-- Habilitar Row Level Security na tabela escala
ALTER TABLE public.escala ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para a tabela escala
-- Política para visualização - todos podem ver todas as escalas
CREATE POLICY "Todos podem visualizar escalas" 
ON public.escala 
FOR SELECT 
USING (true);

-- Política para inserção - todos podem inserir escalas
CREATE POLICY "Todos podem inserir escalas" 
ON public.escala 
FOR INSERT 
WITH CHECK (true);

-- Política para atualização - todos podem atualizar escalas
CREATE POLICY "Todos podem atualizar escalas" 
ON public.escala 
FOR UPDATE 
USING (true);

-- Política para exclusão - todos podem excluir escalas
CREATE POLICY "Todos podem excluir escalas" 
ON public.escala 
FOR DELETE 
USING (true);