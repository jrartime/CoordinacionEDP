create table if not exists public.tbl_contratos (
  id_contrato integer primary key,
  contrato text not null,
  descripcion text,
  presupuesto_anual numeric(14, 2),
  fecha_inicio date,
  fecha_fin date,
  expediente text,
  cpv text,
  importe text,
  cliente text,
  activo boolean not null default false,
  seleccionar boolean not null default false,
  desplazamiento boolean not null default false,
  agrupacion_nomina text,
  iva numeric(7, 4)
);
