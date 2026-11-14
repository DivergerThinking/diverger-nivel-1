# Glosario

| Término | Definición | Contexto | En el código |
|---|---|---|---|
| Equipo | Un portátil, monitor, proyector u otro aparato de la oficina que se presta, con un id y un nombre único. | equipos, prestamos | `Equipo` |
| Nombre normalizado | El nombre del equipo sin espacios al principio ni al final y en minúsculas; dos equipos no comparten nombre normalizado. | equipos | `normalizedName` |
| Estado del equipo | `disponible`, `reservado` o `prestado`. | prestamos | `EquipmentStatus` |
| Persona | El correo de quien pide o tiene el equipo. | prestamos | `person` |
| Fecha de devolución | La fecha en que se devolverá el equipo, como texto `AAAA-MM-DD`. | prestamos | `returnDate` |
| Hoy | El día actual en Madrid (zona horaria Europe/Madrid). | prestamos | `todayInMadrid` |
| Solicitud | La petición de un empleado para reservar un equipo disponible hasta una fecha de devolución. | prestamos | `Request` |
| Reserva | El estado de un equipo solicitado que IT todavía no ha entregado. | prestamos | `Reservation` |
| Entrega | El paso en que IT entrega un equipo reservado, que pasa a prestado. | prestamos | `Handover` |
| Préstamo en el mostrador | Un préstamo que IT hace directamente, sin solicitud, a una persona y hasta una fecha de devolución. | prestamos | `CounterLoan` |
| Préstamo | Cada reserva o préstamo de un equipo, con su persona, su fecha de devolución y su estado (`reservado`, `prestado` o `devuelto`). | prestamos | `Loan` |
| Préstamo activo | El préstamo de un equipo que está reservado o prestado; como mucho hay uno por equipo. | prestamos | `ActiveLoan` |
| Devolución | El paso en que IT apunta que un equipo prestado se ha devuelto; el préstamo pasa a `devuelto`. | prestamos | `Return` |
| Préstamo vencido | Un equipo prestado cuya fecha de devolución es anterior a hoy. | prestamos | `OverdueLoan` |
| Historial | Los préstamos de un equipo, del más reciente al más antiguo. | prestamos | `LoanHistory` |
| Cuenta de IT | Un correo de la variable de entorno `CORREOS_IT`, sin distinguir mayúsculas. | equipos, prestamos | `isItAccount` |
| Empleado | Cualquier persona que ha iniciado sesión con su cuenta de Google de la empresa. | prestamos | `Employee` |
