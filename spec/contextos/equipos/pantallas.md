# Pantallas del contexto «Equipos»

## Alta de equipos

- **Id:** `equipos-alta`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-ACC-01, HU-ACC-02, HU-GES-01
- **Operaciones:** `equipos.crearEquipo` (`POST /api/equipos`), `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`)
- **Qué enseña:** un campo para el nombre del equipo y, tras el alta, el equipo creado con su `id`, `nombre` y `estado`.
- **Qué hace la persona:** escribe el nombre y da de alta el equipo; si falta, ve «Falta el nombre del equipo», y si ya existe, «Ya hay un equipo con ese nombre». Sin sesión ve «Inicia sesión con Google.».
