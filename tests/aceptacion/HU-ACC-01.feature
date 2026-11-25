# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-ACC-01
Característica: Entrar con la cuenta de Google de la empresa
  Como empleado, quiero entrar en la aplicación con mi cuenta de Google de la empresa, para usar la aplicación sin otra contraseña y que IT sepa quién tiene cada equipo.

  @HU-ACC-01-1 @positivo
  Escenario: HU-ACC-01 criterio 1 (positivo)
    Dado un empleado con la cuenta de Google de la empresa ana.perez@empresa.com
    Cuando entra en la aplicación
    Entonces ve la lista de equipos y sus operaciones se hacen a nombre de ana.perez@empresa.com

  @HU-ACC-01-2 @negativo
  Escenario: HU-ACC-01 criterio 2 (negativo)
    Dado una petición a GET /api/equipos sin token
    Cuando llega a la aplicación
    Entonces responde 401 con {"error": "Inicia sesión con Google."}

  @HU-ACC-01-3 @negativo
  Escenario: HU-ACC-01 criterio 3 (negativo)
    Dado una petición a GET /api/equipos con un token de Google cuyo correo no está verificado
    Cuando llega a la aplicación
    Entonces responde 401 con {"error": "Inicia sesión con Google."}
