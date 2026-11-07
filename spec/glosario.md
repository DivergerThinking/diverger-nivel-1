# Glosario

| Término | Definición | Contexto | En el código |
|---|---|---|---|
| Sesión | La identidad de quien hace la petición, sacada del token de identidad de Google con el correo verificado y emitido para el cliente OAuth de la aplicación. | accesos | `Session` |
| Persona | El correo de quien hace una operación o de quien tiene un equipo; se compara sin distinguir mayúsculas. | accesos | `person` |
| Cuenta de IT | Una cuenta cuyo correo está en la lista de IT; puede hacer las operaciones «Solo IT» y las de un empleado. | accesos | `ItAccount` |
| Lista de IT | Los correos de la variable de entorno `CORREOS_IT`, separados por comas. | accesos | `itAccountList` |
| Equipo | Un portátil, monitor o proyector que se presta, con su id y su nombre. | equipos | `Equipment` |
| Nombre normalizado | El nombre de un equipo sin espacios al principio ni al final y en minúsculas; dos equipos no comparten nombre normalizado. | equipos | `normalizedName` |
| Estado del equipo | `disponible`, `reservado` o `prestado`, según su préstamo activo. | prestamos | `EquipmentStatus` |
| Préstamo activo | La reserva o el préstamo en curso de un equipo; hay como mucho uno por equipo. | prestamos | `ActiveLoan` |
| Solicitud | La petición de un empleado sobre un equipo disponible; deja el equipo `reservado` a su nombre. | prestamos | `Request` |
| Entrega | El paso de un equipo `reservado` a `prestado`, con la misma persona y fecha de devolución. | prestamos | `Handover` |
| Préstamo en el mostrador | El préstamo que IT hace directamente a una persona sobre un equipo disponible. | prestamos | `CounterLoan` |
| Devolución | El registro de que un equipo `prestado` vuelve; queda `disponible`. | prestamos | `Return` |
| Fecha de devolución | El día en que se devolverá el equipo, como texto `AAAA-MM-DD`. | prestamos | `returnDate` |
| Hoy | El día actual en Madrid. | prestamos | `todayInMadrid` |
| Préstamo vencido | Un equipo `prestado` cuya fecha de devolución es anterior a hoy. | prestamos | `OverdueLoan` |
| Historial | Las entradas de un equipo, de la más reciente a la más antigua. | prestamos | `LoanHistory` |
| Entrada del historial | Una reserva o un préstamo de un equipo, con su persona, su fecha de devolución y su estado: `reservado`, `prestado` o `devuelto`. | prestamos | `HistoryEntry` |
