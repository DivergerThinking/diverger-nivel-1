# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SOL-02
Característica: Pedir un equipo libre
  Como empleado, quiero pedir un equipo disponible indicando la fecha en que lo devolveré, para tenerlo apartado a mi nombre hasta que IT me lo entregue, sin escribir correos.

  @HU-SOL-02-1 @positivo
  Escenario: HU-SOL-02 criterio 1 (positivo)
    Dado el día 2026-11-15 en Madrid, un empleado con sesión de «ana.perez@empresa.com» y el equipo «Portátil 07» disponible
    Cuando pide `POST /api/equipos/{id}/solicitud` de «Portátil 07» con `{"devolucion": "2026-11-20"}`
    Entonces recibe 201 con el equipo en `estado: "reservado"`, `persona` «ana.perez@empresa.com» y `devolucion` «2026-11-20»

  @HU-SOL-02-2 @negativo
  Escenario: HU-SOL-02 criterio 2 (negativo)
    Dado el día 2026-11-15 en Madrid, un empleado con sesión y el equipo «Portátil 07» disponible
    Cuando pide la solicitud de «Portátil 07» con `{"devolucion": "2026-11-14"}`
    Entonces recibe 400 con `{"error": "La fecha de devolución ya ha pasado"}` y el equipo sigue `disponible`

  @HU-SOL-02-3 @negativo
  Escenario: HU-SOL-02 criterio 3 (negativo)
    Dado un empleado con sesión y el equipo «Portátil 07» disponible
    Cuando pide la solicitud de «Portátil 07» con `{"devolucion": "2026-02-30"}`
    Entonces recibe 400 con `{"error": "La fecha de devolución no es válida"}` y el equipo sigue `disponible`

  @HU-SOL-02-4 @negativo
  Escenario: HU-SOL-02 criterio 4 (negativo)
    Dado un empleado con sesión y el equipo «Portátil 07» disponible
    Cuando pide la solicitud de «Portátil 07» con el cuerpo `{}`
    Entonces recibe 400 con `{"error": "Falta la fecha de devolución"}`

  @HU-SOL-02-5 @negativo
  Escenario: HU-SOL-02 criterio 5 (negativo)
    Dado un empleado con sesión y el equipo «Monitor 03» reservado por «luis.gomez@empresa.com»
    Cuando pide la solicitud de «Monitor 03» con `{"devolucion": "2026-11-20"}`
    Entonces recibe 409 con `{"error": "El equipo no está disponible"}` y «Monitor 03» sigue reservado por «luis.gomez@empresa.com»

  @HU-SOL-02-6 @negativo
  Escenario: HU-SOL-02 criterio 6 (negativo)
    Dado un empleado con sesión
    Cuando pide la solicitud de un id que no corresponde a ningún equipo con `{"devolucion": "2026-11-20"}`
    Entonces recibe 404 con `{"error": "No existe el equipo"}`
