# Pantallas del contexto «Equipos»

## Alta de equipos

- **Id:** `equipos-alta`
- **Quién la ve:** solo IT (lo dice `prestamos.listarVencidos`, que responde 403 a quien no es de IT).
- **Historias:** HU-INV-01
- **Operaciones:** `equipos.crearEquipo` (`POST /api/equipos`), `prestamos.listarVencidos` (`GET /api/prestamos/vencidos`)
- **Qué enseña:** un campo para el nombre del equipo y, tras el alta, el equipo creado con su `nombre` y su `estado` (`disponible`).
- **Qué hace la persona:** escribe el nombre y da de alta el equipo. Si falla, ve el mensaje del contrato: «Falta el nombre del equipo» o «Ya hay un equipo con ese nombre».
