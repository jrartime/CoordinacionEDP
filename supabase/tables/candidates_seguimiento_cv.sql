-- Seguimiento del CV en Candidaturas: cinco desplegables (valores definidos en
-- CANDIDATE_CV_TRACKING de coordinacion/app.js) y notas de seguimiento propias.
-- Sin check constraint a propósito: el catálogo vive en el frontend y puede crecer.
alter table public.candidates
  add column if not exists cv_entrada text,
  add column if not exists cv_valoracion text,
  add column if not exists cv_contacto text,
  add column if not exists cv_disponibilidad text,
  add column if not exists cv_estado_general text,
  add column if not exists cv_notas text not null default '';
