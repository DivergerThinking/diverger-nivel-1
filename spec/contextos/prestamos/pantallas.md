# Pantallas del contexto «Préstamos»

## Equipos

- **Id:** `prestamos-equipos`
- **Quién la ve:** cualquiera con sesión iniciada.
- **Historias:** HU-ACC-01, HU-SOL-01, HU-SOL-02, HU-SOL-03
- **Operaciones:** `prestamos.listarEquipos` (`GET /api/equipos`), `prestamos.solicitarEquipo` (`POST /api/equipos/{id}/solicitud`)
- **Qué enseña:** la lista de equipos con `nombre` y `estado` y, si están reservados o prestados, `persona` y `devolucion`.
- **Qué hace la persona:** elige un equipo disponible, indica la fecha de devolución y lo pide; ve el equipo reservado a su nombre. Si falla ve el mensaje del contrato: «Falta la fecha de devolución», «La fecha de devolución no es válida», «La fecha de devolución ya ha pasado», «No existe el equipo» o «El equipo no está disponible». Sin sesión ve «Inicia sesión con Google.».

## Gestión de préstamos

- **Id:** `prestamos-gestion`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-ACC-02, HU-GES-02, HU-GES-03, HU-GES-04, HU-SOL-03
- **Operaciones:** `prestamos.listarEquipos` (`GET /api/equipos`), `prestamos.entregarEquipo` (`POST /api/equipos/{id}/entrega`), `prestamos.prestarEquipo` (`POST /api/equipos/{id}/prestamo`), `prestamos.registrarDevolucion` (`POST /api/equipos/{id}/devolucion`), `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`)
- **Qué enseña:** los equipos con su `estado`, `persona` y `devolucion`.
- **Qué hace la persona:** entrega un equipo reservado, presta uno disponible en el mostrador indicando la persona y la fecha de devolución, o apunta la devolución de uno prestado. Si falla ve el mensaje del contrato: «El equipo no está reservado», «Faltan la persona o la fecha de devolución», «La fecha de devolución no es válida», «El equipo no está disponible», «El equipo no está prestado» o «No existe el equipo».

## Préstamos vencidos

- **Id:** `prestamos-vencidos`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-SEG-01
- **Operaciones:** `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`)
- **Qué enseña:** los equipos prestados cuya fecha de devolución es anterior a hoy, del más antiguo al más reciente, con `nombre`, `persona` y `devolucion`.
- **Qué hace la persona:** nada; solo los consulta.

## Historial de un equipo

- **Id:** `prestamos-historial`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-SEG-02
- **Operaciones:** `prestamos.listarEquipos` (`GET /api/equipos`), `prestamos.obtenerHistorial` (`GET /api/equipos/{id}/historial`), `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`)
- **Qué enseña:** los préstamos del equipo elegido, del más reciente al más antiguo, con `persona`, `devolucion` y `estado` (`reservado`, `prestado` o `devuelto`).
- **Qué hace la persona:** elige un equipo de la lista y consulta su historial; si no existe ve «No existe el equipo».
