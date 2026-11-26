# Pantallas del contexto «Préstamos»

## Equipos

- **Id:** `prestamos-equipos`
- **Quién la ve:** cualquiera con la sesión iniciada; sin sesión, la aplicación pide entrar con Google.
- **Historias:** HU-ACC-01, HU-EQU-02, HU-PRE-01
- **Operaciones:** `prestamos.listarEquipos` (`GET /api/equipos`), `prestamos.solicitarEquipo` (`POST /api/equipos/{id}/solicitud`)
- **Qué enseña:** la lista de equipos con su `nombre` y `estado`; si está reservado o prestado, también la `persona` y la `devolucion`.
- **Qué hace la persona:** entra con su cuenta de Google y pide un equipo disponible indicando la fecha de devolución; si falla, ve «Inicia sesión con Google.», «Falta la fecha de devolución», «La fecha de devolución no es válida», «La fecha de devolución ya ha pasado», «No existe el equipo» o «El equipo no está disponible».

## Mostrador de IT

- **Id:** `prestamos-mostrador`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-PRE-02, HU-PRE-03, HU-PRE-04
- **Operaciones:** `prestamos.listarEquipos` (`GET /api/equipos`), `prestamos.entregarEquipo` (`POST /api/equipos/{id}/entrega`), `prestamos.prestarEquipo` (`POST /api/equipos/{id}/prestamo`), `prestamos.registrarDevolucion` (`POST /api/equipos/{id}/devolucion`), `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`)
- **Qué enseña:** los equipos con su `estado`, `persona` y `devolucion`, con la acción que corresponde a cada estado.
- **Qué hace la persona:** entrega un equipo reservado, presta uno disponible a una persona con su fecha de devolución o apunta la devolución de uno prestado; si falla, ve «El equipo no está reservado», «Faltan la persona o la fecha de devolución», «La fecha de devolución no es válida», «El equipo no está disponible», «El equipo no está prestado» o «No existe el equipo».

## Préstamos vencidos

- **Id:** `prestamos-vencidos`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-PRE-05
- **Operaciones:** `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`)
- **Qué enseña:** los préstamos vencidos, del más antiguo al más reciente, con `nombre`, `persona` y `devolucion`.
- **Qué hace la persona:** nada; solo los consulta.

## Historial de un equipo

- **Id:** `prestamos-historial`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-EQU-03
- **Operaciones:** `prestamos.listarEquipos` (`GET /api/equipos`), `prestamos.obtenerHistorial` (`GET /api/equipos/{id}/historial`), `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`)
- **Qué enseña:** los préstamos del equipo elegido, del más reciente al más antiguo, con `persona`, `devolucion` y `estado`.
- **Qué hace la persona:** elige un equipo y consulta su historial; si no existe, ve «No existe el equipo».
