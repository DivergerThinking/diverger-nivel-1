# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it-2/backlog.json. No se edita a mano: se regenera.

@HU-ACC-01
Característica: Entrar con la cuenta de Google de la empresa
  Como empleado, quiero usar la aplicación con mi cuenta de Google de la empresa, para que cada reserva y cada préstamo quede a mi nombre sin crear otra contraseña.

  @HU-ACC-01-1 @positivo
  Escenario: HU-ACC-01 criterio 1 (positivo)
    Dado la empleada «ana.perez@empresa.com» con un token de identidad de Google con el correo verificado y emitido para el cliente OAuth de la aplicación
    Cuando consulta GET /api/equipos
    Entonces recibe 200 con la lista de equipos y la aplicación la identifica como «ana.perez@empresa.com»

  @HU-ACC-01-2 @negativo
  Escenario: HU-ACC-01 criterio 2 (negativo)
    Dado una petición sin token
    Cuando consulta GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}

  @HU-ACC-01-3 @negativo
  Escenario: HU-ACC-01 criterio 3 (negativo)
    Dado la empleada «ana.perez@empresa.com» con un token de Google emitido para otro cliente OAuth
    Cuando consulta GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}

  @HU-ACC-01-4 @negativo
  Escenario: HU-ACC-01 criterio 4 (negativo)
    Dado una cuenta de Google con el correo sin verificar
    Cuando consulta GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}
