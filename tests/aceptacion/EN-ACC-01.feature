# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@EN-ACC-01
Característica: Pruebas de contrato de la API del inventario
  Como equipo, quiero disponer de pruebas automáticas que comprueben las rutas, campos, códigos y mensajes del anexo de la API, para detectar antes de integrar cualquier cambio que rompería el inventario de IT.

  @EN-ACC-01-1 @positivo
  Escenario: EN-ACC-01 criterio 1 (positivo)
    Dado la API sin cambios respecto al anexo
    Cuando se ejecutan las pruebas de contrato en la integración continua
    Entonces pasan las pruebas de las ocho operaciones del anexo, con sus respuestas correctas y sus errores

  @EN-ACC-01-2 @negativo
  Escenario: EN-ACC-01 criterio 2 (negativo)
    Dado un cambio que renombra el campo «devolucion» a «fechaDevolucion» en GET /api/equipos
    Cuando se ejecutan las pruebas de contrato
    Entonces falla la prueba de «Ver los equipos» y el cambio no se puede integrar
