# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-ACC-02
Característica: Limitar las operaciones de IT a sus cuentas
  Como técnico de IT, quiero que solo las cuentas de IT hagan las operaciones de IT, para que ningún empleado pueda entregar, prestar o devolver equipos por su cuenta.

  @HU-ACC-02-1 @negativo
  Escenario: HU-ACC-02 criterio 1 (negativo)
    Dado el empleado ana.perez@empresa.com, que no está en CORREOS_IT
    Cuando pide POST /api/equipos con {"nombre": "Portátil 07"}
    Entonces responde 403 con {"error": "Solo IT puede hacer esto."}

  @HU-ACC-02-2 @positivo
  Escenario: HU-ACC-02 criterio 2 (positivo)
    Dado CORREOS_IT con it@empresa.com y una persona que entra como IT@Empresa.com
    Cuando pide GET /api/prestamos/vencidos
    Entonces responde 200 porque los correos se comparan sin distinguir mayúsculas

  @HU-ACC-02-3 @positivo
  Escenario: HU-ACC-02 criterio 3 (positivo)
    Dado la cuenta de servicio del inventario inventario@empresa.com, incluida en CORREOS_IT, y el «Portátil 07» disponible
    Cuando pide el «Portátil 07» con devolución el 2026-12-04
    Entonces responde 201 y el equipo queda reservado a inventario@empresa.com
