// Pantallas del contexto «equipos»: las que describe spec/contextos/equipos/pantallas.md.
import { siPuedeLlamar, type Pantalla } from "../pantallas.js";
import { AltaEquipos } from "./AltaEquipos.js";

export const pantallas: Pantalla[] = [
  {
    id: "equipos-alta",
    titulo: "Alta de equipos",
    Componente: AltaEquipos,
    visible: siPuedeLlamar("/api/prestamos/vencidos"),
  },
];
