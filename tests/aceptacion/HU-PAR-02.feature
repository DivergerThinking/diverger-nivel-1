# language: es
# Generado por Diverger desde .diverger/prueba-paralelo/backlog.json. No se edita a mano: se regenera.

@HU-PAR-02
Característica: Saludo del contexto Beta
  Como empleado, quiero pedir el saludo del contexto Beta, para comprobar que el contexto responde.

  @HU-PAR-02-1 @positivo
  Escenario: HU-PAR-02 criterio 1 (positivo)
    Dado la empleada «ana.perez@empresa.com» con sesión iniciada
    Cuando pide GET /api/beta/saludo
    Entonces recibe 200 con {"contexto": "beta", "persona": "ana.perez@empresa.com"}

  @HU-PAR-02-2 @negativo
  Escenario: HU-PAR-02 criterio 2 (negativo)
    Dado una petición sin token
    Cuando pide GET /api/beta/saludo
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}
