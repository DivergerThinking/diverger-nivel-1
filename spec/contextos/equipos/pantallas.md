# Pantallas del contexto «Equipos»

## Alta de equipos

- **Id:** `equipos-alta`
- **Quién la ve:** cualquier persona con la sesión iniciada; solo una cuenta de IT puede dar de alta, y con otra cuenta `equipos.darDeAltaEquipo` responde 403 «Solo IT puede hacer esto.», que la pantalla muestra. El contrato de este contexto no tiene ninguna lectura solo de IT con la que ocultarla.
- **Historias:** HU-EQU-01
- **Operaciones:** `equipos.darDeAltaEquipo` (`POST /api/equipos`)
- **Qué enseña:** un campo para el nombre del equipo y, tras el alta, el equipo creado con su `nombre` y su `estado` «disponible».
- **Qué hace la persona:** escribe el nombre y da de alta el equipo. Si falla, ve el mensaje de la API: «Falta el nombre del equipo», «Ya hay un equipo con ese nombre» o «Solo IT puede hacer esto.».
