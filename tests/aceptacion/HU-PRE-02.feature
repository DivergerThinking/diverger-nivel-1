# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-02
Característica: Entregar un equipo reservado
  Como técnico de IT, quiero marcar como entregado un equipo reservado, para que conste como prestado a quien lo pidió y cuente para los vencidos.

  @HU-PRE-02-1 @positivo
  Escenario: HU-PRE-02 criterio 1 (positivo)
    Dado el «Portátil 07» reservado por ana.perez@empresa.com hasta el 2026-12-10
    Cuando un técnico de IT envía POST /api/equipos/{id}/entrega
    Entonces recibe 200 con el estado «prestado», la persona ana.perez@empresa.com y la devolución 2026-12-10

  @HU-PRE-02-2 @negativo
  Escenario: HU-PRE-02 criterio 2 (negativo)
    Dado el «Portátil 07» disponible
    Cuando un técnico de IT envía POST /api/equipos/{id}/entrega
    Entonces recibe 409 con {"error": "El equipo no está reservado"}
