# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-01
Característica: Entregar un equipo reservado
  Como técnico de IT, quiero apuntar que entrego un equipo reservado a quien lo pidió, para que conste como prestado con la fecha de devolución acordada y cuente para los vencidos.

  @HU-PRE-01-1 @positivo
  Escenario: HU-PRE-01 criterio 1 (positivo)
    Dado un técnico de IT con sesión y el equipo «Portátil 07» reservado por «ana.perez@empresa.com» con devolución «2026-11-20»
    Cuando pide `POST /api/equipos/{id}/entrega` de «Portátil 07»
    Entonces recibe 200 con el equipo en `estado: "prestado"`, `persona` «ana.perez@empresa.com» y `devolucion` «2026-11-20»

  @HU-PRE-01-2 @negativo
  Escenario: HU-PRE-01 criterio 2 (negativo)
    Dado un técnico de IT con sesión y el equipo «Monitor 03» disponible
    Cuando pide la entrega de «Monitor 03»
    Entonces recibe 409 con `{"error": "El equipo no está reservado"}` y el equipo sigue `disponible`

  @HU-PRE-01-3 @negativo
  Escenario: HU-PRE-01 criterio 3 (negativo)
    Dado un técnico de IT con sesión
    Cuando pide la entrega de un id que no corresponde a ningún equipo
    Entonces recibe 404 con `{"error": "No existe el equipo"}`
