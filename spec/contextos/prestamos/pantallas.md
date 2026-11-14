# Pantallas del contexto «Préstamos»

## Equipos

- **Id:** `prestamos-equipos`
- **Quién la ve:** cualquier persona con la sesión iniciada.
- **Historias:** HU-ACC-01, HU-INV-02, HU-SOL-01, HU-SOL-03
- **Operaciones:** `prestamos.listarEquipos` (`GET /api/equipos`), `prestamos.solicitarEquipo` (`POST /api/equipos/{id}/solicitud`)
- **Qué enseña:** la lista de equipos con su `nombre` y su `estado`; si está reservado o prestado, también la `persona` y la fecha de `devolucion`.
- **Qué hace la persona:** en un equipo disponible, elige la fecha de devolución y lo pide; el equipo pasa a reservado a su nombre. Si falla, ve el mensaje del contrato: «Falta la fecha de devolución», «La fecha de devolución no es válida», «La fecha de devolución ya ha pasado», «No existe el equipo», «El equipo no está disponible» o «Inicia sesión con Google.».

## Gestión de préstamos

- **Id:** `prestamos-gestion`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-ACC-02, HU-SOL-02, HU-PRE-01, HU-PRE-02
- **Operaciones:** `prestamos.listarEquipos` (`GET /api/equipos`), `prestamos.entregarEquipo` (`POST /api/equipos/{id}/entrega`), `prestamos.prestarEquipo` (`POST /api/equipos/{id}/prestamo`), `prestamos.registrarDevolucion` (`POST /api/equipos/{id}/devolucion`)
- **Qué enseña:** la lista de equipos con su `nombre`, su `estado`, su `persona` y su `devolucion`.
- **Qué hace la persona:** entrega un equipo reservado; presta un equipo disponible en el mostrador indicando la persona y la fecha de devolución, que puede ser anterior a hoy; apunta la devolución de un equipo prestado. Si falla, ve el mensaje del contrato: «El equipo no está reservado», «El equipo no está disponible», «El equipo no está prestado», «Faltan la persona o la fecha de devolución», «La fecha de devolución no es válida», «No existe el equipo» o «Solo IT puede hacer esto.».

## Préstamos vencidos

- **Id:** `prestamos-vencidos`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-PRE-03
- **Operaciones:** `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`)
- **Qué enseña:** los equipos prestados cuya fecha de devolución es anterior a hoy, del más antiguo al más reciente, con su `nombre`, su `persona` y su `devolucion`.
- **Qué hace la persona:** nada; solo los consulta.

## Historial de un equipo

- **Id:** `prestamos-historial`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-INV-03
- **Operaciones:** `prestamos.listarEquipos` (`GET /api/equipos`), `prestamos.verHistorial` (`GET /api/equipos/{id}/historial`)
- **Qué enseña:** la lista de equipos para elegir uno y, del elegido, sus préstamos del más reciente al más antiguo con su `persona`, su `devolucion` y su `estado` (reservado, prestado o devuelto).
- **Qué hace la persona:** elige un equipo y consulta su historial. Si falla, ve el mensaje del contrato: «No existe el equipo» o «Solo IT puede hacer esto.».
