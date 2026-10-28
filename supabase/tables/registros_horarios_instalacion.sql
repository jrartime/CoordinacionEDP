-- Control personal: unifica los nombres de centro con la tabla instalaciones.
-- Añade registros_horarios.instalacion_id (FK) y deja `centro` con el nombre
-- oficial de la instalación. Los nombres originales quedan en
-- registros_horarios_centro_backup para poder deshacerlo.
-- Esquema coordinacion (proyecto Portal Laboral). Aplicado el 28/10/2026.
--
-- Sin asignar (pendientes de respuesta): "C.F. “Matalablima”", "C.S CRISTO II",
-- "CP Roces Colloto", "Instalaciones Deportivas de La Florida", "Florida".

alter table coordinacion.registros_horarios
  add column if not exists instalacion_id integer
  references coordinacion.instalaciones(id);

create index if not exists registros_horarios_instalacion_id_idx
  on coordinacion.registros_horarios (instalacion_id);

create table if not exists coordinacion.registros_horarios_centro_backup (
  id bigint primary key,
  centro text
);

create temporary table _centro_map (centro text primary key, instalacion_id integer not null) on commit drop;
insert into _centro_map values
  ('Aula Infantil Otero', 203),
  ('C.F. F8 Carisa', 35),
  ('C.F. La Pixarra', 10),
  ('C.S Tudela Veguin', 18),
  ('Centro Social de Tudela Veguín', 18),
  ('C.Social Ería', 21),
  ('Campo de fútbol de la Monxina', 16),
  ('Campo de fútbol de la Pixarra', 10),
  ('Campo de Fútbol Manuel Díaz Vega', 14),
  ('Díaz Vega', 14),
  ('CEIP Baudilio Arce', 216),
  ('CEIP Buenavista II', 222),
  ('CP Buenavista II', 222),
  ('CEIP Carmen Ruiz Tilve', 201),
  ('CP Carmen Ruiz Tilve', 201),
  ('CEIP Fozaneldi', 209),
  ('CP Fozaneldi', 209),
  ('CEIP Germán Fernandez Ramos', 204),
  ('CP Germán Fernández Ramos', 204),
  ('CEIP José Luis Capitan Colloto', 242),
  ('CEIP Lorenzo Novo Mier', 211),
  ('CEIP Pablo Miaja', 213),
  ('CP Pablo Miaja', 213),
  ('CEIP Parque Infantil', 237),
  ('CP Parque Infantil', 237),
  ('CEIP Poeta Angel Gonzalez', 208),
  ('CEIP Veneranda Manzano', 220),
  ('CP Veneranda Manzano', 220),
  ('CEIP Ventanielles', 236),
  ('Centro Deportivo "Florida Arena"', 33),
  ('Centro Deportivo Florida Arena', 33),
  ('Florida Arena', 33),
  ('Centro Deportivo Corredoria Arena', 28),
  ('Corredoria Arena', 28),
  ('Instalaciones Deportivas de La Corredoria', 28),
  ('Centro Deportivo Pumarín-Teatinos  Jorge Egocheaga', 108),
  ('Piscina de Teatinos', 108),
  ('CP Dolores Medio', 245),
  ('CP El Villar - Trubia', 231),
  ('CP Villar Trubia', 231),
  ('CP Juan Rodríguez Muñiz - Las Campas', 243),
  ('CP La Ería', 235),
  ('CP Narciso Sánchez - Olloniego', 215),
  ('CP San Claudio', 240),
  ('CP San Pedro de los Arcos', 233),
  ('CP San Pedro de Los Arcos', 233),
  ('CP Villafría', 227),
  ('Escuela de Tenis y Pádel Escuela de Tenis y Pádel Parque del Oeste', 29),
  ('Escuela de Tenis y Pádel Parque del Oeste', 29),
  ('Pistas de tenis y pádel del Parque del Oeste', 29),
  ('H.F.E. Tensi 8', 12),
  ('HFE Tensi 8', 12),
  ('HFE Tensi 11', 11),
  ('Online', 30),
  ('Otras Instalaciones', 17),
  ('P. de Colloto', 6),
  ('Polideportivo de Colloto', 6),
  ('P. de Fozaneldi', 7),
  ('Polideportivo de Fozaneldi', 7),
  ('P. de la Carisa', 3),
  ('Polideportivo de la Carisa', 3),
  ('P. de Pumarín', 2),
  ('Polideportivo de Pumarín', 2),
  ('P. de San Claudio', 8),
  ('Polideportivo de San Claudio', 8),
  ('P. de Trubia', 13),
  ('Polideportivo de Trubia', 13),
  ('P. de Vallobín', 4),
  ('Polideportivo de Vallobín', 4),
  ('P. de Ventanielles', 5),
  ('Polideportivo de Ventanielles', 5),
  ('P. Tudela Agüeria', 34),
  ('Polideportivo Manuel Novo de Tudela Agüeria', 34),
  ('Palacio de Deportes', 1),
  ('Palacio de los Deportes', 1),
  ('Palacio de los niños', 38),
  ('Piscina Corredoria', 31),
  ('Piscina de la Corredoria', 31),
  ('Piscina de La Corredoria', 31),
  ('Piscina de Parque del Oeste', 23),
  ('Piscina Parque del Oeste', 23),
  ('Pista Polideportiva de La Florida', 9),
  ('Pista Polideportiva y de Padel de la Florida', 9);

insert into coordinacion.registros_horarios_centro_backup (id, centro)
select h.id, h.centro
from coordinacion.registros_horarios h
join _centro_map m on m.centro = h.centro
on conflict (id) do nothing;

update coordinacion.registros_horarios h
set instalacion_id = m.instalacion_id,
    centro = i.instalacion
from _centro_map m
join coordinacion.instalaciones i on i.id = m.instalacion_id
where h.centro = m.centro;
