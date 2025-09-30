-- Create RPC function to aggregate quadrant counts AND hours by entity and date
CREATE OR REPLACE FUNCTION public.get_quadrant_counts_with_hours(
  p_filter text,
  p_start date,
  p_end date
)
RETURNS TABLE(
  entity_id uuid,
  entity_name text,
  dt date,
  presenca int,
  atraso int,
  falta int,
  fj_at int,
  presenca_horas numeric,
  atraso_horas numeric,
  falta_horas numeric,
  fj_at_horas numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_filter = 'Coordenadores' THEN
    RETURN QUERY
    SELECT
      e.id_coordenador AS entity_id,
      COALESCE(c.nome, 'Sem Coordenador') AS entity_name,
      e.dataescala::date AS dt,
      SUM(CASE WHEN sp.status = 1 THEN 1 ELSE 0 END)::int AS presenca,
      SUM(CASE WHEN sp.status = 2 THEN 1 ELSE 0 END)::int AS atraso,
      SUM(CASE WHEN sp.status = 3 THEN 1 ELSE 0 END)::int AS falta,
      SUM(CASE WHEN sp.status IN (4, 5) THEN 1 ELSE 0 END)::int AS fj_at,
      SUM(CASE 
        WHEN sp.status = 1 THEN 
          EXTRACT(EPOCH FROM (COALESCE(e.finalescala, e.dataescala) - e.dataescala)) / 3600.0
        ELSE 0 
      END)::numeric AS presenca_horas,
      SUM(CASE 
        WHEN sp.status = 2 THEN 
          EXTRACT(EPOCH FROM (COALESCE(e.finalescala, e.dataescala) - e.dataescala)) / 3600.0
        ELSE 0 
      END)::numeric AS atraso_horas,
      SUM(CASE 
        WHEN sp.status = 3 THEN 
          EXTRACT(EPOCH FROM (COALESCE(e.finalescala, e.dataescala) - e.dataescala)) / 3600.0
        ELSE 0 
      END)::numeric AS falta_horas,
      SUM(CASE 
        WHEN sp.status IN (4, 5) THEN 
          EXTRACT(EPOCH FROM (COALESCE(e.finalescala, e.dataescala) - e.dataescala)) / 3600.0
        ELSE 0 
      END)::numeric AS fj_at_horas
    FROM escala e
    JOIN "StatusPresenca" sp ON sp.id_escala = e.idescala
    LEFT JOIN coordenador c ON c.id_coordenador = e.id_coordenador
    WHERE e.dataescala::date BETWEEN p_start AND p_end
      AND e.id_coordenador IS NOT NULL
    GROUP BY e.id_coordenador, c.nome, e.dataescala::date;
    
  ELSIF p_filter = 'Plantões' THEN
    RETURN QUERY
    SELECT
      e.id_plantao AS entity_id,
      COALESCE(p.nome, 'Sem Plantão') AS entity_name,
      e.dataescala::date AS dt,
      SUM(CASE WHEN sp.status = 1 THEN 1 ELSE 0 END)::int AS presenca,
      SUM(CASE WHEN sp.status = 2 THEN 1 ELSE 0 END)::int AS atraso,
      SUM(CASE WHEN sp.status = 3 THEN 1 ELSE 0 END)::int AS falta,
      SUM(CASE WHEN sp.status IN (4, 5) THEN 1 ELSE 0 END)::int AS fj_at,
      SUM(CASE 
        WHEN sp.status = 1 THEN 
          EXTRACT(EPOCH FROM (COALESCE(e.finalescala, e.dataescala) - e.dataescala)) / 3600.0
        ELSE 0 
      END)::numeric AS presenca_horas,
      SUM(CASE 
        WHEN sp.status = 2 THEN 
          EXTRACT(EPOCH FROM (COALESCE(e.finalescala, e.dataescala) - e.dataescala)) / 3600.0
        ELSE 0 
      END)::numeric AS atraso_horas,
      SUM(CASE 
        WHEN sp.status = 3 THEN 
          EXTRACT(EPOCH FROM (COALESCE(e.finalescala, e.dataescala) - e.dataescala)) / 3600.0
        ELSE 0 
      END)::numeric AS falta_horas,
      SUM(CASE 
        WHEN sp.status IN (4, 5) THEN 
          EXTRACT(EPOCH FROM (COALESCE(e.finalescala, e.dataescala) - e.dataescala)) / 3600.0
        ELSE 0 
      END)::numeric AS fj_at_horas
    FROM escala e
    JOIN "StatusPresenca" sp ON sp.id_escala = e.idescala
    LEFT JOIN plantao p ON p.id_plantao = e.id_plantao
    WHERE e.dataescala::date BETWEEN p_start AND p_end
      AND e.id_plantao IS NOT NULL
    GROUP BY e.id_plantao, p.nome, e.dataescala::date;
    
  ELSIF p_filter = 'Empresas' THEN
    RETURN QUERY
    SELECT
      pl.id_empresa AS entity_id,
      COALESCE(em.nome, 'Sem Empresa') AS entity_name,
      e.dataescala::date AS dt,
      SUM(CASE WHEN sp.status = 1 THEN 1 ELSE 0 END)::int AS presenca,
      SUM(CASE WHEN sp.status = 2 THEN 1 ELSE 0 END)::int AS atraso,
      SUM(CASE WHEN sp.status = 3 THEN 1 ELSE 0 END)::int AS falta,
      SUM(CASE WHEN sp.status IN (4, 5) THEN 1 ELSE 0 END)::int AS fj_at,
      SUM(CASE 
        WHEN sp.status = 1 THEN 
          EXTRACT(EPOCH FROM (COALESCE(e.finalescala, e.dataescala) - e.dataescala)) / 3600.0
        ELSE 0 
      END)::numeric AS presenca_horas,
      SUM(CASE 
        WHEN sp.status = 2 THEN 
          EXTRACT(EPOCH FROM (COALESCE(e.finalescala, e.dataescala) - e.dataescala)) / 3600.0
        ELSE 0 
      END)::numeric AS atraso_horas,
      SUM(CASE 
        WHEN sp.status = 3 THEN 
          EXTRACT(EPOCH FROM (COALESCE(e.finalescala, e.dataescala) - e.dataescala)) / 3600.0
        ELSE 0 
      END)::numeric AS falta_horas,
      SUM(CASE 
        WHEN sp.status IN (4, 5) THEN 
          EXTRACT(EPOCH FROM (COALESCE(e.finalescala, e.dataescala) - e.dataescala)) / 3600.0
        ELSE 0 
      END)::numeric AS fj_at_horas
    FROM escala e
    JOIN "StatusPresenca" sp ON sp.id_escala = e.idescala
    LEFT JOIN plantao pl ON pl.id_plantao = e.id_plantao
    LEFT JOIN empresa em ON em.id_empresa = pl.id_empresa
    WHERE e.dataescala::date BETWEEN p_start AND p_end
      AND pl.id_empresa IS NOT NULL
    GROUP BY pl.id_empresa, em.nome, e.dataescala::date;
    
  END IF;
END;
$$;