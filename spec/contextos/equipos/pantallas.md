# Pantallas del contexto «Equipos»

## Alta de equipos

- **Id:** `equipos-alta`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-INV-01, HU-ACC-02
- **Operaciones:** `equipos.crearEquipo` (`POST /api/equipos`), `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`)
- **Qué enseña:** un formulario con el nombre del equipo y, tras el alta, el equipo creado con su `id`, su `nombre` y su `estado` «disponible».
- **Qué hace la persona:** escribe el nombre y da de alta el equipo. Si falla, ve el mensaje del contrato: «Falta el nombre del equipo», «Ya hay un equipo con ese nombre» o «Solo IT puede hacer esto.».
