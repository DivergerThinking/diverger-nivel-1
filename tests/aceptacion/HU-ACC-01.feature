# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-ACC-01
Característica: Entrar con la cuenta de Google de la empresa
  Como empleado, quiero entrar en la aplicación con mi cuenta de Google de la empresa, para usarla sin crear otra contraseña y que cada solicitud quede a mi nombre.

  @HU-ACC-01-1 @positivo
  Escenario: HU-ACC-01 criterio 1 (positivo)
    Dado un token de identidad de Google de «ana.perez@empresa.com», con el correo verificado y emitido para el cliente OAuth de la aplicación
    Cuando envía GET /api/equipos con ese token
    Entonces recibe 200 con la lista de equipos

  @HU-ACC-01-2 @positivo
  Escenario: HU-ACC-01 criterio 2 (positivo)
    Dado el mismo token de «ana.perez@empresa.com» y el equipo «Portátil 07» disponible
    Cuando envía POST /api/equipos/{id}/solicitud con {"devolucion": "2026-11-20"}
    Entonces recibe 201 con persona «ana.perez@empresa.com», tomada del correo del token

  @HU-ACC-01-3 @negativo
  Escenario: HU-ACC-01 criterio 3 (negativo)
    Dado un token de identidad de Google de «ana.perez@empresa.com» con el correo sin verificar
    Cuando envía GET /api/equipos con ese token
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}

  @HU-ACC-01-4 @negativo
  Escenario: HU-ACC-01 criterio 4 (negativo)
    Dado un token de identidad de Google válido pero emitido para otro cliente OAuth
    Cuando envía GET /api/equipos con ese token
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}
