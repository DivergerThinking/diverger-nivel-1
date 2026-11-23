# Pantallas del contexto «Préstamos»

## Equipos

- **Id:** `prestamos-equipos`
- **Quién la ve:** cualquier persona con la sesión iniciada con su cuenta de Google.
- **Historias:** HU-ACC-01, HU-SOL-01, HU-SOL-02, HU-SOL-04, HU-SOL-03
- **Operaciones:** `prestamos.listarEquipos` (`GET /api/equipos`), `prestamos.solicitarEquipo` (`POST /api/equipos/{id}/solicitud`)
- **Qué enseña:** la lista de equipos con su `nombre` y su `estado`; si está reservado o prestado, también la `persona` y la `devolucion`. Sin sesión, el botón para iniciarla con Google.
- **Qué hace la persona:** inicia sesión con Google y pide un equipo disponible indicando la fecha de devolución. Si falla, ve el mensaje del contrato: «Falta la fecha de devolución», «La fecha de devolución no es válida», «La fecha de devolución ya ha pasado», «No existe el equipo», «El equipo no está disponible» o «Inicia sesión con Google.».

## Gestión de préstamos

- **Id:** `prestamos-gestion`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-PRE-01, HU-PRE-02, HU-PRE-03, HU-ACC-02
- **Operaciones:** `prestamos.listarEquipos` (`GET /api/equipos`), `prestamos.entregarEquipo` (`POST /api/equipos/{id}/entrega`), `prestamos.prestarEquipo` (`POST /api/equipos/{id}/prestamo`), `prestamos.devolverEquipo` (`POST /api/equipos/{id}/devolucion`), `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`)
- **Qué enseña:** los equipos con su `estado`, `persona` y `devolucion`, con la acción que corresponde a cada estado.
- **Qué hace la persona:** entrega un equipo reservado, presta uno disponible en el mostrador escribiendo la persona y la fecha de devolución, o apunta la devolución de uno prestado. Si falla, ve el mensaje del contrato: «El equipo no está reservado», «Faltan la persona o la fecha de devolución», «La fecha de devolución no es válida», «El equipo no está disponible», «El equipo no está prestado», «No existe el equipo» o «Solo IT puede hacer esto.».

## Préstamos vencidos

- **Id:** `prestamos-vencidos`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-PRE-04
- **Operaciones:** `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`)
- **Qué enseña:** los equipos prestados con la devolución anterior a hoy, del más antiguo al más reciente, con su `nombre`, su `persona` y su `devolucion`.
- **Qué hace la persona:** nada; solo los consulta.

## Historial de un equipo

- **Id:** `prestamos-historial`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-INV-02
- **Operaciones:** `prestamos.listarEquipos` (`GET /api/equipos`), `prestamos.obtenerHistorial` (`GET /api/equipos/{id}/historial`), `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`)
- **Qué enseña:** los préstamos del equipo elegido, del más reciente al más antiguo, con su `persona`, su `devolucion` y su `estado` (`reservado`, `prestado` o `devuelto`).
- **Qué hace la persona:** elige un equipo de la lista y ve su historial. Si falla, ve «No existe el equipo» o «Solo IT puede hacer esto.».
