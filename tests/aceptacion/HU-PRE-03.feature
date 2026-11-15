# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-03
Característica: Apuntar la devolución de un equipo
  Como técnico de IT, quiero apuntar que un equipo prestado se ha devuelto, para que vuelva a estar libre para el siguiente empleado y deje de contar como vencido.

  @HU-PRE-03-1 @positivo
  Escenario: HU-PRE-03 criterio 1 (positivo)
    Dado un técnico de IT con sesión y el equipo «Portátil 07» prestado a «ana.perez@empresa.com» con devolución «2026-11-20»
    Cuando pide `POST /api/equipos/{id}/devolucion` de «Portátil 07»
    Entonces recibe 200 con el equipo en `estado: "disponible"`, sin `persona` ni `devolucion`

  @HU-PRE-03-2 @negativo
  Escenario: HU-PRE-03 criterio 2 (negativo)
    Dado un técnico de IT con sesión y el equipo «Monitor 03» reservado por «luis.gomez@empresa.com», todavía sin entregar
    Cuando pide la devolución de «Monitor 03»
    Entonces recibe 409 con `{"error": "El equipo no está prestado"}` y «Monitor 03» sigue reservado

  @HU-PRE-03-3 @negativo
  Escenario: HU-PRE-03 criterio 3 (negativo)
    Dado un técnico de IT con sesión
    Cuando pide la devolución de un id que no corresponde a ningún equipo
    Entonces recibe 404 con `{"error": "No existe el equipo"}`
