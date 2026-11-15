# Pantallas del contexto «Préstamos»

## Equipos

- **Id:** `prestamos-equipos`
- **Quién la ve:** cualquier persona con la sesión iniciada.
- **Historias:** HU-ACC-01, HU-SOL-01, HU-SOL-02
- **Operaciones:** `prestamos.listarEquipos` (`GET /api/equipos`), `prestamos.solicitarEquipo` (`POST /api/equipos/{id}/solicitud`)
- **Qué enseña:** la lista de equipos con su `nombre` y su `estado`; si está reservado o prestado, también la `persona` y la fecha de `devolucion`.
- **Qué hace la persona:** elige un equipo disponible, indica la fecha de devolución y lo pide; el equipo pasa a reservado a su nombre. Si falla, ve el mensaje del contrato: «Falta la fecha de devolución», «La fecha de devolución no es válida», «La fecha de devolución ya ha pasado», «No existe el equipo» o «El equipo no está disponible». Sin sesión, ve «Inicia sesión con Google.».

## Gestión de préstamos

- **Id:** `prestamos-gestion`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-PRE-01, HU-PRE-02, HU-PRE-03
- **Operaciones:** `prestamos.listarEquipos` (`GET /api/equipos`), `prestamos.entregarEquipo` (`POST /api/equipos/{id}/entrega`), `prestamos.prestarEquipo` (`POST /api/equipos/{id}/prestamo`), `prestamos.registrarDevolucion` (`POST /api/equipos/{id}/devolucion`), `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`)
- **Qué enseña:** la lista de equipos con su `nombre`, `estado`, `persona` y `devolucion`, con la acción que corresponde a cada estado.
- **Qué hace la persona:** entrega un equipo reservado, presta en el mostrador un equipo disponible indicando la `persona` y la fecha de `devolucion`, o apunta la devolución de un equipo prestado. Si falla, ve el mensaje del contrato: «El equipo no está reservado», «Faltan la persona o la fecha de devolución», «La fecha de devolución no es válida», «El equipo no está disponible», «El equipo no está prestado» o «No existe el equipo».

## Préstamos vencidos

- **Id:** `prestamos-vencidos`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-PRE-04
- **Operaciones:** `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`)
- **Qué enseña:** los equipos prestados cuya fecha de devolución es anterior a hoy, del más antiguo al más reciente, con `nombre`, `persona` y `devolucion`.
- **Qué hace la persona:** nada; solo los consulta.

## Historial de un equipo

- **Id:** `prestamos-historial`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-INV-02
- **Operaciones:** `prestamos.listarEquipos` (`GET /api/equipos`), `prestamos.obtenerHistorial` (`GET /api/equipos/{id}/historial`), `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`)
- **Qué enseña:** para el equipo elegido, sus préstamos del más reciente al más antiguo, cada uno con `persona`, `devolucion` y `estado` (`reservado`, `prestado` o `devuelto`).
- **Qué hace la persona:** elige un equipo de la lista y consulta su historial. Si el equipo no existe, ve «No existe el equipo».
