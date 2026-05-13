-- =============================================
-- Migración: Agregar nivel de triage a referencias_especialidad
-- Basado en NOM-027-SSA3-2013 y Sistema Manchester adaptado
-- para referencias a especialistas
-- Fecha: 2026-03-12
-- =============================================

-- Agregar columna nivel_triage (1-5)
ALTER TABLE public.referencias_especialidad
    ADD COLUMN IF NOT EXISTS nivel_triage SMALLINT
        CHECK (nivel_triage BETWEEN 1 AND 5);

COMMENT ON COLUMN public.referencias_especialidad.nivel_triage IS
    '1=Emergencia (<24h) | 2=Urgente (24-72h) | 3=Semi-urgente (1-2 sem) | 4=Programable (2-4 sem) | 5=Electiva (1-3 meses)';
