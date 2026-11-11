# language: es
# Generado por Diverger desde .diverger/prueba-paralelo/backlog.json. No se edita a mano: se regenera.

@HU-PAR-03
Característica: Saludo del contexto Gamma
  Como empleado, quiero pedir el saludo del contexto Gamma, para comprobar que el contexto responde.

  @HU-PAR-03-1 @positivo
  Escenario: HU-PAR-03 criterio 1 (positivo)
    Dado la empleada «ana.perez@empresa.com» con sesión iniciada
    Cuando pide GET /api/gamma/saludo
    Entonces recibe 200 con {"contexto": "gamma", "persona": "ana.perez@empresa.com"}

  @HU-PAR-03-2 @negativo
  Escenario: HU-PAR-03 criterio 2 (negativo)
    Dado una petición sin token
    Cuando pide GET /api/gamma/saludo
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}
