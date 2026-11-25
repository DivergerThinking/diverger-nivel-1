# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-EQU-02
Característica: Ver los equipos y su estado
  Como empleado, quiero ver los equipos con su estado, para saber qué está libre sin escribir a IT.

  @HU-EQU-02-1 @positivo
  Escenario: HU-EQU-02 criterio 1 (positivo)
    Dado el «Portátil 07» disponible y el «Proyector 02» prestado a luis.gomez@empresa.com hasta el 2026-12-10
    Cuando un empleado abre la lista de equipos
    Entonces ve «Portátil 07» como disponible y «Proyector 02» como prestado a luis.gomez@empresa.com con devolución el 2026-12-10

  @HU-EQU-02-2 @positivo
  Escenario: HU-EQU-02 criterio 2 (positivo)
    Dado el «Monitor 03» reservado a ana.perez@empresa.com con devolución el 2026-12-04
    Cuando un empleado abre la lista de equipos
    Entonces ve el «Monitor 03» como reservado a ana.perez@empresa.com con devolución el 2026-12-04

  @HU-EQU-02-3 @negativo
  Escenario: HU-EQU-02 criterio 3 (negativo)
    Dado una petición a GET /api/equipos sin token
    Cuando llega a la aplicación
    Entonces responde 401 con {"error": "Inicia sesión con Google."}
