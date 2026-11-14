# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@EN-ACC-01
Característica: Limitar a IT las operaciones de IT
  Como equipo, quiero limitar las operaciones «Solo IT» a las cuentas de la variable de entorno CORREOS_IT, para que ningún empleado pueda dar de alta, entregar, prestar o recoger equipos ni ver los vencidos o el historial.

  @EN-ACC-01-1 @positivo
  Escenario: EN-ACC-01 criterio 1 (positivo)
    Dado CORREOS_IT con «it@empresa.com,soporte@empresa.com» y una petición con el token de IT@empresa.com
    Cuando llega a una operación marcada «Solo IT»
    Entonces la aplicación reconoce IT@empresa.com como cuenta de IT, aunque cambien las mayúsculas, y deja pasar la petición

  @EN-ACC-01-2 @negativo
  Escenario: EN-ACC-01 criterio 2 (negativo)
    Dado CORREOS_IT con «it@empresa.com,soporte@empresa.com» y una petición con el token de ana.perez@empresa.com
    Cuando llega a una operación marcada «Solo IT»
    Entonces responde 403 con el error «Solo IT puede hacer esto.» y la operación no se hace
