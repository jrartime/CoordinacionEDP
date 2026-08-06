-- ============================================================================
--  Fase 4 de facturacion: validaciones duras.
-- ----------------------------------------------------------------------------
--  1) Como mucho una tarifa ACTIVA por contrato+funcion: impide crear la
--     ambiguedad en el origen (Configuracion), en vez de solo avisar despues
--     al calcular. Las tarifas inactivas (historico de precios) no se tocan.
--  2) contratos_estado_facturas.es_pagada sustituye al id=5 hardcodeado que
--     usaba el panel de alertas para saber si un estado significa "pagada":
--     si se reordena o edita el catalogo, la alerta dejaba de funcionar sin
--     avisar. Ahora es un dato explicito, editable en Configuracion.
--  Requiere contratos_facturacion.sql.
-- ============================================================================

create unique index if not exists contratos_funciones_activa_unica
on public.contratos_funciones (contrato_id, funcion_id)
where activo;

comment on index public.contratos_funciones_activa_unica is
  'Como mucho una tarifa activa por contrato+funcion; evita la ambiguedad de precio al facturar. El historico de tarifas inactivas no esta limitado.';

alter table public.contratos_estado_facturas
  add column if not exists es_pagada boolean not null default false;

update public.contratos_estado_facturas set es_pagada = true where estado = 'Pagada' and not es_pagada;

comment on column public.contratos_estado_facturas.es_pagada is
  'Marca los estados que significan "factura pagada", para las alertas de Facturacion (antes dependian de un id=5 fijo).';
