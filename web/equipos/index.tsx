// Pantallas del contexto «equipos» (ADR 0053 del harness): las que describe spec/contextos/equipos/pantallas.md.
import { siPuedeLlamar, type Pantalla } from "../pantallas.js";
import { AltaDeEquipos } from "./AltaDeEquipos.js";

export const pantallas: Pantalla[] = [
  {
    id: "equipos-alta",
    titulo: "Alta de equipos",
    Componente: AltaDeEquipos,
    visible: siPuedeLlamar("/api/prestamos/vencidos"),
  },
];
