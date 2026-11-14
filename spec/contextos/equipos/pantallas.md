# Pantallas del contexto «Equipos»

## Alta de equipos

- **Id:** `equipos-alta`
- **Quién la ve:** cualquier persona con la sesión iniciada; el contrato de este contexto no tiene ninguna lectura reservada a IT, así que el alta responde 403 «Solo IT puede hacer esto.» a quien no es de IT y la pantalla enseña ese mensaje (ADR 0004).
- **Historias:** HU-INV-01, HU-ACC-02
- **Operaciones:** `equipos.crearEquipo` (`POST /api/equipos`)
- **Qué enseña:** un formulario con el nombre del equipo y, tras el alta, el equipo creado con su `id`, su `nombre` y su `estado` «disponible».
- **Qué hace la persona:** escribe el nombre y da de alta el equipo. Si falla, ve el mensaje del contrato: «Falta el nombre del equipo», «Ya hay un equipo con ese nombre», «Solo IT puede hacer esto.» o «Inicia sesión con Google.».
