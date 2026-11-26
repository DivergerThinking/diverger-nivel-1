# Pantallas del contexto «Equipos»

## Alta de equipos

- **Id:** `equipos-alta`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-ACC-02, HU-EQU-01
- **Operaciones:** `equipos.crearEquipo` (`POST /api/equipos`), `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`)
- **Qué enseña:** un formulario con el nombre del equipo y, tras el alta, el equipo creado con su `id`, `nombre` y `estado`.
- **Qué hace la persona:** escribe el nombre y da de alta el equipo; si falla, ve «Falta el nombre del equipo», «Ya hay un equipo con ese nombre» o «Solo IT puede hacer esto.».
