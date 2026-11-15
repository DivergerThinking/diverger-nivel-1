// Pantallas del contexto «prestamos» (ADR 0053 del harness): las de spec/contextos/prestamos/pantallas.md.
import { siPuedeLlamar, type Pantalla } from "../pantallas.js";
import { Equipos } from "./Equipos.js";
import { GestionPrestamos } from "./GestionPrestamos.js";
import { Historial } from "./Historial.js";
import { Vencidos } from "./Vencidos.js";

export const pantallas: Pantalla[] = [
  { id: "prestamos-equipos", titulo: "Equipos", Componente: Equipos },
  {
    id: "prestamos-gestion",
    titulo: "Gestión de préstamos",
    Componente: GestionPrestamos,
    visible: siPuedeLlamar("/api/prestamos/vencidos"),
  },
  {
    id: "prestamos-vencidos",
    titulo: "Préstamos vencidos",
    Componente: Vencidos,
    visible: siPuedeLlamar("/api/prestamos/vencidos"),
  },
  {
    id: "prestamos-historial",
    titulo: "Historial de un equipo",
    Componente: Historial,
    visible: siPuedeLlamar("/api/prestamos/vencidos"),
  },
];
