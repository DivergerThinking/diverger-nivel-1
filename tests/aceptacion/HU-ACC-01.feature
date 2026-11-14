# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-ACC-01
Característica: Entrar con la cuenta de Google de la empresa
  Como empleado, quiero entrar en la aplicación con mi cuenta de Google de la empresa, para que cada operación quede a nombre del correo de mi cuenta de Google de la empresa.

  @HU-ACC-01-1 @positivo
  Escenario: HU-ACC-01 criterio 1 (positivo)
    Dado la empleada ana.perez@empresa.com con un token de identidad de Google con el correo verificado y emitido para el cliente OAuth de la aplicación
    Cuando consulta la lista de equipos
    Entonces recibe 200 con la lista de equipos y la aplicación la identifica como ana.perez@empresa.com

  @HU-ACC-01-2 @positivo
  Escenario: HU-ACC-01 criterio 2 (positivo)
    Dado la cuenta de servicio del inventario de IT con un token de identidad de Google con el correo verificado y emitido para el cliente OAuth de la aplicación
    Cuando consulta la lista de equipos
    Entonces recibe 200 con la lista de equipos

  @HU-ACC-01-3 @negativo
  Escenario: HU-ACC-01 criterio 3 (negativo)
    Dado una petición sin token
    Cuando consulta la lista de equipos
    Entonces recibe 401 con el error «Inicia sesión con Google.» y ninguna lista de equipos

  @HU-ACC-01-4 @negativo
  Escenario: HU-ACC-01 criterio 4 (negativo)
    Dado un token de Google de ana.perez@empresa.com con el correo sin verificar
    Cuando consulta la lista de equipos
    Entonces recibe 401 con el error «Inicia sesión con Google.»

  @HU-ACC-01-5 @negativo
  Escenario: HU-ACC-01 criterio 5 (negativo)
    Dado un token de Google de ana.perez@empresa.com emitido para otro cliente OAuth
    Cuando consulta la lista de equipos
    Entonces recibe 401 con el error «Inicia sesión con Google.»
