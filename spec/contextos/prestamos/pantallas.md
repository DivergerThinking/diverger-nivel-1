# Pantallas del contexto «Préstamos»

## Equipos

- **Id:** `prestamos-equipos`
- **Quién la ve:** cualquier persona con la sesión iniciada con su cuenta de Google de la empresa; sin sesión, la aplicación pide iniciarla («Inicia sesión con Google.»).
- **Historias:** HU-ACC-01, HU-EQU-02, HU-SOL-01, HU-SOL-03, HU-SOL-02
- **Operaciones:** `prestamos.listarEquipos` (`GET /api/equipos`), `prestamos.solicitarEquipo` (`POST /api/equipos/{id}/solicitud`)
- **Qué enseña:** la lista de equipos con su `nombre` y su `estado` (disponible, reservado o prestado) y, si está reservado o prestado, la `persona` que lo tiene y su fecha de `devolucion`.
- **Qué hace la persona:** pide un equipo disponible indicando la fecha de devolución; el equipo pasa a reservado a su nombre. Si falla, ve el mensaje de la API: «Falta la fecha de devolución», «La fecha de devolución no es válida», «La fecha de devolución ya ha pasado», «No existe el equipo» o «El equipo no está disponible».

## Mostrador de IT

- **Id:** `prestamos-mostrador`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT; con 401 o 403 la aplicación no la enseña).
- **Historias:** HU-PRE-01, HU-PRE-02, HU-PRE-03
- **Operaciones:** `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`), `prestamos.listarEquipos` (`GET /api/equipos`), `prestamos.entregarEquipo` (`POST /api/equipos/{id}/entrega`), `prestamos.prestarEquipo` (`POST /api/equipos/{id}/prestamo`), `prestamos.registrarDevolucion` (`POST /api/equipos/{id}/devolucion`)
- **Qué enseña:** la lista de equipos con su `nombre`, su `estado`, su `persona` y su `devolucion`, con las acciones que corresponden a cada estado.
- **Qué hace la persona:** entrega un equipo reservado; presta un equipo disponible a la persona que indica, con su fecha de devolución (también anterior a hoy); y apunta la devolución de un equipo prestado. Si falla, ve el mensaje de la API: «El equipo no está reservado», «Faltan la persona o la fecha de devolución», «La fecha de devolución no es válida», «El equipo no está disponible», «El equipo no está prestado», «No existe el equipo» o «Solo IT puede hacer esto.».

## Préstamos vencidos

- **Id:** `prestamos-vencidos`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-PRE-04
- **Operaciones:** `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`)
- **Qué enseña:** los préstamos vencidos, del más antiguo al más reciente, con el `nombre` del equipo, la `persona` y la fecha de `devolucion`.
- **Qué hace la persona:** nada; solo los consulta para reclamarlos.

## Historial de un equipo

- **Id:** `prestamos-historial`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-EQU-03
- **Operaciones:** `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`), `prestamos.listarEquipos` (`GET /api/equipos`), `prestamos.consultarHistorial` (`GET /api/equipos/{id}/historial`)
- **Qué enseña:** para el equipo elegido de la lista, sus préstamos del más reciente al más antiguo, con la `persona`, la fecha de `devolucion` y el `estado` (reservado, prestado o devuelto).
- **Qué hace la persona:** elige un equipo y consulta su historial. Si el equipo no existe, ve «No existe el equipo».
